import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { LEGAL_NAV } from "@/lib/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/rehber`, lastModified: now, priority: 0.8 },
    ...["m100", "m300", "m900"].map((s) => ({ url: `${base}/urun/${s}`, lastModified: now, priority: 0.9 })),
    ...LEGAL_NAV.map((l) => ({ url: `${base}/bilgilendirme/${l.slug}`, lastModified: now, priority: 0.3 })),
  ];
}
