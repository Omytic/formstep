import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
  // www.formstep.tr → formstep.tr (Vercel'de iki alan adı da projeye eklenmeli)
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.formstep.tr" }], destination: "https://formstep.tr/:path*", permanent: true },
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
