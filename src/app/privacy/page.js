"use client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="legal-root">
      <Navbar />
      <main className="legal-container">
        <h1>Privacy Policy (개인정보처리방침)</h1>
        <section>
          <h3>1. 수집하는 정보</h3>
          <p>회원가입 시 이메일 주소를 수집하며, 서비스 이용 과정에서 업로드된 문서 데이터는 AI 분석을 위한 용도로만 사용됩니다.</p>
        </section>
        <section>
          <h3>2. 정보의 보호</h3>
          <p>모든 데이터는 Supabase의 보안 프로토콜에 따라 안전하게 저장되며, 제3자에게 무단으로 제공하지 않습니다.</p>
        </section>
        <section>
          <h3>3. 사용자 권리</h3>
          <p>사용자는 언제든지 자신의 계정을 삭제하거나 데이터 열람을 요청할 수 있습니다.</p>
        </section>
      </main>
      <Footer />
      <style jsx>{` /* 스타일은 TermsPage와 동일 */ `}</style>
    </div>
  );
}
