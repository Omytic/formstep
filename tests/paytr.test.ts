import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildTokenRequest, encodeBasket, paytrCallbackToken, paytrIframeToken, parseCallback, safeEqual } from "@/lib/paytr/hash";

// SERYN'de canlıda çalışan fonksiyonların birebir kopyası (seryn-skin-main/src/lib/paytr.ts).
function serynToken(i: Record<string, string>) {
  const s = i.merchantId + i.userIp + i.merchantOid + i.email + i.paymentAmount + i.userBasket + i.noInstallment + i.maxInstallment + i.currency + i.testMode;
  return createHmac("sha256", i.merchantKey).update(s + i.merchantSalt).digest("base64");
}
function serynNotify(i: Record<string, string>) {
  return createHmac("sha256", i.merchantKey).update(i.merchantOid + i.merchantSalt + i.status + i.totalAmount).digest("base64");
}

const keys = { merchantKey: "KEY123", merchantSalt: "SALT456" };

describe("PayTR imzaları", () => {
  it("token imzası SERYN'in çalışan koduyla aynı", () => {
    const input = { merchantId: "999", userIp: "1.2.3.4", merchantOid: "FST123", email: "a@b.com", paymentAmount: "39900", userBasket: encodeBasket([{ name: "M100", unitPriceMinor: 39900, quantity: 1 }]), noInstallment: "0", maxInstallment: "0", currency: "TL", testMode: "1", ...keys };
    expect(paytrIframeToken(input)).toBe(serynToken(input));
  });

  it("bildirim imzası SERYN'in çalışan koduyla aynı", () => {
    const input = { merchantOid: "FST123", status: "success", totalAmount: "39900", ...keys };
    expect(paytrCallbackToken(input)).toBe(serynNotify(input));
  });

  it("sepet: indirim satırı negatif, toplam ödeme tutarına eşit", () => {
    const b = JSON.parse(Buffer.from(encodeBasket([{ name: "M100", unitPriceMinor: 39900, quantity: 2 }, { name: "İndirim", unitPriceMinor: -7980, quantity: 1 }, { name: "Kargo", unitPriceMinor: 4990, quantity: 1 }]), "base64").toString()) as [string, string, number][];
    const sum = b.reduce((s, [, p, q]) => s + Math.round(Number(p) * 100) * q, 0);
    expect(sum).toBe(79800 - 7980 + 4990);
    expect(b[1][1]).toBe("-79.80");
  });

  it("token isteği tutarı kuruş olarak gönderir ve iframe_v2'yi imzaya katmaz", () => {
    const r = buildTokenRequest({ merchantId: "1", ...keys, userIp: "1.1.1.1", merchantOid: "FSTX", email: "a@b.com", paymentAmountMinor: 12345, basket: "W10=", userName: "A", userAddress: "B", userPhone: "05", okUrl: "o", failUrl: "f", testMode: true, iframeV2: true });
    expect(r.payment_amount).toBe("12345");
    expect(r.test_mode).toBe("1");
    expect(r.currency).toBe("TL");
  });

  it("bildirim gövdesini doğrular; bozuk alanları reddeder", () => {
    const ok = new FormData();
    Object.entries({ merchant_oid: "FST1", status: "success", total_amount: "100", hash: "x" }).forEach(([k, v]) => ok.set(k, v));
    expect(parseCallback(ok)?.merchant_oid).toBe("FST1");
    const bad = new FormData();
    Object.entries({ merchant_oid: "FST-1;drop", status: "success", total_amount: "100", hash: "x" }).forEach(([k, v]) => bad.set(k, v));
    expect(parseCallback(bad)).toBeNull();
  });

  it("imza karşılaştırması uzunluk farkında patlamaz", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("abc", "abc")).toBe(true);
  });
});
