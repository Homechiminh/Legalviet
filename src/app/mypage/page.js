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
  
  // [추가] 상세 보기 모달 상태
  const [selectedCase, setSelectedCase] = useState(null);

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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

      // 2. 질문 히스토리 (최신순 10개)
      // 이제 SQL에서 user_id 컬럼을 만드셨기 때문에 정상적으로 필터링됩니다.
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

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  if (!profile) return <div style={{ padding: '100px', textAlign: 'center' }}>유저 정보를 불러올 수 없습니다.</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'Pretendard' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>{lang === 'ko' ? '마이페이지' : 'My Page'}</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => router.push('/')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
              {lang === 'ko' ? '홈으로' : 'Home'}
            </button>
            <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              {lang === 'ko' ? '로그아웃' : 'Logout'}
            </button>
          </div>
        </div>

        {/* 1. 멤버십 & 사용 현황 카드 */}
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
            <button onClick={() => window.open('https://pf.kakao.com/...', '_blank')} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#da251d', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
              {lang === 'ko' ? '무제한 이용권 구매하기' : 'Upgrade to Premium'}
            </button>
          )}
        </div>

        {/* 2. 유저 기본 정보 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {profile.email ? profile.email[0].toUpperCase() : 'U'}
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700' }}>{profile.email}</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{profile.user_type === 'admin' ? 'Admin' : 'General User'}</p>
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
                <div 
                  key={item.id} 
                  style={{ ...cardStyle, cursor: 'pointer', transition: '0.2s' }} 
                  onClick={() => setSelectedCase(item)} // [수정] 모달 열기
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    {item.file_url && <span style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>📄 File Attached</span>}
                  </div>
                  <p style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#0f172a' }}>
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. 고객 지원 */}
        <UserDashboard lang={lang} profile={profile} />
        
      </div>

      {/* [추가] 분석 상세 보기 모달 */}
      {selectedCase && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCase(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>분석 상세 내역</h2>
              <button onClick={() => setSelectedCase(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              <p style={{ fontWeight: '700', color: '#64748b', fontSize: '13px', marginBottom: '5px' }}>사용자 질문</p>
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {selectedCase.content}
              </div>
              <p style={{ fontWeight: '700', color: '#da251d', fontSize: '13px', marginBottom: '5px' }}>LegalViet AI 분석 결과</p>
              <div style={{ padding: '15px', fontSize: '15px', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                {selectedCase.analysis}
              </div>
            </div>
            <button 
              onClick={() => setSelectedCase(null)}
              style={{ width: '100%', marginTop: '20px', padding: '14px', borderRadius: '12px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
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

const modalOverlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalContentStyle = {
  background: '#fff', padding: '30px', borderRadius: '24px', maxWidth: '600px', width: '90%',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
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
      <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '700' }}>
        {lang === 'ko' ? '법률사무소 매칭 지원' : 'Expert Matching'}
      </h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => handleConsultationRequest('kakao')} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#fae100', border: 'none', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>Kakao</button>
        <button onClick={() => handleConsultationRequest('telegram')} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#0088cc', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>Telegram</button>
      </div>
    </div>
  );
}
