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

    // 1. 유저 인증 및 데이터 수신 (history 추가)
    const { data: { user } } = await supabase.auth.getUser();
    const { 
      prompt, 
      history = [], // 프론트에서 넘어온 이전 대화 내역
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

    // 2. 횟수 체크 (실시간 DB 조회)
    if (!isAdmin) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', targetId)
        .single();

      if (profileError) throw new Error("프로필 정보를 불러올 수 없습니다.");

      if (!profile?.is_subscribed && (profile?.chat_count || 0) >= 1) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403 });
      }
    }

    // 3. 시스템 명령 설정
    const systemInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요. 제목은 ${lang === 'ko' ? '한국어' : '영어'}로 쓰되 본문은 격식 있는 베트남어를 사용하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하고 마지막에 법적 효력이 없음을 명시하세요.`;

    // 4. AI 모델 세팅 (속도가 매우 빠른 최신형 Gemini 3 Flash 적용)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: systemInstruction 
    });

    // 5. [핵심] 대화 내역(History) 포맷 변환 및 채팅 세션 시작
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: contents,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    });

    // 6. 파일 처리 및 메시지 전송
    let messageParts = [prompt];
    if (fileUrl) {
      try {
        const fileResp = await fetch(fileUrl).then(res => res.arrayBuffer());
        const fileExt = fileUrl.split('.').pop().toLowerCase();
        let mimeType = fileExt === 'pdf' ? "application/pdf" : (fileExt === 'png' ? "image/png" : "image/jpeg");

        messageParts.push({
          inlineData: { data: Buffer.from(fileResp).toString("base64"), mimeType }
        });
      } catch (fileErr) { 
        console.error("File processing error:", fileErr); 
      }
    }

    // 대화 전송 (맥락 반영됨)
    const result = await chat.sendMessage(messageParts);
    const responseText = result.response.text();

    // 7. 카운트 증가 및 DB 저장
    if (!isAdmin) {
      await supabaseAdmin.rpc('increment_chat_count', { user_id: targetId });
    }

    await supabaseAdmin.from('legal_cases').insert([{ 
      user_id: targetId, 
      content: prompt, 
      analysis: responseText, 
      file_url: fileUrl 
    }]);

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });

  } catch (error) {
    console.error('Final API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
