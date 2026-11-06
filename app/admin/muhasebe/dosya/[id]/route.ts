import { requireAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Fatura / dekont dosyasını 5 dakikalık imzalı bağlantıyla açar. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!supabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Bulunamadı", { status: 404 });
  const db = supabaseAdmin();
  const { data } = await db.from("ledger_entries").select("file_path").eq("id", id).maybeSingle();
  if (!data?.file_path) return new Response("Bulunamadı", { status: 404 });
  const { data: signed } = await db.storage.from("finance-docs").createSignedUrl(data.file_path, 300);
  if (!signed?.signedUrl) return new Response("Bulunamadı", { status: 404 });
  return Response.redirect(signed.signedUrl, 302);
}
