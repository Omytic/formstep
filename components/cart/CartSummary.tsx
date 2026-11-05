"use client";

import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/money";
import type { Quote } from "@/lib/store/types";

export function FreeShippingBar({ quote }: { quote: Quote }) {
  if (quote.shippingKurus === null) return null;
  const remaining = quote.freeShippingRemainingKurus;
  const threshold = remaining !== null ? quote.subtotalKurus - quote.discountKurus + remaining : null;
  const pct = threshold ? Math.min(100, Math.round(((threshold - (remaining ?? 0)) / threshold) * 100)) : 100;
  if (remaining === null && quote.shippingKurus > 0) return null;
  return (
    <div className="rounded-2xl bg-ice/70 p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Truck size={16} className="text-blue" />
        {remaining === null || remaining <= 0 ? (
          <>Kargon bizden!</>
        ) : (
          <>
            Ücretsiz kargo için <strong>{formatPrice(remaining)}</strong> kaldı.
          </>
        )}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-blue transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Totals({ quote, dark = false }: { quote: Quote; dark?: boolean }) {
  const muted = dark ? "text-mist" : "text-ink/60";
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between">
        <dt className={muted}>Ara toplam</dt>
        <dd className="tabular-nums">{formatPrice(quote.subtotalKurus)}</dd>
      </div>
      {quote.discountKurus > 0 ? (
        <div className="flex justify-between text-good">
          <dt>İndirim {quote.couponCode ? `(${quote.couponCode})` : ""}</dt>
          <dd className="tabular-nums">−{formatPrice(quote.discountKurus)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between">
        <dt className={muted}>Kargo</dt>
        <dd className="tabular-nums">{quote.shippingKurus === null ? "Hesaplanamadı" : quote.shippingKurus === 0 ? "Ücretsiz" : formatPrice(quote.shippingKurus)}</dd>
      </div>
      <div className={`flex items-baseline justify-between border-t pt-3 ${dark ? "border-white/10" : "border-line"}`}>
        <dt className="font-semibold">Toplam</dt>
        <dd className="display text-2xl tabular-nums">{formatPrice(quote.totalKurus)}</dd>
      </div>
      <p className={`text-xs ${muted}`}>Fiyatlara KDV dahildir.</p>
    </dl>
  );
}
