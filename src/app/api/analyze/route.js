import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const { prompt, userId, isAdmin } = await req.json();

    // 1. 유저 상태 확인 (관리자가 아닐 때만 횟수 체크)
    if (!isAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('chat_count, is_subscribed')
        .eq('id', userId)
        .single();

      if (profile?.chat_count >= 1 && !profile?.is_subscribed) {
        return new Response(JSON.stringify({ 
          error: "LIMIT_REACHED", 
          message: "무료 분석 1회를 사용하셨습니다. 지속적인 이용을 위해 구독이 필요합니다." 
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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: "당신은 베트남 법률 서류 및 상황 분석 어시스턴트입니다. 직접적인 법률 판단이 아닌, 제출된 서류의 요약 및 상황 분석 서포트 역할을 수행하며 마지막엔 항상 법적 효력이 없음을 명시하세요."
    });

    let chatHistory = history ? history.reverse().map(h => ([
      { role: "user", parts: [{ text: h.content }] },
      { role: "model", parts: [{ text: h.analysis }] }
    ])).flat() : [];

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // 3. 결과 저장 및 횟수 증가
    await supabase.from('legal_cases').insert([{ user_id: userId, content: prompt, analysis: responseText }]);
    if (!isAdmin) await supabase.rpc('increment_chat_count', { user_id: userId });

    return new Response(JSON.stringify({ analysis: responseText }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
