"use client";
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [lang, setLang] = useState('ko');
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('legalviet_lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const plans = [
    {
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

  return (
    <div className="pricing-root">
      <Navbar lang={lang} />
      
      <main className="container">
        <header className="pricing-header">
          <h1>{lang === 'ko' ? '합리적인 요금제' : 'Flexible Pricing'}</h1>
          <p>{lang === 'ko' ? '베트남 행정의 혁신, LegalViet과 함께하세요.' : 'Smart administrative solutions for Vietnam.'}</p>
          
          {/* 월간/연간 토글 */}
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
              <button className={`btn-plan ${plan.popular ? 'btn-red' : ''}`}>
                {plan.button}
              </button>
            </div>
          ))}
        </div>
      </main>

      <Footer lang={lang} />

      <style jsx>{`
        .pricing-root { background: #f8fafc; min-height: 100vh; font-family: 'Pretendard', sans-serif; }
        .container { max-width: 1000px; margin: 0 auto; padding: 100px 20px; }
        
        .pricing-header { text-align: center; margin-bottom: 60px; }
        .pricing-header h1 { font-size: 42px; font-weight: 900; color: #0f172a; margin-bottom: 20px; letter-spacing: -0.02em; }
        .pricing-header p { color: #64748b; font-size: 18px; margin-bottom: 40px; }

        /* 토글 스위치 디자인 */
        .toggle-wrapper { display: flex; align-items: center; justify-content: center; gap: 15px; font-weight: 700; color: #64748b; }
        .toggle-wrapper .active { color: #0f172a; }
        .toggle-switch { width: 56px; height: 28px; background: #e2e8f0; border-radius: 20px; position: relative; cursor: pointer; transition: 0.3s; }
        .toggle-switch.yearly { background: #da251d; }
        .toggle-handle { width: 22px; height: 22px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .toggle-switch.yearly .toggle-handle { left: 31px; }
        .discount-tag { background: #fee2e2; color: #da251d; font-size: 12px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }

        .plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; }
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

        @media (max-width: 600px) {
          .container { padding: 60px 20px; }
          .amount { font-size: 48px; }
        }
      `}</style>
    </div>
  );
}
