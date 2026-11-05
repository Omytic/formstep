import { after } from "next/server";
import { flushOutbox } from "@/lib/email";
import { supabaseConfigured } from "@/lib/env";
import { SALES_ENABLED } from "@/lib/features";
import { paytrCallbackToken, parseCallback, safeEqual } from "@/lib/paytr/hash";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export function GET() {
  return text("Method Not Allowed", 405);
}

/**
 * PayTR bildirim (callback) adresi: https://formstep.tr/api/paytr/notify
 * FormStep'in kendi PayTR mağaza panelinde tanımlanır. Oturum/CSRF yoktur;
 * güvenlik, imza doğrulamasıyla sağlanır. Sipariş yalnızca burada "ödendi" olur.
 */
export async function POST(req: Request) {
  if (!SALES_ENABLED) return text("Not Found", 404);
  const key = process.env.PAYTR_MERCHANT_KEY?.trim();
  const salt = process.env.PAYTR_MERCHANT_SALT?.trim();
  if (!key || !salt || !supabaseConfigured()) return text("ERROR", 500);

  const body = parseCallback(await req.formData());
  if (!body) return text("PAYTR notification failed: bad request", 400);

  const expected = paytrCallbackToken({
    merchantOid: body.merchant_oid,
    status: body.status,
    totalAmount: body.total_amount,
    merchantKey: key,
    merchantSalt: salt,
  });
  const valid = safeEqual(expected, body.hash);
  const db = supabaseAdmin();
  const log = (outcome: string) =>
    db.from("payment_callbacks").insert({
      merchant_oid: body.merchant_oid,
      status: body.status,
      total_amount: body.total_amount,
      hash_valid: valid,
      outcome,
      payload: { failed_reason_code: body.failed_reason_code ?? null, failed_reason_msg: body.failed_reason_msg ?? null, test_mode: body.test_mode ?? null },
    });

  if (!valid) {
    await log("bad_hash");
    return text("PAYTR notification failed: bad hash", 400);
  }

  const { data, error } =
    body.status === "success"
      ? await db.rpc("finalize_paid_order", { p_merchant_oid: body.merchant_oid, p_total_kurus: Number(body.total_amount) })
      : await db.rpc("mark_payment_failed", { p_merchant_oid: body.merchant_oid, p_reason: body.failed_reason_msg ?? "" });

  if (error) {
    // Geçici hata: OK dönmeyiz, PayTR bir dakika sonra yeniden dener.
    console.error("[paytr] notify", error.message);
    await log(`error:${error.message.slice(0, 80)}`);
    return text("ERROR", 500);
  }
  await log(String(data));
  if (data === "paid") after(() => flushOutbox().catch((e) => console.error("[email]", e)));
  return text("OK");
}
