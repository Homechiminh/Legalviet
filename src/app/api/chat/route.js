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

    // [보안강화] 세션 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false, fileUrl = null } = await req.json();

    if (!user && !userId) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
    }

    const targetId = user?.id || userId;
    
    // 1. 구독 및 횟수 체크 (Admin 제외)
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

    // 2. 시스템 명령 설정
    const systemInstruction = isDocumentRequest 
      ? `당신은 베트남 법률 행정 서류 작성 전문가입니다. 베트남 관공서 제출용 공식 서류 초안을 베트남어로 작성하세요. 제목은 ${lang === 'ko' ? '한국어' : '영어'}로 쓰되 본문은 격식 있는 베트남어를 사용하세요.` 
      : `당신은 베트남 법률 분석 전문가입니다. 답변은 ${lang === 'ko' ? '한국어' : '영어'}로 작성하고 마지막에 법적 효력이 없음을 명시하세요.`;

    // 3. AI 모델 세팅 (Gemini 3 Pro 엔진 장착)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      systemInstruction: systemInstruction,
      // 법률 분석을 위해 온도를 낮춰 더 보수적이고 정확한 답변을 유도합니다.
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

    // 4. 분석 실행
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    // 5. DB 저장
    await supabaseAdmin.from('legal_cases').insert([{ 
      user_id: targetId, 
      content: prompt, 
      analysis: responseText, 
      file_url: fileUrl 
    }]);

    // 6. 카운트 증가 (Admin 제외)
    if (!isAdmin) {
      await supabaseAdmin.rpc('increment_chat_count', { user_id: targetId });
    }

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });

  } catch (error) {
    console.error('Final API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
