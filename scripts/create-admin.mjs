#!/usr/bin/env node
/**
 * İlk yönetici hesabını oluşturur (bir kez, kendi bilgisayarında çalıştır).
 *   node --env-file=.env.local scripts/create-admin.mjs eposta@ornek.com 'GüçlüŞifre123' owner
 * Kullanıcı zaten varsa yalnızca yönetici yetkisi verir.
 */
import { createClient } from "@supabase/supabase-js";

const [email, password, role = "owner"] = process.argv.slice(2);
if (!email || !password) {
  console.error("Kullanım: node --env-file=.env.local scripts/create-admin.mjs <e-posta> <şifre> [owner|staff]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(".env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

let userId;
const { data: created, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  userId = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (!userId) throw error;
} else {
  userId = created.user.id;
}
const { error: e2 } = await sb.from("admins").upsert({ user_id: userId, role });
if (e2) throw e2;
console.log(`✓ ${email} artık ${role === "owner" ? "sahip" : "personel"} yetkisiyle yönetici. yönetim paneline (varsayılan /secretgate) giriş yapabilir.`);
