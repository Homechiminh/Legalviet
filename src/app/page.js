"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LegalVietPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // [추가] 로딩 단계 관리
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [lang, setLang] = useState('ko');

  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  // 1. 페이지 로드시 유저 정보 및 [대화 내역] 불러오기
  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);

    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session) {
          setUser(session.user);
          
          // 유저 프로필 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profile?.name) setUserName(profile.name);

          // [핵심] 새로고침 시 이전 내역 불러오기 (리셋 방지)
          const { data: cases, error: caseError } = await supabase
            .from('legal_cases')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: true });

          if (cases && cases.length > 0) {
            const history = cases.flatMap(c => [
              { role: 'user', text: c.content },
              { role: 'model', text: c.analysis }
            ]);
            setChatHistory(history);
          }
        }
      } catch (err) {
        console.error("User check error:", err);
      }
    };
    checkUser();
  }, []);

  // [추가] 로딩 메시지 순환 효과 (3초마다 변경)
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 3);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('legalviet_lang', newLang);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserName('');
    setChatHistory([]); // 로그아웃 시 내역 초기화
    router.refresh();
    alert(lang === 'ko' ? '로그아웃 되었습니다.' : 'Logged out.');
  };

  const performAnalysis = async (promptText, isDoc) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert(lang === 'ko' 
        ? "법률 분석 기능은 로그인 후 이용 가능합니다. 로그인 페이지로 이동합니다." 
        : "Legal analysis is available after logging in. Moving to login page.");
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    const userId = session.user.id;
    let fileUrl = null;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('legal-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('legal-files')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      const isAdminUser = profile?.user_type === 'admin';

      // 질문 내용을 먼저 히스토리에 추가 (즉각적인 피드백)
      if (!isDoc) {
        setChatHistory(prev => [...prev, { role: 'user', text: promptText }]);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          userId: userId,
          lang: lang,
          isDocumentRequest: isDoc,
          isAdmin: isAdminUser,
          fileUrl: fileUrl
        }),
      });

      const data = await response.json();

      if (response.status === 403 && data.error === "LIMIT_REACHED") {
        setShowSubscriptionModal(true);
        // 제한 걸렸을 때 방금 추가한 질문은 다시 제거 (선택 사항)
        setChatHistory(prev => prev.slice(0, -1));
      } else if (response.ok) {
        setChatHistory(prev => [...prev, { 
          role: isDoc ? 'document' : 'model', 
          text: data.analysis 
        }]);
        if (!isDoc) {
          setContent('');
          setFile(null);
        }
      } else {
        alert((lang === 'ko' ? '실패: ' : 'Failed: ') + (data.error || '오류 발생'));
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      alert(lang === 'ko' ? '연결 에러가 발생했습니다.' : 'Connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (!content.trim() && !file) return;
    performAnalysis(content, false); 
  };
  
  const handleGenerateDocument = (lastAnalysis) => {
    const docPrompt = `아래 분석 내용을 바탕으로 관공서 제출용 베트남어 공식 서류 초안을 작성해줘:\n\n${lastAnalysis}`;
    performAnalysis(docPrompt, true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 100px 0', fontFamily: 'Pretendard, sans-serif' }}>
      
      {/* 네비게이션 바 */}
      <nav style={{ 
        background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 40px', height: '70px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div 
          onClick={() => router.push('/')}
          style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <span style={{ background: '#da251d', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>L</span>
          LegalViet
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <select 
            value={lang}
            onChange={handleLangChange} 
            style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '14px', cursor: 'pointer', marginRight: '5px' }}
          >
            <option value="ko">한국어 (KOR)</option>
            <option value="en">English (ENG)</option>
          </select>

          {user ? (
            <>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                {userName || (lang === 'ko' ? '사용자' : 'User')}님
              </span>
              <button onClick={handleLogout} style={{ fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                {lang === 'ko' ? '로그아웃' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => router.push('/auth/login')} style={{ fontSize: '14px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                {lang === 'ko' ? '로그인' : 'Login'}
              </button>
              <button onClick={() => router.push('/auth/signup')} style={{ fontSize: '14px', fontWeight: '600', color: '#fff', background: '#0f172a', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                {lang === 'ko' ? '회원가입' : 'Sign Up'}
              </button>
            </>
          )}

          <div style={{ height: '20px', width: '1px', background: '#e2e8f0', margin: '0 5px' }} />
          <button onClick={() => router.push('/mypage')} style={{ background: 'none', border: '1px solid #0f172a', padding: '7px 15px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            {lang === 'ko' ? '마이페이지' : 'My Page'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          
          <main>
            <header style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>LegalViet</h1>
              <p style={{ fontSize: '18px', color: '#64748b' }}>
                {lang === 'ko' ? '베트남 행정 및 법률 상황 분석 지원' : 'Support for Vietnamese Administrative & Legal Analysis'}
              </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px' }}>
              {chatHistory.length === 0 && (
                <div style={{ padding: '80px 0', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                  <p style={{ color: '#94a3b8' }}>
                    {lang === 'ko' ? '아직 분석 내역이 없습니다. 아래에서 내용을 입력하여 시작하세요.' : 'No analysis history yet. Please enter details below to start.'}
                  </p>
                </div>
              )}
              {chatHistory.map((chat, index) => (
                <div key={index} style={{ 
                  width: '100%', padding: '30px', borderRadius: '24px',
                  background: chat.role === 'user' ? 'transparent' : (chat.role === 'document' ? '#fffbeb' : '#fff'),
                  border: chat.role === 'user' ? 'none' : (chat.role === 'document' ? '2px solid #fcd34d' : '1px solid #e2e8f0'),
                  boxShadow: chat.role === 'user' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  marginBottom: chat.role === 'user' ? '-10px' : '0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', background: chat.role === 'user' ? '#0f172a' : '#da251d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold'
                    }}>
                      {chat.role === 'user' ? 'U' : 'L'}
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                      {chat.role === 'user' 
                        ? (lang === 'ko' ? '사용자 질문' : 'User Query') 
                        : (chat.role === 'document' ? (lang === 'ko' ? '베트남어 서류 초안' : 'Vietnamese Document Draft') : (lang === 'ko' ? 'LegalViet AI 분석 결과' : 'LegalViet AI Analysis'))}
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>{chat.text}</div>
                  
                  {chat.role === 'model' && index === chatHistory.length - 1 && (
                    <button 
                      onClick={() => handleGenerateDocument(chat.text)}
                      style={{ 
                        marginTop: '25px', padding: '12px 24px', background: '#da251d', color: '#fff', 
                        border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <span>🇻🇳</span> {lang === 'ko' ? '이 내용으로 베트남어 서류 만들기' : 'Generate Vietnamese Document'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={lang === 'ko' ? "분석이 필요한 내용을 자세히 적어주세요..." : "Describe the situation in detail..."}
                style={{ width: '100%', height: '180px', padding: '20px', borderRadius: '15px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', outline: 'none', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <div style={{ flex: 1, position: 'relative', border: '2px dashed #e2e8f0', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#64748b' }}>
                  <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  {file ? `✅ ${file.name}` : (lang === 'ko' ? '📁 파일/이미지 업로드' : '📁 Upload File/Image')}
                </div>
                
                {/* [수정] 동적 로딩 애니메이션 버튼 */}
                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{ 
                    flex: 1.5, background: loading ? '#1e293b' : '#0f172a', color: '#fff', 
                    height: '60px', borderRadius: '15px', border: 'none', fontWeight: '800', 
                    fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div className="pulse-loader"></div>
                      <span style={{ fontSize: '15px' }}>
                        {loadingStep === 0 && (lang === 'ko' ? "⚖️ 법률 데이터 조회 중..." : "Searching Laws...")}
                        {loadingStep === 1 && (lang === 'ko' ? "🔍 관련 조항 분석 중..." : "Analyzing Clauses...")}
                        {loadingStep === 2 && (lang === 'ko' ? "📝 답변 작성 중..." : "Drafting Response...")}
                      </span>
                    </div>
                  ) : (
                    (lang === 'ko' ? '분석 시작하기' : 'Start Analysis')
                  )}
                </button>
              </div>
            </form>
          </main>

          <aside>
            <div style={{ position: 'sticky', top: '110px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#0f172a', color: '#fff', padding: '25px', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Premium Service</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
                  {lang === 'ko' ? '무제한 분석과 전문 서류 양식 저장 기능을 이용하시려면 구독이 필요합니다.' : 'Subscription is required to use unlimited analysis and professional document template saving features.'}
                </p>
                <button onClick={() => setShowSubscriptionModal(true)} style={{ width: '100%', background: '#da251d', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  {lang === 'ko' ? '멤버십 업그레이드' : 'Upgrade Membership'}
                </button>
              </div>

              <div style={{ background: '#fff', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>💡 {lang === 'ko' ? '도움말' : 'Help'}</h3>
                <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li>• {lang === 'ko' ? '비즈니스 비자 관련 문의' : 'Business visa inquiries'}</li>
                  <li>• {lang === 'ko' ? '베트남 법인 설립 서류 검토' : 'Vietnam corporate establishment document review'}</li>
                  <li>• {lang === 'ko' ? '현지 고용 계약서 분석' : 'Local employment contract analysis'}</li>
                  <li>• {lang === 'ko' ? '부동산 매매 계약 주의사항' : 'Real estate transaction precautions'}</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showSubscriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🚀</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>
              {lang === 'ko' ? '무료 체험 완료' : 'Free Trial Ended'}
            </h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '24px', fontSize: '15px' }}>
              {lang === 'ko' 
                ? <><span style={{display: 'block'}}>지속적인 서류 분석과 대화 내역 저장을 위해</span>구독 서비스를 이용해 보세요.</> 
                : <><span style={{display: 'block'}}>Please subscribe to continue</span>document analysis and save chat history.</>}
            </p>
            <button 
              onClick={() => window.open('https://pf.kakao.com/...', '_blank')} 
              style={{ width: '100%', padding: '14px', background: '#da251d', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}
            >
              {lang === 'ko' ? '구독 문의 (카카오톡)' : 'Subscribe Inquiry (KakaoTalk)'}
            </button>
            <button onClick={() => setShowSubscriptionModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              {lang === 'ko' ? '닫기' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* 로딩 애니메이션 CSS */}
      <style jsx>{`
        .pulse-loader {
          width: 10px;
          height: 10px;
          background-color: #fff;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
}
