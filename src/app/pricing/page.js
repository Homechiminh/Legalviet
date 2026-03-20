// src/app/pricing/page.js
import PricingClient from "./PricingClient";

export const metadata = {
  title: "요금제 및 멤버십 | LegalViet",
  description: "합리적인 가격으로 베트남 행정 및 법률 AI 분석 서비스를 이용하세요. 일반 유저를 위한 무제한 분석 플랜부터 로펌 파트너를 위한 리드 제공 플랜까지 준비되어 있습니다.",
  keywords: ["LegalViet 요금제", "베트남 법률 서비스 가격", "AI 행정 분석 구독", "로펌 파트너십", "베트남 비즈니스 툴"],
  openGraph: {
    title: "LegalViet 요금제 - 베트남 비즈니스의 스마트한 선택",
    description: "월 $9부터 시작하는 베트남 행정 혁신. 지금 바로 시작하세요.",
    url: "https://www.legalviet.pro/pricing",
    images: [
      {
        url: "/og-image-pricing.png", // 요금제 전용 공유 이미지가 있다면 별도로 지정 가능합니다.
        width: 1200,
        height: 630,
        alt: "LegalViet 요금제 안내",
      },
    ],
  },
};

export default function Page() {
  return <PricingClient />;
}
