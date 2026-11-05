import { describe, expect, it } from "vitest";
import { buildQuote, percentDiscount } from "@/lib/store/quote";
import { previewProducts } from "@/lib/store/preview";
import type { Product } from "@/lib/store/types";

const catalog: Product[] = previewProducts;
const m100 = catalog[0].variants[0]; // 200,00 TL
const m900last = catalog[2].variants[catalog[2].variants.length - 1]; // stok 3
const shipping = { feeKurus: 4990, freeThresholdKurus: 40000, carrier: "", leadTimeText: "" };

describe("sepet hesabı", () => {
  it("fiyatı tarayıcıdan değil katalogdan alır", () => {
    const q = buildQuote({ cart: [{ variantId: m100.id, qty: 2 }], catalog, shipping, coupon: null });
    expect(q.subtotalKurus).toBe(40000);
    expect(q.shippingKurus).toBe(0); // 400 TL ve üstü
    expect(q.totalKurus).toBe(40000);
  });

  it("ücretsiz kargo sınırının altında kargo ekler ve kalan tutarı söyler", () => {
    const q = buildQuote({ cart: [{ variantId: m100.id, qty: 1 }], catalog, shipping, coupon: null });
    expect(q.shippingKurus).toBe(4990);
    expect(q.freeShippingRemainingKurus).toBe(40000 - 20000);
    expect(q.totalKurus).toBe(20000 + 4990);
  });

  it("indirim sonrası tutar sınırın altına düşerse kargo geri gelir", () => {
    const q = buildQuote({ cart: [{ variantId: m100.id, qty: 2 }], catalog, shipping, coupon: { code: "x", result: { discountKurus: 5000 } } });
    expect(q.shippingKurus).toBe(4990);
    expect(q.totalKurus).toBe(40000 - 5000 + 4990);
  });

  it("stoktan fazlasını keser ve uyarır", () => {
    const q = buildQuote({ cart: [{ variantId: m900last.id, qty: 9 }], catalog, shipping, coupon: null });
    expect(q.lines[0].qty).toBe(3);
    expect(q.problems.length).toBe(1);
  });

  it("bilinmeyen ürünü sepetten çıkarır", () => {
    const q = buildQuote({ cart: [{ variantId: "uydurma", qty: 1 }], catalog, shipping, coupon: null });
    expect(q.lines).toHaveLength(0);
    expect(q.canCheckout).toBe(false);
  });

  it("kargo ayarlanmamışsa ödemeye izin vermez", () => {
    const q = buildQuote({ cart: [{ variantId: m100.id, qty: 1 }], catalog, shipping: { ...shipping, feeKurus: null }, coupon: null });
    expect(q.canCheckout).toBe(false);
  });

  it("indirim ara toplamı aşamaz ve hatalı kupon mesajı Türkçe döner", () => {
    const big = buildQuote({ cart: [{ variantId: m100.id, qty: 1 }], catalog, shipping, coupon: { code: "x", result: { discountKurus: 999999 } } });
    expect(big.discountKurus).toBe(20000);
    const bad = buildQuote({ cart: [{ variantId: m100.id, qty: 1 }], catalog, shipping, coupon: { code: "x", result: { error: "coupon_expired" } } });
    expect(bad.couponError).toBe("Bu kuponun süresi doldu.");
    expect(bad.discountKurus).toBe(0);
  });

  it("yüzde indirimi kuruşa yuvarlar (SQL ile aynı kural)", () => {
    expect(percentDiscount(39990, 10)).toBe(3999);
    expect(percentDiscount(33335, 15)).toBe(5000);
  });
});
