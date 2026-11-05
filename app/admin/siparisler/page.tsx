import { adm } from "@/lib/admin-path";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { StatusBadge } from "@/components/account/StatusBadge";
import { listOrders } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/orders";

const TABS = [
  { v: "acik", label: "Kargolanacak" },
  { v: "hepsi", label: "Tümü" },
  { v: "shipped", label: "Kargoda" },
  { v: "delivered", label: "Teslim" },
  { v: "pending_payment", label: "Ödeme bekleyen" },
  { v: "payment_failed", label: "Başarısız" },
  { v: "refunded", label: "İade" },
  { v: "cancelled", label: "İptal" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ durum?: string; q?: string; s?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.durum ?? "acik";
  const page = Number(sp.s) || 1;
  const { orders, total } = await listOrders({ status, q: sp.q, page });
  const qs = (o: Record<string, string | number | undefined>) => "?" + new URLSearchParams(Object.entries({ durum: status, q: sp.q, ...o }).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();

  return (
    <div className="fs-enter space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-4xl">Siparişler</h1>
        <a href={adm(`/siparisler/csv${qs({})}`)} className="btn btn-ghost btn-sm"><Download size={15} /> CSV indir</a>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link key={t.v} href={qs({ durum: t.v, s: undefined })} className={`chip min-h-9 px-4 ${status === t.v ? "bg-ink text-white" : "bg-white text-ink/70 hover:text-ink"}`}>{t.label}</Link>
        ))}
        <form className="relative ml-auto w-full sm:w-72">
          <input type="hidden" name="durum" value={status} />
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
          <input name="q" defaultValue={sp.q} placeholder="No, ad, e-posta, telefon" className="field min-h-11 pl-11 text-sm" />
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-ink/50">
            <tr>
              <th className="px-5 py-3 font-medium">Sipariş</th>
              <th className="px-5 py-3 font-medium">Müşteri</th>
              <th className="px-5 py-3 font-medium">Ürünler</th>
              <th className="px-5 py-3 font-medium">Tutar</th>
              <th className="px-5 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-paper">
                <td className="px-5 py-3">
                  <Link href={adm(`/siparisler/${o.id}`)} className="font-semibold text-blue hover:underline">{o.number}</Link>
                  <p className="text-xs text-ink/45">{formatDate(o.createdAt, true)}</p>
                </td>
                <td className="px-5 py-3">{o.fullName}<p className="text-xs text-ink/45">{o.address.city}</p></td>
                <td className="px-5 py-3 text-ink/70">{o.items.map((i) => `${i.productCode} ${i.sizeLabel} ×${i.qty}`).join(", ")}</td>
                <td className="px-5 py-3 tabular-nums">{formatPrice(o.totalKurus)}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length ? <p className="px-5 py-10 text-center text-sm text-ink/50">Bu filtrede sipariş yok.</p> : null}
      </div>
      {total > 25 ? (
        <div className="flex justify-center gap-2">
          {page > 1 ? <Link href={qs({ s: page - 1 })} className="btn btn-ghost btn-sm">Önceki</Link> : null}
          <span className="self-center text-sm text-ink/50">{page} / {Math.ceil(total / 25)}</span>
          {page * 25 < total ? <Link href={qs({ s: page + 1 })} className="btn btn-ghost btn-sm">Sonraki</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
