import { requireAdmin } from "@/lib/auth";
import { getCategories, getCounterparties, getEntries, monthRange } from "@/lib/ops/data";
import { LEDGER_KINDS, PAY_METHODS } from "@/lib/ops/meta";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  await requireAdmin();
  const ay = new URL(req.url).searchParams.get("ay") ?? "";
  if (!/^\d{4}-\d{2}$/.test(ay)) return new Response("ay gerekli", { status: 400 });
  const [from, to] = monthRange(ay);
  const [entries, cats, cps] = await Promise.all([getEntries(from, to), getCategories(), getCounterparties()]);
  const cat = new Map(cats.map((c) => [c.id, c.name]));
  const cp = new Map(cps.map((c) => [c.id, c.name]));
  const head = ["Tarih", "Tür", "Kategori", "Kişi / firma", "Açıklama", "Tutar", "Durum", "Vade", "Ödeme şekli"];
  const lines = entries.map((e) =>
    [e.occurred_on, LEDGER_KINDS[e.kind].label, cat.get(e.category_id ?? "") ?? "", cp.get(e.counterparty_id ?? "") ?? "", e.description, ((LEDGER_KINDS[e.kind].sign * e.amount_kurus) / 100).toFixed(2).replace(".", ","), e.status === "odendi" ? "Ödendi" : "Bekliyor", e.due_on ?? "", PAY_METHODS[e.method as keyof typeof PAY_METHODS] ?? e.method]
      .map(cell)
      .join(";"),
  );
  return new Response("﻿" + [head.join(";"), ...lines].join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="formstep-aldi-verdi-${ay}.csv"` },
  });
}
