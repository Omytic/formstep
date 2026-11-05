import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/hesabim", "/odeme", "/sepet", "/siparis", "/api/", "/giris", "/kayit", "/sifre"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
