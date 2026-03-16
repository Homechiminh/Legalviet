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
                        <span className="data-value highlight">{lead.contact_info}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">💬 Kakao/Tele:</span>
                        <span className="data-value">{lead.kakao_id || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => onUnlock(lead.id)} className="btn-unlock">
                      {lang === 'ko' ? '🔐 1크레딧으로 고객 정보 열람' : '🔐 Unlock Contact (1 Credit)'}
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
        .lead-card { padding: 20px; border: 1px solid #f1f5f9; border-radius: 20px; transition: 0.3s; }
        .lead-card.unlocked { border: 2px solid #0f172a; background: #f8fafc; }
        
        .lead-top { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .theme-tag { color: #da251d; font-weight: 800; font-size: 13px; }
        .time-tag { font-size: 12px; color: #94a3b8; }
        .lead-summary { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px; }

        .btn-unlock { width: 100%; padding: 14px; background: #da251d; color: #fff; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-unlock:hover { background: #b91c1c; transform: translateY(-2px); }

        .unlocked-data { background: #fff; padding: 15px; border-radius: 12px; border: 1px dashed #0f172a; }
        .data-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .data-label { color: #64748b; font-weight: 600; }
        .data-value { color: #0f172a; font-weight: 700; }
        .data-value.highlight { color: #da251d; font-size: 16px; }

        .empty-leads { text-align: center; padding: 50px; color: #94a3b8; font-size: 14px; }
      `}</style>
    </section>
  );
}
