"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { readSheet } from "read-excel-file/browser";
import { importSales, type ImportRow } from "@/app/actions/ops";
import { CHANNELS, IMPORT_FIELDS, IMPORT_GUESS, type ImportField, type ImportMapping } from "@/lib/ops/meta";

type Cell = string | number | boolean | Date | null;
type Grid = Cell[][];

/* ───────── dosya okuma ───────── */

function parseDelimited(text: string): Grid {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = [["\t", (first.match(/\t/g) ?? []).length], [";", (first.match(/;/g) ?? []).length], [",", (first.match(/,/g) ?? []).length]].sort((a, b) => Number(b[1]) - Number(a[1]))[0][0] as string;
  const rows: Grid = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function readFile(file: File): Promise<Grid> {
  if (/\.xlsx$/i.test(file.name)) return (await readSheet(file)) as Grid;
  if (/\.xls$/i.test(file.name)) throw new Error("Eski .xls biçimi okunamıyor. Dosyayı Excel'de açıp .xlsx olarak kaydet.");
  const buf = await file.arrayBuffer();
  let text = new TextDecoder("utf-8").decode(buf);
  if (text.includes("�")) text = new TextDecoder("windows-1254").decode(buf);
  return parseDelimited(text.replace(/^﻿/, ""));
}

/* ───────── değer dönüştürme ───────── */

const lc = (s: unknown) => String(s ?? "").trim().toLocaleLowerCase("tr-TR");

function toDate(v: Cell): string {
  if (v instanceof Date) return new Date(v.getTime() - v.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  if (typeof v === "number" && v > 30000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 86400_000).toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function toNum(v: Cell): number {
  if (typeof v === "number") return v;
  let s = String(v ?? "").replace(/[^\d,.-]/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function guessHeaderRow(grid: Grid): number {
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const cells = grid[i].map(lc);
    const hits = cells.filter((c) => c && Object.values(IMPORT_GUESS).some((g) => g.some((k) => c.includes(k)))).length;
    const score = hits * 10 + cells.filter((c) => c && Number.isNaN(Number(c))).length;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

function guessMapping(headers: string[], saved: ImportMapping): ImportMapping {
  const out: ImportMapping = {};
  const used = new Set<string>();
  for (const f of IMPORT_FIELDS) {
    if (saved[f.key] && headers.includes(saved[f.key]!)) {
      out[f.key] = saved[f.key];
      used.add(saved[f.key]!);
      continue;
    }
    for (const k of IMPORT_GUESS[f.key]) {
      const h = headers.find((x) => !used.has(x) && lc(x).includes(k));
      if (h) {
        out[f.key] = h;
        used.add(h);
        break;
      }
    }
  }
  return out;
}

/* ───────── bileşen ───────── */

export function SalesImporter({ savedMappings }: { savedMappings: Record<string, ImportMapping> }) {
  const [channel, setChannel] = useState("");
  const [fileName, setFileName] = useState("");
  const [grid, setGrid] = useState<Grid | null>(null);
  const [headerRow, setHeaderRow] = useState(0);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [unitPrice, setUnitPrice] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const [progress, setProgress] = useState("");

  const headers = useMemo(() => (grid?.[headerRow] ?? []).map((h, i) => String(h ?? "").trim() || `Sütun ${i + 1}`), [grid, headerRow]);

  async function onFile(file: File | undefined) {
    setError("");
    setResult(null);
    if (!file) return;
    try {
      const g = (await readFile(file)).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
      if (g.length < 2) throw new Error("Dosyada veri bulunamadı.");
      const hr = guessHeaderRow(g);
      setGrid(g);
      setFileName(file.name);
      setHeaderRow(hr);
      const hs = g[hr].map((h, i) => String(h ?? "").trim() || `Sütun ${i + 1}`);
      setMapping(guessMapping(hs, savedMappings[channel] ?? {}));
    } catch (e) {
      setGrid(null);
      setError(e instanceof Error ? e.message : "Dosya okunamadı.");
    }
  }

  const rows: (ImportRow & { skip?: string })[] = useMemo(() => {
    if (!grid) return [];
    const col = (f: ImportField) => (mapping[f] ? headers.indexOf(mapping[f]!) : -1);
    const idx = Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, col(f.key)])) as Record<ImportField, number>;
    const get = (r: Cell[], f: ImportField) => (idx[f] >= 0 ? r[idx[f]] : null);
    return grid.slice(headerRow + 1).map((r) => {
      const status = lc(get(r, "status"));
      const qty = Math.round(Math.abs(toNum(get(r, "qty")))) || (idx.qty < 0 ? 1 : 0);
      const gross = Math.abs(toNum(get(r, "gross"))) * (unitPrice ? qty : 1);
      const type: "satis" | "iade" = /iade|return|refund/.test(status) ? "iade" : "satis";
      const row = {
        order_no: String(get(r, "order_no") ?? "").trim(),
        sold_on: toDate(get(r, "sold_on")),
        sku: String(get(r, "sku") ?? "").trim(),
        title: String(get(r, "title") ?? "").trim(),
        qty,
        gross: Math.round(gross * 100) / 100,
        commission: Math.abs(toNum(get(r, "commission"))),
        shipping: Math.abs(toNum(get(r, "shipping"))),
        other: Math.abs(toNum(get(r, "other"))),
        type,
      };
      const skip = /iptal|cancel/.test(status) ? "iptal" : !row.order_no || !row.sold_on || !row.qty ? "eksik" : undefined;
      return { ...row, skip };
    });
  }, [grid, headerRow, headers, mapping, unitPrice]);

  const valid = rows.filter((r) => !r.skip);
  const missing = IMPORT_FIELDS.filter((f) => f.required && !mapping[f.key]);
  const ready = channel && grid && !missing.length && valid.length > 0;

  function submit() {
    if (!ready) return;
    setResult(null);
    start(async () => {
      const clean: ImportRow[] = valid.map((r) => ({ order_no: r.order_no, sold_on: r.sold_on, sku: r.sku, title: r.title, qty: r.qty, gross: r.gross, commission: r.commission, shipping: r.shipping, other: r.other, type: r.type }));
      const size = 1500;
      const parts = Math.ceil(clean.length / size);
      let inserted = 0;
      let last: { ok: boolean; message: string } | null = null;
      for (let i = 0; i < parts; i++) {
        setProgress(parts > 1 ? `${i + 1} / ${parts}` : "");
        const r = await importSales(channel, parts > 1 ? `${fileName} (${i + 1}/${parts})` : fileName, clean.slice(i * size, (i + 1) * size), mapping);
        if (!r.ok) {
          last = r;
          break;
        }
        inserted += r.inserted ?? 0;
        last = parts > 1 ? { ok: true, message: `${inserted} satır eklendi. ${r.message}` } : r;
      }
      setProgress("");
      setResult(last);
    });
  }

  const sample = rows.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="card grid gap-5 p-6 md:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor="kanal" className="label">1. Pazaryeri</label>
          <select id="kanal" value={channel} onChange={(e) => { setChannel(e.target.value); if (grid) setMapping(guessMapping(headers, savedMappings[e.target.value] ?? {})); }} className="field">
            <option value="">Seç</option>
            {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <span className="label">2. Rapor dosyası</span>
          <label className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-4 transition hover:border-blue hover:bg-blue/5 ${grid ? "border-good/40 bg-good/5" : "border-line"}`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-blue shadow-sm">{grid ? <FileSpreadsheet size={20} /> : <Upload size={20} />}</span>
            <span className="min-w-0 text-sm">
              <span className="block truncate font-semibold">{grid ? fileName : "Excel (.xlsx) ya da CSV dosyası seç"}</span>
              <span className="text-ink/55">{grid ? `${rows.length} satır okundu · değiştirmek için tıkla` : "Satıcı panelinden indirdiğin sipariş raporu"}</span>
            </span>
            <input type="file" accept=".xlsx,.csv,.txt,.tsv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}
        </div>
      </div>

      {grid ? (
        <div className="card space-y-5 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label !mb-0">3. Sütunları eşle</p>
              <p className="text-sm text-ink/55">Tahmin ettiklerimizi kontrol et. Bu kanal için seçimlerin bir sonraki yüklemede hatırlanır.</p>
            </div>
            <label className="text-sm">
              Başlık satırı{" "}
              <select value={headerRow} onChange={(e) => setHeaderRow(Number(e.target.value))} className="ml-1 rounded-lg border border-line px-2 py-1">
                {grid.slice(0, 15).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {IMPORT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label" htmlFor={`m-${f.key}`}>{f.label}{f.required ? " *" : ""}</label>
                <select id={`m-${f.key}`} value={mapping[f.key] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))} className={`field ${f.required && !mapping[f.key] ? "!border-warn" : ""}`}>
                  <option value="">—</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={unitPrice} onChange={(e) => setUnitPrice(e.target.checked)} className="size-4 accent-blue" />
            Tutar sütunu birim fiyat; adetle çarp
          </label>

          <div>
            <p className="mb-2 text-sm font-semibold">Önizleme</p>
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper/60 text-left text-xs uppercase tracking-wide text-ink/45">
                    <th className="px-3 py-2">Sipariş</th><th className="px-3 py-2">Tarih</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2 text-right">Adet</th><th className="px-3 py-2 text-right">Tutar</th><th className="px-3 py-2 text-right">Komisyon</th><th className="px-3 py-2 text-right">Kargo</th><th className="px-3 py-2">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sample.map((r, i) => (
                    <tr key={i} className={r.skip ? "text-ink/35" : ""}>
                      <td className="px-3 py-2 font-mono text-xs">{r.order_no || "—"}</td>
                      <td className="px-3 py-2">{r.sold_on || "—"}</td>
                      <td className="max-w-40 truncate px-3 py-2">{r.sku || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.qty}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.gross.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.commission ? r.commission.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.shipping ? r.shipping.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "—"}</td>
                      <td className="px-3 py-2">{r.skip === "iptal" ? "İptal, alınmaz" : r.skip ? "Eksik bilgi" : r.type === "iade" ? "İade" : "Satış"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
            <button type="button" onClick={submit} disabled={!ready || pending} className="btn btn-primary">
              {pending ? `Yükleniyor ${progress}` : `${valid.length} satırı yükle`}
            </button>
            <p className="text-sm text-ink/55">
              {!channel ? "Önce pazaryerini seç." : missing.length ? `Eşlenmesi gereken: ${missing.map((m) => m.label).join(", ")}.` : `${rows.length - valid.length} satır atlanacak (iptal ya da eksik). Aynı siparişi tekrar yüklersen çift kayıt olmaz.`}
            </p>
          </div>
          {result ? <p role="status" className={`rounded-2xl px-4 py-3 text-sm ${result.ok ? "bg-good/10 text-good" : "bg-bad/10 text-bad"}`}>{result.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
