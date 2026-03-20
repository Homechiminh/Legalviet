import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// 관리자용 Supabase 클라이언트 생성 (환경변수 확인 필수!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Anon Key가 아닌 Service Role Key를 써야 DB 수정이 잘 됩니다.
);

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET);
    const digest = hmac.update(rawBody).digest('hex');
    const signature = req.headers.get('x-signature');

    if (signature !== digest) return new Response('Invalid signature', { status: 401 });

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const userEmail = payload.data.attributes.user_email;
    const variantId = String(payload.data.attributes.variant_id);

    console.log(`[Webhook] Event: ${eventName}, User: ${userEmail}`);

    // --- [케이스 1: 구독 시작/업데이트/결제 성공] ---
    if (['subscription_created', 'subscription_updated', 'order_created'].includes(eventName)) {
      const isPartner = variantId === process.env.LEMON_SQUEEZY_VARIANT_ID_PARTNER_MONTHLY || 
                        variantId === process.env.LEMON_SQUEEZY_VARIANT_ID_PARTNER_YEARLY;

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          user_type: isPartner ? 'partner' : 'pro',
          is_subscribed: true,
          lead_credits: isPartner ? 20 : 0 
        })
        .eq('email', userEmail);

      if (error) throw error;
    }

    // --- [케이스 2: 만료 또는 환불] ---
    if (['subscription_expired', 'order_refunded'].includes(eventName)) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          user_type: 'standard',
          is_subscribed: false,
          lead_credits: 0 
        })
        .eq('email', userEmail);

      if (error) throw error;
    }

    return NextResponse.json({ message: 'Webhook Processed' });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
