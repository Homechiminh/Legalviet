"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('ko');
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);
    fetchProfileAndHistory();
  }, []);

  const fetchProfileAndHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 1. 프로필 & 사용 횟수 정보
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) setProfile(profileData);

      // 2. 질문 히스토리 (최신순 10개)
      const { data: historyData } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (historyData) setHistory(historyData);

    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  if (!profile) return <div style={{ padding: '50px', textAlign: 'center' }}>유저 정보를 불러올 수 없습니다.</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'Pretendard' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>{lang === 'ko' ? '마이페이지' : 'My Page'}</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
            {lang === 'ko' ? '로그아웃' : 'Logout'}
          </button>
        </div>

        {/* 1. 멤버십 & 사용 현황 카드 (사장님 요청 추가분) */}
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '8px' }}>Membership Status</p>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
                {profile.is_subscribed ? (lang === 'ko' ? '프리미엄 구독 중' : 'Premium Subscriber') : (lang === 'ko' ? '무료 체험 중' : 'Free Plan')}
              </h2>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: '12px', textAlign: 'right' }}>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>{lang === 'ko' ? '잔여 횟수' : 'Remaining'}</p>
              <p style={{ fontSize: '20px', fontWeight: '700' }}>
                {profile.is_subscribed ? '∞' : `${Math.max(0, 1 - (profile.chat_count || 0))}/1`}
              </p>
            </div>
          </div>
          {!profile.is_subscribed && (
            <button style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#da251d', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
              {lang === 'ko' ? '무제한 이용권 구매하기' : 'Upgrade to Premium'}
            </button>
          )}
        </div>

        {/* 2. 유저 기본 정보 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {profile.email[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700' }}>{profile.email}</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{profile.user_type === 'lawfirm' ? 'Law Firm Partner' : 'General User'}</p>
            </div>
          </div>
        </div>

        {/* 3. 분석 히스토리 */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
            {lang === 'ko' ? '최근 분석 내역' : 'Recent History'}
            <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '400' }}>Total {history.length}</span>
          </h3>
          {history.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
              {lang === 'ko' ? '아직 분석 내역이 없습니다.' : 'No history found.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((item) => (
                <div key={item.id} style={{ ...cardStyle, cursor: 'pointer', transition: '0.2s' }} onClick={() => alert(`[분석결과]\n${item.analysis}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    {item.file_url && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>📄 File</span>}
                  </div>
                  <p style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. 고객 지원 (UserDashboard) */}
        <UserDashboard lang={lang} profile={profile} />
        
      </div>
    </div>
  );
}

const cardStyle = { 
  background: '#fff', 
  padding: '24px', 
  borderRadius: '20px', 
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
  marginBottom: '15px',
  border: '1px solid #f1f5f9'
};

function UserDashboard({ lang, profile }) {
  const [requesting, setRequesting] = useState(false);
  const handleConsultationRequest = async (type) => {
    const KAKAO_URL = "https://open.kakao.com/o/sUEA1yfd";
    const TELEGRAM_URL = "https://t.me/Legalviet";
    if (!confirm(lang === 'ko' ? "상담원과 연결하시겠습니까?" : "Connect to consultant?")) return;
    setRequesting(true);
    try {
      await supabase.from('consultation_requests').insert([{ user_id: profile.id, user_email: profile.email, status: 'pending' }]);
      window.open(type === 'kakao' ? KAKAO_URL : TELEGRAM_URL, '_blank');
    } finally { setRequesting(false); }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>{lang === 'ko' ? '전문가 매칭 지원' : 'Expert Matching'}</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => handleConsultationRequest('kakao')} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#fae100', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Kakao</button>
        <button onClick={() => handleConsultationRequest('telegram')} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#0088cc', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Telegram</button>
      </div>
    </div>
  );
}
