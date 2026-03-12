"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ko'); // 기본값 설정
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    user_type: 'normal', // 기본값: 일반 유저
    phone: '',
    chatId: ''
  });

  // [수정] 페이지가 로드될 때 홈에서 저장한 언어 설정을 불러옵니다.
  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Supabase Auth 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. profiles 테이블에 확장 정보 저장 (user_type 포함)
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: authData.user.id, 
            email: formData.email,
            user_type: formData.user_type, // 'normal' 또는 'lawfirm'
            phone: formData.phone, 
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px', fontFamily: 'Pretendard, sans-serif' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px', position: 'relative' }}>
        
        {/* [수정] 홈의 설정을 따르기로 했으므로 우측 상단 언어 선택 셀렉트 박스는 삭제했습니다. */}

        <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '10px' }}>
          <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '15px' }}>
            <span style={{ background: '#da251d', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontWeight: '900' }}>L</span>
            <span style={{ fontSize: '22px', fontWeight: '900', marginLeft: '8px' }}>LegalViet</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
            {lang === 'ko' ? '회원가입' : 'Sign Up'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button 
            type="button"
            onClick={() => setFormData({...formData, user_type: 'normal'})}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
              background: formData.user_type === 'normal' ? '#0f172a' : '#fff',
              color: formData.user_type === 'normal' ? '#fff' : '#64748b',
              transition: '0.2s'
            }}
          >
            {lang === 'ko' ? '일반 유저' : 'General User'}
          </button>
          <button 
            type="button"
            onClick={() => setFormData({...formData, user_type: 'lawfirm'})}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '700', fontSize: '14px',
              background: formData.user_type === 'lawfirm' ? '#da251d' : '#fff',
              color: formData.user_type === 'lawfirm' ? '#fff' : '#64748b',
              transition: '0.2s'
            }}
          >
            {lang === 'ko' ? '로펌 유저' : 'Law Firm User'}
          </button>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={labelStyle}>{lang === 'ko' ? '이메일 (필수)' : 'Email (Required)'}</label>
            <input required type="email" placeholder="example@email.com" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ko' ? '비밀번호 (필수)' : 'Password (Required)'}</label>
            <input required type="password" placeholder={lang === 'ko' ? '6자리 이상' : '6+ characters'} value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} style={inputStyle} />
          </div>

          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', marginTop: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: '800', color: formData.user_type === 'lawfirm' ? '#da251d' : '#0f172a', marginBottom: '10px' }}>
              {formData.user_type === 'lawfirm' 
                ? (lang === 'ko' ? '로펌 추가 정보 (선택)' : 'Law Firm Info (Optional)') 
                : (lang === 'ko' ? '추가 정보 (선택)' : 'Additional Info (Optional)')}
            </p>
            <div style={{ marginBottom: '10px' }}>
              <label style={subLabelStyle}>{lang === 'ko' ? '연락처' : 'Contact Number'}</label>
              <input type="text" placeholder="010-0000-0000" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={subLabelStyle}>{lang === 'ko' ? '채팅앱 ID (카톡/텔레그램)' : 'Chat App ID (Kakao/Telegram)'}</label>
              <input type="text" placeholder={lang === 'ko' ? '아이디 입력' : 'Enter ID'} value={formData.chatId} onChange={(e)=>setFormData({...formData, chatId: e.target.value})} style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', marginTop: '10px',
            background: formData.user_type === 'lawfirm' ? '#da251d' : '#0f172a',
            color: '#fff'
          }}>
            {loading 
              ? (lang === 'ko' ? '처리 중...' : 'Processing...') 
              : (formData.user_type === 'lawfirm' 
                  ? (lang === 'ko' ? '로펌 계정으로 가입' : 'Sign Up as Law Firm') 
                  : (lang === 'ko' ? '일반 계정으로 가입' : 'Sign Up as General User'))
            }
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          {lang === 'ko' ? '이미 계정이 있으신가요? ' : 'Already have an account? '}
          <span onClick={() => router.push('/auth/login')} style={{ color: '#da251d', cursor: 'pointer', fontWeight: '600' }}>
            {lang === 'ko' ? '로그인' : 'Login'}
          </span>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' };
const subLabelStyle = { fontSize: '13px', color: '#64748b', marginBottom: '5px', display: 'block' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px' };
