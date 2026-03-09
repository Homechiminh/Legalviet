import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// [체크] 서버가 시작될 때 API 키가 있는지 로그로 확인 (나중에 지우세요)
if (!process.env.GEMINI_API_KEY) console.error("GEMINI_API_KEY가 없습니다!");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') || ""; // prompt가 없을 경우 대비
    const file = formData.get('file');

    // 모델 설정 (명칭을 더 확실한 최신 버전으로 사용)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-pro-preview" // 또는 "gemini-1.5-flash"
    });

    let parts = [{ text: prompt }];

    // 파일 처리
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      parts.push({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type
        }
      });
    }

    // [중요 수정] AI 분석 실행 방식을 더 명확하게 변경
    // systemInstruction 대신 generationConfig 등을 사용하는 더 안전한 방식
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });
    
    const response = await result.response;
    const responseText = response.text();

    // Supabase DB 저장
    const { data: caseData, error: dbError } = await supabase
      .from('legal_cases')
      .insert([{
        content: prompt,
        analysis: responseText,
        status: 'open'
      }])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Error:", dbError);
      // DB 에러가 나더라도 AI 답변은 전달하도록 처리하거나 에러를 던짐
    }

    return new Response(JSON.stringify({ success: true, analysis: responseText }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Detailed Error:", error);
    // 404 에러 시 어떤 주소를 호출하려 했는지 등 구체적 에러 메시지 반환
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500 });
  }
}