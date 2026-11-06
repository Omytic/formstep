import { requireAdmin } from "@/lib/auth";
import { getSales, getVariants, monthRange } from "@/lib/ops/data";
import { CHANNELS } from "@/lib/ops/meta";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const money = (k: number) => (k / 100).toFixed(2).replace(".", ",");

/** Ayın satışları; Excel'de Türkçe açılsın diye noktalı virgül ve UTF-8 BOM. */
export async function GET(req: Request) {
  await requireAdmin();
  const url = new URL(req.url);
  const ay = url.searchParams.get("ay") ?? "";
  if (!/^\d{4}-\d{2}$/.test(ay)) return new Response("ay gerekli", { status: 400 });
  const kanal = url.searchParams.get("kanal") ?? undefined;
  const [from, to] = monthRange(ay);
  const [sales, { byId }] = await Promise.all([getSales(from, to, kanal && kanal in CHANNELS ? kanal : undefined), getVariants()]);
  const head = ["Tarih", "Kanal", "Tür", "Sipariş no", "Model", "Numara", "Pazaryeri kodu", "Adet", "Tutar", "Komisyon", "Kargo", "Diğer", "Net"];
  const lines = sales.map((s) => {
    const v = s.variant_id ? byId.get(s.variant_id) : null;
    return [s.sold_on, CHANNELS[s.channel], s.type === "iade" ? "İade" : "Satış", s.order_no, v?.code ?? "", v?.size ?? "", s.external_sku, s.qty, money(s.gross_kurus), money(s.commission_kurus), money(s.shipping_kurus), money(s.other_fee_kurus), money(s.net_kurus)].map(cell).join(";");
  });
  return new Response("﻿" + [head.join(";"), ...lines].join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="formstep-satislar-${ay}.csv"` },
  });
}
