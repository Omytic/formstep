#!/usr/bin/env node
/**
 * Ekip hesaplarını açar ya da şifrelerini sıfırlar (kendi bilgisayarında, Cursor terminalinde çalıştır).
 *
 *   node --env-file=.env.local scripts/create-team.mjs 'ŞİFRE'
 *
 * Yunus, Yusuf ve Ömer için yunus@formstep.tr, yusuf@formstep.tr, omer@formstep.tr hesaplarını açar,
 * üçüne de "sahip" yetkisi verir. Giriş ekranında kullanıcı adı olarak yunus / yusuf / ömer yazılır.
 * Hesap zaten varsa şifresini verilen şifreyle değiştirir. Şifre hiçbir dosyaya kaydedilmez;
 * ilk girişten sonra herkes Hesabım sayfasından kendi şifresini değiştirmeli.
 */
import { createClient } from "@supabase/supabase-js";

const TEAM = [
  { user: "yunus", name: "Yunus" },
  { user: "yusuf", name: "Yusuf" },
  { user: "omer", name: "Ömer" },
];

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error("Kullanım: node --env-file=.env.local scripts/create-team.mjs 'ŞİFRE'  (en az 8 karakter)");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(".env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const { data: list, error: listError } = await sb.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;

for (const m of TEAM) {
  const email = `${m.user}@formstep.tr`;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email);
  let id = existing?.id;
  if (existing) {
    const { error } = await sb.auth.admin.updateUserById(existing.id, { password, user_metadata: { full_name: m.name } });
    if (error) throw error;
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: m.name } });
    if (error) throw error;
    id = data.user.id;
  }
  const { error: e2 } = await sb.from("admins").upsert({ user_id: id, role: "owner", display_name: m.name });
  if (e2) throw e2;
  console.log(`✓ ${m.name}: kullanıcı adı "${m.user === "omer" ? "ömer" : m.user}" ${existing ? "(şifre güncellendi)" : "(hesap açıldı)"}`);
}
console.log("\nGiriş: https://formstep.tr/admin/giris");
