"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ko');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      alert(lang === 'ko' ? '로그인 성공!' : 'Login successful!');
      router.push('/');
    } catch (error) {
      alert((lang === 'ko' ? '로그인 실패: ' : 'Login failed: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        
        {/* 로고 영역 */}
        <header className="login-header">
          <div className="logo" onClick={() => router.push('/')}>
            <span className="logo-box">L</span>
            <span className="logo-text">LegalViet</span>
          </div>
          <h2 className="title">
            {lang === 'ko' ? '로그인' : 'Login'}
          </h2>
          <p className="subtitle">
            {lang === 'ko' ? '다시 오신 것을 환영합니다!' : 'Welcome back!'}
          </p>
        </header>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label className="label">{lang === 'ko' ? '이메일' : 'Email'}</label>
            <input 
              required 
              type="email" 
              placeholder="example@email.com" 
              value={formData.email} 
              onChange={(e)=>setFormData({...formData, email: e.target.value})} 
              className="input-field"
            />
          </div>
          <div className="input-group">
            <label className="label">{lang === 'ko' ? '비밀번호' : 'Password'}</label>
            <input 
              required 
              type="password" 
              placeholder={lang === 'ko' ? '비밀번호를 입력하세요' : 'Enter your password'} 
              value={formData.password} 
              onChange={(e)=>setFormData({...formData, password: e.target.value})} 
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading 
              ? (lang === 'ko' ? '로그인 중...' : 'Logging in...') 
              : (lang === 'ko' ? '로그인' : 'Login')
            }
          </button>
        </form>

        {/* 푸터 (회원가입 링크) */}
        <footer className="login-footer">
          {lang === 'ko' ? '아직 계정이 없으신가요? ' : "Don't have an account? "}
          <span onClick={() => router.push('/auth/signup')} className="signup-link">
            {lang === 'ko' ? '회원가입' : 'Sign Up'}
          </span>
        </footer>
      </div>

      {/* --- 반응형 CSS --- */}
      <style jsx>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 20px;
          font-family: 'Pretendard', sans-serif;
        }

        .login-card {
          background: #fff;
          padding: 40px;
          border-radius: 28px;
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
          width: 100%;
          max-width: 420px;
          transition: 0.3s;
        }

        .login-header {
          text-align: center;
          margin-bottom: 35px;
        }

        .logo {
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
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
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
        }

        .title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 15px;
          color: #64748b;
          margin-top: 8px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          margin-left: 4px;
        }

        .input-field {
          width: 100%;
          padding: 15px 18px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          outline: none;
          font-size: 16px;
          background: #f8fafc;
          transition: 0.2s;
        }

        .input-field:focus {
          border-color: #0f172a;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          font-size: 17px;
          margin-top: 10px;
          background: #0f172a;
          color: #fff;
          transition: 0.2s;
        }

        .submit-btn:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 30px;
          text-align: center;
          font-size: 15px;
          color: #64748b;
        }

        .signup-link {
          color: #da251d;
          cursor: pointer;
          font-weight: 700;
          margin-left: 5px;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        /* 🚨 모바일 최적화 핵심 쿼리 🚨 */
        @media (max-width: 480px) {
          .login-root {
            padding: 15px;
            background: #fff; /* 모바일에서는 카드 배경과 통일해서 더 넓어보이게 */
          }

          .login-card {
            padding: 30px 10px;
            box-shadow: none; /* 모바일은 그림자보다 깔끔한 평면 느낌 */
            border: none;
          }

          .title {
            font-size: 24px;
          }

          .input-field {
            font-size: 16px; /* 아이폰 자동 줌 방지 (16px 이상 권장) */
            padding: 14px;
          }

          .submit-btn {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
}
