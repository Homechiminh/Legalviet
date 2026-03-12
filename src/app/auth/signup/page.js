"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ko');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    user_type: 'normal',
    phone: '',
    chat_type: 'kakao', // [추가] 기본값: 카카오톡
    chatId: ''
  });

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: authData.user.id, 
            email: formData.email,
            user_type: formData.user_type,
            phone: formData.phone, 
            chat_type: formData.chat_type, // [추가] 선택한 채팅앱 종류 저장
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
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '15px' }}>
            <span style={{ background: '#da251d', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontWeight: '900' }}>L</span>
            <span style={{ fontSize: '22px', fontWeight: '900', marginLeft: '8px' }}>LegalViet</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
            {lang === 'ko' ? '회원가입' : 'Sign Up'}
          </h2>
        </div>

        {/* 유저 타입 선택 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button 
            type="button"
            onClick={() => setFormData({...formData, user_type: 'normal'})}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '700',
              background: formData.user_type === 'normal' ? '#0f172a' : '#fff',
              color: formData.user_type === 'normal' ? '#fff' : '#64748b'
            }}
          >
            {lang === 'ko' ? '일반 유저' : 'General User'}
          </button>
          <button 
            type="button"
            onClick={() => setFormData({...formData, user_type: 'lawfirm'})}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '700',
              background: formData.user_type === 'lawfirm' ? '#da251d' : '#fff',
              color: formData.user_type === 'lawfirm' ? '#fff' : '#64748b'
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

          {/* 추가 정보 섹션 */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', marginTop: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: '800', color: formData.user_type === 'lawfirm' ? '#da251d' : '#0f172a', marginBottom: '10px' }}>
              {lang === 'ko' ? '연락처 정보 (선택)' : 'Contact Info (Optional)'}
            </p>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={subLabelStyle}>{lang === 'ko' ? '연락처' : 'Phone Number'}</label>
              <input type="text" placeholder="010-0000-0000" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} style={inputStyle} />
            </div>

            {/* [추가] 채팅앱 종류 및 ID 입력 영역 */}
            <div>
              <label style={subLabelStyle}>{lang === 'ko' ? '채팅앱 및 ID' : 'Chat App & ID'}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={formData.chat_type} 
                  onChange={(e) => setFormData({...formData, chat_type: e.target.value})}
                  style={{ ...inputStyle, width: '120px', fontSize: '13px', padding: '10px' }}
                >
                  <option value="kakao">카카오톡</option>
                  <option value="telegram">텔레그램</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="zalo">Zalo</option>
                </select>
                <input 
                  type="text" 
                  placeholder={lang === 'ko' ? '아이디 입력' : 'Enter ID'} 
                  value={formData.chatId} 
                  onChange={(e)=>setFormData({...formData, chatId: e.target.value})} 
                  style={{ ...inputStyle, flex: 1 }} 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', marginTop: '10px',
            background: formData.user_type === 'lawfirm' ? '#da251d' : '#0f172a',
            color: '#fff'
          }}>
            {loading ? (lang === 'ko' ? '처리 중...' : 'Processing...') : (lang === 'ko' ? '가입하기' : 'Sign Up')}
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
