"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ko');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'normal',
    phone: '',
    chat_type: 'kakao',
    chatId: ''
  });

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: authData.user.id, 
            name: formData.name,
            email: formData.email,
            user_type: formData.user_type,
            phone: formData.phone, 
            chat_type: formData.chat_type,
            chat_id: formData.chatId,
            chat_count: 0,
            is_subscribed: false
          }]);
          
        if (profileError) throw profileError;
      }

      alert(lang === 'ko' ? '회원가입 완료! 로그인 페이지로 이동합니다.' : 'Sign up successful! Redirecting to login page.');
      router.push('/auth/login');
    } catch (error) {
      alert((lang === 'ko' ? '에러 발생: ' : 'Error: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-root">
      <div className="signup-card">
        
        {/* 로고 및 헤더 */}
        <header className="signup-header">
          <div className="logo" onClick={() => router.push('/')}>
            <span className="logo-box">L</span>
            <span className="logo-text">LegalViet</span>
          </div>
          <h2 className="title">{lang === 'ko' ? '회원가입' : 'Sign Up'}</h2>
        </header>

        {/* 유저 타입 선택 토글 */}
        <div className="type-toggle">
          <button 
            type="button"
            className={formData.user_type === 'normal' ? 'active-normal' : ''}
            onClick={() => setFormData({...formData, user_type: 'normal'})}
          >
            {lang === 'ko' ? '일반 유저' : 'General'}
          </button>
          <button 
            type="button"
            className={formData.user_type === 'lawfirm' ? 'active-lawfirm' : ''}
            onClick={() => setFormData({...formData, user_type: 'lawfirm'})}
          >
            {lang === 'ko' ? '로펌 유저' : 'Law Firm'}
          </button>
        </div>

        <form onSubmit={handleSignup} className="signup-form">
          <div className="input-group">
            <label className="label">{lang === 'ko' ? '이름 (필수)' : 'Name (Required)'}</label>
            <input required type="text" placeholder={lang === 'ko' ? '홍길동' : 'Full Name'} value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="input-field" />
          </div>

          <div className="input-group">
            <label className="label">{lang === 'ko' ? '이메일 (필수)' : 'Email (Required)'}</label>
            <input required type="email" placeholder="example@email.com" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className="input-field" />
          </div>

          <div className="input-group">
            <label className="label">{lang === 'ko' ? '비밀번호 (필수)' : 'Password (Required)'}</label>
            <input required type="password" placeholder={lang === 'ko' ? '6자리 이상' : '6+ characters'} value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} className="input-field" />
          </div>

          {/* 선택 입력 섹션 */}
          <div className="optional-box">
            <p className="optional-title" style={{ color: formData.user_type === 'lawfirm' ? '#da251d' : '#0f172a' }}>
              {lang === 'ko' ? '연락처 정보 (선택)' : 'Contact Info (Optional)'}
            </p>
            <p className="optional-desc">
              {lang === 'ko' ? '* 매칭 지원 시 활용됩니다.' : '* Used for expert matching.'}
            </p>
            
            <div className="input-group">
              <label className="sub-label">{lang === 'ko' ? '연락처' : 'Phone'}</label>
              <input type="text" placeholder="010-0000-0000" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className="input-field" />
            </div>

            <div className="input-group">
              <label className="sub-label">{lang === 'ko' ? '채팅앱 ID' : 'Chat ID'}</label>
              <div className="chat-input-row">
                <select value={formData.chat_type} onChange={(e) => setFormData({...formData, chat_type: e.target.value})} className="chat-select">
                  <option value="kakao">카카오톡</option>
                  <option value="telegram">텔레그램</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="zalo">Zalo</option>
                </select>
                <input type="text" placeholder="ID" value={formData.chatId} onChange={(e)=>setFormData({...formData, chatId: e.target.value})} className="input-field" style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`submit-btn ${formData.user_type === 'lawfirm' ? 'lawfirm-btn' : ''}`}>
            {loading ? (lang === 'ko' ? '처리 중...' : 'Processing...') : (lang === 'ko' ? '가입하기' : 'Create Account')}
          </button>
        </form>

        <footer className="signup-footer">
          {lang === 'ko' ? '이미 계정이 있으신가요? ' : 'Already have an account? '}
          <span onClick={() => router.push('/auth/login')} className="login-link">
            {lang === 'ko' ? '로그인' : 'Login'}
          </span>
        </footer>
      </div>

      <style jsx>{`
        .signup-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 20px; font-family: 'Pretendard', sans-serif; }
        .signup-card { background: #fff; padding: 40px; border-radius: 28px; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08); width: 100%; max-width: 480px; }
        
        .signup-header { text-align: center; margin-bottom: 25px; }
        .logo { cursor: pointer; display: inline-flex; align-items: center; gap: 10px; margin-bottom: 15px; }
        .logo-box { background: #da251d; color: #fff; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 18px; }
        .logo-text { font-size: 24px; font-weight: 900; color: #0f172a; }
        .title { font-size: 24px; font-weight: 800; color: #0f172a; }

        /* 토글 버튼 */
        .type-toggle { display: flex; gap: 10px; margin-bottom: 25px; }
        .type-toggle button { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .active-normal { background: #0f172a !important; color: #fff !important; border-color: #0f172a !important; }
        .active-lawfirm { background: #da251d !important; color: #fff !important; border-color: #da251d !important; }

        .signup-form { display: flex; flex-direction: column; gap: 18px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 14px; font-weight: 700; color: #334155; margin-left: 4px; }
        .sub-label { font-size: 13px; color: #64748b; margin-left: 4px; }
        
        .input-field { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid #e2e8f0; outline: none; font-size: 16px; background: #f8fafc; transition: 0.2s; }
        .input-field:focus { border-color: #0f172a; background: #fff; box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05); }

        /* 선택 입력창 박스 */
        .optional-box { background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 15px; }
        .optional-title { font-size: 14px; font-weight: 800; }
        .optional-desc { font-size: 11px; color: #94a3b8; margin-top: -10px; }
        .chat-input-row { display: flex; gap: 8px; }
        .chat-select { width: 110px; border-radius: 12px; border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; outline: none; }

        .submit-btn { width: 100%; padding: 16px; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; font-size: 17px; margin-top: 10px; background: #0f172a; color: #fff; transition: 0.2s; }
        .lawfirm-btn { background: #da251d; }
        .submit-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .signup-footer { margin-top: 25px; text-align: center; font-size: 14px; color: #64748b; }
        .login-link { color: #da251d; cursor: pointer; font-weight: 700; margin-left: 5px; text-decoration: underline; }

        /* 🚨 모바일 최적화 🚨 */
        @media (max-width: 480px) {
          .signup-root { padding: 10px; background: #fff; }
          .signup-card { padding: 20px 10px; box-shadow: none; }
          .type-toggle button { padding: 10px; font-size: 13px; }
          .optional-box { padding: 15px; }
          .chat-input-row { flex-direction: column; }
          .chat-select { width: 100%; }
        }
      `}</style>
    </div>
  );
}
