"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PartnerDashboard from '@/components/PartnerDashboard'; // 부품 임포트

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('ko');
  const [profile, setProfile] = useState(null);
  
  // 일반 히스토리 상태
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 5;

  // 로펌 파트너 상태
  const [leads, setLeads] = useState([]);
  const [unlockedLeads, setUnlockedLeads] = useState([]);

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
      if (!user) { router.push('/auth/login'); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profileData) {
        setProfile(profileData);
        setUnlockedLeads(profileData.unlocked_leads || []);
      }

      // 1. 일반 히스토리 (기존 유지)
      const { count } = await supabase.from('legal_cases').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setTotalCount(count || 0);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data: historyData } = await supabase.from('legal_cases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).range(from, from + ITEMS_PER_PAGE - 1);
      if (historyData) setHistory(historyData);

      // 2. 로펌 전용 데이터 로드 (관리자/파트너 전용)
      if (profileData?.user_type === 'admin' || profileData?.user_type === 'partner') {
        const { data: leadsData } = await supabase.from('consultation_leads').select('*').order('created_at', { ascending: false }).limit(10);
        if (leadsData) setLeads(leadsData);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleUnlockLead = async (leadId) => {
    if (profile.lead_credits <= 0) { alert(lang === 'ko' ? "열람권이 부족합니다." : "No credits."); return; }
    if (!confirm(lang === 'ko' ? "열람권 1회를 사용하시겠습니까?" : "Use 1 credit?")) return;
    
    try {
      const { error } = await supabase.from('profiles').update({ 
        lead_credits: profile.lead_credits - 1,
        unlocked_leads: [...unlockedLeads, leadId]
      }).eq('id', profile.id);
      
      if (!error) {
        setUnlockedLeads(prev => [...prev, leadId]);
        // 프로필 정보 즉시 갱신을 위해 다시 페칭
        const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).maybeSingle();
        if (updatedProfile) setProfile(updatedProfile);
      }
    } catch (err) { alert(err.message); }
  };

  const handleDeleteAll = async () => {
    if (!confirm("모든 내역을 삭제하시겠습니까?")) return;
    await supabase.from('legal_cases').delete().eq('user_id', profile.id);
    setCurrentPage(1);
    fetchProfileAndHistory();
  };

  if (loading && history.length === 0) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="mypage-root">
      <div className="container">
        <header className="header">
          <h1 className="title">{lang === 'ko' ? '마이페이지' : 'My Page'}</h1>
          <div className="header-btns">
            <button onClick={() => router.push('/')} className="btn-home">Home</button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="btn-logout">Logout</button>
          </div>
        </header>

        {/* 🏛️ 로펌 파트너 대시보드 (조건부 노출) */}
        {(profile?.user_type === 'admin' || profile?.user_type === 'partner') && (
          <PartnerDashboard 
            lang={lang} profile={profile} leads={leads} 
            unlockedLeads={unlockedLeads} onUnlock={handleUnlockLead} 
          />
        )}

        <section className="card membership-card">
          <div className="membership-info">
            <div className="status-box">
              <p className="label">Membership Status</p>
              <h2 className="status-text">{profile?.is_subscribed ? 'PREMIUM' : 'FREE PLAN'}</h2>
            </div>
            <div className="count-badge">
              <p className="badge-label">{lang === 'ko' ? '잔여 횟수' : 'Remaining'}</p>
              <p className="badge-value">{profile?.is_subscribed ? '∞' : `${Math.max(0, 1 - (profile?.chat_count || 0))}/1`}</p>
            </div>
          </div>
        </section>

        <section className="history-section">
          <div className="section-header-row">
            <h3 className="section-title">{lang === 'ko' ? '최근 분석 내역' : 'Recent History'}</h3>
            {history.length > 0 && <button onClick={handleDeleteAll} className="btn-reset-history">Reset</button>}
          </div>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-row" onClick={() => setSelectedCase(item)}>
                <span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span>
                <p className="content-preview">{item.content}</p>
                <span className="arrow-icon">›</span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-btn">Prev</button>
              <span className="p-info">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-btn">Next</button>
            </div>
          )}
        </section>

        <UserDashboard lang={lang} profile={profile} />
      </div>

      {/* 모달 등 생략 없이 기존 스타일 유지 */}
      <style jsx>{`
        .mypage-root { min-height: 100vh; background: #f8fafc; padding: 40px 20px; }
        .container { max-width: 850px; margin: 0 auto; }
        .card { background: #fff; padding: 24px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 15px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: 800; color: #0f172a; }
        .btn-home { border: 1px solid #e2e8f0; background: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
        .btn-logout { background: #fee2e2; color: #ef4444; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .membership-card { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; border: none; }
        .status-text { font-size: 22px; font-weight: 800; }
        .history-row { display: flex; align-items: center; padding: 18px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
        .history-date { font-size: 13px; color: #94a3b8; width: 100px; flex-shrink: 0; }
        .content-preview { flex-grow: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 15px; font-size: 14px; }
        .pagination { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
        .p-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; }
        .btn-reset-history { color: #94a3b8; background: none; border: none; cursor: pointer; text-decoration: underline; }
      `}</style>
    </div>
  );
}

function UserDashboard({ lang, profile }) {
  // 기존 코드 유지
  return (
    <div className="card dashboard-card">
      <h3 style={{marginBottom:'15px', fontWeight:700}}>{lang === 'ko' ? '법률사무소 매칭 지원' : 'Expert Matching'}</h3>
      <div style={{display:'flex', gap:'10px'}}>
        <button style={{flex:1, padding:'14px', borderRadius:'12px', background:'#fae100', border:'none', fontWeight:700, cursor:'pointer'}} onClick={() => window.open("https://open.kakao.com/o/sUEA1yfd")}>Kakao</button>
        <button style={{flex:1, padding:'14px', borderRadius:'12px', background:'#0088cc', color:'#fff', border:'none', fontWeight:700, cursor:'pointer'}} onClick={() => window.open("https://t.me/Legalviet")}>Telegram</button>
      </div>
    </div>
  );
}
