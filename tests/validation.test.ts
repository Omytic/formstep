import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation/checkout";
import { legalDoc, sellerComplete } from "@/lib/legal";
import { safeInternalPath } from "@/lib/security/text";

const base = {
  email: " Ali@Ornek.com ",
  fullName: "Ali Veli",
  phone: "+90 (532) 111 22 33",
  city: "İstanbul",
  district: "Beyoğlu",
  line: "Kuloğlu Mah. Ağa Hamamı Sok. No: 1",
  billingType: "individual" as const,
  acceptTerms: true,
  cart: [{ variantId: "v1", qty: 1 }],
};

describe("ödeme formu", () => {
  it("e-postayı ve telefonu normalleştirir", () => {
    const r = checkoutSchema.parse(base);
    expect(r.email).toBe("ali@ornek.com");
    expect(r.phone).toBe("05321112233");
  });
  it("sözleşme onayı olmadan geçmez", () => {
    expect(checkoutSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
  });
  it("kurumsal faturada vergi numarası ister", () => {
    const r = checkoutSchema.safeParse({ ...base, billingType: "corporate", companyName: "OMY", taxOffice: "Beyoğlu", taxNumber: "12" });
    expect(r.success).toBe(false);
  });
  it("listede olmayan ili reddeder", () => {
    expect(checkoutSchema.safeParse({ ...base, city: "Atlantis" }).success).toBe(false);
  });
});

describe("yasal metinler", () => {
  const seller = { address: "", phone: "", email: "", taxOffice: "", taxNumber: "", mersis: "", etbis: "" };
  it("eksik satıcı bilgisini uydurmaz, açıkça işaretler", () => {
    const d = legalDoc("mesafeli-satis", seller, { feeKurus: null, freeThresholdKurus: null, carrier: "", leadTimeText: "" });
    const text = JSON.stringify(d);
    expect(text).toContain("yönetim panelinden girilecek");
    expect(text).not.toContain("Vergi dairesi");
    expect(text).not.toContain("MERSİS");
    expect(sellerComplete(seller)).toBe(false);
    expect(sellerComplete({ ...seller, address: "Ataköy", phone: "+90 553 588 69 36", email: "info@omytic.com" })).toBe(true);
  });
  it("bilinmeyen sayfa için null döner", () => {
    expect(legalDoc("yok", seller, { feeKurus: 0, freeThresholdKurus: null, carrier: "", leadTimeText: "" })).toBeNull();
  });
});

describe("güvenli yönlendirme", () => {
  it("dış adrese yönlendirmez", () => {
    expect(safeInternalPath("//evil.com")).toBe("/hesabim");
    expect(safeInternalPath("https://evil.com")).toBe("/hesabim");
    expect(safeInternalPath("/odeme")).toBe("/odeme");
  });
});
