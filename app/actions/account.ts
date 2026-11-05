"use server";

import { ACCOUNTS_ENABLED } from "@/lib/features";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { addressSchema, phoneSchema } from "@/lib/validation/checkout";

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const PREVIEW: FormState = { ok: false, message: "Önizleme modunda kayıt yapılamaz." };

export async function saveAddress(_: FormState, form: FormData): Promise<FormState> {
  if (!ACCOUNTS_ENABLED) return { ok: false, message: "Üyelik şu an kapalı." };
  const user = await requireUser();
  if (user.preview) return PREVIEW;
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (errors[String(i.path[0])] ??= i.message));
    return { ok: false, message: "Lütfen alanları kontrol et.", errors };
  }
  const d = parsed.data;
  const supabase = await supabaseServer();
  const id = String(form.get("id") ?? "");
  const row = { user_id: user.id, title: d.title, full_name: d.fullName, phone: d.phone, city: d.city, district: d.district, line: d.line, postal_code: d.postalCode, is_default: form.get("isDefault") === "on" };
  if (row.is_default) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = id ? await supabase.from("addresses").update(row).eq("id", id) : await supabase.from("addresses").insert(row);
  if (error) return { ok: false, message: "Adres kaydedilemedi." };
  revalidatePath("/hesabim/adresler");
  return { ok: true, message: "Adres kaydedildi." };
}

export async function deleteAddress(form: FormData): Promise<void> {
  if (!ACCOUNTS_ENABLED) return;
  const user = await requireUser();
  if (user.preview) return;
  const supabase = await supabaseServer();
  await supabase.from("addresses").delete().eq("id", String(form.get("id")));
  revalidatePath("/hesabim/adresler");
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  if (!ACCOUNTS_ENABLED) return { ok: false, message: "Üyelik şu an kapalı." };
  const user = await requireUser();
  if (user.preview) return PREVIEW;
  const parsed = z
    .object({ fullName: z.string().trim().min(3, "Ad soyad gir.").max(80), phone: z.union([z.literal(""), phoneSchema]) })
    .safeParse({ fullName: form.get("fullName"), phone: String(form.get("phone") ?? "") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Kontrol et." };
  const marketing = form.get("marketing") === "on";
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone, marketing_consent: marketing, marketing_consent_at: marketing ? new Date().toISOString() : null })
    .eq("id", user.id);
  await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });
  if (error) return { ok: false, message: "Kaydedilemedi." };
  revalidatePath("/hesabim", "layout");
  return { ok: true, message: "Bilgilerin güncellendi." };
}

export async function requestDeletion(prev: FormState): Promise<FormState> {
  if (!ACCOUNTS_ENABLED) return { ok: false, message: "Üyelik şu an kapalı." };
  void prev;
  const user = await requireUser();
  if (user.preview) return PREVIEW;
  const supabase = await supabaseServer();
  await supabase.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", user.id);
  return { ok: true, message: "Talebini aldık. Yasal saklama süresi gereken sipariş kayıtları dışında hesabın silinecek; sana e-posta ile bilgi vereceğiz." };
}
