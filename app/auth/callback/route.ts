import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { safeInternalPath } from "@/lib/security/text";
import { supabaseServer } from "@/lib/supabase/server";

/** E-posta doğrulama ve şifre sıfırlama bağlantılarının döndüğü adres. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeInternalPath(url.searchParams.get("next"), "/hesabim");
  const code = url.searchParams.get("code");
  if (code && supabaseConfigured()) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/giris?hata=baglanti", url.origin));
}
