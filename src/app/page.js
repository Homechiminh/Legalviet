"use client";
import { useState } from 'react';

export default function LegalVietPage() {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('prompt', content);
    if (file) formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData, // 파일 전송을 위해 FormData 사용
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.analysis);
      } else {
        alert('분석 실패: ' + data.error);
      }
    } catch (error) {
      alert('연결 에러');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🇻🇳 LegalViet 법률 상담 (이미지 첨부 가능)</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="법률 고민을 입력하세요..."
          style={{ width: '100%', height: '150px', marginBottom: '10px', padding: '10px' }}
        />
        <div style={{ border: '2px dashed #ccc', padding: '20px', marginBottom: '10px' }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*,application/pdf" />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: '#003366', color: 'white' }}>
          {loading ? 'AI 분석 중...' : '상담 시작하기'}
        </button>
      </form>
      {result && <div style={{ marginTop: '20px', padding: '20px', background: '#f9f9f9' }}>{result}</div>}
    </div>
  );
}