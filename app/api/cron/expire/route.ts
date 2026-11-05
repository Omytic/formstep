import { flushOutbox } from "@/lib/email";
import { supabaseConfigured } from "@/lib/env";
import { safeEqualString } from "@/lib/security/text";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vercel Cron: ödenmemiş eski siparişleri kapatır, bekleyen e-postaları gönderir. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqualString(auth, `Bearer ${secret}`)) return new Response("Unauthorized", { status: 401 });
  if (!supabaseConfigured()) return Response.json({ skipped: true });
  const { data } = await supabaseAdmin().rpc("expire_pending_orders");
  await flushOutbox(50);
  return Response.json({ expired: data ?? 0 });
}
