import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// [SEO 최적화] 전역 메타데이터 설정
export const metadata = {
  metadataBase: new URL('https://www.legalviet.pro'),
  title: {
    default: "LegalViet - 베트남 법률·행정 AI 분석 서비스",
    template: "%s | LegalViet"
  },
  description: "베트남의 복잡한 행정 서류와 법률 문서, 이제 AI로 1초 만에 요약하고 분석하세요. 로펌 파트너 매칭까지 지원합니다.",
  keywords: ["베트남 법률", "베트남 행정", "베트남 비자", "베트남 법인설립", "베트남 투자", "AI 분석"],
  icons: {
    icon: "/icon.png", // 아까 만든 여백 없는 64x64 아이콘
    apple: "/icon.png",
  },
  openGraph: {
    title: "LegalViet - AI 기반 베트남 행정 가이드",
    description: "복잡한 베트남 서류, AI가 명확하게 분석해 드립니다.",
    url: "https://www.legalviet.pro",
    siteName: "LegalViet",
    images: [
      {
        url: "/og-image.png", // 카톡/구글 공유 시 뜨는 이미지 (1200x630 추천)
        width: 1200,
        height: 630,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  verification: {
    // 구글 서치 콘솔에서 'HTML 태그' 인증 방식을 선택하면 나오는 content 값을 여기에 넣으세요!
    google: "여기에_구글_콘솔_인증_코드를_입력하세요",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko"> {/* 한국어 서비스이므로 ko로 변경 */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
