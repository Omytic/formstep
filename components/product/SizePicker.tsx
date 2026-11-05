"use client";

import type { Variant } from "@/lib/store/types";

export function SizePicker({
  variants,
  value,
  onChange,
  accent,
  tone = "light",
  lowStock = 5,
}: {
  variants: Variant[];
  value: string | null;
  onChange: (id: string) => void;
  accent: string;
  tone?: "light" | "dark";
  lowStock?: number;
}) {
  return (
    <div role="radiogroup" aria-label="Numara" className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {variants.map((v) => {
        const on = v.id === value;
        const out = v.stock <= 0;
        const base = tone === "dark" ? "border-white/20 text-paper hover:border-white/60" : "border-line bg-white hover:border-ink/40";
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={out}
            onClick={() => onChange(v.id)}
            className={`relative min-h-11 rounded-xl border-2 px-1 text-[13px] font-semibold tabular-nums transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through ${on ? "scale-[1.04] text-white shadow-lg" : base}`}
            style={on ? { backgroundColor: accent, borderColor: accent } : undefined}
          >
            {v.sizeLabel}
            {!out && v.stock <= lowStock ? (
              <span className="absolute -right-1.5 -top-2 rounded-full bg-warn px-1.5 text-[10px] font-bold leading-4 text-white">Son {v.stock}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
