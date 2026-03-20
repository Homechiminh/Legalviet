"use client";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="legal-root">
      <Navbar />
      <main className="legal-container">
        <h1>Terms of Service (이용약관)</h1>
        <section>
          <h3>1. 서비스의 목적</h3>
          <p>LegalViet은 AI를 기반으로 한 법률/행정 문서 분석 보조 도구입니다. 본 서비스가 제공하는 정보는 참고용이며, 어떠한 법적 효력도 갖지 않습니다.</p>
        </section>
        <section>
          <h3>2. 책임의 한계</h3>
          <p>본 서비스의 분석 결과에 따라 발생하는 직접적, 간접적 손실에 대해 운영자는 책임을 지지 않습니다. 최종 결정 전 반드시 전문 법무인과 상의하시기 바랍니다.</p>
        </section>
        <section>
          <h3>3. 결제 및 환불</h3>
          <p>모든 결제는 Lemon Squeezy를 통해 처리되며, 환불 정책은 해당 플랫폼의 규정을 따릅니다.</p>
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .legal-root { background: #f8fafc; min-height: 100vh; }
        .legal-container { max-width: 800px; margin: 60px auto; padding: 40px; background: #fff; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { font-size: 28px; margin-bottom: 30px; color: #0f172a; }
        section { margin-bottom: 25px; }
        h3 { font-size: 18px; margin-bottom: 10px; color: #1e293b; }
        p { color: #64748b; line-height: 1.6; font-size: 14px; }
      `}</style>
    </div>
  );
}
