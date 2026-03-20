import { t } from './Translations';

export default function PartnerDashboard({ lang, profile, leads, unlockedLeads, onUnlock }) {
  const currentT = t[lang] || t['ko'];

  return (
    <section className="partner-section">
      <div className="card dashboard-card">
        <div className="dashboard-header">
          <div className="title-area">
            <h3 className="dashboard-title">
              {lang === 'ko' ? '🏛️ 로펌 파트너 센터' : '🏛️ Law Firm Partner Center'}
            </h3>
            <p className="dashboard-subtitle">
              {lang === 'ko' ? '실시간으로 유입되는 잠재 고객 리드입니다.' : 'Real-time potential customer leads.'}
            </p>
          </div>
          <div className="credit-status">
            <span className="c-label">{lang === 'ko' ? '잔여 열람권' : 'Remaining Credits'}</span>
            {/* DB에서 10개로 업데이트된 값이 여기에 자동으로 표시됩니다 */}
            <span className="c-value">{profile.lead_credits || 0}</span>
          </div>
        </div>

        <div className="leads-container">
          {leads.length === 0 ? (
            <div className="empty-leads">
              {lang === 'ko' ? '현재 매칭 가능한 고객이 없습니다.' : 'No available leads at the moment.'}
            </div>
          ) : (
            leads.map((lead) => {
              const isUnlocked = unlockedLeads.includes(lead.id);
              return (
                <div key={lead.id} className={`lead-card ${isUnlocked ? 'unlocked' : ''}`}>
                  <div className="lead-top">
                    <span className="theme-tag">#{lead.theme || 'General'}</span>
                    <span className="time-tag">{new Date(lead.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="lead-summary">{lead.summary}</p>

                  {isUnlocked ? (
                    <div className="unlocked-data">
                      <div className="data-row">
                        <span className="data-label">👤 {lang === 'ko' ? '고객명' : 'Name'}:</span>
                        <span className="data-value">{lead.user_name || 'Anonymous'}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">📞 {lang === 'ko' ? '연락처' : 'Contact'}:</span>
                        <span className="data-value highlight">{lead.contact_info || '비공개'}</span>
                      </div>
                      <div className="data-row">
                        {/* [수정] kakao_id를 사장님 DB 필드명인 chat_id로 맞추는 것이 안전합니다 */}
                        <span className="data-label">💬 {lead.chat_type || 'Messenger'}:</span>
                        <span className="data-value">{lead.chat_id || lead.kakao_id || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onUnlock(lead.id)} 
                      className="btn-unlock"
                      disabled={profile.lead_credits <= 0}
                    >
                      {profile.lead_credits <= 0 
                        ? (lang === 'ko' ? '🚫 크레딧 부족' : '🚫 No Credits')
                        : (lang === 'ko' ? '🔐 1크레딧으로 고객 정보 열람' : '🔐 Unlock Contact (1 Credit)')
                      }
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx>{`
        .partner-section { margin-bottom: 40px; }
        .dashboard-card { background: #fff; border-radius: 28px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); overflow: hidden; }
        .dashboard-header { background: #0f172a; padding: 30px; display: flex; justify-content: space-between; align-items: center; color: #fff; }
        .dashboard-title { font-size: 20px; font-weight: 800; margin-bottom: 5px; }
        .dashboard-subtitle { font-size: 13px; color: #94a3b8; }
        
        .credit-status { background: rgba(255,255,255,0.1); padding: 10px 25px; border-radius: 16px; text-align: center; border: 1px solid rgba(255,255,255,0.2); }
        .c-label { font-size: 11px; opacity: 0.7; display: block; margin-bottom: 2px; }
        .c-value { font-size: 24px; font-weight: 900; color: #fbbf24; }

        .leads-container { padding: 30px; display: flex; flex-direction: column; gap: 15px; }
        .lead-card { padding: 25px; border: 1px solid #f1f5f9; border-radius: 24px; transition: 0.3s; background: #fff; }
        .lead-card.unlocked { border: 2px solid #da251d; background: #fffafb; }
        
        .lead-top { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .theme-tag { color: #da251d; font-weight: 800; font-size: 13px; background: #fee2e2; padding: 4px 10px; border-radius: 8px; }
        .time-tag { font-size: 12px; color: #94a3b8; }
        .lead-summary { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px; font-weight: 500; }

        .btn-unlock { width: 100%; padding: 16px; background: #da251d; color: #fff; border: none; border-radius: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 15px; }
        .btn-unlock:hover:not(:disabled) { background: #b91c1c; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(218, 37, 29, 0.3); }
        .btn-unlock:disabled { background: #cbd5e1; cursor: not-allowed; }

        .unlocked-data { background: #fff; padding: 20px; border-radius: 16px; border: 1px dashed #da251d; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; align-items: center; }
        .data-row:last-child { margin-bottom: 0; }
        .data-label { color: #64748b; font-weight: 600; }
        .data-value { color: #0f172a; font-weight: 700; }
        .data-value.highlight { color: #da251d; font-size: 18px; text-decoration: underline; text-underline-offset: 4px; }

        .empty-leads { text-align: center; padding: 60px; color: #94a3b8; font-size: 15px; font-weight: 500; }
      `}</style>
    </div>
  );             
}
