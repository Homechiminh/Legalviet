"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// 분리된 컴포넌트들 임포트
import { t } from '@/components/Translations';
import Navbar from '@/components/Navbar';
import ChatList from '@/components/ChatList';
import AnalysisForm from '@/components/AnalysisForm';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

export default function LegalVietPage() {
  const router = useRouter();
  
  // --- [상태 관리] ---
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); 
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [lang, setLang] = useState('ko');
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');

  // --- [초기 로드: 언어, 유저, 히스토리] ---
  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);

    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session) {
          setUser(session.user);
          
          // 프로필에서 이름 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profile?.name) setUserName(profile.name);

          // 기존 분석 내역 로드
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

  // --- [로딩 애니메이션 컨트롤] ---
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

  // --- [파일 내보내기 로직] ---
  const handleExport = (type, text) => {
    if (type === 'word') {
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
      const footer = "</body></html>";
      const sourceHTML = header + text.replace(/\n/g, "<br/>") + footer;
      const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LegalViet_Doc_${Date.now()}.doc`;
      link.click();
    } else if (type === 'excel') {
      const header = "<html><head><meta charset='utf-8'></head><body><table>";
      const footer = "</table></body></html>";
      const rows = text.split('\n').map(line => `<tr><td>${line}</td></tr>`).join('');
      const sourceHTML = header + rows + footer;
      const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LegalViet_Sheet_${Date.now()}.xls`;
      link.click();
    }
  };

  // --- [핵심: 분석 실행 로직] ---
  const performAnalysis = async (promptText = content, isDoc = false) => {
    if (loading || (!isDoc && !promptText.trim())) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/login'); return; }

    setLoading(true);
    const userId = session.user.id;
    let fileUrl = null;

    try {
      // 1. 파일 업로드 처리
      if (file && !isDoc) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        await supabase.storage.from('legal-files').upload(fileName, file);
        const { data: { publicUrl } } = supabase.storage.from('legal-files').getPublicUrl(fileName);
        fileUrl = publicUrl;
      }

      // 2. 유저 타입 확인
      const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', userId).maybeSingle();

      if (!isDoc) {
        setChatHistory(prev => [...prev, { role: 'user', text: promptText }]);
      }

      // 3. AI API 호출
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
        if (!isDoc) setChatHistory(prev => prev.slice(0, -1));
      } else if (response.ok) {
        setChatHistory(prev => [...prev, { role: isDoc ? 'document' : 'model', text: data.analysis }]);
        if (!isDoc) { setContent(''); setFile(null); }
      }
    } catch (error) {
      alert(lang === 'ko' ? '분석 중 에러가 발생했습니다.' : 'Error during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-root">
      {/* 1. 상단바 부품 */}
      <Navbar 
        lang={lang} 
        setLang={(newLang) => {
          setLang(newLang);
          localStorage.setItem('legalviet_lang', newLang);
        }} 
        user={user} 
        userName={userName}
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.reload();
        }}
        onMyPage={() => router.push('/mypage')}
        onLogin={() => router.push('/auth/login')}
      />

      {/* 2. 메인 영역 */}
      <div className="main-container">
        <div className="responsive-grid">
          
          <main className="chat-section">
            <header className="page-intro">
              <h1 className="brand-title">LegalViet</h1>
              <p className="brand-subtitle">{t[lang].subtitle}</p>
            </header>

            {/* 3. 채팅 내역 부품 */}
            <ChatList 
              history={chatHistory} 
              lang={lang} 
              onExport={handleExport}
              onCopy={(text) => {
                navigator.clipboard.writeText(text);
                alert(lang === 'ko' ? '복사되었습니다!' : 'Copied!');
              }}
              onMakeDoc={(lastAnalysis) => {
                const docPrompt = lang === 'ko' 
                  ? `아래 분석 내용을 바탕으로 관공서 제출용 베트남어 공식 서류 초안을 작성해줘:\n\n${lastAnalysis}`
                  : `Based on the following analysis, draft an official Vietnamese document for government submission:\n\n${lastAnalysis}`;
                performAnalysis(docPrompt, true);
              }}
            />

            {/* 4. 입력창 부품 */}
            <AnalysisForm 
              content={content}
              setContent={setContent}
              file={file}
              setFile={setFile}
              loading={loading}
              loadingStep={loadingStep}
              lang={lang}
              onSubmit={() => performAnalysis()}
            />
          </main>

          {/* 5. 사이드바 부품 */}
          <Sidebar 
            lang={lang} 
            onUpgrade={() => setShowSubscriptionModal(true)} 
          />
        </div>
      </div>

      {/* 6. 푸터 부품 */}
      <Footer lang={lang} />

      {/* 7. 구독 안내 모달 */}
      {showSubscriptionModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon">🚀</div>
            <h2 className="modal-title">{t[lang].modalTitle}</h2>
            <button 
              onClick={() => window.open('https://pf.kakao.com/...', '_blank')} 
              className="kakao-btn"
            >
              {t[lang].modalBtn}
            </button>
            <button 
              onClick={() => setShowSubscriptionModal(false)} 
              className="close-btn"
            >
              {t[lang].modalClose}
            </button>
          </div>
        </div>
      )}

      {/* --- [공통 레이아웃 스타일] --- */}
      <style jsx>{`
        .layout-root { min-height: 100vh; display: flex; flex-direction: column; background: #f8fafc; }
        .main-container { flex-grow: 1; width: 100%; max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 350px; gap: 30px; }
        
        .page-intro { margin-bottom: 30px; }
        .brand-title { font-size: 36px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .brand-subtitle { font-size: 18px; color: #64748b; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-box { background: white; padding: 40px; border-radius: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .modal-icon { font-size: 40px; margin-bottom: 20px; }
        .modal-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }
        .kakao-btn { width: 100%; padding: 14px; background: #da251d; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; margin-bottom: 12px; transition: 0.2s; }
        .kakao-btn:hover { background: #b91c1c; }
        .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; }

        /* 모바일 반응형 */
        @media (max-width: 900px) {
          .responsive-grid { grid-template-columns: 1fr; }
          .main-container { margin: 20px auto; }
          .chat-section { order: 1; }
        }
      `}</style>
    </div>
  );
}
