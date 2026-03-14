import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    if (!targetId) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
    }

    try {
      if (!isAdmin) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('chat_count, is_subscribed').eq('id', targetId).single();
        if (!profile?.is_subscribed && (profile?.chat_count || 0) >= 1) {
          return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403 });
        }
      }
    } catch (e) { console.error("횟수 체크 중 오류:", e); }

    let embedding = null;
    let dbContext = "";

    try {
      const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const embeddingResult = await embedModel.embedContent(prompt);
      embedding = embeddingResult.embedding.values;

      // [여기서 확인하세요!] 사장님, 아래 로그가 정답을 알려줄 겁니다.
      console.log("⚠️ 사장님 확인용 - 실제 임베딩 숫자(차원)는?:", embedding.length);

      const { data: similarCases, error: rpcError } = await supabaseAdmin.rpc('match_legal_cases', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 2
      });

      if (!rpcError && similarCases && similarCases.length > 0) {
        dbContext = "\n\n[참고: 시스템 내 유사 사례 데이터]\n";
        similarCases.forEach((c, i) => {
          dbContext += `${i + 1}. 질문: ${c.content}\n   답변: ${c.analysis.substring(0, 500)}...\n`;
        });
      }
    } catch (ragError) {
      console.error("RAG 오류:", ragError);
    }

    const baseInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요. 제목은 ${lang === 'ko' ? '한국어' : '영어'}로 쓰되 본문은 격식 있는 베트남어를 사용하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하고 마지막에 법적 효력이 없음을 명시하세요.`;
    
    const finalInstruction = baseInstruction + (dbContext ? `\n\n과거 사례 참고: ${dbContext}` : "");

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: finalInstruction 
    });

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: contents,
      generationConfig: { temperature: 0.3, topP: 0.8, maxOutputTokens: 4096 }
    });

    let messageParts = [prompt];
    if (fileUrl) {
      try {
        const fileResp = await fetch(fileUrl).then(res => res.arrayBuffer());
        const fileExt = fileUrl.split('.').pop().toLowerCase();
        messageParts.push({ 
          inlineData: { data: Buffer.from(fileResp).toString("base64"), mimeType: fileExt === 'pdf' ? "application/pdf" : "image/jpeg" } 
        });
      } catch (e) { console.error("파일 에러:", e); }
    }

    const result = await chat.sendMessage(messageParts);
    const responseText = result.response.text();

    if (responseText) {
      try {
        const { error: insertError } = await supabaseAdmin.from('legal_cases').insert([{ 
          user_id: targetId, 
          content: prompt, 
          analysis: responseText, 
          file_url: fileUrl,
          embedding: embedding 
        }]);

        if (insertError) {
          console.error("DB Insert 실패 로그:", insertError);
        }

        if (!isAdmin) {
          await supabaseAdmin.rpc('increment_chat_count', { user_id: targetId });
        }
      } catch (dbErr) {
        console.error("DB 저장 예외:", dbErr);
      }
    }

    return new Response(JSON.stringify({ analysis: responseText }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('최종 API 에러:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
