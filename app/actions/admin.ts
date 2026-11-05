"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, requireAdmin, type AdminUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AdminState = { ok: boolean; message: string } | null;

const PREVIEW: AdminState = { ok: false, message: "Önizleme modunda değişiklik kaydedilmez. Supabase bağlanınca bu form çalışır." };

/** "399,90" / "399.90" / "399" → kuruş. Boşsa null. */
function tl(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim().replace(/\s|TL|₺/gi, "");
  if (!s) return null;
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(norm);
  if (!Number.isFinite(n) || n < 0) throw new Error("Tutar geçersiz");
  return Math.round(n * 100);
}
function int(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isInteger(n)) throw new Error("Sayı geçersiz");
  return n;
}
const str = (v: FormDataEntryValue | null, max = 2000) => String(v ?? "").trim().slice(0, max);
const on = (v: FormDataEntryValue | null) => v === "on" || v === "true";

async function guard(role?: "owner"): Promise<AdminUser | null> {
  const admin = await requireAdmin(role);
  return admin.preview ? null : admin;
}

function fail(e: unknown, fallback = "Kaydedilemedi."): AdminState {
  const msg = e instanceof Error ? e.message : String(e);
  if (/duplicate key.*sku/i.test(msg)) return { ok: false, message: "Bu SKU başka bir varyantta kullanılıyor." };
  if (/duplicate key.*code/i.test(msg)) return { ok: false, message: "Bu kupon kodu zaten var." };
  if (/transition_not_allowed/.test(msg)) return { ok: false, message: "Bu durum değişikliğine izin verilmiyor." };
  if (/geçersiz/.test(msg)) return { ok: false, message: msg };
  console.error("[admin]", msg);
  return { ok: false, message: fallback };
}

// ───────── siparişler ─────────

export async function setOrderStatus(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  const id = str(form.get("id"), 40);
  const to = str(form.get("to"), 30);
  try {
    const db = supabaseAdmin();
    if (to === "shipped") {
      const { data } = await db.from("orders").select("tracking_number").eq("id", id).single();
      if (!data?.tracking_number) return { ok: false, message: "Kargoya vermeden önce takip numarasını kaydet." };
    }
    const { error } = await db.rpc("admin_set_order_status", {
      p_order_id: id,
      p_to: to,
      p_actor: admin.email,
      p_note: str(form.get("note"), 300),
      p_restock: on(form.get("restock")),
    });
    if (error) throw new Error(error.message);
    await audit(admin, "order.status", "order", id, { to, restock: on(form.get("restock")) });
    const { flushOutbox } = await import("@/lib/email");
    await flushOutbox().catch(() => undefined);
    revalidatePath(`/admin/siparisler/${id}`);
    revalidatePath("/admin/siparisler");
    return { ok: true, message: "Sipariş durumu güncellendi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveOrderMeta(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  const id = str(form.get("id"), 40);
  const patch = {
    tracking_carrier: str(form.get("carrier"), 60) || null,
    tracking_number: str(form.get("tracking"), 60) || null,
    invoice_no: str(form.get("invoice"), 60) || null,
    internal_note: str(form.get("note"), 2000),
  };
  const { error } = await supabaseAdmin().from("orders").update(patch).eq("id", id);
  if (error) return fail(error.message);
  await audit(admin, "order.meta", "order", id, patch);
  revalidatePath(`/admin/siparisler/${id}`);
  return { ok: true, message: "Kaydedildi." };
}

// ───────── ürünler ─────────

export async function saveProduct(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  const id = str(form.get("id"), 40);
  const status = str(form.get("status"), 20) as "draft" | "published" | "archived";
  const db = supabaseAdmin();
  if (status === "published") {
    const { data } = await db.from("product_variants").select("id").eq("product_id", id).eq("active", true).gt("stock", 0);
    if (!data?.length) return { ok: false, message: "Yayına almadan önce fiyatı ve stoğu girilmiş en az bir aktif numara ekle." };
  }
  const patch = {
    name: str(form.get("name"), 40),
    tagline: str(form.get("tagline"), 80),
    description: str(form.get("description"), 2000),
    size_guide: str(form.get("sizeGuide"), 3000),
    seo_title: str(form.get("seoTitle"), 70) || null,
    seo_description: str(form.get("seoDescription"), 170) || null,
    status: ["draft", "published", "archived"].includes(status) ? status : "draft",
  };
  const { error } = await db.from("products").update(patch).eq("id", id);
  if (error) return fail(error.message);
  await audit(admin, "product.update", "product", id, patch);
  revalidatePath("/", "layout");
  return { ok: true, message: status === "published" ? "Kaydedildi ve yayında." : "Kaydedildi." };
}

export async function saveVariant(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = str(form.get("id"), 40);
    const price = tl(form.get("price"));
    if (!price || price <= 0) return { ok: false, message: "Satış fiyatını gir." };
    const compare = tl(form.get("compareAt"));
    if (compare !== null && compare <= price) return { ok: false, message: "Üstü çizili fiyat, satış fiyatından büyük olmalı." };
    const stock = int(form.get("stock")) ?? 0;
    if (stock < 0) return { ok: false, message: "Stok negatif olamaz." };
    const row = {
      product_id: str(form.get("productId"), 40),
      size_label: str(form.get("size"), 20),
      sku: str(form.get("sku"), 40).toUpperCase(),
      price_kurus: price,
      compare_at_kurus: compare,
      stock,
      active: on(form.get("active")),
      sort_order: int(form.get("sort")) ?? 0,
    };
    if (!row.size_label || !/^[A-Z0-9-]{3,40}$/.test(row.sku)) return { ok: false, message: "Numara ve SKU (harf, rakam, tire) zorunlu." };
    const db = supabaseAdmin();
    const { error } = id ? await db.from("product_variants").update(row).eq("id", id) : await db.from("product_variants").insert(row);
    if (error) throw new Error(error.message);
    await audit(admin, id ? "variant.update" : "variant.create", "variant", id || row.sku, row);
    revalidatePath("/", "layout");
    return { ok: true, message: "Numara kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

/** Stok tablosu: tüm model ve numaraların stoğunu tek seferde kaydeder (yalnızca değişenler). */
export async function saveStocks(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  const changes: { id: string; stock: number }[] = [];
  for (const [k, v] of form.entries()) {
    if (!k.startsWith("s_")) continue;
    const id = k.slice(2);
    const before = form.get(`o_${id}`);
    const raw = String(v).trim();
    if (!/^\d{1,6}$/.test(raw)) return { ok: false, message: "Stok yalnızca 0 veya pozitif tam sayı olabilir." };
    if (raw !== String(before)) changes.push({ id, stock: Number(raw) });
  }
  if (!changes.length) return { ok: true, message: "Değişiklik yok." };
  const db = supabaseAdmin();
  for (const c of changes) {
    const { error } = await db.from("product_variants").update({ stock: c.stock }).eq("id", c.id);
    if (error) return fail(error.message);
  }
  await audit(admin, "stock.bulk", "variant", null, changes);
  revalidatePath("/", "layout");
  return { ok: true, message: `${changes.length} numaranın stoğu güncellendi.` };
}

export async function deleteVariant(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  const id = str(form.get("id"), 40);
  await supabaseAdmin().from("product_variants").delete().eq("id", id);
  await audit(admin, "variant.delete", "variant", id, {});
  revalidatePath("/", "layout");
}

export async function saveFeature(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  const id = str(form.get("id"), 40);
  const row = { product_id: str(form.get("productId"), 40), label: str(form.get("label"), 80), body: str(form.get("body"), 400), verified: on(form.get("verified")), sort_order: int(form.get("sort")) ?? 0 };
  if (!row.label) return { ok: false, message: "Başlık gir." };
  const db = supabaseAdmin();
  const { error } = id ? await db.from("product_features").update(row).eq("id", id) : await db.from("product_features").insert(row);
  if (error) return fail(error.message);
  await audit(admin, "feature.save", "feature", id || row.label, row);
  revalidatePath("/", "layout");
  return { ok: true, message: "Özellik kaydedildi." };
}

export async function deleteFeature(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  await supabaseAdmin().from("product_features").delete().eq("id", str(form.get("id"), 40));
  revalidatePath("/", "layout");
}

export async function uploadImage(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  const file = form.get("file");
  const productId = str(form.get("productId"), 40);
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Bir görsel seç." };
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return { ok: false, message: "Yalnızca PNG, JPG veya WEBP." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, message: "Görsel en fazla 5 MB olabilir." };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const db = supabaseAdmin();
  const { error } = await db.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) return fail(error.message, "Yüklenemedi.");
  const url = db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  const { count } = await db.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  await db.from("product_images").insert({ product_id: productId, path: url, alt: str(form.get("alt"), 160), sort_order: count ?? 0 });
  await audit(admin, "image.upload", "product", productId, { path });
  revalidatePath("/", "layout");
  return { ok: true, message: "Görsel eklendi." };
}

export async function deleteImage(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  await supabaseAdmin().from("product_images").delete().eq("id", str(form.get("id"), 40));
  revalidatePath("/", "layout");
}

// ───────── kuponlar ─────────

export async function saveCoupon(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const kind = str(form.get("kind"), 10) === "fixed" ? "fixed" : "percent";
    const value = kind === "percent" ? int(form.get("value")) : tl(form.get("value"));
    if (!value || value <= 0 || (kind === "percent" && value > 90)) return { ok: false, message: kind === "percent" ? "Yüzde 1 ile 90 arasında olmalı." : "İndirim tutarını gir." };
    const code = str(form.get("code"), 32).toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { ok: false, message: "Kod 3-32 karakter; harf, rakam, tire." };
    const row = {
      code,
      kind,
      value,
      min_subtotal_kurus: tl(form.get("min")) ?? 0,
      starts_at: str(form.get("startsAt")) ? new Date(str(form.get("startsAt"))).toISOString() : null,
      ends_at: str(form.get("endsAt")) ? new Date(str(form.get("endsAt"))).toISOString() : null,
      max_uses: int(form.get("maxUses")),
      max_uses_per_email: int(form.get("maxPerEmail")),
      active: true,
      note: str(form.get("note"), 200),
    };
    const { error } = await supabaseAdmin().from("coupons").insert(row);
    if (error) throw new Error(error.message);
    await audit(admin, "coupon.create", "coupon", code, row);
    revalidatePath("/admin/kuponlar");
    return { ok: true, message: `${code} oluşturuldu.` };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleCoupon(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  const id = str(form.get("id"), 40);
  const active = on(form.get("active"));
  await supabaseAdmin().from("coupons").update({ active }).eq("id", id);
  await audit(admin, "coupon.toggle", "coupon", id, { active });
  revalidatePath("/admin/kuponlar");
}

// ───────── içerik ve ayarlar ─────────

const SETTING_KEYS = ["public.shipping", "public.seller", "public.marketplaces", "public.claims", "public.finder", "public.announcement", "private.notify", "private.launch"] as const;

const urlOrEmpty = z.union([z.literal(""), z.string().url().max(400)]);

export async function saveSetting(_: AdminState, form: FormData): Promise<AdminState> {
  const key = str(form.get("key"), 40) as (typeof SETTING_KEYS)[number];
  if (!SETTING_KEYS.includes(key)) return { ok: false, message: "Geçersiz ayar." };
  const admin = await guard(key === "private.launch" ? "owner" : undefined);
  if (!admin) return PREVIEW;
  try {
    let value: unknown;
    switch (key) {
      case "public.shipping":
        value = { fee_kurus: tl(form.get("fee")), free_threshold_kurus: tl(form.get("free")), carrier: str(form.get("carrier"), 60), lead_time_text: str(form.get("lead"), 60) };
        break;
      case "public.seller":
        value = Object.fromEntries(["address", "phone", "email", "tax_office", "tax_number", "mersis", "etbis"].map((k) => [k, str(form.get(k), 400)]));
        break;
      case "public.marketplaces": {
        const v = Object.fromEntries(["amazon", "trendyol", "hepsiburada", "instagram", "x"].map((k) => [k, str(form.get(k), 400)]));
        for (const [k, u] of Object.entries(v)) if (!urlOrEmpty.safeParse(u).success) return { ok: false, message: `${k} bağlantısı geçerli bir adres değil.` };
        value = v;
        break;
      }
      case "public.claims": {
        const text = str(form.get("text"), 120);
        const evidence = str(form.get("evidence"), 400);
        const date = str(form.get("date"), 40);
        if (text && (!z.string().url().safeParse(evidence).success || !date)) return { ok: false, message: "İddia için kanıt bağlantısı ve tarih zorunlu." };
        value = text ? [{ text, evidence_url: evidence, date, active: on(form.get("active")) }] : [];
        break;
      }
      case "public.finder":
        value = { gunluk: str(form.get("gunluk"), 10), ayakta: str(form.get("ayakta"), 10), tempo: str(form.get("tempo"), 10) };
        break;
      case "public.announcement":
        value = { text: str(form.get("text"), 140), active: on(form.get("active")) };
        break;
      case "private.notify":
        value = { admin_email: str(form.get("adminEmail"), 160), low_stock: int(form.get("lowStock")) ?? 5 };
        break;
      case "private.launch":
        value = { paytr_approved: on(form.get("paytr")), legal_reviewed: on(form.get("legal")), email_dns_verified: on(form.get("email")) };
        break;
    }
    const { error } = await supabaseAdmin().from("store_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    await audit(admin, "setting.save", "setting", key, value);
    revalidatePath("/", "layout");
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveFaq(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  const id = str(form.get("id"), 40);
  const row = { question: str(form.get("question"), 200), answer: str(form.get("answer"), 1200), sort_order: int(form.get("sort")) ?? 0, published: on(form.get("published")) };
  if (!row.question || !row.answer) return { ok: false, message: "Soru ve cevap gir." };
  const db = supabaseAdmin();
  const { error } = id ? await db.from("faq_items").update(row).eq("id", id) : await db.from("faq_items").insert(row);
  if (error) return fail(error.message);
  await audit(admin, "faq.save", "faq", id || row.question, row);
  revalidatePath("/", "layout");
  return { ok: true, message: "Kaydedildi." };
}

export async function deleteFaq(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  await supabaseAdmin().from("faq_items").delete().eq("id", str(form.get("id"), 40));
  revalidatePath("/", "layout");
}

export async function saveLegal(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await guard("owner");
  if (!admin) return PREVIEW;
  const slug = str(form.get("slug"), 40);
  const body = str(form.get("body"), 30000);
  const db = supabaseAdmin();
  if (!body) {
    await db.from("legal_pages").delete().eq("slug", slug);
    revalidatePath(`/bilgilendirme/${slug}`);
    return { ok: true, message: "Özel metin kaldırıldı; şablon kullanılıyor." };
  }
  const { data: prev } = await db.from("legal_pages").select("version").eq("slug", slug).maybeSingle();
  const { error } = await db.from("legal_pages").upsert({ slug, title: str(form.get("title"), 120), body, published: true, version: (prev?.version ?? 0) + 1 });
  if (error) return fail(error.message);
  await audit(admin, "legal.save", "legal", slug, { version: (prev?.version ?? 0) + 1 });
  revalidatePath(`/bilgilendirme/${slug}`);
  return { ok: true, message: "Metin yayınlandı." };
}
