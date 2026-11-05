import { getAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/admin";
import { STATUS_LABEL } from "@/lib/orders";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // CSV formül enjeksiyonuna karşı
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Yetkisiz", { status: 403 });
  const url = new URL(req.url);
  const rows: string[] = [["Sipariş", "Tarih", "Durum", "Ad soyad", "E-posta", "Telefon", "İl", "İlçe", "Adres", "Ürünler", "Ara toplam", "İndirim", "Kargo", "Toplam", "Kupon", "Kargo firması", "Takip no", "Fatura no"].map(cell).join(";")];
  for (let page = 1; page <= 40; page++) {
    const { orders, total } = await listOrders({ status: url.searchParams.get("durum") ?? "hepsi", q: url.searchParams.get("q") ?? undefined, page });
    for (const o of orders) {
      rows.push(
        [o.number, o.createdAt, STATUS_LABEL[o.status], o.fullName, o.email, o.phone, o.address.city, o.address.district, o.address.line, o.items.map((i) => `${i.productCode} ${i.sizeLabel} x${i.qty}`).join(" | "), o.subtotalKurus / 100, o.discountKurus / 100, o.shippingKurus / 100, o.totalKurus / 100, o.couponCode, o.trackingCarrier, o.trackingNumber, o.invoiceNo]
          .map(cell)
          .join(";"),
      );
    }
    if (page * 25 >= total) break;
  }
  return new Response("﻿" + rows.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="formstep-siparisler-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
