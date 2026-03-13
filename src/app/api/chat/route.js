import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// [설정] 직접 입력된 API 키 및 접속 정보
// 주의: GEMINI_API_KEY 부분에 사장님의 유료 API 키를 꼭 넣어주세요.
const GEMINI_API_KEY = "AIzaSyCfzb5WuxREohVZqZlDwF4nlpjSvRXBihw"; 
const SB_URL = "https://rwezgxprqftuquphvmtp.supabase.co";
const SB_ANON_KEY = "sb_publishable_fVb3zRDUlGXkfUQDGhbdtw_yk-lahJH";
const SB_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3ZXpneHBycWZ0dXF1cGh2bXRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgyMzUzNywiZXhwIjoyMDg4Mzk5NTM3fQ.WsjYdXTLM2J20mt6LEjsXZn4CC6HFc4MVZLDRxV99xk";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const supabaseAdmin = createClient(SB_URL, SB_SERVICE_ROLE);

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      SB_URL,
      SB_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch (e) {} },
          remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch (e) {} },
        },
      }
    );

    // [세션 확인] 
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

    // 3. AI 모델 세팅 (Gemini 2.5 Pro 엔진 장착)
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
