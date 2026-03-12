"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('ko'); // 기본값: 한국어
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // [수정] 페이지 로드시 저장된 언어 설정을 불러옵니다.
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
      // Supabase 이메일/비밀번호 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      alert(lang === 'ko' ? '로그인 성공!' : 'Login successful!');
      router.push('/'); // 로그인 성공 시 메인 페이지로 이동
    } catch (error) {
      alert((lang === 'ko' ? '로그인 실패: ' : 'Login failed: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px', fontFamily: 'Pretendard, sans-serif' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', position: 'relative' }}>
        
        {/* [수정] 홈의 설정을 따르기로 했으므로 언어 선택 토글은 삭제했습니다. */}

        <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '10px' }}>
          <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '15px' }}>
            <span style={{ background: '#da251d', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontWeight: '900' }}>L</span>
            <span style={{ fontSize: '22px', fontWeight: '900', marginLeft: '8px' }}>LegalViet</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
            {lang === 'ko' ? '로그인' : 'Login'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>
            {lang === 'ko' ? '다시 오신 것을 환영합니다!' : 'Welcome back!'}
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>{lang === 'ko' ? '이메일' : 'Email'}</label>
            <input 
              required 
              type="email" 
              placeholder="example@email.com" 
              value={formData.email} 
              onChange={(e)=>setFormData({...formData, email: e.target.value})} 
              style={inputStyle} 
            />
          </div>
          <div>
            <label style={labelStyle}>{lang === 'ko' ? '비밀번호' : 'Password'}</label>
            <input 
              required 
              type="password" 
              placeholder={lang === 'ko' ? '비밀번호를 입력하세요' : 'Enter your password'} 
              value={formData.password} 
              onChange={(e)=>setFormData({...formData, password: e.target.value})} 
              style={inputStyle} 
            />
          </div>

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', marginTop: '10px',
            background: '#0f172a', color: '#fff', transition: '0.2s'
          }}>
            {loading 
              ? (lang === 'ko' ? '로그인 중...' : 'Logging in...') 
              : (lang === 'ko' ? '로그인' : 'Login')
            }
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          {lang === 'ko' ? '아직 계정이 없으신가요? ' : "Don't have an account? "}
          <span onClick={() => router.push('/auth/signup')} style={{ color: '#da251d', cursor: 'pointer', fontWeight: '600' }}>
            {lang === 'ko' ? '회원가입' : 'Sign Up'}
          </span>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px', display: 'block' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px', background: '#f8fafc' };
