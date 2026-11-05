"use server";

import { z } from "zod";
import { isPreview, supabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCatalog, getSettings } from "@/lib/store/catalog";
import { previewCoupons } from "@/lib/store/preview";
import { buildQuote, percentDiscount, type CouponResult } from "@/lib/store/quote";
import type { Quote } from "@/lib/store/types";

const cartSchema = z
  .array(z.object({ variantId: z.string().min(1).max(80), qty: z.number().int().min(1).max(99) }))
  .max(10);

export async function lookupCoupon(code: string, subtotal: number, email: string | null): Promise<CouponResult> {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(clean)) return { error: "coupon_invalid" };
  if (isPreview()) {
    const c = previewCoupons[clean];
    if (!c) return { error: "coupon_invalid" };
    if (subtotal < c.min) return { error: "coupon_minimum" };
    return { discountKurus: c.kind === "percent" ? percentDiscount(subtotal, c.value) : Math.min(c.value, subtotal) };
  }
  if (!supabaseConfigured()) return { error: "coupon_invalid" };
  const { data, error } = await supabaseAdmin().rpc("coupon_discount", {
    p_code: clean,
    p_email: email,
    p_subtotal: subtotal,
  });
  if (error) {
    const known = error.message.match(/coupon_[a-z_]+/)?.[0];
    return { error: known ?? "coupon_invalid" };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { discountKurus: Number(row?.discount ?? 0) };
}

export async function quoteCart(rawCart: unknown, couponCode?: string | null, email?: string | null): Promise<Quote> {
  const parsed = cartSchema.safeParse(rawCart);
  const cart = parsed.success ? parsed.data : [];
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const first = buildQuote({ cart, catalog, shipping: settings.shipping, coupon: null });
  if (!couponCode || !couponCode.trim() || first.lines.length === 0) return first;
  const result = await lookupCoupon(couponCode, first.subtotalKurus, email ?? null);
  return buildQuote({ cart, catalog, shipping: settings.shipping, coupon: { code: couponCode.trim(), result } });
}
