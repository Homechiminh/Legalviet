import { t } from './Translations';

export default function Navbar({ lang, setLang, user, userName, onLogout, onMyPage, onLogin }) {
  return (
    <nav className="nav">
      <div className="logo" onClick={() => window.location.href = '/'}>
        <span className="logo-box">L</span> LegalViet
      </div>
      <div className="nav-actions">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="lang-select">
          <option value="ko">KOR</option>
          <option value="en">ENG</option>
        </select>
        {user ? (
          <div className="user-box">
            <span className="user-name">{userName || (lang === 'ko' ? '사용자' : 'User')}</span>
            <button onClick={onLogout} className="logout-btn">{t[lang].logout}</button>
          </div>
        ) : (
          <button onClick={onLogin} className="login-btn">{t[lang].login}</button>
        )}
        <button onClick={onMyPage} className="mypage-btn">{lang === 'ko' ? '마이' : 'My'}</button>
      </div>
      <style jsx>{`
        .nav { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 5%; height: 70px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
        .logo { font-size: 22px; font-weight: 900; color: #0f172a; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .logo-box { background: #da251d; color: #fff; padding: 2px 8px; border-radius: 4px; }
        .nav-actions { display: flex; align-items: center; gap: 12px; }
        .lang-select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px; font-size: 13px; }
        .user-name { font-size: 13px; font-weight: 700; color: #0f172a; margin-right: 8px; }
        .logout-btn { font-size: 13px; color: #ef4444; background: none; border: none; cursor: pointer; font-weight: 600; }
        .login-btn { font-size: 13px; font-weight: 600; color: #fff; background: #0f172a; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
        .mypage-btn { background: none; border: 1px solid #0f172a; padding: 7px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; }
        @media (max-width: 600px) { .user-name { display: none; } .nav { padding: 0 15px; } }
      `}</style>
    </nav>
  );
}
