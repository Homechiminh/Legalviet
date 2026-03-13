import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const cookieStore = cookies();
    
    // 최신 SSR 방식 세션 확인
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { cookieStore.set({ name, value, ...options }) },
          remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false, fileUrl = null } = await req.json();

    // 1. 구독/사용 횟수 체크 (single() -> maybeSingle()로 변경하여 데이터 없을 시 에러 방지)
    if (!isAdmin) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) console.error("Profile check error:", profileError);

      // 프로필이 없는 신규 유저일 경우를 대비해 기본값 처리
      const chatCount = profile?.chat_count || 0;
      const isSubscribed = profile?.is_subscribed || false;

      if (!isSubscribed && chatCount >= 1) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403 });
      }
    }

    // 2. 시스템 명령 및 모델 설정
    let systemInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요. 제목은 ${lang === 'ko' ? '한국어' : '영어'}로 쓰되 본문은 격식 있는 베트남어를 사용하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하고 마지막에 법적 효력이 없음을 명시하세요.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", 
      systemInstruction: systemInstruction 
    });

    // 3. 멀티모달 프롬프트 구성 (텍스트 + 이미지)
    let promptParts = [prompt];
    if (fileUrl) {
      const imageResp = await fetch(fileUrl).then(res => res.arrayBuffer());
      // Buffer.from 대신 안전한 Uint8Array 방식 사용 (Edge Runtime 호환)
      const base64Data = Buffer.from(imageResp).toString("base64");
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg" 
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    // 4. 결과 저장 및 횟수 증가
    await supabaseAdmin.from('legal_cases').insert([{ user_id: userId, content: prompt, analysis: responseText, file_url: fileUrl }]);
    if (!isAdmin) await supabaseAdmin.rpc('increment_chat_count', { user_id: userId });

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    // 에러 발생 시에도 JSON 형식을 유지하여 클라이언트의 catch 방어
    return new Response(JSON.stringify({ error: error.message || "Unknown error occurred" }), { status: 500 });
  }
}
