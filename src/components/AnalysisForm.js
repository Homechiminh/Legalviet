import { t } from './Translations';

export default function AnalysisForm({ content, setContent, file, setFile, loading, loadingStep, lang, onSubmit }) {
  return (
    <form className="input-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t[lang].placeholder} />
      <div className="form-bottom">
        <div className="upload-zone">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <span>{file ? `✅ ${file.name}` : t[lang].upload}</span>
        </div>
        <button type="submit" disabled={loading} className="analyze-btn">
          {loading ? (
            <div className="loader">
              <div className="pulse"></div>
              <span>{loadingStep === 0 ? t[lang].step0 : loadingStep === 1 ? t[lang].step1 : t[lang].step2}</span>
            </div>
          ) : t[lang].startAnalysis}
        </button>
      </div>
      <style jsx>{`
        .input-form { background: #fff; padding: 30px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        textarea { width: 100%; height: 160px; padding: 20px; border-radius: 15px; border: 1px solid #f1f5f9; background: #f8fafc; font-size: 16px; outline: none; resize: none; border: 1px solid transparent; transition: 0.2s; }
        textarea:focus { border-color: #0f172a; }
        .form-bottom { display: flex; gap: 15px; margin-top: 20px; }
        .upload-zone { flex: 1; position: relative; border: 2px dashed #e2e8f0; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #64748b; cursor: pointer; }
        .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .analyze-btn { flex: 1.5; background: #0f172a; color: #fff; height: 60px; border-radius: 15px; border: none; font-weight: 800; font-size: 18px; cursor: pointer; }
        .loader { display: flex; align-items: center; gap: 10px; }
        .pulse { width: 10px; height: 10px; background: #fff; border-radius: 50%; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.2); opacity: 0; } }
        @media (max-width: 768px) { .form-bottom { flex-direction: column; } .analyze-btn { height: 55px; } }
      `}</style>
    </form>
  );
}
