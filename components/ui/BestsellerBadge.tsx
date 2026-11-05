import { Trophy } from "lucide-react";

/** "Amazon Türkiye'nin en çok satan tabanlığı" rozeti. Metin yönetim panelinden gelir. */
export function BestsellerBadge({ text, tone = "dark", size = "md", className = "" }: { text: string; tone?: "dark" | "light"; size?: "sm" | "md"; className?: string }) {
  const base =
    tone === "dark"
      ? "border-[#ffb547]/40 bg-[#ffb547]/10 text-[#ffd18a]"
      : "border-[#e8a33d]/40 bg-[#fff5e3] text-[#9a5b00]";
  return (
    <span className={`fs-badge relative inline-flex items-center gap-2 overflow-hidden rounded-full border font-semibold ${size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-xs sm:text-sm"} ${base} ${className}`}>
      <span className={`grid shrink-0 place-items-center rounded-full bg-[#ffb547] text-[#3a2200] ${size === "sm" ? "size-4" : "size-5"}`}>
        <Trophy size={size === "sm" ? 10 : 12} strokeWidth={2.5} />
      </span>
      <span className="relative">{text}</span>
    </span>
  );
}
