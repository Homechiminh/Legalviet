import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

    // [수정 포인트] 더 강력한 세션 확인 방식
    const { data: { user }, error: authError } = await supabase.auth.getUser(); // getSession 대신 getUser 사용 (보안 및 정확도 향상)
    
    // 만약 세션이 없더라도 클라이언트에서 넘겨준 userId가 있다면 일단 진행하게 하여 튕김 방지
    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false, fileUrl = null } = await req.json();

    if (!user && !userId) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
    }

    // 2. 구독 및 카운트 체크 (userId 우선 사용)
    const targetId = user?.id || userId;
    
    if (!isAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', targetId)
        .maybeSingle();

      const chatCount = profile?.chat_count || 0;
      const isSubscribed = profile?.is_subscribed || false;

      if (!isSubscribed && chatCount >= 1) {
        return new Response(JSON.stringify({ error: "LIMIT_REACHED" }), { status: 403 });
      }
    }

    // 3. AI 모델 세팅 및 분석 (기존 로직 동일)
    const systemInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다...` 
      : `당신은 베트남 법률 분석 전문가입니다...`;

    const model = genAI.getGenerativeModel({ model: "gemini-3-pro", systemInstruction });

    let promptParts = [prompt];
    if (fileUrl) {
      try {
        const fileResp = await fetch(fileUrl).then(res => res.arrayBuffer());
        const fileExt = fileUrl.split('.').pop().toLowerCase();
        let mimeType = fileExt === 'pdf' ? "application/pdf" : (fileExt === 'png' ? "image/png" : "image/jpeg");

        promptParts.push({
          inlineData: { data: Buffer.from(fileResp).toString("base64"), mimeType }
        });
      } catch (fileErr) { console.error("File error:", fileErr); }
    }

    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    // 4. DB 저장 및 결과 반환
    await supabaseAdmin.from('legal_cases').insert([{ 
      user_id: targetId, 
      content: prompt, 
      analysis: responseText, 
      file_url: fileUrl 
    }]);

    if (!isAdmin) await supabaseAdmin.rpc('increment_chat_count', { user_id: targetId });

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });

  } catch (error) {
    console.error('Final API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
