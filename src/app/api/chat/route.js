import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    // 1. 에러 발생 지점 수정: cookies() 호출 방식 최적화
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          // t.get 에러 방지를 위해 안전한 접근 방식으로 수정
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch (e) {} },
          remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch (e) {} },
        },
      }
    );

    // 세션 확인 (서버 에러 방지를 위해 에러 처리 추가)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
    }

    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false, fileUrl = null } = await req.json();

    // 2. 구독/사용 횟수 체크 (Admin이 아닐 때만)
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

    // 3. AI 모델 설정
    let systemInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요. 제목은 ${lang === 'ko' ? '한국어' : '영어'}로 쓰되 본문은 격식 있는 베트남어를 사용하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하고 마지막에 법적 효력이 없음을 명시하세요.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemInstruction 
    });

    // 4. 이미지 처리 로직 강화
    let promptParts = [prompt];
    if (fileUrl) {
      try {
        const imageResp = await fetch(fileUrl).then(res => res.arrayBuffer());
        promptParts.push({
          inlineData: {
            data: Buffer.from(imageResp).toString("base64"),
            mimeType: "image/jpeg" 
          }
        });
      } catch (imgErr) {
        console.error("Image processing error:", imgErr);
        // 이미지 처리 실패해도 텍스트 분석은 계속 진행
      }
    }

    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    // 5. 결과 저장 및 카운트 증가 (Admin 제외)
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
    return new Response(JSON.stringify({ error: error.message || "서버 내부 에xt러가 발생했습니다." }), { status: 500 });
  }
}
