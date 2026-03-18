"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PartnerDashboard from '@/components/PartnerDashboard';

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [lang, setLang] = useState('ko');
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 폼 상태 관리 (is_contact_public 추가)
  const [editData, setEditData] = useState({
    phone: '',
    chat_type: 'kakao',
    chat_id: '',
    is_contact_public: false // 공개 여부 상태
  });

  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 5;

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
        setEditData({
          phone: profileData.phone || '',
          chat_type: profileData.chat_type || 'kakao',
          chat_id: profileData.chat_id || '',
          is_contact_public: profileData.is_contact_public ?? false
        });
      }

      const { count } = await supabase.from('legal_cases').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setTotalCount(count || 0);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data: historyData } = await supabase.from('legal_cases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).range(from, from + ITEMS_PER_PAGE - 1);
      if (historyData) setHistory(historyData);

      if (profileData?.user_type === 'admin' || profileData?.user_type === 'partner') {
        const { data: leadsData } = await supabase.from('consultation_leads').select('*').order('created_at', { ascending: false }).limit(10);
        if (leadsData) setLeads(leadsData);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleUpdateProfile = async () => {
    setUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: editData.phone,
          chat_type: editData.chat_type,
          chat_id: editData.chat_id,
          is_contact_public: editData.is_contact_public // DB에 저장
        })
        .eq('id', profile.id);

      if (error) throw error;

      alert(lang === 'ko' ? "설정이 저장되었습니다." : "Settings saved.");
      setIsEditing(false);
      fetchProfileAndHistory();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUnlockLead = async (leadId) => {
    if (profile.lead_credits <= 0) { alert("열람권이 부족합니다."); return; }
    if (!confirm("열람권을 사용하시겠습니까?")) return;
    try {
      const { error } = await supabase.from('profiles').update({ 
        lead_credits: profile.lead_credits - 1,
        unlocked_leads: [...unlockedLeads, leadId]
      }).eq('id', profile.id);
      if (!error) { setUnlockedLeads(prev => [...prev, leadId]); fetchProfileAndHistory(); }
    } catch (err) { alert(err.message); }
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

        {/* 1. 파트너 대시보드 */}
        {(profile?.user_type === 'admin' || profile?.user_type === 'partner') && (
          <PartnerDashboard 
            lang={lang} profile={profile} leads={leads} 
            unlockedLeads={unlockedLeads} onUnlock={handleUnlockLead} 
          />
        )}

        {/* 2. 유저 정보 및 공개 ON/OFF 설정 */}
        <section className="card user-card">
          <div className="user-top-row">
            <div className="avatar">{profile?.email?.[0].toUpperCase()}</div>
            <div className="user-info-text">
              <p className="u-email">{profile?.email}</p>
              <p className="u-role">{profile?.user_type === 'partner' ? 'Law Firm Partner' : 'Standard User'}</p>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="btn-edit-toggle">
              {isEditing ? (lang === 'ko' ? '취소' : 'Cancel') : (lang === 'ko' ? '정보 수정' : 'Edit Info')}
            </button>
          </div>

          <div className="public-status-row">
            <span className={`status-badge ${profile?.is_contact_public ? 'on' : 'off'}`}>
              {profile?.is_contact_public 
                ? (lang === 'ko' ? '● 연락처 공개 중' : '● Contact Public') 
                : (lang === 'ko' ? '○ 연락처 비공개' : '○ Contact Private')}
            </span>
            <p className="status-hint">
              {lang === 'ko' ? '* 비공개 시 로펌이 정보를 열람할 수 없습니다.' : '* Private mode hides info from law firms.'}
            </p>
          </div>

          {isEditing && (
            <div className="edit-form">
              {/* 공개/비공개 스위치 */}
              <div className="toggle-group">
                <label className="toggle-label">{lang === 'ko' ? '로펌 매칭용 연락처 공개' : 'Public for Matching'}</label>
                <div 
                  className={`switch ${editData.is_contact_public ? 'active' : ''}`} 
                  onClick={() => setEditData({...editData, is_contact_public: !editData.is_contact_public})}
                >
                  <div className="handle" />
                </div>
              </div>

              <div className="input-group">
                <label>{lang === 'ko' ? '연락처' : 'Phone'}</label>
                <input 
                  type="text" 
                  value={editData.phone} 
                  onChange={(e) => setEditData({...editData, phone: e.target.value})} 
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="input-group">
                <label>{lang === 'ko' ? '메신저 ID' : 'Messenger ID'}</label>
                <div className="messenger-row">
                  <select value={editData.chat_type} onChange={(e) => setEditData({...editData, chat_type: e.target.value})}>
                    <option value="kakao">카카오톡</option>
                    <option value="telegram">텔레그램</option>
                    <option value="zalo">Zalo</option>
                  </select>
                  <input type="text" value={editData.chat_id} onChange={(e) => setEditData({...editData, chat_id: e.target.value})} placeholder="ID" />
                </div>
              </div>

              <button onClick={handleUpdateProfile} disabled={updateLoading} className="btn-save-profile">
                {updateLoading ? '...' : (lang === 'ko' ? '설정 저장하기' : 'Save Settings')}
              </button>
            </div>
          )}
        </section>

        {/* 3. 히스토리 - 파일 확인 버튼 추가됨 */}
        <section className="history-section">
          <h3 className="section-title">{lang === 'ko' ? '최근 분석 내역' : 'Recent History'}</h3>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-row" onClick={() => setSelectedCase(item)}>
                <span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span>
                <p className="content-preview">{item.content}</p>
                
                {/* [추가] 업로드된 파일이 있을 경우 노출되는 아이콘 버튼 */}
                {item.file_url && (
                  <button 
                    className="file-preview-btn" 
                    title={lang === 'ko' ? '첨부파일 보기' : 'View Attachment'}
                    onClick={(e) => {
                      e.stopPropagation(); // 부모 div의 클릭 이벤트(상세보기) 전파 방지
                      window.open(item.file_url, '_blank');
                    }}
                  >
                    📄
                  </button>
                )}
                
                <span className="arrow-icon">›</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .mypage-root { min-height: 100vh; background: #f8fafc; padding: 40px 20px; }
        .container { max-width: 850px; margin: 0 auto; }
        .card { background: #fff; padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 15px; }
        
        .user-top-row { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
        .avatar { width: 50px; height: 50px; background: #0f172a; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .user-info-text { flex-grow: 1; }
        .btn-edit-toggle { background: #f1f5f9; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; }

        .public-status-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
        .status-badge { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 20px; }
        .status-badge.on { background: #e6fffa; color: #38a169; }
        .status-badge.off { background: #fff5f5; color: #e53e3e; }
        .status-hint { font-size: 11px; color: #94a3b8; }

        .toggle-group { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 15px; }
        .toggle-label { font-size: 14px; font-weight: 700; color: #0f172a; }
        .switch { width: 50px; height: 26px; background: #cbd5e1; border-radius: 13px; position: relative; cursor: pointer; transition: 0.3s; }
        .switch.active { background: #da251d; }
        .handle { width: 20px; height: 20px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; }
        .switch.active .handle { left: 27px; }

        .edit-form { background: #f8fafc; padding: 20px; border-radius: 16px; display: flex; flex-direction: column; gap: 15px; border: 1px solid #f1f5f9; }
        .input-group label { display: block; font-size: 12px; font-weight: 800; color: #64748b; margin-bottom: 5px; }
        .input-group input { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; }
        .messenger-row { display: flex; gap: 10px; }
        .btn-save-profile { background: #0f172a; color: #fff; border: none; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; }

        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: 800; }
        .history-row { display: flex; align-items: center; padding: 18px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: 0.2s; }
        .history-row:hover { background: #fcfcfc; }
        .history-date { font-size: 13px; color: #94a3b8; width: 100px; flex-shrink: 0; }
        .content-preview { flex-grow: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 15px; font-size: 14px; }
        
        /* 파일 아이콘 버튼 스타일 */
        .file-preview-btn {
          background: #f1f5f9;
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          margin-right: 15px;
          cursor: pointer;
          font-size: 16px;
          transition: 0.2s;
        }
        .file-preview-btn:hover {
          background: #e2e8f0;
          transform: scale(1.1);
        }

        .arrow-icon { color: #cbd5e1; font-size: 18px; }
      `}</style>
    </div>
  );
}
