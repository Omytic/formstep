import { adm } from "@/lib/admin-path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { saveOrderMeta, setOrderStatus } from "@/app/actions/admin";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ActionForm, F, T } from "@/components/admin/ActionForm";
import { getAdminOrder } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate, STATUS_LABEL, type OrderStatus } from "@/lib/orders";

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string; tone: string; restock?: boolean; confirm?: string }[]>> = {
  paid: [
    { to: "preparing", label: "Hazırlanıyor olarak işaretle", tone: "btn-dark" },
    { to: "shipped", label: "Kargoya verildi", tone: "btn-primary" },
    { to: "cancelled", label: "İptal et", tone: "btn-ghost text-bad", restock: true, confirm: "Sipariş iptal edilsin mi? Ödeme iadesini PayTR panelinden yapman gerekir." },
  ],
  preparing: [
    { to: "shipped", label: "Kargoya verildi", tone: "btn-primary" },
    { to: "cancelled", label: "İptal et", tone: "btn-ghost text-bad", restock: true, confirm: "Sipariş iptal edilsin mi? Ödeme iadesini PayTR panelinden yapman gerekir." },
  ],
  shipped: [
    { to: "delivered", label: "Teslim edildi", tone: "btn-dark" },
    { to: "refunded", label: "İade edildi", tone: "btn-ghost text-bad", restock: true, confirm: "İade olarak işaretlensin mi? Para iadesini PayTR panelinden yap." },
  ],
  delivered: [{ to: "refunded", label: "İade edildi", tone: "btn-ghost text-bad", restock: true, confirm: "İade olarak işaretlensin mi? Para iadesini PayTR panelinden yap." }],
  stock_issue: [
    { to: "preparing", label: "Stok sağlandı, hazırla", tone: "btn-dark" },
    { to: "refunded", label: "İade edildi", tone: "btn-ghost text-bad", confirm: "İade olarak işaretlensin mi? Para iadesini PayTR panelinden yap." },
  ],
  pending_payment: [{ to: "cancelled", label: "İptal et", tone: "btn-ghost text-bad", confirm: "Ödenmemiş sipariş iptal edilsin mi?" }],
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const data = await getAdminOrder(id);
  if (!data) notFound();
  const { order: o, callbacks, marketing } = data;
  const actions = NEXT[o.status] ?? [];

  return (
    <div className="fs-enter space-y-6">
      <Link href={adm("/siparisler")} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"><ArrowLeft size={15} /> Siparişler</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="display text-4xl">{o.number}</h1>
        <StatusBadge status={o.status} />
        <a href={`/siparis/${o.publicToken}`} target="_blank" className="ml-auto inline-flex items-center gap-1 text-sm text-blue hover:underline">Müşteri görünümü <ExternalLink size={13} /></a>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card p-6">
            <h2 className="font-semibold">Ürünler</h2>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-line">
                {o.items.map((i) => (
                  <tr key={i.sku}>
                    <td className="py-2.5">FormStep {i.productName} · {i.sizeLabel}<span className="block text-xs text-ink/45">{i.sku}</span></td>
                    <td className="py-2.5 text-center">× {i.qty}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatPrice(i.unitKurus * i.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink/55">Ara toplam</dt><dd>{formatPrice(o.subtotalKurus)}</dd></div>
              {o.discountKurus ? <div className="flex justify-between"><dt className="text-ink/55">İndirim ({o.couponCode})</dt><dd>−{formatPrice(o.discountKurus)}</dd></div> : null}
              <div className="flex justify-between"><dt className="text-ink/55">Kargo</dt><dd>{o.shippingKurus ? formatPrice(o.shippingKurus) : "Ücretsiz"}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Toplam</dt><dd>{formatPrice(o.totalKurus)}</dd></div>
            </dl>
          </div>

          {actions.length ? (
            <div className="card p-6">
              <h2 className="font-semibold">Durumu değiştir</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {actions.map((a) => (
                  <ActionForm key={a.to} action={setOrderStatus} submit={null} confirm={a.confirm}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="to" value={a.to} />
                    {a.restock ? <input type="hidden" name="restock" value="on" /> : null}
                    <button type="submit" className={`btn btn-sm ${a.tone}`}>{a.label}</button>
                  </ActionForm>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink/50">İptal ve iadelerde stok otomatik geri eklenir. Para iadesi PayTR mağaza panelinden yapılır.</p>
            </div>
          ) : null}

          <div className="card p-6">
            <h2 className="font-semibold">Kargo, fatura ve not</h2>
            <ActionForm action={saveOrderMeta} className="mt-4">
              <input type="hidden" name="id" value={o.id} />
              <div className="grid gap-4 sm:grid-cols-3">
                <F label="Kargo firması" name="carrier" defaultValue={o.trackingCarrier ?? ""} />
                <F label="Takip numarası" name="tracking" defaultValue={o.trackingNumber ?? ""} />
                <F label="Fatura no" name="invoice" defaultValue={o.invoiceNo ?? ""} />
              </div>
              <div className="mt-4"><T label="İç not (müşteri görmez)" name="note" rows={3} defaultValue={o.internalNote} /></div>
            </ActionForm>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold">Geçmiş</h2>
            <ol className="mt-4 space-y-3 border-l-2 border-line pl-5">
              {[...o.events].reverse().map((e, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white bg-blue" />
                  <p className="font-medium">{STATUS_LABEL[e.toStatus as OrderStatus] ?? e.toStatus}{e.note ? <span className="font-normal text-ink/60"> — {e.note}</span> : null}</p>
                  <p className="text-xs text-ink/45">{formatDate(e.at, true)} · {e.actor}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 text-sm leading-6">
            <h2 className="font-semibold">Müşteri</h2>
            <p className="mt-2">{o.fullName}<br /><a href={`mailto:${o.email}`} className="text-blue">{o.email}</a><br /><a href={`tel:${o.phone}`} className="text-blue">{o.phone}</a></p>
            <p className="mt-2 text-xs text-ink/50">{o.userId ? "Üye" : "Misafir"} · Pazarlama izni: {marketing ? "var" : "yok"}</p>
            <h2 className="mt-5 font-semibold">Teslimat</h2>
            <p className="mt-1 text-ink/70">{o.address.line}<br />{o.address.district} / {o.address.city} {o.address.postal_code}</p>
            <h2 className="mt-5 font-semibold">Fatura</h2>
            <p className="mt-1 text-ink/70">{o.billing.type === "corporate" ? <>{o.billing.company_name}<br />{o.billing.tax_office} · {o.billing.tax_number}</> : `Bireysel · ${o.fullName}`}</p>
          </div>
          <div className="card p-6 text-sm">
            <h2 className="font-semibold">PayTR bildirimleri</h2>
            <p className="mt-1 text-xs text-ink/45">merchant_oid: {o.merchantOid}</p>
            {callbacks.length ? (
              <ul className="mt-3 space-y-2">
                {callbacks.map((c, i) => (
                  <li key={i} className="rounded-xl bg-paper px-3 py-2">
                    <span className={c.hash_valid ? "text-good" : "text-bad"}>{c.status}</span> · {formatPrice(Number(c.total_amount))} · {c.outcome}
                    <span className="block text-xs text-ink/45">{formatDate(c.received_at, true)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-ink/50">Henüz bildirim gelmedi.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
