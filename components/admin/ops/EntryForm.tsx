"use client";

import { useState } from "react";
import { saveEntry } from "@/app/actions/ops";
import { ActionForm, F } from "@/components/admin/ActionForm";
import type { Category, Counterparty } from "@/lib/ops/data";
import { LEDGER_KINDS, PAY_METHODS, type LedgerKind } from "@/lib/ops/meta";

/** Gelir / gider / ortak hareketi formu: türe göre ilgili alanları gösterir. */
export function EntryForm({ categories, counterparties, today }: { categories: Category[]; counterparties: Counterparty[]; today: string }) {
  const [kind, setKind] = useState<LedgerKind>("gider");
  const [status, setStatus] = useState("odendi");
  const partner = kind === "ortak_giris" || kind === "ortak_cikis";
  const cats = categories.filter((c) => c.active && c.kind === kind);
  const people = counterparties.filter((c) => c.active && (partner ? c.kind === "ortak" : c.kind !== "ortak"));
  return (
    <ActionForm action={saveEntry} submit="Kaydet" resetOnSuccess>
      <div className="mb-5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kayıt türü">
        {(Object.keys(LEDGER_KINDS) as LedgerKind[]).map((k) => (
          <label key={k} className={`chip cursor-pointer border px-4 py-2 text-sm transition ${kind === k ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/65 hover:border-ink/30"}`}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
            {LEDGER_KINDS[k].label}
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <F label="Tutar (TL)" name="amount" inputMode="decimal" placeholder="0,00" required />
        <F label="Tarih" name="occurred_on" type="date" defaultValue={today} required />
        {!partner ? (
          <div>
            <label htmlFor="f-category" className="label">Kategori</label>
            <select id="f-category" name="category_id" className="field" key={kind}>
              <option value="">Seç</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor="f-cp" className="label">{partner ? "Ortak" : kind === "gelir" ? "Kimden" : "Kime"}</label>
          <select id="f-cp" name="counterparty_id" className="field" required={partner} key={`cp-${partner}`}>
            <option value="">{partner ? "Seç" : "—"}</option>
            {people.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f-method" className="label">Ödeme şekli</label>
          <select id="f-method" name="method" className="field" defaultValue="banka">
            {Object.entries(PAY_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {!partner ? (
          <div>
            <label htmlFor="f-status" className="label">Durum</label>
            <select id="f-status" name="status" className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="odendi">{kind === "gelir" ? "Tahsil edildi" : "Ödendi"}</option>
              <option value="bekliyor">{kind === "gelir" ? "Tahsil edilecek" : "Ödenecek (vadeli)"}</option>
            </select>
          </div>
        ) : null}
        {!partner && status === "bekliyor" ? <F label="Vade tarihi" name="due_on" type="date" /> : null}
        <div className="sm:col-span-2"><F label="Açıklama" name="description" placeholder="Ör. 1.200 adet tabanlık, fatura no 2026-118" /></div>
        <div className="sm:col-span-2">
          <label htmlFor="f-file" className="label">Fatura / dekont</label>
          <input id="f-file" name="file" type="file" accept="application/pdf,image/*" className="field file:mr-3 file:rounded-full file:border-0 file:bg-paper file:px-3 file:py-1 file:text-sm" />
          <p className="mt-1 text-xs text-ink/50">PDF ya da fotoğraf, en fazla 3,5 MB. Yalnızca ekip görebilir.</p>
        </div>
      </div>
    </ActionForm>
  );
}
