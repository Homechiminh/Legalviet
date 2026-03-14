import { t } from './Translations';

export default function Sidebar({ lang, onUpgrade }) {
  return (
    <aside className="sidebar">
      <div className="sticky-box">
        {/* 프리미엄 카드 */}
        <div className="card dark">
          <h3 className="card-title">{t[lang].premiumTitle}</h3>
          <p className="card-desc">{t[lang].premiumDesc}</p>
          <button onClick={onUpgrade} className="upgrade-btn">
            {t[lang].premiumBtn}
          </button>
        </div>

        {/* 도움말 카드 */}
        <div className="card light">
          <h3 className="card-title">{t[lang].helpTitle}</h3>
          <ul className="help-list">
            <li>{t[lang].help1}</li>
            <li>{t[lang].help2}</li>
            <li>{t[lang].help3}</li>
            <li>{t[lang].help4}</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .sidebar { width: 100%; }
        .sticky-box { position: sticky; top: 110px; display: flex; flex-direction: column; gap: 20px; }
        
        .card { padding: 25px; border-radius: 24px; transition: 0.3s; }
        .card.dark { background: #0f172a; color: #fff; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1); }
        .card.light { background: #fff; border: 1px solid #e2e8f0; color: #0f172a; }
        
        .card-title { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
        .card-desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
        
        .upgrade-btn { width: 100%; background: #da251d; color: #fff; border: none; padding: 12px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .upgrade-btn:hover { background: #b91c1c; transform: translateY(-2px); }
        
        .help-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .help-list li { font-size: 13px; color: #64748b; font-weight: 500; }

        /* 모달 반응형: 모바일에서는 사이드바가 아래로 내려가므로 sticky 해제 */
        @media (max-width: 900px) {
          .sticky-box { position: static; margin-top: 20px; }
        }
      `}</style>
    </aside>
  );
}
