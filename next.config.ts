import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Muhasebe dosyaları (fatura, dekont) için: varsayılan 1 MB yetmez. Vercel istek sınırı 4,5 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  // www → köksüz yönlendirme burada yok. Vercel şu an formstep.tr'yi www'ye gönderiyor;
  // uygulama da www'yi geri çevirirse tarayıcı döngüye girer ve site açılmaz.
  async redirects() {
    return [
      { source: "/bilgilendirme/teslimat", destination: "/bilgilendirme/iade-ve-cayma", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(),
      },
    ];
  },
};

export default nextConfig;
