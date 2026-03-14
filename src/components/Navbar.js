import { t } from './Translations';

export default function Navbar({ lang, setLang, user, userName, onLogout, onMyPage, onLogin }) {
  // [보정] lang이 없거나 Translations에 해당 키가 없을 경우를 대비한 안전장치
  const currentT = t[lang] || t['ko'];

  return (
    <nav className="nav">
      <div className="logo" onClick={() => window.location.href = '/'}>
        <span className="logo-box">L</span>
        <span className="logo-text">LegalViet</span>
      </div>
      
      <div className="nav-actions">
        {/* 언어 선택 */}
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="lang-select">
          <option value="ko">KOR</option>
          <option value="en">ENG</option>
        </select>

        {/* 유저 상태에 따른 버튼 */}
        {user ? (
          <div className="user-area">
            <span className="user-name">{userName || (lang === 'en' ? 'User' : '사용자')}님</span>
            <button onClick={onLogout} className="logout-btn">
              {currentT.logout}
            </button>
          </div>
        ) : (
          <button onClick={onLogin} className="login-btn">
            {currentT.login}
          </button>
        )}

        {/* 마이페이지 버튼 - Translations의 문구를 사용하도록 수정 */}
        <button onClick={onMyPage} className="mypage-btn">
          {currentT.mypage}
        </button>
      </div>

      <style jsx>{`
        .nav { 
          background: #fff; 
          border-bottom: 1px solid #e2e8f0; 
          padding: 0 40px; 
          height: 70px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          position: sticky; 
          top: 0; 
          z-index: 100; 
        }
        
        .logo { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          cursor: pointer; 
        }
        
        .logo-box { 
          background: #da251d; 
          color: #fff; 
          padding: 4px 10px; 
          border-radius: 8px; 
          font-weight: 900; 
          font-size: 18px; 
        }
        
        .logo-text { 
          font-size: 22px; 
          font-weight: 900; 
          color: #0f172a; 
          letter-spacing: -0.5px;
        }

        .nav-actions { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
        }

        .lang-select { 
          border: 1px solid #e2e8f0; 
          background: #fff; 
          border-radius: 8px; 
          padding: 6px 12px; 
          font-size: 14px; 
          outline: none;
          cursor: pointer;
        }

        .user-area { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
        }

        .user-name { 
          font-size: 14px; 
          font-weight: 700; 
          color: #0f172a; 
        }

        .logout-btn { 
          font-size: 14px; 
          color: #ef4444; 
          background: none; 
          border: none; 
          cursor: pointer; 
          font-weight: 600; 
        }

        .login-btn { 
          font-size: 14px; 
          font-weight: 600; 
          color: #fff; 
          background: #0f172a; 
          border: none; 
          padding: 9px 20px; 
          border-radius: 10px; 
          cursor: pointer; 
          transition: 0.2s;
        }

        .mypage-btn { 
          background: none; 
          border: 1px solid #0f172a; 
          padding: 8px 18px; 
          border-radius: 10px; 
          font-size: 14px; 
          font-weight: 600; 
          cursor: pointer; 
          transition: 0.2s;
        }

        .login-btn:hover, .mypage-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }

        /* 모바일 대응 */
        @media (max-width: 768px) {
          .nav { padding: 0 20px; }
          .user-name, .logo-text { display: none; } /* 좁은 화면에서 텍스트 숨김 */
          .logo-box { padding: 4px 8px; }
        }
      `}</style>
    </nav>
  );
}
