"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lock, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { formatPrice } from "@/lib/money";
import { useCart } from "./CartProvider";
import { FreeShippingBar, Totals } from "./CartSummary";

export function CartPage() {
  const { quote, lines, ready, pending, setQty, remove, coupon, applyCoupon } = useCart();
  const [code, setCode] = useState(coupon);
  const empty = ready && lines.length === 0;

  return (
    <div className="min-h-screen bg-paper pb-24 pt-28">
      <div className="mx-auto max-w-6xl px-5">
        <h1 className="display text-5xl md:text-7xl">Sepetin</h1>

        {!ready ? (
          <div className="mt-10 grid gap-4 lg:grid-cols-12">
            <div className="skeleton h-40 lg:col-span-8" />
            <div className="skeleton h-72 lg:col-span-4" />
          </div>
        ) : empty ? (
          <div className="fs-enter mt-12 flex flex-col items-center rounded-[2rem] bg-white px-6 py-20 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-ice">
              <ShoppingBag size={30} className="text-blue" />
            </div>
            <p className="mt-6 text-2xl font-semibold">Sepetin şimdilik boş</p>
            <p className="mt-2 text-ink/60">Üç modelimize göz at; sana uygun olanı bulmak bir dakikanı alır.</p>
            <Link href="/#modeller" className="btn btn-primary mt-8">
              Modelleri keşfet <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              {quote?.problems.map((p) => (
                <p key={p} className="rounded-2xl bg-warn/10 px-5 py-4 text-sm text-warn">{p}</p>
              ))}
              {(quote?.lines ?? []).map((l) => (
                <div key={l.variantId} className="fs-pop flex gap-5 rounded-[1.75rem] bg-white p-4 sm:p-5">
                  <Link href={`/urun/${l.slug}`} className="relative size-28 shrink-0 overflow-hidden rounded-2xl bg-ice sm:size-32">
                    <Image src={l.image} alt="" fill sizes="128px" className="object-contain p-2" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/urun/${l.slug}`} className="text-lg font-semibold hover:text-blue">FormStep {l.name}</Link>
                        <p className="text-sm text-ink/55">Numara {l.sizeLabel} · {formatPrice(l.unitKurus)}</p>
                      </div>
                      <button type="button" onClick={() => remove(l.variantId)} className="grid size-10 place-items-center rounded-full text-ink/40 transition hover:bg-bad/10 hover:text-bad" aria-label="Sepetten çıkar">
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QtyStepper value={l.qty} max={l.maxQty} onChange={(v) => setQty(l.variantId, v)} size="sm" />
                      <p className="text-lg font-semibold tabular-nums">{formatPrice(l.lineKurus)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {!quote && pending ? lines.map((l) => <div key={l.variantId} className="skeleton h-40" />) : null}
            </div>

            <aside className={`space-y-5 rounded-[1.75rem] bg-white p-6 transition-opacity lg:sticky lg:top-24 lg:col-span-4 ${pending ? "opacity-70" : ""}`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyCoupon(code);
                }}
              >
                <label htmlFor="kupon" className="label flex items-center gap-1.5"><Tag size={14} /> Kupon kodu</label>
                <div className="flex gap-2">
                  <input id="kupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="field uppercase" placeholder="KOD" autoComplete="off" aria-invalid={Boolean(quote?.couponError)} />
                  <button type="submit" className="btn btn-dark shrink-0" disabled={!code.trim()}>Uygula</button>
                </div>
                {quote?.couponError ? <p className="field-error">{quote.couponError}</p> : null}
                {quote?.couponCode ? (
                  <p className="mt-2 flex items-center justify-between rounded-xl bg-good/10 px-3 py-2 text-sm text-good">
                    {quote.couponCode} uygulandı
                    <button type="button" onClick={() => { setCode(""); applyCoupon(""); }} aria-label="Kuponu kaldır"><X size={15} /></button>
                  </p>
                ) : null}
              </form>
              {quote ? (
                <>
                  <FreeShippingBar quote={quote} />
                  <Totals quote={quote} />
                  <Link href="/odeme" className="btn btn-primary btn-block" aria-disabled={!quote.canCheckout}>
                    <Lock size={16} /> Güvenli ödemeye geç
                  </Link>
                  {quote.shippingKurus === null ? <p className="text-center text-xs text-ink/50">Kargo ayarları tamamlandığında ödeme açılacak.</p> : null}
                </>
              ) : null}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
