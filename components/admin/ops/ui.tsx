import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatTry } from "@/lib/money";
import { monthLabel, shiftMonth } from "@/lib/ops/meta";

/** Sayfa başlığı: başlık, kısa açıklama ve sağda eylemler. */
export function PageHead({ title, children, actions }: { title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-4xl">{title}</h1>
        {children ? <p className="mt-1 max-w-2xl text-ink/55">{children}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Sayı kartı. */
export function Stat({ label, value, sub, tone = "" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink/55">{label}</p>
      <p className={`display mt-2 text-3xl tabular-nums ${tone}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink/50">{sub}</p> : null}
    </div>
  );
}

/** Kuruş → "1.250,00 TL"; kuruş yoksa "1.250 TL". */
export function tl(k: number): string {
  const s = formatTry(Math.round(k));
  return s.endsWith(",00 TL") ? s.replace(",00 TL", " TL") : s;
}

export function n(x: number): string {
  return x.toLocaleString("tr-TR");
}

export function pct(part: number, whole: number): string {
  if (!whole) return "—";
  const v = (part / whole) * 100;
  return `${v < 0 ? "−" : ""}%${Math.abs(v).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

/** Ay seçici: ‹ Kasım 2026 › */
export function MonthNav({ month, base, max }: { month: string; base: string; max?: string }) {
  const next = shiftMonth(month, 1);
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-1">
      <Link href={`${base}?ay=${shiftMonth(month, -1)}`} className="grid size-9 place-items-center rounded-full hover:bg-paper" aria-label="Önceki ay"><ChevronLeft size={17} /></Link>
      <span className="min-w-32 text-center text-sm font-semibold">{monthLabel(month)}</span>
      {max && next > max ? (
        <span className="grid size-9 place-items-center text-ink/20" aria-hidden><ChevronRight size={17} /></span>
      ) : (
        <Link href={`${base}?ay=${next}`} className="grid size-9 place-items-center rounded-full hover:bg-paper" aria-label="Sonraki ay"><ChevronRight size={17} /></Link>
      )}
    </div>
  );
}

/** Boş durum: kısa açıklama ve isteğe bağlı eylem. */
export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children ? <div className="mx-auto mt-1 max-w-md text-sm text-ink/55">{children}</div> : null}
    </div>
  );
}

/** Basit yatay çubuk (yüzde). */
export function Bar({ value, max, tone = "bg-blue" }: { value: number; max: number; tone?: string }) {
  const w = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink/5">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${w}%` }} />
    </div>
  );
}

export const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink/45";
export const td = "px-4 py-3 whitespace-nowrap";
