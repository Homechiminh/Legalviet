import { t } from './Translations';

export default function ChatList({ history, lang, onExport, onCopy, onMakeDoc }) {
  if (history.length === 0) {
    return (
      <div className="empty">
        <p>{t[lang].emptyHistory}</p>
        <style jsx>{` .empty { padding: 80px 0; text-align: center; background: #fff; border-radius: 24px; border: 2px dashed #e2e8f0; color: #94a3b8; } `}</style>
      </div>
    );
  }

  return (
    <div className="chat-flow">
      {history.map((chat, index) => (
        <div key={index} className={`bubble ${chat.role}`}>
          <div className="bubble-head">
            <div className={`icon ${chat.role}`}>{chat.role === 'user' ? 'U' : 'L'}</div>
            <span className="label">
              {chat.role === 'user' ? t[lang].roleUser : (chat.role === 'document' ? t[lang].roleDoc : t[lang].roleAI)}
            </span>
          </div>
          <div className="text-content">{chat.text}</div>
          
          {chat.role === 'document' && (
            <div className="action-row">
              <button onClick={() => onExport('word', chat.text)} className="btn-word">Word</button>
              <button onClick={() => onExport('excel', chat.text)} className="btn-excel">Excel</button>
              <button onClick={() => onCopy(chat.text)} className="btn-copy">{t[lang].copy}</button>
            </div>
          )}

          {chat.role === 'model' && index === history.length - 1 && (
            <button onClick={() => onMakeDoc(chat.text)} className="make-doc-btn">{t[lang].makeDoc}</button>
          )}
        </div>
      ))}
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
        .make-doc-btn { width: 100%; margin-top: 20px; padding: 14px; background: #da251d; color: #fff; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }
        @media (max-width: 600px) { .bubble { padding: 20px; } .text-content { font-size: 15px; } }
      `}</style>
    </div>
  );
}
