"use client";

import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  max,
  onChange,
  size = "md",
  tone = "light",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  const h = size === "sm" ? "h-9" : "h-12";
  const w = size === "sm" ? "w-9" : "w-12";
  const border = tone === "dark" ? "border-white/20" : "border-line";
  return (
    <div className={`inline-flex items-center rounded-full border ${border} ${h}`} role="group" aria-label="Adet">
      <button type="button" className={`grid ${w} ${h} place-items-center rounded-full transition hover:bg-black/5 disabled:opacity-30`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Bir azalt">
        <Minus size={15} />
      </button>
      <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={`grid ${w} ${h} place-items-center rounded-full transition hover:bg-black/5 disabled:opacity-30`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Bir artır">
        <Plus size={15} />
      </button>
    </div>
  );
}
