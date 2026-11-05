"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { siteUrl, supabaseConfigured } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { safeInternalPath } from "@/lib/security/text";
import { supabaseServer } from "@/lib/supabase/server";

export type AuthState = { ok: boolean; message: string } | null;

const NOT_READY: AuthState = { ok: false, message: "Üyelik sistemi çok yakında açılıyor." };

async function limited(scope: string): Promise<boolean> {
  const h = await headers();
  const ip = clientIp(h.get("x-forwarded-for"));
  return !rateLimit({ key: `${scope}:${ip}`, limit: 10, windowMs: 10 * 60_000 }).ok;
}

const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8).max(72);

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_READY;
  if (await limited("signin")) return { ok: false, message: "Çok fazla deneme. Birkaç dakika sonra tekrar dene." };
  const parsed = z.object({ email, password: z.string().min(1) }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { ok: false, message: "E-posta ve şifreni kontrol et." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.message.includes("confirm") ? "Önce e-postanı doğrulaman gerekiyor." : "E-posta veya şifre hatalı." };
  redirect(safeInternalPath(String(form.get("next") ?? ""), "/hesabim"));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_READY;
  if (await limited("signup")) return { ok: false, message: "Çok fazla deneme. Birkaç dakika sonra tekrar dene." };
  const parsed = z
    .object({ fullName: z.string().trim().min(3).max(80), email, password, kvkk: z.literal("on") })
    .safeParse({ fullName: form.get("fullName"), email: form.get("email"), password: form.get("password"), kvkk: form.get("kvkk") });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    const msg =
      path === "password" ? "Şifren en az 8 karakter olmalı." : path === "kvkk" ? "Aydınlatma metnini okuduğunu onaylaman gerekiyor." : path === "fullName" ? "Adını ve soyadını gir." : "Geçerli bir e-posta adresi gir.";
    return { ok: false, message: msg };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: `${siteUrl()}/auth/callback?next=/hesabim` },
  });
  // Kullanıcı varlığını sızdırmamak için aynı mesajı gösteririz.
  if (error && !error.message.toLowerCase().includes("registered")) return { ok: false, message: "Hesap oluşturulamadı. Lütfen tekrar dene." };
  return { ok: true, message: "Neredeyse tamam! E-postana gelen bağlantıya tıklayarak hesabını doğrula." };
}

export async function requestReset(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_READY;
  if (await limited("reset")) return { ok: false, message: "Çok fazla deneme. Birkaç dakika sonra tekrar dene." };
  const parsed = email.safeParse(form.get("email"));
  if (!parsed.success) return { ok: false, message: "Geçerli bir e-posta adresi gir." };
  const supabase = await supabaseServer();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${siteUrl()}/auth/callback?next=/sifre-sifirla` });
  return { ok: true, message: "Bu adrese kayıtlı bir hesap varsa, şifre sıfırlama bağlantısını gönderdik." };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_READY;
  const parsed = password.safeParse(form.get("password"));
  if (!parsed.success) return { ok: false, message: "Şifren en az 8 karakter olmalı." };
  if (form.get("password") !== form.get("password2")) return { ok: false, message: "Şifreler eşleşmiyor." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, message: "Bağlantının süresi dolmuş olabilir. Yeniden şifre sıfırlama iste." };
  return { ok: true, message: "Şifren güncellendi." };
}

export async function signOut(): Promise<void> {
  if (supabaseConfigured()) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  redirect("/");
}
