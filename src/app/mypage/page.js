"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('ko');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) setProfile(data);
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  // profile이 없을 경우를 대비한 방어 코드
  if (!profile) return <div style={{ padding: '50px', textAlign: 'center' }}>유저 정보를 불러올 수 없습니다.</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'Pretendard' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>{lang === 'ko' ? '마이페이지' : 'My Page'}</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
            {lang === 'ko' ? '로그아웃' : 'Logout'}
          </button>
        </div>

        {/* 유저 정보 카드 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: profile.user_type === 'lawfirm' ? '#da251d' : '#0f172a', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              fontSize: '24px', 
              fontWeight: '900' 
            }}>
              {profile.email ? profile.email[0].toUpperCase() : 'U'}
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{profile.email}</p>
              <span style={{ fontSize: '13px', padding: '4px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', fontWeight: '600' }}>
                {profile.user_type === 'lawfirm' ? (lang === 'ko' ? '로펌 파트너' : 'Law Firm Partner') : (lang === 'ko' ? '일반 회원' : 'General Member')}
              </span>
            </div>
          </div>
        </div>

        {profile.user_type === 'lawfirm' ? (
          <LawFirmDashboard lang={lang} profile={profile} />
        ) : (
          <UserDashboard lang={lang} profile={profile} />
        )}
      </div>
    </div>
  );
}

// 하단 UserDashboard, LawFirmDashboard, 스타일 상수는 기존과 동일하므로 유지하시면 됩니다.
// (단, cardStyle과 actionButtonStyle이 하단에 정의되어 있어야 함)

function UserDashboard({ lang, profile }) {
  const [requesting, setRequesting] = useState(false);

  const handleConsultationRequest = async (type) => {
    const KAKAO_URL = "https://open.kakao.com/o/sUEA1yfd";
    const TELEGRAM_URL = "https://t.me/Legalviet";
    
    const targetUrl = type === 'kakao' ? KAKAO_URL : TELEGRAM_URL;
    const platformName = type === 'kakao' ? '카카오톡' : '텔레그램';

    const msg = lang === 'ko' 
      ? `${platformName}으로 전담 상담원과 연결됩니다.` 
      : `Connecting to a consultant via ${type === 'kakao' ? 'KakaoTalk' : 'Telegram'}.`;

    if (!confirm(msg)) return;
    
    setRequesting(true);
    try {
      await supabase
        .from('consultation_requests')
        .insert([{
          user_id: profile.id,
          user_email: profile.email,
          user_phone: profile.phone || 'N/A',
          status: 'pending'
        }]);

      window.open(targetUrl, '_blank');
    } catch (error) {
      console.error("Error logging request:", error);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '15px' }}>{lang === 'ko' ? '1:1 법률 상담 매칭' : '1:1 Legal Matching'}</h3>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '25px' }}>
          {lang === 'ko' 
            ? '원하시는 메신저를 선택해주세요. LegalViet 상담원이 로펌 매칭을 도와드립니다.' 
            : 'Please select your preferred messenger. Our consultant will help you with law firm matching.'}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => handleConsultationRequest('kakao')}
            disabled={requesting}
            style={{ ...actionButtonStyle, background: '#fae100', color: '#3c1e1e', padding: '16px' }}
          >
            <span style={{ fontWeight: '900', marginRight: '8px' }}>TALK</span>
            {lang === 'ko' ? '카카오톡으로 상담하기' : 'Consult via KakaoTalk'}
          </button>

          <button 
            onClick={() => handleConsultationRequest('telegram')}
            disabled={requesting}
            style={{ ...actionButtonStyle, background: '#0088cc', color: '#fff', padding: '16px' }}
          >
            <span style={{ fontWeight: '900', marginRight: '8px' }}>TG</span>
            {lang === 'ko' ? '텔레그램으로 상담하기' : 'Consult via Telegram'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LawFirmDashboard({ lang, profile }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ color: '#da251d' }}>{lang === 'ko' ? '로펌 파트너 전용 공간' : 'Law Firm Partner Space'}</h3>
      <p style={{ fontSize: '14px', marginTop: '10px' }}>
        {lang === 'ko' ? '파트너 로펌을 위한 전용 관리 대시보드가 준비 중입니다.' : 'Partner dashboard is under construction.'}
      </p>
    </div>
  );
}

const cardStyle = { background: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' };
const actionButtonStyle = { border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' };
