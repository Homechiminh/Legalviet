"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// 분리된 컴포넌트들 임포트
import { t } from '@/components/Translations';
import Navbar from '@/components/Navbar';
import PartnerBanner from '@/components/PartnerBanner';
import ChatList from '@/components/ChatList';
import AnalysisForm from '@/components/AnalysisForm';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

export default function LegalVietPage() {
  const router = useRouter();
  const messagesEndRef = useRef(null); // 자동 스크롤용 Ref
  
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

  // 스크롤 최하단 이동 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      } catch (err) { console.error("User check error:", err); }
    };
    checkUser();
  }, []);

  // 채팅 내역 업데이트 시 자동 스크롤 실행
  useEffect(() => {
    if (chatHistory.length > 0) {
      scrollToBottom();
    }
  }, [chatHistory]);

  // --- [로딩 애니메이션 컨트롤] ---
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 3);
      }, 3000);
    } else { setLoadingStep(0); }
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

  // --- [핵심: 분석 실행 및 리드 저장 로직] ---
  const performAnalysis = async (promptText = content, isDoc = false) => {
    if (loading || (!isDoc && !promptText.trim())) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth/login'); return; }

    setLoading(true);
    const userId = session.user.id;
    let fileUrl = null;

    try {
      if (file && !isDoc) {
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
        if (!isDoc) setChatHistory(prev => prev.slice(0, -1));
      } else if (response.ok) {
        setChatHistory(prev => [...prev, { role: isDoc ? 'document' : 'model', text: data.analysis }]);
        
        if (!isDoc) {
          await supabase.from('consultation_leads').insert([{
            user_id: userId,
            user_name: userName || '익명 고객',
            contact_info: user?.email || '비공개',
            theme: promptText.substring(0, 20) + '...',
            summary: data.analysis.substring(0, 100) + '...',
          }]);
        }

        if (!isDoc) { setContent(''); setFile(null); }
      }
    } catch (error) {
      alert((t[lang] || t['ko']).startAnalysis + ' 에러');
    } finally {
      setLoading(false);
    }
  };

  const currentT = t[lang] || t['ko'];

  return (
    <div className="layout-root">
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

      <div className="main-container">
        <div className="responsive-grid">
          <main className="chat-section">
            <header className="page-intro">
              <h1 className="brand-title">LegalViet</h1>
              {/* [추가됨] 요청하신 진화하는 플랫폼 멘트 */}
              <div className="brand-desc-group">
                <p className="brand-subtitle">{currentT.subtitle}</p>
                <p className="brand-evolution-text">
                  {lang === 'ko' 
                    ? "실시간으로 적립되는 유저들의 문서/행정/법률 데이터를 기반으로 진화하는 플랫폼" 
                    : "An evolving platform powered by real-time user document, administrative, and legal data."}
                </p>
              </div>
            </header>

            <ChatList 
              history={chatHistory} 
              lang={lang} 
              loading={loading}
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

            <div ref={messagesEndRef} />

            {/* [재배치] ChatList 밑으로 이동된 파트너 배너 */}
            <div className="bottom-banner-wrapper">
              <PartnerBanner lang={lang} />
            </div>

            <div className="sticky-form-area">
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
            </div>
          </main>

          <Sidebar lang={lang} onUpgrade={() => setShowSubscriptionModal(true)} />
        </div>
      </div>

      <Footer lang={lang} />

      {showSubscriptionModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon">🚀</div>
            <h2 className="modal-title">{currentT.modalTitle}</h2>
            <button onClick={() => window.open('https://pf.kakao.com/...', '_blank')} className="kakao-btn">{currentT.modalBtn}</button>
            <button onClick={() => setShowSubscriptionModal(false)} className="close-btn">{currentT.modalClose}</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .layout-root { 
          min-height: 100vh; display: flex; flex-direction: column; background: #f8fafc; 
          padding-bottom: 60px;
        }
        .main-container { flex-grow: 1; width: 100%; max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .responsive-grid { display: grid; grid-template-columns: 1fr 350px; gap: 30px; }
        
        .page-intro { margin-bottom: 40px; }
        .brand-title { font-size: 42px; font-weight: 900; color: #0f172a; margin-bottom: 12px; letter-spacing: -1px; }
        .brand-desc-group { display: flex; flex-direction: column; gap: 6px; }
        .brand-subtitle { font-size: 18px; color: #475569; font-weight: 600; }
        
        /* [추가됨] 진화하는 플랫폼 멘트 스타일 */
        .brand-evolution-text { 
          font-size: 14px; 
          color: #94a3b8; 
          font-weight: 500; 
          line-height: 1.5;
          max-width: 600px;
        }

        /* [재배치] 하단 배너 스타일 */
        .bottom-banner-wrapper { 
          margin: 40px 0;
          border-radius: 24px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }

        .sticky-form-area {
          position: sticky;
          bottom: 20px;
          z-index: 100;
          margin-top: 40px;
        }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-box { background: white; padding: 40px; border-radius: 24px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
        .modal-icon { font-size: 40px; margin-bottom: 20px; }
        .modal-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }
        .kakao-btn { width: 100%; padding: 14px; background: #da251d; color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; margin-bottom: 12px; transition: 0.2s; }
        .kakao-btn:hover { background: #b91c1c; }
        .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; }

        @media (max-width: 900px) {
          .responsive-grid { grid-template-columns: 1fr; }
          .main-container { margin: 20px auto; }
          .chat-section { order: 1; }
          .sticky-form-area { bottom: 10px; }
          .brand-title { font-size: 32px; }
          .bottom-banner-wrapper { margin: 30px 0; }
        }
      `}</style>
    </div>
  );
}
