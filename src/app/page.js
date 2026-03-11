"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegalVietPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // 추가된 상태: 언어 설정 및 유저 정보
  const [lang, setLang] = useState('ko'); // 'ko' 또는 'en'
  const [user, setUser] = useState(null); // 로그인 유저 정보 저장용

  // 1. 분석 요청 함수 (일반 분석)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    await performAnalysis(content, false);
  };

  // 2. 베트남어 서류 제작 전용 함수
  const handleGenerateDocument = async (lastAnalysis) => {
    const docPrompt = `아래 분석 내용을 바탕으로 관공서 제출용 베트남어 공식 서류 초안을 작성해줘:\n\n${lastAnalysis}`;
    await performAnalysis(docPrompt, true);
  };

  // 공통 분석 로직
  const performAnalysis = async (promptText, isDoc) => {
    setLoading(true);
    const tempUserId = user?.id || "user_123"; 

    try {
      const response = await fetch('/api/chat', { // route.js 경로에 맞춤
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          userId: tempUserId,
          lang: lang,
          isDocumentRequest: isDoc,
          isAdmin: false
        }),
      });

      const data = await response.json();

      if (response.status === 403 && data.error === "LIMIT_REACHED") {
        setShowSubscriptionModal(true);
      } else if (response.ok) {
        setChatHistory(prev => [...prev, { 
          role: isDoc ? 'document' : 'model', 
          text: data.analysis 
        }]);
        if (!isDoc) setContent('');
      } else {
        alert('분석 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      alert('연결 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Pretendard, sans-serif', color: '#333' }}>
      
      {/* 상단 네비게이션: 로그인/회원가입/마이페이지 */}
      <nav style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '20px', fontSize: '14px' }}>
        <select 
          onChange={(e) => setLang(e.target.value)} 
          style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}
        >
          <option value="ko">KOR 🇰🇷</option>
          <option value="en">ENG 🇺🇸</option>
        </select>
        <button onClick={() => router.push('/auth/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>로그인</button>
        <button onClick={() => router.push('/auth/signup')} style={{ background: '#0f172a', color: '#white', border: 'none', padding: '6px 12px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>회원가입</button>
        <button onClick={() => router.push('/mypage')} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>마이페이지</button>
      </nav>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
          <span style={{ color: '#da251d' }}>Legal</span>Viet {lang === 'ko' ? '서류 분석기' : 'AI Analyzer'}
        </h1>
        <p style={{ color: '#64748b' }}>{lang === 'ko' ? '베트남 행정 및 법률 상황 분석 지원' : 'Support for Vietnamese Administrative & Legal Analysis'}</p>
      </header>

      {/* 대화 내역 UI */}
      <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {chatHistory.map((chat, index) => (
          <div key={index} style={{ 
            alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
            width: '100%', maxWidth: '90%',
            padding: '20px',
            borderRadius: '16px',
            background: chat.role === 'user' ? '#f8fafc' : (chat.role === 'document' ? '#fffbeb' : '#fff'),
            border: chat.role === 'document' ? '2px solid #fcd34d' : '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: chat.role === 'document' ? '#b45309' : '#64748b' }}>
              {chat.role === 'user' ? 'Q.' : (chat.role === 'document' ? '📄 VIETNAMESE DOCUMENT DRAFT' : 'AI ANALYSIS')}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '1.7' }}>{chat.text}</div>
            
            {/* AI 분석 결과 바로 다음에만 '서류 제작' 버튼 노출 */}
            {chat.role === 'model' && index === chatHistory.length - 1 && (
              <button 
                onClick={() => handleGenerateDocument(chat.text)}
                style={{ marginTop: '15px', padding: '10px 16px', background: '#da251d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                🇻🇳 이 내용으로 베트남어 서류 만들기
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 입력 섹션 */}
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={lang === 'ko' ? "내용을 입력하세요..." : "Enter details here..."}
          style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9', resize: 'none', outline: 'none', fontSize: '15px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <div style={{ flex: 1, position: 'relative', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center', fontSize: '13px' }}>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            {file ? file.name : '📁 파일 첨부'}
          </div>
          <button type="submit" disabled={loading} style={{ flex: 2, background: '#0f172a', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
            {loading ? 'Processing...' : (lang === 'ko' ? '분석 요청' : 'Analyze')}
          </button>
        </div>
      </form>

      {/* 구독 모달 (기존 유지) */}
      {showSubscriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', maxWidth: '350px' }}>
            <h2 style={{ fontWeight: '800' }}>{lang === 'ko' ? '구독이 필요합니다' : 'Subscription Required'}</h2>
            <p style={{ margin: '15px 0', color: '#64748b' }}>무료 횟수를 모두 사용하셨습니다.</p>
            <button onClick={() => window.open('https://pf.kakao.com/...')} style={{ width: '100%', padding: '12px', background: '#da251d', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>문의하기</button>
            <button onClick={() => setShowSubscriptionModal(false)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#94a3b8' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
