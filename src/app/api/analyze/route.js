import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    // lang: 'ko' 또는 'en' (기본값 'ko')
    // isDocumentRequest: 서류 제작 버튼 클릭 여부 (기본값 false)
    const { prompt, userId, isAdmin, lang = 'ko', isDocumentRequest = false } = await req.json();

    // 1. 유저 상태 확인 (관리자가 아닐 때만 횟수 체크)
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', userId)
        .single();

      if (profile?.chat_count >= 1 && !profile?.is_subscribed) {
        const limitMessage = lang === 'ko' 
          ? "무료 분석 1회를 사용하셨습니다. 지속적인 이용을 위해 구독이 필요합니다." 
          : "You have used your 1 free analysis. Subscription is required for continued use.";
          
        return new Response(JSON.stringify({ 
          error: "LIMIT_REACHED", 
          message: limitMessage
        }), { status: 403 });
      }
    }

    // 2. 대화 적립 (최근 5개 내역 불러오기)
    const { data: history } = await supabase
      .from('legal_cases')
      .select('content, analysis')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 3. 상황별 시스템 명령 설정 (언어 및 서류 제작 기능 대응)
    let systemInstruction = "";
    
    if (isDocumentRequest) {
      // 베트남어 서류 제작 모드
      systemInstruction = `당신은 베트남 법률 행정 서류 작성 전문가입니다. 
      사용자의 요청 내용을 바탕으로 베트남 관공서나 기관에 제출 가능한 '공식 서류 초안(Draft)'을 베트남어로 작성하세요. 
      - 서류의 제목과 간단한 설명은 ${lang === 'ko' ? '한국어' : '영어'}로 제공하되,
      - 서류 본문 양식은 반드시 표준 베트남어 법률 용어를 사용하여 격식 있게 작성하세요.`;
    } else {
      // 일반 분석 모드 (다국어 대응)
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
    await supabase.from('legal_cases').insert([{ user_id: userId, content: prompt, analysis: responseText }]);
    if (!isAdmin) await supabase.rpc('increment_chat_count', { user_id: userId });

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
