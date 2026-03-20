"use client";
import { t } from './Translations';
import Link from 'next/link';

export default function Footer({ lang }) {
  // 빌드 시 lang이 undefined일 경우를 대비해 기본값 'ko' 설정
  const currentLang = lang || 'ko';
  const content = t[currentLang] || t['ko'];

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <span className="logo-box">L</span> LegalViet
        </div>
        
        {/* 설명 문구 */}
        <p className="footer-desc">{content?.footerDesc}</p>
        
        {/* [추가] 사이트 승인을 위한 필수 법적 링크 */}
        <div className="footer-links">
          <Link href="/terms">
            <span className="link-item">{currentLang === 'ko' ? '이용약관' : 'Terms of Service'}</span>
          </Link>
          <span className="link-divider">|</span>
          <Link href="/privacy">
            <span className="link-item">{currentLang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}</span>
          </Link>
        </div>

        <div className="footer-divider"></div>
        <div className="copyright">{content?.copyright}</div>
      </div>

      <style jsx>{`
        .footer { 
          background: #fff; 
          border-top: 1px solid #e2e8f0; 
          padding: 60px 0; 
          margin-top: 80px; 
        }
        .footer-content { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 0 20px; 
          text-align: center; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
        }
        
        .footer-logo { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 15px; }
        .logo-box { background: #da251d; color: #fff; padding: 2px 8px; border-radius: 4px; margin-right: 5px; }
        
        .footer-desc { font-size: 15px; color: #64748b; line-height: 1.8; max-width: 550px; margin-bottom: 20px; }

        /* 법적 링크 스타일 추가 */
        .footer-links { margin-bottom: 25px; display: flex; gap: 15px; align-items: center; }
        .link-item { font-size: 14px; color: #475569; cursor: pointer; font-weight: 600; }
        .link-item:hover { color: #da251d; text-decoration: underline; }
        .link-divider { font-size: 12px; color: #cbd5e1; }

        .footer-divider { width: 40px; height: 2px; background: #da251d; margin-bottom: 20px; border-radius: 2px; }
        
        .copyright { font-size: 13px; color: #94a3b8; font-weight: 500; letter-spacing: -0.01em; }

        @media (max-width: 600px) {
          .footer { padding: 40px 0; }
          .footer-desc { font-size: 14px; }
          .footer-links { gap: 10px; }
          .link-item { font-size: 13px; }
        }
      `}</style>
    </footer>
  );
}
