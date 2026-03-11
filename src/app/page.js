"use client";
import { useState, useEffect } from 'react';

export default function LegalVietPage() {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // 대화 적립을 위한 상태
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    
    setLoading(true);
    
    // 유저 ID는 임시로 세팅 (로그인 구현 전까지는 로컬스토리지나 임시 ID 사용)
    const tempUserId = "user_123"; 

    const formData = new FormData();
    formData.append('prompt', content);
    formData.append('userId', tempUserId);
    if (file) formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 403 && data.error === "LIMIT_REACHED") {
        setShowSubscriptionModal(true); // 1회 제한 팝업 띄우기
      } else if (response.ok) {
        // 대화 내역에 추가 (적립식 UI)
        setChatHistory(prev => [...prev, { role: 'user', text: content }, { role: 'model', text: data.analysis }]);
        setContent(''); // 입력창 비우기
        setFile(null);
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
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#003366' }}>🇻🇳 LegalViet 서류 및 상황 분석 서포트</h1>
        <p style={{ color: '#666' }}>베트남 법률 서류 요약 및 현지 상황 분석을 도와드립니다.</p>
        
        <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '15px', textAlign: 'left', marginTop: '20px', fontSize: '14px' }}>
          <strong>⚠️ 이용 안내 및 면책 조항</strong>
          <p style={{ margin: '5px 0 0', color: '#92400e' }}>
            본 서비스는 서류 요약 및 상황 분석 보조 도구이며, 직접적인 법률 자문을 제공하지 않습니다. 
            최종 결정 전 반드시 전문 변호사와 상담하십시오.
          </p>
        </div>
      </header>

      {/* 대화 내역 출력 (적립식 UI) */}
      <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {chatHistory.map((chat, index) => (
          <div key={index} style={{ 
            alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            padding: '15px',
            borderRadius: '10px',
            background: chat.role === 'user' ? '#eef2ff' : '#f3f4f6',
            whiteSpace: 'pre-wrap'
          }}>
            <strong>{chat.role === 'user' ? '나' : 'LegalViet AI'}</strong>
            <p style={{ marginTop: '5px' }}>{chat.text}</p>
          </div>
        ))}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="분석이 필요한 서류 내용이나 상황을 입력하세요..."
          style={{ width: '100%', height: '120px', marginBottom: '10px', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <div style={{ border: '2px dashed #ccc', padding: '15px', marginBottom: '10px', textAlign: 'center', borderRadius: '8px' }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*,application/pdf" />
          <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>서류 사진이나 PDF를 첨부할 수 있습니다.</p>
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: '100%', padding: '15px', background: '#003366', color: 'white', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' 
          }}
        >
          {loading ? '분석 중...' : '분석 시작하기'}
        </button>
      </form>

      {/* 구독 유도 모달 팝업 */}
      {showSubscriptionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', maxWidth: '400px', textAlign: 'center' }}>
            <h2>무료 체험 완료 🚀</h2>
            <p style={{ margin: '20px 0', lineHeight: '1.5' }}>
              첫 번째 무료 분석을 모두 사용하셨습니다.<br/>
              정기 구독을 통해 무제한 서류 분석과<br/>과거 내역 적립 서비스를 이용해 보세요!
            </p>
            <button 
              onClick={() => window.open('https://pf.kakao.com/...', '_blank')} // 카톡 상담 등으로 연결 가능
              style={{ width: '100%', padding: '12px', background: '#facc15', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
            >
              구독 문의하기 (카카오톡)
            </button>
            <button 
              onClick={() => setShowSubscriptionModal(false)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
            >
              나중에 하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
