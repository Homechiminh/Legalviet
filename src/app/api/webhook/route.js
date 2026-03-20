import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    
    // 1. 보안 검증: 레몬스퀴즈가 보낸 진짜 신호인지 확인
    const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET);
    const digest = hmac.update(rawBody).digest('hex');
    const signature = req.headers.get('x-signature');

    if (signature !== digest) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const userEmail = payload.data.attributes.user_email;
    const variantId = String(payload.data.attributes.variant_id);

    const supabase = createRouteHandlerClient({ cookies });

    console.log(`[Webhook] Event: ${eventName}, User: ${userEmail}, Variant: ${variantId}`);

    // --- [케이스 1: 구독 시작, 결제 성공, 요금제 변경] ---
    // 'subscription_cancelled'는 여기에 포함하지 않습니다. (취소해도 만료 전까진 권한 유지)
    if (['subscription_created', 'subscription_updated', 'order_created'].includes(eventName)) {
      
      // 로펌 파트너 요금제인지 확인 (Vercel 환경변수에 등록한 ID들과 비교)
      const isPartner = variantId === process.env.LEMON_SQUEEZY_VARIANT_ID_PARTNER_MONTHLY || 
                        variantId === process.env.LEMON_SQUEEZY_VARIANT_ID_PARTNER_YEARLY;

      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: isPartner ? 'partner' : 'pro',
          is_subscribed: true,
          // 로펌 전환 시 크레딧 20개 부여, 일반 유료 전환 시 0개 (기존 정책 유지 시 수정 가능)
          lead_credits: isPartner ? 20 : 0 
        })
        .eq('email', userEmail);

      if (error) throw error;
      console.log(`[Success] Updated user ${userEmail} to ${isPartner ? 'partner' : 'pro'}`);
    }

    // --- [케이스 2: 권한 즉시 회수 (만료 또는 환불)] ---
    // 'subscription_expired': 한 달 기간이 다 끝났을 때만 날아옴 (1번 안 자동화의 핵심)
    // 'order_refunded': 사장님이 돈을 돌려줬을 때 즉시 회수
    if (['subscription_expired', 'order_refunded'].includes(eventName)) {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: 'standard', // 무료 유저로 변경
          is_subscribed: false,
          lead_credits: 0 
        })
        .eq('email', userEmail);

      if (error) throw error;
      console.log(`[Success] Revoked access for ${userEmail} due to ${eventName}`);
    }

    return NextResponse.json({ message: 'Webhook Processed' });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
