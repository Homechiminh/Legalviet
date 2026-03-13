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
  const [loadingStep, setLoadingStep] = useState(0); 
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
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profile?.name) setUserName(profile.name);

          const { data: cases } = await supabase
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

  // 2. 로딩 메시지 순환 효과
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

  // [수정] 워드(.doc) 다운로드 기능
  const exportToWord = (text) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>LegalViet Document</title></head><body>";
    const footer = "</body></html>";
    // 줄바꿈을 HTML 태그로 변환
    const sourceHTML = header + text.replace(/\n/g, "<br/>") + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LegalViet_Document_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // [수정] 엑셀(.xls) 다운로드 기능
  const exportToExcel = (text) => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body><table>";
    const footer = "</table></body></html>";
    
    // 텍스트를 줄 단위로 나눠서 엑셀 행(tr)으로 변환
    const rows = text.split('\n').map(line => `<tr><td>${line}</td></tr>`).join('');
    const sourceHTML = header + rows + footer;

    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/vnd.ms-excel'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LegalViet_Analysis_${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(lang === 'ko' ? '복사되었습니다!' : 'Copied!');
  };

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('legalviet_lang', newLang);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserName('');
    setChatHistory([]);
    router.refresh();
  };

  const performAnalysis = async (promptText, isDoc) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/login'); return; }

    setLoading(true);
    const userId = session.user.id;
    let fileUrl = null;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        await supabase.storage.from('legal-files').upload(fileName, file);
        const { data: { publicUrl } } = supabase.storage.from('legal-files').getPublicUrl(fileName);
        fileUrl = publicUrl;
      }

      const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', userId).maybeSingle();

      if (!isDoc) {
        setChatHistory(prev => [...prev, { role: 'user', text: promptText }]);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          history: chatHistory, 
          userId: userId,
          lang: lang,
          isDocumentRequest: isDoc,
          isAdmin: profile?.user_type === 'admin',
          fileUrl: fileUrl
        }),
      });

      const data = await response.json();

      if (response.status === 403) {
        setShowSubscriptionModal(true);
        setChatHistory(prev => prev.slice(0, -1));
      } else if (response.ok) {
        setChatHistory(prev => [...prev, { role: isDoc ? 'document' : 'model', text: data.analysis }]);
        if (!isDoc) { setContent(''); setFile(null); }
      }
    } catch (error) {
      alert('에러 발생');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 100px 0', fontFamily: 'Pretendard, sans-serif' }}>
      
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 40px', height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => router.push('/')} style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span style={{ background: '#da251d', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>L</span> LegalViet
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <select value={lang} onChange={handleLangChange} style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '14px' }}>
            <option value="ko">한국어 (KOR)</option>
            <option value="en">English (ENG)</option>
          </select>
          {user ? (
            <button onClick={handleLogout} style={{ fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>로그아웃</button>
          ) : (
            <button onClick={() => router.push('/auth/login')} style={{ fontSize: '14px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>로그인</button>
          )}
          <button onClick={() => router.push('/mypage')} style={{ background: 'none', border: '1px solid #0f172a', padding: '7px 15px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>마이페이지</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          
          <main>
            <header style={{ marginBottom: '30px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>LegalViet</h1>
              <p style={{ fontSize: '18px', color: '#64748b' }}>베트남 행정 및 법률 상황 분석 지원</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px' }}>
              {chatHistory.map((chat, index) => (
                <div key={index} style={{ 
                  width: '100%', padding: '30px', borderRadius: '24px',
                  background: chat.role === 'user' ? 'transparent' : (chat.role === 'document' ? '#fffbeb' : '#fff'),
                  border: chat.role === 'user' ? 'none' : (chat.role === 'document' ? '2px solid #fcd34d' : '1px solid #e2e8f0'),
                  boxShadow: chat.role === 'user' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: chat.role === 'user' ? '#0f172a' : '#da251d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{chat.role === 'user' ? 'U' : 'L'}</div>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{chat.role === 'user' ? '질문' : (chat.role === 'document' ? '베트남어 서류 초안' : 'AI 분석')}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8', color: '#334155' }}>{chat.text}</div>
                  
                  {/* [수정] 출력 버튼 그룹 (워드/엑셀/복사) */}
                  {(chat.role === 'document' || chat.role === 'model') && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button onClick={() => exportToWord(chat.text)} style={{ padding: '10px 18px', background: '#2b579a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>📘 워드 다운로드</button>
                      <button onClick={() => exportToExcel(chat.text)} style={{ padding: '10px 18px', background: '#217346', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>📗 엑셀 다운로드</button>
                      <button onClick={() => copyToClipboard(chat.text)} style={{ padding: '10px 18px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>📋 복사</button>
                    </div>
                  )}

                  {chat.role === 'model' && index === chatHistory.length - 1 && (
                    <button onClick={() => performAnalysis(`아래 분석 내용을 바탕으로 공식 서류 초안을 작성해줘:\n\n${chat.text}`, true)} style={{ marginTop: '20px', padding: '12px 24px', background: '#da251d', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🇻🇳 베트남어 서류 만들기</button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); performAnalysis(content, false); }} style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="분석이 필요한 내용을 자세히 적어주세요..." style={{ width: '100%', height: '180px', padding: '20px', borderRadius: '15px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', outline: 'none', resize: 'none' }} />
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <div style={{ flex: 1, position: 'relative', border: '2px dashed #e2e8f0', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#64748b' }}>
                  <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  {file ? `✅ ${file.name}` : '📁 파일 업로드'}
                </div>
                <button type="submit" disabled={loading} style={{ flex: 1.5, background: loading ? '#1e293b' : '#0f172a', color: '#fff', height: '60px', borderRadius: '15px', border: 'none', fontWeight: '800', fontSize: '18px', cursor: 'pointer' }}>
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div className="pulse-loader"></div>
                      <span style={{ fontSize: '15px' }}>{loadingStep === 0 ? "⚖️ 조회 중..." : loadingStep === 1 ? "🔍 분석 중..." : "📝 작성 중..."}</span>
                    </div>
                  ) : "분석 시작하기"}
                </button>
              </div>
            </form>
          </main>

          <aside>
            <div style={{ position: 'sticky', top: '110px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#0f172a', color: '#fff', padding: '25px', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Premium Service</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>무제한 분석과 전문 서류 양식 저장 기능을 이용하시려면 구독이 필요합니다.</p>
                <button onClick={() => setShowSubscriptionModal(true)} style={{ width: '100%', background: '#da251d', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>멤버십 업그레이드</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showSubscriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🚀</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>무료 체험 완료</h2>
            <button onClick={() => window.open('https://pf.kakao.com/...', '_blank')} style={{ width: '100%', padding: '14px', background: '#da251d', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>구독 문의 (카카오톡)</button>
            <button onClick={() => setShowSubscriptionModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .pulse-loader { width: 10px; height: 10px; background-color: #fff; border-radius: 50%; animation: pulse 1.5s infinite ease-in-out; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); } }
      `}</style>
    </div>
  );
}
