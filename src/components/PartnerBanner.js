import { t } from './Translations';

export default function PartnerBanner({ lang }) {
  // 각기 다른 3개의 임시 이미지 로고 설정
  const premiumPartners = [
    { 
      id: 1, 
      name: "Vina Law", 
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=VL&backgroundColor=0f172a&fontFamily=Arial&fontWeight=700" 
    },
    { 
      id: 2, 
      name: "HL Legal", 
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=HL&backgroundColor=da251d&fontFamily=Arial&fontWeight=700" 
    },
    { 
      id: 3, 
      name: "S&P Firm", 
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=SP&backgroundColor=2b579a&fontFamily=Arial&fontWeight=700" 
    },
  ];

  return (
    <div className="partner-banner">
      <div className="banner-inner">
        <div className="label-area">
          <span className="banner-label">{lang === 'ko' ? '공식 파트너 로펌' : 'Official Partners'}</span>
        </div>
        <div className="logo-container">
          <div className="logo-track">
            {premiumPartners.map(p => (
              <div key={p.id} className="partner-item">
                <img src={p.logo} alt={p.name} className="partner-logo" />
                <span className="partner-name">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .partner-banner { 
          background: #fff; 
          border-bottom: 1px solid #e2e8f0; 
          padding: 20px 0; 
          overflow: hidden;
        }
        .banner-inner { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 0 20px; 
          display: flex; 
          align-items: center; 
          gap: 40px; 
        }
        .label-area {
          border-right: 2px solid #f1f5f9;
          padding-right: 40px;
        }
        .banner-label { 
          font-size: 13px; 
          font-weight: 800; 
          color: #94a3b8; 
          text-transform: uppercase; 
          white-space: nowrap; 
        }
        .logo-container {
          flex: 1;
          overflow-x: auto;
        }
        .logo-container::-webkit-scrollbar { display: none; }
        
        .logo-track { 
          display: flex; 
          gap: 45px; 
          align-items: center; 
        }
        .partner-item { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
          cursor: pointer; 
          opacity: 0.8; 
          transition: 0.3s;
          white-space: nowrap;
        }
        .partner-item:hover { 
          opacity: 1; 
          transform: translateY(-1px);
        }
        .partner-logo { 
          width: 48px; 
          height: 48px; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .partner-name { 
          font-size: 16px; 
          font-weight: 800; 
          color: #1e293b; 
        }
        
        @media (max-width: 900px) {
          .partner-banner { padding: 15px 0; }
          .banner-inner { flex-direction: column; align-items: flex-start; gap: 15px; }
          .label-area { border-right: none; padding-right: 0; padding-bottom: 5px; }
          .logo-track { gap: 30px; }
          .partner-logo { width: 40px; height: 40px; }
          .partner-name { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
