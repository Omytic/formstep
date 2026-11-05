import { redirect } from "next/navigation";
import { adm } from "@/lib/admin-path";
import { isPreview, supabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string; fullName: string; preview?: boolean };

export async function getUser(): Promise<SessionUser | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: String(data.user.user_metadata?.full_name ?? ""),
  };
}

const PREVIEW_USER: SessionUser = { id: "preview", email: "onizleme@formstep.tr", fullName: "Önizleme", preview: true };

/** Hesap sayfaları. Önizlemede boş bir hesapla gezilebilir. */
export async function requireUser(next = "/hesabim"): Promise<SessionUser> {
  if (isPreview()) return PREVIEW_USER;
  const user = await getUser();
  if (!user) redirect(`/giris?next=${encodeURIComponent(next)}`);
  return user;
}

export type AdminUser = SessionUser & { role: "owner" | "staff" };

export async function getAdmin(): Promise<AdminUser | null> {
  if (isPreview()) return { ...PREVIEW_USER, role: "owner" };
  const user = await getUser();
  if (!user) return null;
  const { data } = await supabaseAdmin().from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { ...user, role: data.role };
}

/** Her yönetim sayfası, eylemi ve rotası bunu sunucuda çağırır. */
export async function requireAdmin(role?: "owner"): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) {
    const user = await getUser();
    redirect(user ? "/" : adm("/giris"));
  }
  if (role === "owner" && admin.role !== "owner") redirect(adm());
  return admin;
}

export async function audit(admin: AdminUser, action: string, entity: string, entityId: string | null, diff: unknown) {
  if (admin.preview) return;
  await supabaseAdmin().from("audit_log").insert({ admin_id: admin.id, action, entity, entity_id: entityId, diff });
}
