"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/money";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { useCart } from "./CartProvider";
import { FreeShippingBar, Totals } from "./CartSummary";

export function CartDrawer() {
  const { open, setOpen, quote, lines, setQty, remove, pending } = useCart();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;
  const empty = lines.length === 0;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Sepet">
      <button type="button" aria-label="Sepeti kapat" className="fs-backdrop absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div ref={panel} tabIndex={-1} className="fs-drawer absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-paper shadow-2xl outline-none">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p className="display text-2xl">Sepetin</p>
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full transition hover:bg-black/5" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center fs-enter">
            <div className="grid size-20 place-items-center rounded-full bg-ice">
              <ShoppingBag size={30} className="text-blue" />
            </div>
            <p className="mt-6 text-xl font-semibold">Sepetin şimdilik boş</p>
            <p className="mt-2 text-sm text-ink/60">Sana uygun FormStep&apos;i bulmak bir dakikanı alır.</p>
            <Link href="/#modeller" onClick={() => setOpen(false)} className="btn btn-primary mt-8">
              Modelleri keşfet
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {quote?.problems.map((p) => (
                <p key={p} className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
                  {p}
                </p>
              ))}
              {!quote && pending
                ? lines.map((l) => <div key={l.variantId} className="skeleton h-24" />)
                : quote?.lines.map((l) => (
                    <div key={l.variantId} className="fs-pop flex gap-4 rounded-2xl bg-white p-3">
                      <Link href={`/urun/${l.slug}`} onClick={() => setOpen(false)} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-ice">
                        <Image src={l.image} alt="" fill sizes="96px" className="object-contain p-1.5" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">FormStep {l.name}</p>
                            <p className="text-sm text-ink/55">Numara {l.sizeLabel}</p>
                          </div>
                          <button type="button" onClick={() => remove(l.variantId)} className="grid size-9 place-items-center rounded-full text-ink/40 transition hover:bg-bad/10 hover:text-bad" aria-label={`${l.name} ürününü sepetten çıkar`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <QtyStepper size="sm" value={l.qty} max={l.maxQty} onChange={(v) => setQty(l.variantId, v)} />
                          <p className="font-semibold tabular-nums">{formatPrice(l.lineKurus)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
            {quote ? (
              <div className={`space-y-4 border-t border-line bg-white px-6 py-5 transition-opacity ${pending ? "opacity-60" : ""}`}>
                <FreeShippingBar quote={quote} />
                <Totals quote={quote} />
                <Link href="/odeme" onClick={() => setOpen(false)} className="btn btn-primary btn-block" aria-disabled={!quote.canCheckout}>
                  Güvenli ödemeye geç
                </Link>
                <Link href="/sepet" onClick={() => setOpen(false)} className="block text-center text-sm text-ink/60 underline-offset-4 hover:underline">
                  Sepeti ve kupon kodunu düzenle
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
