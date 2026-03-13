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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

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
            <div style={{ width: '60px', height: '60px', background: profile.user_type === 'lawfirm' ? '#da251d' : '#0f172a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: '900' }}>
              {profile.email[0].toUpperCase()}
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

// --- 일반 유저 전용 대시보드 (메신저 선택형) ---
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
      // DB에 상담 요청 기록 저장
      await supabase
        .from('consultation_requests')
        .insert([{
          user_id: profile.id,
          user_email: profile.email,
          user_phone: profile.phone || 'N/A',
          status: 'pending'
        }]);

      // 선택한 메신저로 이동
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
          {/* 카카오톡 버튼 */}
          <button 
            onClick={() => handleConsultationRequest('kakao')}
            disabled={requesting}
            style={{ 
              ...actionButtonStyle, 
              background: '#fae100', 
              color: '#3c1e1e', 
              padding: '16px', 
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontWeight: '900' }}>TALK</span>
            {lang === 'ko' ? '카카오톡으로 상담하기' : 'Consult via KakaoTalk'}
          </button>

          {/* 텔레그램 버튼 */}
          <button 
            onClick={() => handleConsultationRequest('telegram')}
            disabled={requesting}
            style={{ 
              ...actionButtonStyle, 
              background: '#0088cc', 
              color: '#fff', 
              padding: '16px', 
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontWeight: '900' }}>TG</span>
            {lang === 'ko' ? '텔레그램으로 상담하기' : 'Consult via Telegram'}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginBottom: '20px' }}>{lang === 'ko' ? '안내 사항' : 'Information'}</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#64748b', lineHeight: '1.8' }}>
          <li>{lang === 'ko' ? '상담 가능 시간: 평일 09:00 - 18:00 (베트남 시간)' : 'Available: Weekdays 09:00 - 18:00 (ICT)'}</li>
          <li>{lang === 'ko' ? '매칭된 상담 내역은 선택하신 채팅창에서 유지됩니다.' : 'Consultation history is kept in your selected messenger.'}</li>
        </ul>
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
const actionButtonStyle = { border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' };
