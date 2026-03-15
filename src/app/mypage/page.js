"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('ko');
  const [profile, setProfile] = useState(null);
  
  // 히스토리 및 페이지네이션 상태
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 5;

  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);
    fetchProfileAndHistory();
  }, [currentPage]);

  const fetchProfileAndHistory = async () => {
    try {
      setLoading(true);
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

      const { count } = await supabase
        .from('legal_cases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      setTotalCount(count || 0);

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: historyData } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (historyData) setHistory(historyData);

    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // [추가] 내역 초기화 로직
  const handleDeleteAll = async () => {
    const confirmMsg = lang === 'ko' 
      ? "정말 모든 분석 내역을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다." 
      : "Are you sure you want to delete all history? This cannot be undone.";
    
    if (!confirm(confirmMsg)) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('legal_cases')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      alert(lang === 'ko' ? "내역이 초기화되었습니다." : "History has been reset.");
      setCurrentPage(1);
      fetchProfileAndHistory(); // 목록 갱신
    } catch (err) {
      alert(lang === 'ko' ? "삭제 중 오류가 발생했습니다." : "Error during deletion.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && history.length === 0) return <div className="loading-screen">Loading...</div>;
  if (!profile) return <div className="loading-screen">유저 정보를 불러올 수 없습니다.</div>;

  return (
    <div className="mypage-root">
      <div className="container">
        
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

        <section className="card user-card">
          <div className="avatar">
            {profile.email ? profile.email[0].toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <p className="user-email">{profile.email}</p>
            <p className="user-role">{profile.user_type === 'admin' ? 'Admin Account' : 'Standard Account'}</p>
          </div>
        </section>

        <section className="history-section">
          <div className="section-header-row">
            <h3 className="section-title">
              {lang === 'ko' ? '최근 분석 내역' : 'Recent History'}
              <span className="count-tag">Total {totalCount}</span>
            </h3>
            {/* [추가] 초기화 버튼 */}
            {history.length > 0 && (
              <button onClick={handleDeleteAll} className="btn-reset-history">
                {lang === 'ko' ? '내역 초기화' : 'Reset History'}
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <div className="card empty-state">
              {lang === 'ko' ? '아직 분석 내역이 없습니다.' : 'No history found.'}
            </div>
          ) : (
            <>
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-row" onClick={() => setSelectedCase(item)}>
                    <div className="history-date">{new Date(item.created_at).toLocaleDateString()}</div>
                    <div className="history-content-box">
                      <p className="content-preview">{item.content}</p>
                      {item.file_url && <span className="file-icon">📄</span>}
                    </div>
                    <div className="arrow-icon">›</div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-btn"
                  >
                    {lang === 'ko' ? '이전' : 'Prev'}
                  </button>
                  <span className="p-info">{currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-btn"
                  >
                    {lang === 'ko' ? '다음' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <UserDashboard lang={lang} profile={profile} />
        
      </div>

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

      <style jsx>{`
        .mypage-root { min-height: 100vh; background: #f8fafc; padding: 40px 20px; font-family: 'Pretendard', sans-serif; }
        .container { max-width: 900px; margin: 0 auto; }
        .loading-screen { padding: 100px; text-align: center; color: #64748b; }

        .card { background: #fff; padding: 24px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 15px; }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: 800; color: #0f172a; }
        .header-btns { display: flex; gap: 10px; }
        .btn-home, .btn-logout { padding: 8px 16px; border-radius: 8px; font-size: 14px; cursor: pointer; transition: 0.2s; font-weight: 600; }
        .btn-home { border: 1px solid #e2e8f0; background: #fff; color: #475569; }
        .btn-logout { border: none; background: #fee2e2; color: #ef4444; }

        .membership-card { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; border: none; }
        .membership-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .label { opacity: 0.7; font-size: 13px; margin-bottom: 5px; }
        .status-text { font-size: 22px; font-weight: 800; }
        .count-badge { background: rgba(255,255,255,0.1); padding: 10px 15px; border-radius: 12px; text-align: right; }
        .badge-label { font-size: 11px; opacity: 0.6; }
        .badge-value { font-size: 18px; font-weight: 700; }
        .btn-upgrade { width: 100%; padding: 14px; border-radius: 12px; background: #da251d; color: #fff; border: none; font-weight: 700; cursor: pointer; }

        .user-card { display: flex; align-items: center; gap: 15px; }
        .avatar { width: 45px; height: 45px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #0f172a; }
        .user-email { font-size: 16px; font-weight: 700; }
        .user-role { font-size: 13px; color: #64748b; }

        .history-section { margin-bottom: 30px; }
        /* 초기화 버튼 정렬을 위한 래퍼 */
        .section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .section-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .count-tag { font-size: 12px; color: #3b82f6; font-weight: 400; }
        
        /* 초기화 버튼 디자인 */
        .btn-reset-history { background: none; border: none; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; text-decoration: underline; }
        .btn-reset-history:hover { color: #ef4444; }

        .history-list { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .history-row { display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: 0.2s; }
        .history-row:last-child { border-bottom: none; }
        .history-row:hover { background: #f8fafc; }
        
        .history-date { font-size: 13px; color: #94a3b8; width: 100px; flex-shrink: 0; }
        .history-content-box { flex-grow: 1; display: flex; align-items: center; gap: 10px; overflow: hidden; }
        
        .content-preview { font-weight: 600; font-size: 14px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .file-icon { font-size: 12px; }
        .arrow-icon { color: #cbd5e1; font-size: 20px; margin-left: 10px; }

        .pagination { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 25px; }
        .p-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; font-size: 13px; cursor: pointer; color: #475569; }
        .p-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .p-info { font-size: 14px; font-weight: 700; color: #0f172a; }

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

        @media (max-width: 600px) {
          .mypage-root { padding: 20px 15px; }
          .header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .title { font-size: 24px; }
          .history-row { padding: 15px; }
          .history-date { width: 80px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}

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
        @media (max-width: 480px) { .matching-btns { flex-direction: column; } }
      `}</style>
    </div>
  );
}
