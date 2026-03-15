import { t } from './Translations';

export default function PartnerBanner({ lang }) {
  // 예시 구독 로펌 (프리미엄 로펌들)
  const premiumPartners = [
    { id: 1, name: "Vina Law", logo: "https://via.placeholder.com/40/0f172a/fff?text=V" },
    { id: 2, name: "HL Legal", logo: "https://via.placeholder.com/40/da251d/fff?text=H" },
    { id: 3, name: "S&P Firm", logo: "https://via.placeholder.com/40/2b579a/fff?text=S" },
  ];

  return (
    <div className="partner-banner">
      <div className="banner-inner">
        <span className="banner-label">{lang === 'ko' ? '공식 파트너 로펌' : 'Official Partners'}</span>
        <div className="logo-track">
          {premiumPartners.map(p => (
            <div key={p.id} className="partner-item">
              <img src={p.logo} alt={p.name} className="partner-logo" />
              <span className="partner-name">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .partner-banner { background: #fff; border-bottom: 1px solid #f1f5f9; padding: 12px 0; overflow: hidden; }
        .banner-inner { max-width: 1200px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; gap: 20px; }
        .banner-label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; white-space: nowrap; border-right: 1px solid #e2e8f0; padding-right: 20px; }
        .logo-track { display: flex; gap: 25px; align-items: center; }
        .partner-item { display: flex; align-items: center; gap: 8px; cursor: pointer; opacity: 0.7; transition: 0.2s; }
        .partner-item:hover { opacity: 1; }
        .partner-logo { width: 28px; height: 28px; border-radius: 6px; }
        .partner-name { font-size: 13px; font-weight: 700; color: #475569; }
        
        @media (max-width: 768px) {
          .banner-inner { flex-direction: column; align-items: flex-start; gap: 10px; }
          .banner-label { border-right: none; padding-right: 0; padding-bottom: 5px; }
          .logo-track { gap: 15px; }
        }
      `}</style>
    </div>
  );
}
