"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    // [중요] redirect 주소는 사장님 도메인으로 설정!
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) alert(error.message);
    else alert("재설정 링크를 메일로 보내드렸습니다!");
    setLoading(false);
  };

  return (
    <div className="auth-box">
      <h2>비밀번호 찾기</h2>
      <p>가입하신 이메일을 입력하세요.</p>
      <form onSubmit={handleReset}>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" required />
        <button type="submit" disabled={loading}>재설정 메일 발송</button>
      </form>
      <button onClick={() => router.back()} className="btn-back">뒤로가기</button>
      {/* 스타일 생략 (기본 로그인 스타일 유지) */}
    </div>
  );
}
