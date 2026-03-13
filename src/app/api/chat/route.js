import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// [보안] 진짜 키는 절대 여기에 적지 마세요. .env.local 혹은 Vercel 환경변수에서 읽어옵니다.
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
    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false, fileUrl = null } = await req.json();

    const targetId = user?.id || userId;
    if (!targetId) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
    }

    // 2. [횟수 체크 강화] 분석 시작 직전에 실시간 DB 정보를 강제로 조회합니다.
    if (!isAdmin) {
      // .maybeSingle() 대신 .single()을 써서 데이터가 반드시 있어야 함을 명시하거나 에러 처리를 강화합니다.
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', targetId)
        .single();

      if (profileError) throw new Error("프로필 정보를 불러올 수 없습니다.");

      const chatCount = profile?.chat_count || 0;
      const isSubscribed = profile?.is_subscribed || false;

      // 비구독자가 이미 1회 이상 사용했다면 즉시 차단 (새로고침해도 여기서 걸림)
      if (!isSubscribed && chatCount >= 1) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403 });
      }
    }

    // 3. 시스템 명령 설정
    const systemInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요. 제목은 ${lang === 'ko' ? '한국어' : '영어'}로 쓰되 본문은 격식 있는 베트남어를 사용하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하고 마지막에 법적 효력이 없음을 명시하세요.`;

    // 4. AI 모델 세팅 (Gemini 2.5 Pro)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro", 
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    });

    let promptParts = [prompt];
    if (fileUrl) {
      try {
        const fileResp = await fetch(fileUrl).then(res => res.arrayBuffer());
        const fileExt = fileUrl.split('.').pop().toLowerCase();
        let mimeType = fileExt === 'pdf' ? "application/pdf" : (fileExt === 'png' ? "image/png" : "image/jpeg");

        promptParts.push({
          inlineData: { data: Buffer.from(fileResp).toString("base64"), mimeType }
        });
      } catch (fileErr) { 
        console.error("File processing error:", fileErr); 
      }
    }

    // 5. 분석 실행
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    // 6. [중요] 카운트 증가와 DB 저장을 순차적으로 확실히 실행
    // 횟수 증가를 먼저 실행하여 사용자가 결과를 받기 전에 이미 '사용한 상태'로 만듭니다.
    if (!isAdmin) {
      const { error: rpcError } = await supabaseAdmin.rpc('increment_chat_count', { user_id: targetId });
      if (rpcError) console.error("카운트 증가 실패:", rpcError);
    }

    // 분석 내역 저장
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
