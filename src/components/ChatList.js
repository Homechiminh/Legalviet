import { t } from './Translations';

export default function ChatList({ history, lang, loading, onExport, onCopy, onMakeDoc }) {
  const currentT = t[lang] || t['ko'];

  if (history.length === 0) {
    return (
      <div className="empty">
        <p>{currentT.emptyHistory}</p>
        <style jsx>{` .empty { padding: 80px 0; text-align: center; background: #fff; border-radius: 24px; border: 2px dashed #e2e8f0; color: #94a3b8; } `}</style>
      </div>
    );
  }

  // 상담 링크 클릭 핸들러 (사장님 직통)
  const handleConsultantClick = (type) => {
    const KAKAO_URL = "https://open.kakao.com/o/sUEA1yfd"; // 사장님 카톡 링크
    const TELEGRAM_URL = "https://t.me/Legalviet"; // 사장님 텔레그램 링크
    window.open(type === 'kakao' ? KAKAO_URL : TELEGRAM_URL, '_blank');
  };

  return (
    <div className="chat-flow">
      {history.map((chat, index) => (
        <div key={index} className={`bubble ${chat.role}`}>
          <div className="bubble-head">
            <div className={`icon ${chat.role}`}>{chat.role === 'user' ? 'U' : 'L'}</div>
            <span className="label">
              {chat.role === 'user' ? currentT.roleUser : (chat.role === 'document' ? currentT.roleDoc : currentT.roleAI)}
            </span>
          </div>
          <div className="text-content">{chat.text}</div>
          
          {chat.role === 'document' && (
            <div className="action-row">
              <button onClick={() => onExport('word', chat.text)} className="btn-word">Word</button>
              <button onClick={() => onExport('excel', chat.text)} className="btn-excel">Excel</button>
              <button onClick={() => onCopy(chat.text)} className="btn-copy">{currentT.copy}</button>
            </div>
          )}

          {/* 모델의 마지막 답변 하단에 서류 작성 버튼 배치 (로딩 상태 적용) */}
          {chat.role === 'model' && index === history.length - 1 && (
            <button 
              onClick={() => onMakeDoc(chat.text)} 
              className={`make-doc-btn ${loading ? 'is-loading' : ''}`}
              disabled={loading}
            >
              {loading ? currentT.step2 : currentT.makeDoc}
            </button>
          )}
        </div>
      ))}

      {/* 분석 완료 후 전문가 직접 상담 섹션 */}
      <div className="consult-section">
        <h3 className="consult-title">
          {lang === 'ko' ? '⚖️ 전문가 추가 검토 요청' : '⚖️ Request Expert Review'}
        </h3>
        <p className="consult-desc">
          {lang === 'ko' 
            ? '분석 결과에 대해 실무 전문가의 직접적인 조언이 필요하신가요?' 
            : 'Do you need direct advice from a practitioner regarding the results?'}
        </p>
        <div className="consult-btns">
          <button onClick={() => handleConsultantClick('kakao')} className="btn-kakao">KakaoTalk</button>
          <button onClick={() => handleConsultantClick('telegram')} className="btn-telegram">Telegram</button>
        </div>
      </div>

      <style jsx>{`
        .chat-flow { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }
        .bubble { padding: 25px; border-radius: 24px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .bubble.user { background: transparent; border: none; box-shadow: none; margin-bottom: -15px; }
        .bubble.document { background: #fffbeb; border: 2px solid #fcd34d; }
        .bubble-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .icon { width: 32px; height: 32px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
        .icon.user { background: #0f172a; } .icon.model, .icon.document { background: #da251d; }
        .text-content { white-space: pre-wrap; font-size: 16px; line-height: 1.8; color: #334155; }
        .action-row { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
        .action-row button { padding: 8px 16px; border: none; border-radius: 8px; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
        .btn-word { background: #2b579a; } .btn-excel { background: #217346; } .btn-copy { background: #e2e8f0 !important; color: #0f172a !important; }
        
        .make-doc-btn { 
          width: 100%; 
          margin-top: 20px; 
          padding: 16px; 
          background: #da251d; 
          color: #fff; 
          border: none; 
          border-radius: 12px; 
          font-weight: 800; 
          cursor: pointer; 
          transition: 0.3s;
        }
        .make-doc-btn.is-loading {
          background: #94a3b8;
          cursor: not-allowed;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .consult-section { 
          margin-top: 20px; 
          padding: 30px; 
          background: #f1f5f9; 
          border-radius: 24px; 
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        .consult-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
        .consult-desc { font-size: 14px; color: #64748b; margin-bottom: 20px; }
        .consult-btns { display: flex; gap: 10px; justify-content: center; }
        .consult-btns button { 
          flex: 1; 
          max-width: 200px;
          padding: 14px; 
          border-radius: 12px; 
          border: none; 
          font-weight: 700; 
          font-size: 14px;
          cursor: pointer; 
          transition: 0.2s;
        }
        .btn-kakao { background: #fae100; color: #3c1e1e; }
        .btn-telegram { background: #0088cc; color: #fff; }
        .consult-btns button:hover { opacity: 0.8; transform: translateY(-2px); }

        @media (max-width: 600px) { 
          .bubble { padding: 20px; } 
          .text-content { font-size: 15px; } 
          .consult-btns { flex-direction: column; align-items: center; }
          .consult-btns button { max-width: 100%; width: 100%; }
        }
      `}</style>
    </div>
  );
}
