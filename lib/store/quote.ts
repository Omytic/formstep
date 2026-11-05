import type { CartLine, Product, Quote, QuoteLine, Shipping } from "./types";

export type CouponResult = { discountKurus: number } | { error: string };

export const COUPON_ERRORS: Record<string, string> = {
  coupon_invalid: "Bu kupon kodu geçerli değil.",
  coupon_not_started: "Bu kupon henüz başlamadı.",
  coupon_expired: "Bu kuponun süresi doldu.",
  coupon_used_up: "Bu kuponun kullanım hakkı doldu.",
  coupon_minimum: "Sepet tutarı bu kupon için yeterli değil.",
  coupon_email_limit: "Bu kuponu bu e-posta adresiyle daha önce kullandın.",
};

export const MAX_QTY = 10;

/**
 * Sepeti güncel katalogla fiyatlar. Veritabanındaki create_pending_order
 * fonksiyonu aynı kuralları uygular; ödeme anında tutar yeniden hesaplanır.
 */
export function buildQuote(input: {
  cart: CartLine[];
  catalog: Product[];
  shipping: Shipping;
  coupon: { code: string; result: CouponResult } | null;
}): Quote {
  const problems: string[] = [];
  const lines: QuoteLine[] = [];
  const seen = new Set<string>();

  for (const item of input.cart.slice(0, 10)) {
    if (seen.has(item.variantId)) continue;
    seen.add(item.variantId);
    const product = input.catalog.find((p) => p.variants.some((v) => v.id === item.variantId));
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant || !variant.active || product.status !== "published") {
      problems.push("Sepetindeki bir ürün artık satışta değil; çıkarıldı.");
      continue;
    }
    if (variant.stock <= 0) {
      problems.push(`${product.name} (${variant.sizeLabel}) tükendi; sepetten çıkarıldı.`);
      continue;
    }
    const maxQty = Math.min(MAX_QTY, variant.stock);
    let qty = Math.max(1, Math.floor(item.qty) || 1);
    if (qty > maxQty) {
      problems.push(`${product.name} (${variant.sizeLabel}) için en fazla ${maxQty} adet alabilirsin.`);
      qty = maxQty;
    }
    lines.push({
      variantId: variant.id,
      slug: product.slug,
      code: product.code,
      name: product.name,
      sizeLabel: variant.sizeLabel,
      sku: variant.sku,
      image: product.images[0]?.src ?? "",
      unitKurus: variant.priceKurus,
      qty,
      lineKurus: variant.priceKurus * qty,
      maxQty,
    });
  }

  const subtotalKurus = lines.reduce((s, l) => s + l.lineKurus, 0);
  let discountKurus = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;
  if (input.coupon && lines.length) {
    if ("error" in input.coupon.result) {
      couponError = COUPON_ERRORS[input.coupon.result.error] ?? "Kupon uygulanamadı.";
    } else {
      discountKurus = Math.min(input.coupon.result.discountKurus, subtotalKurus);
      couponCode = input.coupon.code.toUpperCase();
    }
  }

  const { feeKurus, freeThresholdKurus } = input.shipping;
  const afterDiscount = subtotalKurus - discountKurus;
  let shippingKurus: number | null = null;
  let freeShippingRemainingKurus: number | null = null;
  if (feeKurus !== null) {
    const free = freeThresholdKurus !== null && afterDiscount >= freeThresholdKurus;
    shippingKurus = lines.length === 0 ? 0 : free ? 0 : feeKurus;
    if (freeThresholdKurus !== null && !free) freeShippingRemainingKurus = freeThresholdKurus - afterDiscount;
  }

  return {
    lines,
    problems,
    subtotalKurus,
    discountKurus,
    couponCode,
    couponError,
    shippingKurus,
    freeShippingRemainingKurus,
    totalKurus: afterDiscount + (shippingKurus ?? 0),
    canCheckout: lines.length > 0 && shippingKurus !== null,
  };
}

export function percentDiscount(subtotal: number, percent: number): number {
  return Math.min(subtotal, Math.floor((subtotal * percent + 50) / 100));
}
