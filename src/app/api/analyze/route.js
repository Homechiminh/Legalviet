import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// 서비스 롤 키를 사용하는 어드민 클라이언트 (유저 횟수 업데이트용)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    // [보안] 서버 사이드 세션 확인
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "로그인이 필요합니다." }), { status: 401 });
    }

    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false } = await req.json();

    // 1. 유저 상태 확인 및 구독 여부에 따른 제한 로직
    if (!isAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', userId)
        .single();

      // [핵심 수정] 구독자가 아닐 때만 횟수 체크를 진행함
      if (!profile?.is_subscribed) {
        // 무료 사용 횟수 제한 (예: 1회)
        if (profile?.chat_count >= 1) {
          const limitMessage = lang === 'ko' 
            ? "무료 분석 1회를 사용하셨습니다. 무제한 이용을 위해 구독이 필요합니다." 
            : "You have used your 1 free analysis. Subscription is required for unlimited use.";
            
          return new Response(JSON.stringify({ 
            error: "LIMIT_REACHED", 
            message: limitMessage
          }), { status: 403 });
        }
      }
      // profile.is_subscribed가 true이면 위 if문을 타지 않고 바로 아래 분석 로직으로 넘어감 (무제한)
    }

    // 2. 대화 적립 (최근 5개 내역 불러오기)
    const { data: history } = await supabaseAdmin
      .from('legal_cases')
      .select('content, analysis')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. 상황별 시스템 명령 설정
    let systemInstruction = "";
    if (isDocumentRequest) {
      systemInstruction = `당신은 베트남 법률 행정 서류 작성 전문가입니다. 
      사용자의 요청 내용을 바탕으로 베트남 관공서나 기관에 제출 가능한 '공식 서류 초안(Draft)'을 베트남어로 작성하세요. 
      - 서류의 제목과 간단한 설명은 ${lang === 'ko' ? '한국어' : '영어'}로 제공하되,
      - 서류 본문 양식은 반드시 표준 베트남어 법률 용어를 사용하여 격식 있게 작성하세요.`;
    } else {
      systemInstruction = `당신은 베트남 법률 서류 및 상황 분석 어시스턴트입니다.
      - 모든 답변의 메인 언어는 반드시 ${lang === 'ko' ? '한국어' : '영어(English)'}로 작성하세요.
      - 답변 끝에 주요 베트남어 키워드나 문장을 포함하고, 마지막엔 항상 법적 효력이 없음을 명시하세요.`;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction
    });

    let chatHistory = history ? history.reverse().map(h => ([
      { role: "user", parts: [{ text: h.content }] },
      { role: "model", parts: [{ text: h.analysis }] }
    ])).flat() : [];

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // 4. 결과 저장 및 횟수 증가
    await supabaseAdmin.from('legal_cases').insert([{ user_id: userId, content: prompt, analysis: responseText }]);
    
    // [보충] 구독자는 굳이 카운트를 안 올려도 되지만, 통계를 위해 올리거나 관리자만 제외하도록 유지
    if (!isAdmin) await supabaseAdmin.rpc('increment_chat_count', { user_id: userId });

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
