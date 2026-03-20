// src/app/auth/login/page.js
import LoginClient from "./LoginClient";

export const metadata = {
  title: "로그인 | LegalViet",
  description: "LegalViet에 로그인하여 베트남 법률 및 행정 서류 AI 분석 서비스를 이용하세요. 기존 분석 내역 확인 및 로펌 파트너 서비스를 제공합니다.",
  // 로그인 페이지는 검색 결과에 노출되어야 하지만, 보안상 불필요한 크롤링을 방지하기 위해 아래 옵션을 넣기도 합니다.
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <LoginClient />;
}
