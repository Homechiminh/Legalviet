"use client";
import { useState } from 'react';

export default function LegalVietPage() {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    
    setLoading(true);
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
        setShowSubscriptionModal(true); 
      } else if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'user', text: content }, { role: 'model', text: data.analysis }]);
        setContent('');
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
    <div style={{ padding: '40px 20px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Pretendard, -apple-system, sans-serif', color: '#333' }}>
      {/* 1. 세련된 타이틀 영역 */}
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', background: '#f1f5f9', borderRadius: '20px', fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '12px' }}>
          Vietnam Business Support AI
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '12px' }}>
          <span style={{ color: '#da251d' }}>Legal</span>Viet 서류·상황 분석기
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.6' }}>
          베트남 현지 행정 서류 요약과 복잡한 상황 분석을 스마트하게 도와드립니다.
        </p>
      </header>

      {/* 2. 대화 적립식 UI 섹션 */}
      {chatHistory.length > 0 && (
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {chatHistory.map((chat, index) => (
            <div key={index} style={{ 
              alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '18px',
              borderRadius: chat.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              background: chat.role === 'user' ? '#0f172a' : '#fff',
              color: chat.role === 'user' ? '#fff' : '#334155',
              boxShadow: chat.role === 'user' ? '0 4px 12px rgba(15, 23, 42, 0.15)' : '0 4px 12px rgba(0,0,0,0.05)',
              border: chat.role === 'user' ? 'none' : '1px solid #e2e8f0',
              lineHeight: '1.6'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', opacity: 0.8 }}>
                {chat.role === 'user' ? '나의 상담' : 'LegalViet AI 분석 결과'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '15px' }}>{chat.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* 3. 입력 영역 & 주의사항 */}
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="분석이 필요한 서류 내용이나 현재 상황을 상세히 입력해 주세요."
          style={{ width: '100%', height: '160px', marginBottom: '16px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'border 0.2s', resize: 'none' }}
        />
        
        {/* 파일 업로드 영역 */}
        <div style={{ position: 'relative', marginBottom: '16px', padding: '15px', border: '2px dashed #e2e8f0', borderRadius: '12px', textAlign: 'center', transition: 'all 0.2s' }}>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            accept="image/*,application/pdf" 
            style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0, cursor: 'pointer' }}
          />
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {file ? `✅ ${file.name}` : '📄 서류 사진 또는 PDF 첨부 (선택)'}
          </div>
        </div>

        {/* 수정된 주의사항 섹션 */}
        <div style={{ background: '#fff9f0', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: '#9a3412', marginBottom: '20px', lineHeight: '1.5', border: '1px solid #ffedd5' }}>
          <strong>💡 이용 시 주의사항</strong><br/>
          본 서비스는 행정 절차 안내 및 서류 내용 정리를 돕는 보조 도구입니다. 중요 서류 작성이나 최종 결정 시에는 반드시 전문 법률 사무소 또는 변호사에게 상담을 받으시기 바랍니다.
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: '100%', padding: '16px', background: '#0f172a', color: 'white', 
            border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: '700', transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? 'AI 분석 리포트 생성 중...' : '분석 시작하기'}
        </button>
      </form>

      {/* 구독 유도 모달 */}
      {showSubscriptionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '24px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🚀</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>무료 체험 완료</h2>
            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '24px', fontSize: '15px' }}>
              첫 번째 무료 분석 리포트가 생성되었습니다.<br/>
              지속적인 서류 분석과 대화 내역 저장을 위해<br/>구독 서비스를 이용해 보세요.
            </p>
            <button 
              onClick={() => window.open('https://pf.kakao.com/...', '_blank')} 
              style={{ width: '100%', padding: '14px', background: '#da251d', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', fontSize: '15px' }}
            >
              구독 문의 (카카오톡)
            </button>
            <button onClick={() => setShowSubscriptionModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>나중에 하기</button>
          </div>
        </div>
      )}
    </div>
  );
}
