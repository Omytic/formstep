"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adm } from "@/lib/admin-path";
import { siteUrl, supabaseConfigured } from "@/lib/env";
import { ACCOUNTS_ENABLED } from "@/lib/features";
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
const personName = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .refine((value) => {
    const parts = value.split(/\s+/).filter(Boolean);
    return parts.length >= 2 && parts.every((part) => part.length >= 2);
  });
const password = z.string().min(8).max(72);
/**
 * Ekip giriş alanına e-posta yerine kullanıcı adını yazar: "ömer" → omer@formstep.tr.
 * Hesaplar scripts/create-team.mjs ile bu biçimde açılır.
 */
export async function usernameToEmail(raw: string): Promise<string> {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i̇: "i", ö: "o", ş: "s", ü: "u" };
  const user = raw.trim().toLocaleLowerCase("tr-TR").replace(/[çğıöşü]|i̇/g, (c) => map[c] ?? c).replace(/[^a-z0-9._-]/g, "");
  return `${user}@formstep.tr`;
}

async function signInEmail(raw: unknown): Promise<string | null> {
  const value = String(raw ?? "").trim();
  const candidate = value.includes("@") ? value.toLowerCase() : value.length >= 2 ? await usernameToEmail(value) : "";
  const parsed = email.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return NOT_READY;
  if (await limited("signin")) return { ok: false, message: "Çok fazla deneme. Birkaç dakika sonra tekrar dene." };
  const emailValue = await signInEmail(form.get("email"));
  const parsed = z.object({ email, password: z.string().min(1) }).safeParse({ email: emailValue, password: form.get("password") });
  if (!parsed.success) return { ok: false, message: "E-posta ve şifreni kontrol et." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.message.includes("confirm") ? "Önce e-postanı doğrulaman gerekiyor." : "Kullanıcı adı veya şifre hatalı." };
  const fallback = ACCOUNTS_ENABLED ? "/hesabim" : adm();
  const next = safeInternalPath(String(form.get("next") ?? ""), fallback);
  redirect(ACCOUNTS_ENABLED || next.startsWith(adm()) ? next : adm());
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  if (!ACCOUNTS_ENABLED) return NOT_READY;
  if (!supabaseConfigured()) return NOT_READY;
  if (await limited("signup")) return { ok: false, message: "Çok fazla deneme. Birkaç dakika sonra tekrar dene." };
  const parsed = z
    .object({ fullName: personName, email, password, kvkk: z.literal("on") })
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
  if (!ACCOUNTS_ENABLED) return NOT_READY;
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
  redirect(ACCOUNTS_ENABLED ? "/" : adm("/giris"));
}
