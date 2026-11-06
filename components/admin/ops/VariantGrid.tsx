"use client";

import { useEffect, useRef, useState } from "react";

export type GridModel = { code: string; variants: { id: string; size: string }[] };

/**
 * Model × numara adet tablosu. Her hücre `${prefix}${variant_id}` adıyla gönderilir.
 * `hint` verilirse hücrenin altında mevcut stok görünür.
 */
export function VariantGrid({
  models,
  prefix = "q_",
  hint,
  hintLabel = "stok",
  initial,
}: {
  models: GridModel[];
  prefix?: string;
  hint?: Record<string, number>;
  hintLabel?: string;
  initial?: Record<string, number>;
}) {
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial ?? {}).map(([k, v]) => [k, String(v)])),
  );
  const box = useRef<HTMLDivElement>(null);
  // Form başarıyla kaydedilip sıfırlanınca tablo da boşalsın
  useEffect(() => {
    const form = box.current?.closest("form");
    if (!form) return;
    const clear = () => setVals({});
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);
  const sizes = [...new Set(models.flatMap((m) => m.variants.map((v) => v.size)))].sort((a, b) => (Number(a.split("-")[0]) || 999) - (Number(b.split("-")[0]) || 999));
  const total = (code: string) =>
    models.find((m) => m.code === code)!.variants.reduce((s, v) => s + (Number(vals[v.id]) || 0), 0);
  const grand = models.reduce((s, m) => s + total(m.code), 0);

  return (
    <div ref={box} className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[300px] text-sm">
        <thead>
          <tr className="border-b border-line bg-paper/60">
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-ink/45">Numara</th>
            {models.map((m) => (
              <th key={m.code} className="px-3 py-2.5 text-left font-semibold">{m.code}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sizes.map((size) => (
            <tr key={size}>
              <td className="px-3 py-1.5 font-semibold tabular-nums">{size}</td>
              {models.map((m) => {
                const v = m.variants.find((x) => x.size === size);
                if (!v) return <td key={m.code} className="px-3 py-1.5 text-ink/25">—</td>;
                const val = vals[v.id] ?? "";
                return (
                  <td key={m.code} className="px-1.5 py-1.5 sm:px-3">
                    <input
                      name={`${prefix}${v.id}`}
                      value={val}
                      onChange={(e) => setVals((s) => ({ ...s, [v.id]: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                      inputMode="numeric"
                      placeholder="0"
                      aria-label={`${m.code} ${size} adet`}
                      className={`w-full min-w-12 rounded-xl border px-1.5 py-2 sm:px-3 text-center font-semibold tabular-nums outline-none transition focus:border-blue ${val && val !== "0" ? "border-blue/40 bg-blue/5" : "border-line"}`}
                    />
                    {hint ? <span className="mt-0.5 block text-center text-[11px] text-ink/40">{hintLabel}: {hint[v.id] ?? 0}</span> : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line">
            <td className="px-3 py-2.5 font-semibold">Toplam</td>
            {models.map((m) => (
              <td key={m.code} className="px-3 py-2.5 text-center font-semibold tabular-nums">{total(m.code) || "—"}</td>
            ))}
          </tr>
          <tr>
            <td colSpan={models.length + 1} className="px-3 pb-3 text-right text-sm text-ink/55">Genel toplam: <strong className="text-ink">{grand} adet</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
