import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 클라이언트 사이드와 서버 사이드 모두에서 사용 가능한 supabase 객체 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * [주의] 어드민 작업이 필요한 경우에만 서버 환경(API Route 등)에서 
 * SUPABASE_SERVICE_ROLE_KEY를 사용하여 별도의 클라이언트를 만드세요.
 */
