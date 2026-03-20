// src/app/auth/signup/page.js
import SignupClient from "./SignupClient";

export const metadata = {
  title: "회원가입 | LegalViet",
  description: "LegalViet 계정을 생성하고 베트남의 복잡한 행정 서류와 법률 문서 AI 분석 서비스를 시작하세요. 로펌 파트너 매칭을 통해 전문가의 도움도 받으실 수 있습니다.",
  keywords: ["베트남 법률 서비스 가입", "LegalViet 회원가입", "베트남 행정 AI 분석", "베트남 비즈니스 툴"],
  openGraph: {
    title: "회원가입 | LegalViet - 베트남 법률 AI의 시작",
    description: "지금 가입하고 AI가 제안하는 베트남 행정 솔루션을 경험하세요.",
    url: "https://www.legalviet.pro/auth/signup",
  },
};

export default function Page() {
  return <SignupClient />;
}
