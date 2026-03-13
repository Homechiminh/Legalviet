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

    // 1. 구독/사용 횟수 체크
    if (!isAdmin) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('chat_count, is_subscribed').eq('id', userId).single();
      if (!profile?.is_subscribed && profile?.chat_count >= 1) {
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
      promptParts.push({
        inlineData: {
          data: Buffer.from(imageResp).toString("base64"),
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
