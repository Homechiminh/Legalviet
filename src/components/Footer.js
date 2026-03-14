import { t } from './Translations';

export default function Footer({ lang }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <span className="logo-box">L</span> LegalViet
        </div>
        <p className="footer-desc">{t[lang].footerDesc}</p>
        <div className="footer-divider"></div>
        <div className="copyright">{t[lang].copyright}</div>
      </div>

      <style jsx>{`
        .footer { background: #fff; border-top: 1px solid #e2e8f0; padding: 60px 0; margin-top: 80px; }
        .footer-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        
        .footer-logo { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 15px; }
        .logo-box { background: #da251d; color: #fff; padding: 2px 8px; border-radius: 4px; margin-right: 5px; }
        
        .footer-desc { font-size: 15px; color: #64748b; line-height: 1.8; max-width: 550px; margin-bottom: 30px; }
        .footer-divider { width: 40px; height: 2px; background: #da251d; margin-bottom: 20px; border-radius: 2px; }
        
        .copyright { font-size: 13px; color: #94a3b8; font-weight: 500; letter-spacing: -0.01em; }

        @media (max-width: 600px) {
          .footer { padding: 40px 0; }
          .footer-desc { font-size: 14px; }
        }
      `}</style>
    </footer>
  );
}
