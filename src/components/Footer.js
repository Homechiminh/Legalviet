"use client";
import { t } from './Translations';
import Link from 'next/link';

export default function Footer({ lang }) {
  const currentLang = lang || 'ko';
  const content = t[currentLang] || t['ko'];

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <span className="logo-box">L</span> LegalViet
        </div>
        
        <p className="footer-desc">{content?.footerDesc}</p>
        
        <div className="footer-links">
          <Link href="/terms"><span className="link-item">{currentLang === 'ko' ? '이용약관' : 'Terms of Service'}</span></Link>
          <span className="link-divider">|</span>
          <Link href="/privacy"><span className="link-item">{currentLang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}</span></Link>
          <span className="link-divider">|</span>
          <Link href="/pricing"><span className="link-item">{currentLang === 'ko' ? '요금제' : 'Pricing'}</span></Link>
        </div>

        <div className="business-info">
          <p className="contact">Contact: <strong>admin@legalviet.pro</strong></p>
          <p className="biz-details">
            <strong>Korean Sanctuary</strong> 
            <span className="bar">|</span> 
            {currentLang === 'ko' ? '사업자등록번호' : 'Biz Registration'}: 190-41-00742
          </p>
          <p className="biz-address">
            22 Seocheondong-ro, Giheung-gu, Yongin-si, Gyeonggi-do, Republic of Korea
          </p>
        </div>

        <div className="footer-divider"></div>
        <div className="copyright">{content?.copyright}</div>
      </div>

      <style jsx>{`
        .footer { background: #fff; border-top: 1px solid #e2e8f0; padding: 60px 0; margin-top: 80px; }
        .footer-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .footer-logo { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 15px; }
        .logo-box { background: #da251d; color: #fff; padding: 2px 8px; border-radius: 4px; margin-right: 5px; }
        .footer-desc { font-size: 15px; color: #64748b; line-height: 1.8; max-width: 550px; margin-bottom: 20px; }
        .footer-links { margin-bottom: 25px; display: flex; gap: 15px; align-items: center; }
        .link-item { font-size: 14px; color: #475569; cursor: pointer; font-weight: 600; }
        .link-item:hover { color: #da251d; text-decoration: underline; }
        .link-divider { font-size: 12px; color: #cbd5e1; }
        .business-info { margin-bottom: 30px; color: #94a3b8; font-size: 13px; line-height: 1.6; }
        .contact { color: #475569; margin-bottom: 8px; }
        .bar { margin: 0 10px; color: #e2e8f0; }
        .biz-details { margin-bottom: 4px; }
        .footer-divider { width: 40px; height: 2px; background: #da251d; margin-bottom: 20px; border-radius: 2px; }
        .copyright { font-size: 13px; color: #94a3b8; font-weight: 500; letter-spacing: -0.01em; }
        @media (max-width: 600px) {
          .footer { padding: 40px 0; }
          .footer-links { gap: 10px; flex-wrap: wrap; justify-content: center; }
        }
      `}</style>
    </footer>
  );
}
