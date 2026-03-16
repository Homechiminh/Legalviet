import { t } from './Translations';

export default function Sidebar({ lang, onUpgrade }) {
  // lang이 없거나 Translations에 해당 키가 없을 경우를 대비한 안전장치
  const currentT = t[lang] || t['ko'];

  return (
    <aside className="sidebar">
      <div className="sticky-box">
        {/* 프리미엄 카드 - 딥 네이비 배경 */}
        <div className="card dark">
          <h3 className="card-title">{currentT.premiumTitle}</h3>
          <p className="card-desc">{currentT.premiumDesc}</p>
          <button onClick={onUpgrade} className="upgrade-btn">
            {currentT.premiumBtn}
          </button>
        </div>

        {/* 안내 카드 - 텍스트 가이드 역할 */}
        <div className="card light">
          <h3 className="card-title-navy">{currentT.helpTitle}</h3>
          <ul className="help-list">
            <li>{currentT.help1}</li>
            <li>{currentT.help2}</li>
            <li>{currentT.help3}</li>
            <li>{currentT.help4}</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .sidebar { width: 100%; }
        .sticky-box { position: sticky; top: 110px; display: flex; flex-direction: column; gap: 20px; }
        
        .card { padding: 30px; border-radius: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .card.dark { background: #0f172a; color: #fff; }
        .card.light { background: #fff; border: 1px solid #e2e8f0; color: #0f172a; }
        
        .card-title { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
        .card-title-navy { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 15px; }
        .card-desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
        
        .upgrade-btn { width: 100%; background: #da251d; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 15px; }
        .upgrade-btn:hover { background: #b91c1c; transform: translateY(-2px); }
        
        .help-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .help-list li { 
          font-size: 14px; 
          color: #64748b; 
          font-weight: 500; 
          line-height: 1.4;
          /* 클릭 불가능함을 시각적으로 전달 */
          cursor: default; 
        }

        @media (max-width: 900px) {
          .sticky-box { position: static; margin-top: 20px; }
        }
      `}</style>
    </aside>
  );
}
