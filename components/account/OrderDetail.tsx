import Link from "next/link";
import { Check, Package, PackageCheck, Truck, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { formatDate, PROGRESS, type Order } from "@/lib/orders";
import { StatusBadge } from "./StatusBadge";

const STEPS = [
  { status: "paid", label: "Ödendi", icon: Wallet },
  { status: "preparing", label: "Hazırlanıyor", icon: Package },
  { status: "shipped", label: "Kargoda", icon: Truck },
  { status: "delivered", label: "Teslim edildi", icon: PackageCheck },
] as const;

export function OrderDetail({ order }: { order: Order }) {
  const idx = PROGRESS.indexOf(order.status);
  const showProgress = idx >= 0;

  return (
    <div className="space-y-5">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink/55">Sipariş {order.number}</p>
            <p className="text-lg font-semibold">{formatDate(order.createdAt, true)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {showProgress ? (
          <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Sipariş durumu">
            {STEPS.map((s, i) => {
              const done = i <= idx;
              const Icon = done && i < idx ? Check : s.icon;
              return (
                <li key={s.status} className="relative flex flex-col items-center text-center">
                  {i > 0 ? (
                    <span className="absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 bg-line">
                      <span className="block h-full origin-left bg-blue transition-transform duration-1000" style={{ transform: `scaleX(${done ? 1 : 0})` }} />
                    </span>
                  ) : null}
                  <span className={`relative grid size-10 place-items-center rounded-full transition-colors duration-500 ${done ? "bg-blue text-white" : "bg-ice text-ink/40"}`}>
                    {i === idx ? <span className="fs-pulse-ring absolute inset-0 rounded-full bg-blue/40" /> : null}
                    <Icon size={17} className="relative" />
                  </span>
                  <span className={`mt-2 text-xs font-medium sm:text-sm ${done ? "" : "text-ink/45"}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        ) : null}

        {order.trackingNumber ? (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ice p-4">
            <p className="text-sm">
              <span className="text-ink/60">{order.trackingCarrier || "Kargo"} takip no:</span> <strong className="tabular-nums">{order.trackingNumber}</strong>
            </p>
          </div>
        ) : null}
      </div>

      <div className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Ürünler</h2>
        <ul className="mt-4 divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.sku} className="flex justify-between gap-4 py-3">
              <span>
                FormStep {i.productName} <span className="text-ink/55">· {i.sizeLabel} × {i.qty}</span>
              </span>
              <span className="tabular-nums">{formatPrice(i.unitKurus * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink/60">Ara toplam</dt><dd>{formatPrice(order.subtotalKurus)}</dd></div>
          {order.discountKurus ? <div className="flex justify-between text-good"><dt>İndirim {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{formatPrice(order.discountKurus)}</dd></div> : null}
          <div className="flex justify-between"><dt className="text-ink/60">Kargo</dt><dd>{order.shippingKurus ? formatPrice(order.shippingKurus) : "Ücretsiz"}</dd></div>
          <div className="flex justify-between pt-2 text-base font-semibold"><dt>Toplam</dt><dd>{formatPrice(order.totalKurus)}</dd></div>
        </dl>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Teslimat</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            {order.fullName}
            <br />
            {order.address.line}
            <br />
            {order.address.district} / {order.address.city}
            <br />
            {order.phone}
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Fatura</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            {order.billing.type === "corporate" ? (
              <>
                {order.billing.company_name}
                <br />
                {order.billing.tax_office} · {order.billing.tax_number}
              </>
            ) : (
              <>Bireysel · {order.fullName}</>
            )}
            {order.invoiceNo ? (
              <>
                <br />
                Fatura no: {order.invoiceNo}
              </>
            ) : null}
          </p>
        </div>
      </div>
      <p className="text-center text-sm text-ink/55">
        Bir sorun mu var? <Link href="/bilgilendirme/iletisim" className="text-blue hover:underline">Bize ulaş</Link> · <Link href="/bilgilendirme/iade-ve-cayma" className="text-blue hover:underline">İade ve cayma</Link>
      </p>
    </div>
  );
}
