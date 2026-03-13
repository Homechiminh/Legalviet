import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    // 1. Next.js 최신 규격에 맞춘 쿠키 핸들링 (t.get 에러 방지)
    const cookieStore = await cookies(); // await 추가
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { 
            try { cookieStore.set({ name, value, ...options }) } catch (e) { /* 서버 컴포넌트 제약 무시 */ }
          },
          remove(name, options) { 
            try { cookieStore.set({ name, value: '', ...options }) } catch (e) { /* 서버 컴포넌트 제약 무시 */ }
          },
        },
      }
    );

    // 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
    }

    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false, fileUrl = null } = await req.json();

    // 2. 구독 및 카운트 체크
    if (!isAdmin) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) console.error("Profile check error:", profileError);

      const chatCount = profile?.chat_count || 0;
      const isSubscribed = profile?.is_subscribed || false;

      if (!isSubscribed && chatCount >= 1) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403 });
      }
    }

    // 3. AI 모델 세팅
    const systemInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요. 제목은 ${lang === 'ko' ? '한국어' : '영어'}로 쓰되 본문은 격식 있는 베트남어를 사용하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하고 마지막에 법적 효력이 없음을 명시하세요.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemInstruction 
    });

    // 4. 파일 처리 (이미지 + PDF)
    let promptParts = [prompt];
    if (fileUrl) {
      try {
        const fileResp = await fetch(fileUrl).then(res => res.arrayBuffer());
        const fileExt = fileUrl.split('.').pop().toLowerCase();
        
        let mimeType = "image/jpeg";
        if (fileExt === 'pdf') mimeType = "application/pdf";
        else if (fileExt === 'png') mimeType = "image/png";

        promptParts.push({
          inlineData: {
            data: Buffer.from(fileResp).toString("base64"),
            mimeType: mimeType 
          }
        });
      } catch (fileErr) {
        console.error("File processing error:", fileErr);
      }
    }

    // 5. AI 분석 실행
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    // 6. DB 저장 및 카운트 증가
    await supabaseAdmin.from('legal_cases').insert([{ 
      user_id: userId, 
      content: prompt, 
      analysis: responseText, 
      file_url: fileUrl 
    }]);

    if (!isAdmin) {
      await supabaseAdmin.rpc('increment_chat_count', { user_id: userId });
    }

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });

  } catch (error) {
    console.error('Final API Error:', error);
    return new Response(JSON.stringify({ error: error.message || "서버 에러가 발생했습니다." }), { status: 500 });
  }
}
