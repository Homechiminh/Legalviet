"use client";
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [lang, setLang] = useState('ko');
  const [isYearly, setIsYearly] = useState(false);

  // [추가] 나중에 Lemon Squeezy 승인 후 여기에 URL만 붙여넣으시면 됩니다!
  const CHECKOUT_URLS = {
    standard_monthly: "#", 
    standard_yearly: "#",
    partner_monthly: "#",
    partner_yearly: "#"
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const handleCheckout = (planType) => {
    let url = "#";
    if (planType === 'standard') {
      url = isYearly ? CHECKOUT_URLS.standard_yearly : CHECKOUT_URLS.standard_monthly;
    } else {
      url = isYearly ? CHECKOUT_URLS.partner_yearly : CHECKOUT_URLS.partner_monthly;
    }
    
    if (url === "#") {
      alert(lang === 'ko' ? "현재 결제 시스템 준비 중입니다. 잠시만 기다려주세요!" : "Checkout is being prepared. Please wait a moment!");
    } else {
      window.location.href = url;
    }
  };

  const plans = [
    {
      id: 'standard',
      name: lang === 'ko' ? '일반 유저' : 'Standard User',
      monthlyPrice: '9',
      yearlyPrice: '86',
      features: lang === 'ko' 
        ? ['무제한 AI 문서 분석', '분석 결과 히스토리 무제한 저장', '전문가 상담 연결 지원'] 
        : ['Unlimited AI Analysis', 'Unlimited History Storage', 'Expert Matching Support'],
      button: lang === 'ko' ? '지금 시작하기' : 'Get Started',
      popular: false
    },
    {
      id: 'partner',
      name: lang === 'ko' ? '로펌 파트너' : 'Law Firm Partner',
      monthlyPrice: '50',
      yearlyPrice: '480',
      features: lang === 'ko' 
        ? ['유저 연락처 공개 크레딧 20개', '전문가 전용 AI 분석 도구', '파트너 배지 부여', '상담 리드 우선 배정'] 
        : ['20 Contact Credits', 'Partner AI Tools', 'Partner Badge', 'Priority Lead Allocation'],
      button: lang === 'ko' ? '파트너 가입하기' : 'Join as Partner',
      popular: true
    }
  ];

  const faqs = [
    {
      q: lang === 'ko' ? "AI 분석 결과는 법적 효력이 있나요?" : "Is the AI analysis legally binding?",
      a: lang === 'ko' 
        ? "LegalViet의 AI 분석은 행정 업무 보조 및 참고용이며, 공식적인 법적 효력은 없습니다. 정밀한 법적 검토가 필요한 경우 파트너 로펌 매칭을 통해 전문가의 조언을 받으시는 것을 권장합니다."
        : "LegalViet's AI analysis is for administrative assistance and reference only and has no official legal effect. For precise legal review, we recommend seeking expert advice through our partner law firm matching."
    },
    {
      q: lang === 'ko' ? "내 문서와 데이터는 안전하게 보호되나요?" : "Are my documents and data safe?",
      a: lang === 'ko'
        ? "유저가 업로드한 모든 문서는 보안 서버에서 암호화되어 관리됩니다. 분석 후 데이터는 유저 본인만 확인할 수 있으며, 마이페이지 설정에서 언제든 직접 삭제가 가능합니다."
        : "All documents uploaded by users are encrypted and managed on secure servers. After analysis, the data can only be viewed by the user and can be deleted at any time in the My Page settings."
    },
    {
      q: lang === 'ko' ? "로펌 파트너용 크레딧은 어떻게 사용하나요?" : "How do I use credits for Law Firm Partners?",
      a: lang === 'ko'
        ? "파트너 계정은 상담을 요청한 유저 중 연락처 공개를 동의한 유저의 정보를 크레딧 1개를 사용하여 열람할 수 있습니다. 매월 플랜에 따라 크레딧이 자동으로 충전됩니다."
        : "Partner accounts can view information of users who have agreed to reveal their contact info by using 1 credit. Credits are automatically recharged every month according to your plan."
    },
    {
        q: lang === 'ko' ? "결제 후 즉시 이용 가능한가요?" : "Is it available immediately after payment?",
        a: lang === 'ko'
          ? "네, 결제가 완료되면 시스템에서 자동으로 계정 권한이 업데이트되어 프로 기능을 즉시 이용하실 수 있습니다."
          : "Yes, once payment is complete, system permissions are automatically updated, giving you immediate access to Pro features."
      }
  ];

  return (
    <div className="pricing-root">
      <Navbar lang={lang} />
      
      <main className="container">
        <header className="pricing-header">
          <h1>{lang === 'ko' ? '합리적인 요금제' : 'Flexible Pricing'}</h1>
          <p>{lang === 'ko' ? '베트남 행정의 혁신, LegalViet과 함께하세요.' : 'Smart administrative solutions for Vietnam.'}</p>
          
          <div className="toggle-wrapper">
            <span className={!isYearly ? 'active' : ''}>{lang === 'ko' ? '월간 결제' : 'Monthly'}</span>
            <div className={`toggle-switch ${isYearly ? 'yearly' : ''}`} onClick={() => setIsYearly(!isYearly)}>
              <div className="toggle-handle" />
            </div>
            <span className={isYearly ? 'active' : ''}>
              {lang === 'ko' ? '연간 결제' : 'Yearly'} 
              <span className="discount-tag">{lang === 'ko' ? '20% 할인' : '20% OFF'}</span>
            </span>
          </div>
        </header>

        <div className="plan-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <span className="badge">Best for Business</span>}
              <h3>{plan.name}</h3>
              <div className="price-row">
                <span className="currency">$</span>
                <span className="amount">{isYearly ? plan.yearlyPrice : plan.monthlyPrice}</span>
                <span className="period">{isYearly ? (lang === 'ko' ? '/년' : '/yr') : (lang === 'ko' ? '/월' : '/mo')}</span>
              </div>
              <ul className="feature-list">
                {plan.features.map((f, j) => <li key={j}>✅ {f}</li>)}
              </ul>
              <button 
                onClick={() => handleCheckout(plan.id)}
                className={`btn-plan ${plan.popular ? 'btn-red' : ''}`}
              >
                {plan.button}
              </button>
            </div>
          ))}
        </div>

        {/* [신규] FAQ 섹션 */}
        <section className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <div className="faq-q">Q. {faq.q}</div>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer lang={lang} />

      <style jsx>{`
        .pricing-root { background: #f8fafc; min-height: 100vh; font-family: 'Pretendard', sans-serif; }
        .container { max-width: 1000px; margin: 0 auto; padding: 100px 20px; }
        
        .pricing-header { text-align: center; margin-bottom: 60px; }
        .pricing-header h1 { font-size: 42px; font-weight: 900; color: #0f172a; margin-bottom: 20px; letter-spacing: -0.02em; }
        .pricing-header p { color: #64748b; font-size: 18px; margin-bottom: 40px; }

        .toggle-wrapper { display: flex; align-items: center; justify-content: center; gap: 15px; font-weight: 700; color: #64748b; }
        .toggle-wrapper .active { color: #0f172a; }
        .toggle-switch { width: 56px; height: 28px; background: #e2e8f0; border-radius: 20px; position: relative; cursor: pointer; transition: 0.3s; }
        .toggle-switch.yearly { background: #da251d; }
        .toggle-handle { width: 22px; height: 22px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .toggle-switch.yearly .toggle-handle { left: 31px; }
        .discount-tag { background: #fee2e2; color: #da251d; font-size: 12px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }

        .plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; margin-bottom: 80px; }
        .plan-card { background: #fff; padding: 45px; border-radius: 32px; border: 1px solid #e2e8f0; position: relative; transition: 0.3s; display: flex; flex-direction: column; }
        .plan-card.popular { border-color: #da251d; box-shadow: 0 25px 50px -12px rgba(218, 37, 29, 0.15); transform: translateY(-5px); }
        .badge { position: absolute; top: 20px; left: 45px; background: #da251d; color: #fff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }

        h3 { font-size: 22px; font-weight: 800; margin-bottom: 25px; color: #0f172a; }
        .price-row { margin-bottom: 35px; }
        .amount { font-size: 56px; font-weight: 900; color: #0f172a; letter-spacing: -0.03em; }
        .currency { font-size: 24px; color: #94a3b8; font-weight: 700; margin-right: 4px; }
        .period { font-size: 18px; color: #94a3b8; font-weight: 600; }

        .feature-list { list-style: none; padding: 0; margin-bottom: 45px; flex-grow: 1; }
        .feature-list li { margin-bottom: 15px; font-size: 15px; color: #475569; display: flex; align-items: center; gap: 10px; }

        .btn-plan { width: 100%; padding: 18px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 16px; color: #0f172a; }
        .btn-red { background: #0f172a; color: #fff; border: none; }
        .btn-red:hover { background: #da251d; transform: scale(1.02); }
        .btn-plan:not(.btn-red):hover { background: #f8fafc; border-color: #cbd5e1; }

        /* FAQ 스타일 */
        .faq-section { border-top: 1px solid #e2e8f0; padding-top: 80px; }
        .faq-title { font-size: 28px; font-weight: 900; color: #0f172a; text-align: center; margin-bottom: 40px; }
        .faq-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 40px; }
        .faq-item { background: transparent; }
        .faq-q { font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .faq-a { font-size: 15px; color: #64748b; line-height: 1.7; }

        @media (max-width: 600px) {
          .container { padding: 60px 20px; }
          .amount { font-size: 48px; }
          .faq-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
