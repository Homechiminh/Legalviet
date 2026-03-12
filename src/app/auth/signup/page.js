"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    user_type: 'normal', // 기본값: 일반 유저
    phone: '',
    chatId: ''
  });

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

      alert('회원가입 완료! 로그인 페이지로 이동합니다.');
      router.push('/auth/login');
    } catch (error) {
      alert('에러 발생: ' + error.message);
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
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>회원가입</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <button 
            type="button"
            onClick={() => setFormData({...formData, user_type: 'normal'})}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '700',
              background: formData.user_type === 'normal' ? '#0f172a' : '#fff',
              color: formData.user_type === 'normal' ? '#fff' : '#64748b',
              transition: '0.2s'
            }}
          >
            일반 유저
          </button>
          <button 
            type="button"
            onClick={() => setFormData({...formData, user_type: 'lawfirm'})}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: '700',
              background: formData.user_type === 'lawfirm' ? '#da251d' : '#fff',
              color: formData.user_type === 'lawfirm' ? '#fff' : '#64748b',
              transition: '0.2s'
            }}
          >
            로펌 유저
          </button>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={labelStyle}>이메일 (필수)</label>
            <input required type="email" placeholder="example@email.com" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>비밀번호 (필수)</label>
            <input required type="password" placeholder="6자리 이상" value={formData.password} onChange={(e)=>setFormData({...formData, password: e.target.value})} style={inputStyle} />
          </div>

          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', marginTop: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: '800', color: formData.user_type === 'lawfirm' ? '#da251d' : '#0f172a', marginBottom: '10px' }}>
              {formData.user_type === 'lawfirm' ? '로펌 추가 정보 (선택)' : '추가 정보 (선택)'}
            </p>
            <div style={{ marginBottom: '10px' }}>
              <label style={subLabelStyle}>연락처</label>
              <input type="text" placeholder="010-0000-0000" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={subLabelStyle}>채팅앱 ID (카톡/텔레그램)</label>
              <input type="text" placeholder="아이디 입력" value={formData.chatId} onChange={(e)=>setFormData({...formData, chatId: e.target.value})} style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '16px', marginTop: '10px',
            background: formData.user_type === 'lawfirm' ? '#da251d' : '#0f172a',
            color: '#fff'
          }}>
            {loading ? '처리 중...' : `${formData.user_type === 'lawfirm' ? '로펌' : '일반'} 계정으로 가입`}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          이미 계정이 있으신가요? <span onClick={() => router.push('/auth/login')} style={{ color: '#da251d', cursor: 'pointer', fontWeight: '600' }}>로그인</span>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '5px', display: 'block' };
const subLabelStyle = { fontSize: '13px', color: '#64748b', marginBottom: '5px', display: 'block' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px' };
