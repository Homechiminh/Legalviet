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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [lang, setLang] = useState('ko');

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang') || 'ko';
    setLang(savedLang);
  }, []);

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem('legalviet_lang', newLang);
  };

  const performAnalysis = async (promptText, isDoc) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert(lang === 'ko' ? "로그인 후 이용 가능합니다." : "Please login first.");
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    const userId = session.user.id;
    let fileUrl = null;

    try {
      // 1. 파일이 있으면 Supabase Storage에 업로드
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

      // 2. 관리자 여부 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      const isAdminUser = profile?.user_type === 'admin';

      // 3. API 요청
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
        alert(data.error || '오류 발생');
      }
    } catch (error) {
      console.error(error);
      alert(lang === 'ko' ? '연결 에러가 발생했습니다.' : 'Connection error.');
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
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px', fontFamily: 'Pretendard, sans-serif' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 40px', height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => router.push('/')} style={{ fontSize: '22px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#da251d', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>L</span> LegalViet
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <select value={lang} onChange={handleLangChange} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '14px', cursor: 'pointer' }}>
            <option value="ko">한국어 (KOR)</option>
            <option value="en">English (ENG)</option>
          </select>
          <button onClick={() => router.push('/mypage')} style={{ background: 'none', border: '1px solid #0f172a', padding: '7px 15px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>My Page</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
          <main>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '40px' }}>
              {chatHistory.length === 0 && (
                <div style={{ padding: '80px 0', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                  <p style={{ color: '#94a3b8' }}>아직 분석 내역이 없습니다. 내용을 입력하여 시작하세요.</p>
                </div>
              )}
              {chatHistory.map((chat, index) => (
                <div key={index} style={{ 
                  padding: '30px', borderRadius: '24px', 
                  background: chat.role === 'document' ? '#fffbeb' : '#fff',
                  border: chat.role === 'document' ? '2px solid #fcd34d' : '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: chat.role === 'user' ? '#0f172a' : '#da251d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold'
                    }}>{chat.role === 'user' ? 'U' : 'L'}</div>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{chat.role === 'user' ? '사용자 질문' : (chat.role === 'document' ? '서류 초안' : 'AI 분석 결과')}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8' }}>{chat.text}</div>
                  {chat.role === 'model' && index === chatHistory.length - 1 && (
                    <button onClick={() => handleGenerateDocument(chat.text)} style={{ marginTop: '20px', padding: '12px 24px', background: '#da251d', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🇻🇳 서류 초안 만들기</button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={lang === 'ko' ? "내용을 입력하세요..." : "Enter details..."} style={{ width: '100%', height: '150px', padding: '20px', borderRadius: '15px', border: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', outline: 'none', resize: 'none' }} />
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <div style={{ flex: 1, position: 'relative', border: '2px dashed #e2e8f0', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  <span style={{ fontSize: '14px', color: '#64748b' }}>{file ? `✅ ${file.name}` : '📁 파일/이미지 업로드'}</span>
                </div>
                <button type="submit" disabled={loading} style={{ flex: 1.5, background: '#0f172a', color: '#fff', height: '60px', borderRadius: '15px', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>
                  {loading ? '분석 중...' : '분석 시작하기'}
                </button>
              </div>
            </form>
          </main>

          <aside>
            <div style={{ position: 'sticky', top: '110px' }}>
              <div style={{ background: '#0f172a', color: '#fff', padding: '25px', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Premium Service</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>무제한 분석과 서류 저장 기능을 이용하세요.</p>
                <button onClick={() => setShowSubscriptionModal(true)} style={{ width: '100%', background: '#da251d', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>업그레이드</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showSubscriptionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
            <h2 style={{ marginBottom: '15px' }}>무료 체험 완료</h2>
            <p style={{ color: '#64748b', marginBottom: '25px' }}>더 많은 분석을 위해 구독이 필요합니다.</p>
            <button onClick={() => setShowSubscriptionModal(false)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
