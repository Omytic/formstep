"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { saveStocks } from "@/app/actions/admin";
import { ActionForm } from "./ActionForm";

type Cell = { id: string; stock: number } | null;
export type StockRow = { size: string; cells: Cell[] };

export function StockGrid({ models, rows }: { models: { code: string; status: string }[]; rows: StockRow[] }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.flatMap((r) => r.cells.filter(Boolean).map((c) => [c!.id, String(c!.stock)]))),
  );
  const original = Object.fromEntries(rows.flatMap((r) => r.cells.filter(Boolean).map((c) => [c!.id, String(c!.stock)])));
  const changed = Object.keys(values).filter((k) => values[k] !== original[k]).length;
  const totals = models.map((_, i) => rows.reduce((s, r) => s + (r.cells[i] ? Number(values[r.cells[i]!.id]) || 0 : 0), 0));
  const bump = (id: string, d: number) => setValues((v) => ({ ...v, [id]: String(Math.max(0, (Number(v[id]) || 0) + d)) }));

  return (
    <ActionForm action={saveStocks} submit={changed ? `${changed} değişikliği kaydet` : "Kaydet"}>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-4 text-left font-medium text-ink/50">Numara</th>
              {models.map((m) => (
                <th key={m.code} className="px-5 py-4 text-left">
                  <span className="display text-2xl">{m.code}</span>
                  <span className={`chip ml-2 ${m.status === "published" ? "bg-good/10 text-good" : "bg-ink/5 text-ink/50"}`}>{m.status === "published" ? "Yayında" : "Taslak"}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.size} className="hover:bg-paper/60">
                <td className="px-5 py-2.5 font-semibold tabular-nums">{r.size}</td>
                {r.cells.map((c, i) =>
                  c ? (
                    <td key={i} className="px-5 py-2.5">
                      <input type="hidden" name={`o_${c.id}`} value={original[c.id]} />
                      <div className={`inline-flex items-center rounded-full border transition-colors ${values[c.id] !== original[c.id] ? "border-blue bg-blue/5" : Number(values[c.id]) === 0 ? "border-bad/30 bg-bad/5" : "border-line"}`}>
                        <button type="button" onClick={() => bump(c.id, -1)} className="grid size-9 place-items-center text-ink/50 hover:text-ink" aria-label={`${models[i].code} ${r.size} azalt`}><Minus size={14} /></button>
                        <input
                          name={`s_${c.id}`}
                          value={values[c.id]}
                          onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                          inputMode="numeric"
                          aria-label={`${models[i].code} ${r.size} stok`}
                          className="w-14 bg-transparent text-center font-semibold tabular-nums outline-none"
                        />
                        <button type="button" onClick={() => bump(c.id, 1)} className="grid size-9 place-items-center text-ink/50 hover:text-ink" aria-label={`${models[i].code} ${r.size} artır`}><Plus size={14} /></button>
                      </div>
                    </td>
                  ) : (
                    <td key={i} className="px-5 py-2.5 text-ink/30">—</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line">
              <td className="px-5 py-4 font-semibold">Toplam</td>
              {totals.map((t, i) => <td key={i} className="px-5 py-4 font-semibold tabular-nums">{t} adet</td>)}
            </tr>
          </tfoot>
        </table>
      </div>
    </ActionForm>
  );
}
