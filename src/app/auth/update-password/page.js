"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ko');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);

    // [보안 체크] 세션이 없는 상태(링크 없이 그냥 들어온 경우)라면 로그인으로 보냅니다.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert(lang === 'ko' ? "유효하지 않은 접근입니다." : "Invalid access.");
        router.push('/auth/login');
      }
    };
    checkSession();
  }, [router, lang]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert(lang === 'ko' ? "비밀번호가 일치하지 않습니다." : "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Supabase의 유저 정보 업데이트 함수 (비밀번호만 변경)
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      alert(lang === 'ko' ? "비밀번호가 성공적으로 변경되었습니다!" : "Password updated successfully!");
      router.push('/auth/login');
    } catch (error) {
      alert((lang === 'ko' ? "변경 실패: " : "Failed to update: ") + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <header className="login-header">
          <div className="logo" onClick={() => router.push('/')}>
            <span className="logo-box">L</span>
            <span className="logo-text">LegalViet</span>
          </div>
          <h2 className="title">
            {lang === 'ko' ? '새 비밀번호 설정' : 'Set New Password'}
          </h2>
          <p className="subtitle">
            {lang === 'ko' 
              ? '새롭게 사용할 비밀번호를 입력해주세요.' 
              : 'Please enter your new password.'}
          </p>
        </header>

        <form onSubmit={handleUpdate} className="login-form">
          <div className="input-group">
            <label className="label">{lang === 'ko' ? '새 비밀번호' : 'New Password'}</label>
            <input 
              required 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className="input-field"
              minLength={6}
            />
          </div>
          
          <div className="input-group">
            <label className="label">{lang === 'ko' ? '비밀번호 확인' : 'Confirm Password'}</label>
            <input 
              required 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e)=>setConfirmPassword(e.target.value)} 
              className="input-field"
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading 
              ? (lang === 'ko' ? '변경 중...' : 'Updating...') 
              : (lang === 'ko' ? '비밀번호 변경하기' : 'Update Password')
            }
          </button>
        </form>
      </div>

      <style jsx>{`
        /* 기존 로그인 페이지 스타일과 100% 동일하게 유지 */
        .login-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 20px; font-family: 'Pretendard', sans-serif; }
        .login-card { background: #fff; padding: 40px; border-radius: 28px; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08); width: 100%; max-width: 420px; }
        .login-header { text-align: center; margin-bottom: 35px; }
        .logo { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .logo-box { background: #da251d; color: #fff; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 18px; }
        .logo-text { font-size: 24px; font-weight: 900; color: #0f172a; }
        .title { font-size: 26px; font-weight: 800; color: #0f172a; }
        .subtitle { font-size: 15px; color: #64748b; margin-top: 8px; }
        .login-form { display: flex; flex-direction: column; gap: 22px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .label { font-size: 14px; font-weight: 700; color: #334155; margin-left: 4px; }
        .input-field { width: 100%; padding: 15px 18px; border-radius: 14px; border: 1px solid #e2e8f0; outline: none; font-size: 16px; background: #f8fafc; }
        .submit-btn { width: 100%; padding: 16px; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; font-size: 17px; background: #0f172a; color: #fff; transition: 0.2s; }
        .submit-btn:hover { background: #1e293b; transform: translateY(-1px); }
        .submit-btn:disabled { background: #94a3b8; }
      `}</style>
    </div>
  );
}
