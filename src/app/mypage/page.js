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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileData) setProfile(profileData);

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

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!profile) return <div className="loading-screen">유저 정보를 불러올 수 없습니다.</div>;

  return (
    <div className="mypage-root">
      <div className="container">
        
        {/* 헤더 섹션 */}
        <header className="header">
          <h1 className="title">{lang === 'ko' ? '마이페이지' : 'My Page'}</h1>
          <div className="header-btns">
            <button onClick={() => router.push('/')} className="btn-home">
              {lang === 'ko' ? '홈으로' : 'Home'}
            </button>
            <button onClick={handleLogout} className="btn-logout">
              {lang === 'ko' ? '로그아웃' : 'Logout'}
            </button>
          </div>
        </header>

        {/* 1. 멤버십 카드 */}
        <section className="card membership-card">
          <div className="membership-info">
            <div className="status-box">
              <p className="label">Membership Status</p>
              <h2 className="status-text">
                {profile.is_subscribed ? (lang === 'ko' ? '프리미엄 구독 중' : 'Premium Subscriber') : (lang === 'ko' ? '무료 체험 중' : 'Free Plan')}
              </h2>
            </div>
            <div className="count-badge">
              <p className="badge-label">{lang === 'ko' ? '잔여 횟수' : 'Remaining'}</p>
              <p className="badge-value">
                {profile.is_subscribed ? '∞' : `${Math.max(0, 1 - (profile.chat_count || 0))}/1`}
              </p>
            </div>
          </div>
          {!profile.is_subscribed && (
            <button onClick={() => window.open('https://pf.kakao.com/...', '_blank')} className="btn-upgrade">
              {lang === 'ko' ? '무제한 이용권 구매하기' : 'Upgrade to Premium'}
            </button>
          )}
        </section>

        {/* 2. 유저 정보 */}
        <section className="card user-card">
          <div className="avatar">
            {profile.email ? profile.email[0].toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <p className="user-email">{profile.email}</p>
            <p className="user-role">{profile.user_type === 'admin' ? 'Admin Account' : 'Standard Account'}</p>
          </div>
        </section>

        {/* 3. 히스토리 */}
        <section className="history-section">
          <h3 className="section-title">
            {lang === 'ko' ? '최근 분석 내역' : 'Recent History'}
            <span className="count-tag">Total {history.length}</span>
          </h3>
          
          {history.length === 0 ? (
            <div className="card empty-state">
              {lang === 'ko' ? '아직 분석 내역이 없습니다.' : 'No history found.'}
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="card history-item" onClick={() => setSelectedCase(item)}>
                  <div className="history-item-top">
                    <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
                    {item.file_url && <span className="file-tag">📄 File</span>}
                  </div>
                  <p className="content-preview">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. 대시보드 (매칭 지원) */}
        <UserDashboard lang={lang} profile={profile} />
        
      </div>

      {/* 상세 보기 모달 */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{lang === 'ko' ? '분석 상세 내역' : 'Analysis Detail'}</h2>
              <button onClick={() => setSelectedCase(null)} className="close-x">&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>{lang === 'ko' ? '사용자 질문' : 'User Question'}</label>
                <div className="q-box">{selectedCase.content}</div>
              </div>
              <div className="detail-group">
                <label className="ai-label">LegalViet AI Analysis</label>
                <div className="a-box">{selectedCase.analysis}</div>
              </div>
            </div>
            <button onClick={() => setSelectedCase(null)} className="btn-close-modal">
              {lang === 'ko' ? '닫기' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* --- 반응형 스타일 로직 --- */}
      <style jsx>{`
        .mypage-root { min-height: 100vh; background: #f8fafc; padding: 40px 20px; font-family: 'Pretendard', sans-serif; }
        .container { max-width: 900px; margin: 0 auto; }
        .loading-screen { padding: 100px; text-align: center; color: #64748b; }

        /* 카드 기본 디자인 */
        .card { background: #fff; padding: 24px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 15px; }

        /* 헤더 */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: 800; color: #0f172a; }
        .header-btns { display: flex; gap: 10px; }
        .btn-home, .btn-logout { padding: 8px 16px; border-radius: 8px; font-size: 14px; cursor: pointer; transition: 0.2s; font-weight: 600; }
        .btn-home { border: 1px solid #e2e8f0; background: #fff; color: #475569; }
        .btn-logout { border: none; background: #fee2e2; color: #ef4444; }

        /* 멤버십 카드 */
        .membership-card { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; border: none; }
        .membership-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .label { opacity: 0.7; font-size: 13px; margin-bottom: 5px; }
        .status-text { font-size: 22px; font-weight: 800; }
        .count-badge { background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 12px; text-align: right; }
        .badge-label { font-size: 11px; opacity: 0.6; }
        .badge-value { font-size: 18px; font-weight: 700; }
        .btn-upgrade { width: 100%; padding: 14px; border-radius: 12px; background: #da251d; color: #fff; border: none; font-weight: 700; cursor: pointer; }

        /* 유저 카드 */
        .user-card { display: flex; align-items: center; gap: 15px; }
        .avatar { width: 45px; height: 45px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #0f172a; }
        .user-email { font-size: 16px; font-weight: 700; }
        .user-role { font-size: 13px; color: #64748b; }

        /* 히스토리 섹션 */
        .history-section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: 700; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
        .count-tag { font-size: 12px; color: #3b82f6; font-weight: 400; }
        .history-list { display: flex; flexDirection: column; gap: 12px; }
        .history-item { cursor: pointer; transition: 0.2s; }
        .history-item:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .history-item-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .date { font-size: 12px; color: #94a3b8; }
        .file-tag { font-size: 10px; background: #eff6ff; color: #3b82f6; padding: 2px 6px; border-radius: 4px; }
        .content-preview { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #334155; }
        .empty-state { text-align: center; color: #94a3b8; padding: 40px; }

        /* 모달 스타일 */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
        .modal-content { background: #fff; padding: 30px; border-radius: 24px; max-width: 600px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
        .close-x { border: none; background: none; font-size: 24px; cursor: pointer; color: #94a3b8; }
        .modal-body { max-height: 60vh; overflow-y: auto; padding-right: 10px; }
        .detail-group { margin-bottom: 20px; }
        .detail-group label { display: block; font-weight: 700; color: #64748b; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; }
        .ai-label { color: #da251d !important; }
        .q-box { background: #f8fafc; padding: 15px; border-radius: 12px; font-size: 14px; white-space: pre-wrap; }
        .a-box { padding: 5px 15px; font-size: 15px; line-height: 1.8; white-space: pre-wrap; color: #1e293b; }
        .btn-close-modal { width: 100%; margin-top: 20px; padding: 14px; border-radius: 12px; background: #0f172a; color: #fff; border: none; font-weight: 700; cursor: pointer; }

        /* 🚨 모바일 반응형 쿼리 🚨 */
        @media (max-width: 600px) {
          .mypage-root { padding: 20px 15px; }
          .header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title { font-size: 24px; }
          .membership-info { flex-direction: column; gap: 15px; }
          .count-badge { text-align: left; width: 100%; }
          .status-text { font-size: 18px; }
          .modal-content { padding: 20px; }
          .modal-header h2 { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}

// 전문가 매칭 컴포넌트
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
    <div className="card dashboard-card">
      <h3 className="dashboard-title">{lang === 'ko' ? '법률사무소 매칭 지원' : 'Expert Matching'}</h3>
      <div className="matching-btns">
        <button onClick={() => handleConsultationRequest('kakao')} className="btn-kakao">Kakao</button>
        <button onClick={() => handleConsultationRequest('telegram')} className="btn-telegram">Telegram</button>
      </div>
      <style jsx>{`
        .dashboard-title { margin-bottom: 15px; font-size: 16px; font-weight: 700; color: #0f172a; }
        .matching-btns { display: flex; gap: 10px; }
        .matching-btns button { flex: 1; padding: 14px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-kakao { background: #fae100; color: #3c1e1e; }
        .btn-telegram { background: #0088cc; color: #fff; }
        .matching-btns button:hover { opacity: 0.8; transform: translateY(-1px); }
        
        @media (max-width: 480px) {
          .matching-btns { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
