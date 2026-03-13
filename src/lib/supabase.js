import { createClient } from '@supabase/supabase-js';

// 사장님이 주신 정보를 직접 입력했습니다.
const supabaseUrl = 'https://rwezgxprqftuquphvmtp.supabase.co';
const supabaseAnonKey = 'sb_publishable_fVb3zRDUlGXkfUQDGhbdtw_yk-lahJH';

// 클라이언트 사이드와 서버 사이드 모두에서 사용 가능한 supabase 객체 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * [주의] 어드민 작업이 필요한 경우(API Route 등)에서만 
 * 아래 SERVICE_ROLE_KEY를 사용하여 별도의 클라이언트를 만드세요.
 * * const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 사장님이 주신 긴 키
 */
