import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Marketplaces } from "@/lib/store/types";

const LOGOS = {
  amazon: { label: "Amazon", src: "/assets/brand/stores/amazon-logo.png", w: 319, h: 96, height: 24 },
  trendyol: { label: "Trendyol", src: "/assets/brand/stores/trendyol-logo.png", w: 418, h: 96, height: 19 },
  hepsiburada: { label: "Hepsiburada", src: "/assets/brand/stores/hepsiburada-logo.png", w: 565, h: 96, height: 19 },
} as const;

type Key = keyof typeof LOGOS;

/**
 * FormStep'in satıldığı pazaryeri mağazalarına giden butonlar. Logolar açık renkli olduğu için
 * butonlar her zeminde koyu kapsül olarak görünür.
 * `overrides` ile bir modelin kendi ürün sayfası (ör. Amazon'daki M900) verilebilir.
 */
export function StoreButtons({
  marketplaces,
  overrides,
  product,
  layout = "stack",
  className = "",
}: {
  marketplaces: Pick<Marketplaces, Key>;
  overrides?: Partial<Record<Key, string>>;
  product?: string;
  layout?: "stack" | "row";
  className?: string;
}) {
  const items = (Object.keys(LOGOS) as Key[])
    .map((k) => ({ key: k, href: overrides?.[k] || marketplaces[k], ...LOGOS[k] }))
    .filter((s) => s.href);
  if (!items.length) return null;
  return (
    <ul className={`${layout === "row" ? "grid gap-2 sm:grid-cols-3" : "grid gap-2"} ${className}`}>
      {items.map((s, i) => (
        <li key={s.key} className="@container">
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${product ? `FormStep ${product}, ` : ""}${s.label}'da satın al`}
            className={`group flex min-h-13 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-white ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 hover:ring-sky/60 ${i === 0 ? "bg-[#0b0f1c] shadow-[0_14px_30px_-14px_rgba(8,115,229,0.75)]" : "bg-[#0b0f1c]/92"}`}
          >
            <Image src={s.src} alt={s.label} width={s.w} height={s.h} className="w-auto object-contain object-left" style={{ height: s.height, width: "auto" }} />
            <span className="flex items-center gap-1 text-sm font-semibold text-white/80 transition group-hover:text-white">
              <span className="hidden @[15rem]:inline">Satın al</span> <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
