import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "FormStep — Memory foam tabanlık | M100, M300, M900", template: "%s — FormStep" },
  description: "Amazon Türkiye'nin en çok satan tabanlığı FormStep: günlük kullanım için M100, içe ve dışa basmaya özel M300, topuk desteği için M900. İki katmanlı memory foam tabanlıklar.",
  applicationName: "FormStep",
  openGraph: {
    title: "FormStep — Her adımda daha fazla konfor",
    description: "Amazon Türkiye'nin en çok satan tabanlığı. İki katmanlı memory foam: M100, M300, M900.",
    locale: "tr_TR",
    type: "website",
    siteName: "FormStep",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "FormStep memory foam tabanlık" }],
  },
  twitter: { card: "summary_large_image", site: "@formsteptr", images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#060a16" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="antialiased" data-scroll-behavior="smooth">
      <head>
        <link rel="preload" href="/fonts/archivo-latin-800-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
          İçeriğe geç
        </a>
        {children}
      </body>
    </html>
  );
}
