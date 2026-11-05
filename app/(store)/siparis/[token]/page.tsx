import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/account/OrderDetail";
import { OrderRefresher } from "@/components/account/OrderRefresher";
import { ClearCartOnSuccess } from "@/components/cart/ClearCartOnSuccess";
import { getOrderByToken } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Siparişin", robots: { index: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ r?: string }> }) {
  const [{ token }, { r }] = await Promise.all([params, searchParams]);
  const order = await getOrderByToken(token);
  if (!order) notFound();
  const waiting = order.status === "pending_payment";
  const failed = order.status === "payment_failed" || (r === "fail" && waiting);

  return (
    <div className="min-h-screen bg-paper pb-24 pt-28">
      {order.status === "paid" ? <ClearCartOnSuccess /> : null}
      {waiting && !failed ? <OrderRefresher /> : null}
      <div className="mx-auto max-w-3xl px-5">
        <div className="fs-enter text-center">
          {failed ? (
            <>
              <h1 className="display text-5xl md:text-6xl">Ödeme tamamlanmadı</h1>
              <p className="mx-auto mt-4 max-w-md text-ink/65">{order.failedReason || "Kartından tutar çekilmedi."} Sepetin duruyor; tekrar deneyebilirsin.</p>
              <Link href="/odeme" className="btn btn-primary mt-8">Tekrar dene</Link>
            </>
          ) : waiting ? (
            <>
              <span className="relative mx-auto block size-16">
                <span className="fs-pulse-ring absolute inset-0 rounded-full bg-blue/30" />
                <span className="absolute inset-3 animate-spin rounded-full border-4 border-blue/20 border-t-blue" />
              </span>
              <h1 className="display mt-8 text-5xl">Ödemen kontrol ediliyor</h1>
              <p className="mx-auto mt-4 max-w-md text-ink/65">Bankadan onay gelince bu sayfa kendiliğinden güncellenecek. Genellikle birkaç saniye sürer.</p>
            </>
          ) : (
            <>
              <svg viewBox="0 0 52 52" className="mx-auto size-20" aria-hidden>
                <circle cx="26" cy="26" r="25" fill="#2477EA" />
                <path d="M15 27l7 7 15-15" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="fs-check-draw" />
              </svg>
              <h1 className="display mt-8 text-5xl md:text-6xl">Teşekkürler, {order.fullName.split(" ")[0]}!</h1>
              <p className="mx-auto mt-4 max-w-md text-ink/65">Sipariş numaran <strong>{order.number}</strong>. Ayrıntıları {order.email} adresine gönderdik.</p>
            </>
          )}
        </div>
        <div className="mt-12">
          <OrderDetail order={order} />
        </div>
      </div>
    </div>
  );
}
