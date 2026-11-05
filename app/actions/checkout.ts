"use server";

import { headers } from "next/headers";
import { getUser } from "@/lib/auth";
import { isPreview, paytrConfigured, paytrTestMode, siteUrl, supabaseConfigured } from "@/lib/env";
import { LEGAL_VERSION, legalDoc, sellerComplete, type OrderContext } from "@/lib/legal";
import { encodeBasket, merchantOid } from "@/lib/paytr/hash";
import { requestIframeToken } from "@/lib/paytr/client";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/store/catalog";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { quoteCart } from "./cart";

export type CheckoutResult =
  | { ok: true; mode: "paytr"; iframeToken: string; orderToken: string }
  | { ok: true; mode: "preview"; totalKurus: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const DB_ERRORS: Record<string, string> = {
  out_of_stock: "Sepetindeki bir ürünün stoğu az önce tükendi. Sepetini kontrol et.",
  variant_unavailable: "Sepetindeki bir ürün artık satışta değil.",
  shipping_not_configured: "Kargo ayarları henüz tamamlanmadı; ödeme şu an alınamıyor.",
  cart_empty: "Sepetin boş.",
};

async function paymentsOpen(): Promise<boolean> {
  if (!supabaseConfigured() || !paytrConfigured()) return false;
  if (paytrTestMode()) return true;
  const [{ data }, settings] = await Promise.all([
    supabaseAdmin().from("store_settings").select("value").eq("key", "private.launch").maybeSingle(),
    getSettings(),
  ]);
  const launch = (data?.value ?? {}) as Record<string, boolean>;
  return Boolean(launch.paytr_approved && launch.legal_reviewed && sellerComplete(settings.seller));
}

export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Lütfen işaretli alanları kontrol et.", fieldErrors };
  }
  const d = parsed.data;

  const h = await headers();
  const ip = clientIp(h.get("x-forwarded-for") ?? h.get("x-real-ip"));
  if (!rateLimit({ key: `checkout:${ip}`, limit: 8, windowMs: 10 * 60_000 }).ok) {
    return { ok: false, message: "Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene." };
  }

  const quote = await quoteCart(d.cart, d.coupon || null, d.email);
  if (!quote.canCheckout || quote.problems.length) {
    return { ok: false, message: quote.problems[0] ?? "Sepetin güncellendi; lütfen kontrol et." };
  }
  if (d.coupon && quote.couponError) return { ok: false, message: quote.couponError, fieldErrors: { coupon: quote.couponError } };

  if (isPreview()) return { ok: true, mode: "preview", totalKurus: quote.totalKurus };
  if (!(await paymentsOpen())) {
    return { ok: false, message: "Online ödeme çok yakında açılıyor. Şimdilik FormStep'i pazaryeri mağazalarımızdan alabilirsin." };
  }

  const user = await getUser();
  const oid = `FST${merchantOid().slice(2)}`.slice(0, 26);
  const billing =
    d.billingType === "corporate"
      ? { type: "corporate", company_name: d.companyName, tax_office: d.taxOffice, tax_number: d.taxNumber }
      : { type: "individual", full_name: d.fullName };
  const acceptedAt = new Date().toISOString();

  const db = supabaseAdmin();
  const { data, error } = await db.rpc("create_pending_order", {
    p_items: quote.lines.map((l) => ({ variant_id: l.variantId, qty: l.qty })),
    p_coupon: quote.couponCode,
    p_contact: { email: d.email, phone: d.phone, full_name: d.fullName },
    p_shipping_address: { city: d.city, district: d.district, line: d.line, postal_code: d.postalCode },
    p_billing: billing,
    p_legal: { version: LEGAL_VERSION, accepted_at: acceptedAt, ip },
    p_marketing: d.marketing,
    p_user_id: user?.id ?? null,
    p_merchant_oid: oid,
    p_client_ip: ip,
  });
  if (error) {
    const code = error.message.match(/[a-z_]+$/)?.[0] ?? "";
    console.error("[checkout] create_pending_order", error.message);
    return { ok: false, message: DB_ERRORS[code] ?? (code.startsWith("coupon_") ? "Kupon artık geçerli değil." : "Sipariş oluşturulamadı. Lütfen tekrar dene.") };
  }
  const order = (Array.isArray(data) ? data[0] : data) as { order_id: string; public_token: string; total: number; number: string };

  // Sözleşmelerin bu siparişe ait, değişmez kopyası.
  const settings = await getSettings();
  const ctx: OrderContext = {
    number: order.number,
    date: new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date()),
    buyerName: d.fullName,
    buyerEmail: d.email,
    buyerPhone: d.phone,
    address: `${d.line}, ${d.district} / ${d.city}`,
    lines: quote.lines.map((l) => ({ name: `FormStep ${l.name}`, size: l.sizeLabel, qty: l.qty, unitKurus: l.unitKurus })),
    subtotalKurus: quote.subtotalKurus,
    discountKurus: quote.discountKurus,
    shippingKurus: quote.shippingKurus ?? 0,
    totalKurus: order.total,
  };
  await db
    .from("orders")
    .update({
      legal_snapshot: {
        version: LEGAL_VERSION,
        accepted_at: acceptedAt,
        ip,
        pre_information: legalDoc("on-bilgilendirme", settings.seller, settings.shipping, ctx, settings.marketplaces),
        distance_sales: legalDoc("mesafeli-satis", settings.seller, settings.shipping, ctx, settings.marketplaces),
      },
    })
    .eq("id", order.order_id);

  // PayTR sepeti (SERYN'deki çalışan yapı): ürünler + "İndirim" + "Kargo" satırları, toplam = ödeme tutarı.
  const basket = encodeBasket([
    ...quote.lines.map((l) => ({ name: `FormStep ${l.name} ${l.sizeLabel}`, unitPriceMinor: l.unitKurus, quantity: l.qty })),
    ...(quote.discountKurus ? [{ name: "İndirim", unitPriceMinor: -quote.discountKurus, quantity: 1 }] : []),
    ...(quote.shippingKurus ? [{ name: "Kargo", unitPriceMinor: quote.shippingKurus, quantity: 1 }] : []),
  ]);
  const base = siteUrl();
  const token = await requestIframeToken({
    userIp: ip,
    merchantOid: oid,
    email: d.email,
    amountKurus: order.total,
    basket,
    userName: d.fullName,
    userAddress: ctx.address,
    userPhone: d.phone,
    okUrl: `${base}/siparis/${order.public_token}?r=ok`,
    failUrl: `${base}/siparis/${order.public_token}?r=fail`,
  });
  if (!token.ok) {
    console.error("[checkout] paytr token", token.reason);
    return { ok: false, message: "Ödeme sayfası açılamadı. Lütfen birazdan tekrar dene." };
  }
  return { ok: true, mode: "paytr", iframeToken: token.token, orderToken: order.public_token };
}
