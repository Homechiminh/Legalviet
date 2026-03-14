import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// [보안] 환경 변수 사용
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch (e) {} },
          remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch (e) {} },
        },
      }
    );

    // 1. 유저 인증 및 데이터 수신
    const { data: { user } } = await supabase.auth.getUser();
    const { 
      prompt, 
      history = [], 
      userId, 
      isAdmin, 
      lang = 'ko', 
      isDocumentRequest = false, 
      fileUrl = null 
    } = await req.json();

    const targetId = user?.id || userId;
    if (!targetId) return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });

    // 2. 횟수 체크 (실시간 DB 조회)
    if (!isAdmin) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('chat_count, is_subscribed').eq('id', targetId).single();
      if (!profile?.is_subscribed && (profile?.chat_count || 0) >= 1) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403 });
      }
    }

    // --- [RAG 로직: DB 지식 활용] ---
    
    // A. 질문을 '의미 숫자(Embedding)'로 변환 (리스트에서 확인한 모델 사용)
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const embeddingResult = await embedModel.embedContent(prompt);
    const embedding = embeddingResult.embedding.values;

    // B. DB에서 유사 사례 검색
    const { data: similarCases } = await supabaseAdmin.rpc('match_legal_cases', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 2 // 속도를 위해 상위 2개만 참조
    });

    let dbContext = "";
    if (similarCases && similarCases.length > 0) {
      dbContext = "\n\n[참고: 시스템 내 유사 사례]\n";
      similarCases.forEach((c, i) => {
        dbContext += `- 질문: ${c.content}\n  답변요지: ${c.analysis.substring(0, 300)}...\n`;
      });
    }

    // 3. 시스템 명령 및 모델 설정 (확인된 gemini-3-flash-preview 적용)
    const baseInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하세요.`;
    
    const finalInstruction = baseInstruction + (dbContext ? `\n\n과거 유사 사례를 참고하여 답변의 전문성을 높이세요: ${dbContext}` : "");

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: finalInstruction 
    });

    // 4. 채팅 세션 시작 (이전 대화 반영)
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: contents,
      generationConfig: { temperature: 0.3, topP: 0.8, maxOutputTokens: 4096 }
    });

    // 5. 파일 및 메시지 전송
    let messageParts = [prompt];
    if (fileUrl) {
      try {
        const fileResp = await fetch(fileUrl).then(res => res.arrayBuffer());
        const fileExt = fileUrl.split('.').pop().toLowerCase();
        messageParts.push({ 
          inlineData: { 
            data: Buffer.from(fileResp).toString("base64"), 
            mimeType: fileExt === 'pdf' ? "application/pdf" : "image/jpeg" 
          } 
        });
      } catch (e) { console.error("File Error:", e); }
    }

    // [중요] AI 답변 대기
    const result = await chat.sendMessage(messageParts);
    const responseText = result.response.text();

    // 6. 분석 성공 시에만 카운트 증가 및 DB 저장
    if (responseText) {
      if (!isAdmin) await supabaseAdmin.rpc('increment_chat_count', { user_id: targetId });

      await supabaseAdmin.from('legal_cases').insert([{ 
        user_id: targetId, 
        content: prompt, 
        analysis: responseText, 
        file_url: fileUrl,
        embedding: embedding 
      }]);
    }

    // 7. 결과 반환
    return new Response(JSON.stringify({ analysis: responseText }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Final API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
