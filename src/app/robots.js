export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"], // 보안이 필요한 곳은 제외
    },
    sitemap: "https://www.legalviet.pro/sitemap.xml",
  };
}
