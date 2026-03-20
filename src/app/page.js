// src/app/page.js (서버 컴포넌트로 변경)
import LegalVietClient from "./LegalVietClient"; // 1번에서 만든 파일을 불러옵니다.

export const metadata = {
  title: "LegalViet | 베트남 법률·행정 AI 분석 서비스",
  description: "베트남 서류와 법률, 이제 AI로 분석하세요. 실시간 데이터로 진화하는 베트남 비즈니스 필수 툴.",
  keywords: ["베트남 법률", "베트남 행정", "AI 분석", "LegalViet"],
  verification: {
    // 구글 서치 콘솔에서 받은 'content' 값을 여기에 넣으세요!
    google: "여기에_인증_코드를_입력하세요",
  },
  openGraph: {
    title: "LegalViet - AI 기반 베트남 행정 가이드",
    url: "https://www.legalviet.pro",
    images: [{ url: "/og-image.png" }],
  },
};

export default function Page() {
  return <LegalVietClient />; // 실제 화면 로직은 클라이언트 컴포넌트에게 맡깁니다.
}
