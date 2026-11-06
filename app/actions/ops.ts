"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adm } from "@/lib/admin-path";
import { audit, requireAdmin, type AdminUser } from "@/lib/auth";
import { getStockLevels } from "@/lib/ops/data";
import { AD_PLATFORMS, CHANNELS, CONTENT_STATUS, COUNTERPARTY_KINDS, LEDGER_KINDS, LOCATION_KINDS, MOVEMENT_KINDS, PAY_METHODS, SHIP_STATUS, SOCIAL_PLATFORMS, type ImportMapping } from "@/lib/ops/meta";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type OpsState = { ok: boolean; message: string } | null;

const PREVIEW: OpsState = { ok: false, message: "Önizleme modunda kayıt yapılmaz. Supabase bağlanınca bu form çalışır." };

class Invalid extends Error {}

/** "1.250,50" / "1250.5" / "1250" → kuruş */
function tl(v: FormDataEntryValue | null, required = false): number | null {
  const s = String(v ?? "").trim().replace(/\s|TL|₺/gi, "");
  if (!s) {
    if (required) throw new Invalid("Tutar gerekli.");
    return null;
  }
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(norm);
  if (!Number.isFinite(n) || n < 0) throw new Invalid("Tutar geçersiz.");
  return Math.round(n * 100);
}
function int(v: FormDataEntryValue | null, { min = 0, required = false } = {}): number | null {
  const s = String(v ?? "").trim();
  if (!s) {
    if (required) throw new Invalid("Adet gerekli.");
    return null;
  }
  const n = Number(s);
  if (!Number.isInteger(n) || n < min) throw new Invalid("Adet geçersiz.");
  return n;
}
const str = (v: FormDataEntryValue | null, max = 500) => String(v ?? "").trim().slice(0, max);
const uuid = (v: FormDataEntryValue | null) => {
  const s = str(v, 40);
  return /^[0-9a-f-]{36}$/i.test(s) ? s : null;
};
const date = (v: FormDataEntryValue | null, required = true) => {
  const s = str(v, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (required) throw new Invalid("Tarih geçersiz.");
  return null;
};
const oneOf = <T extends string>(v: FormDataEntryValue | null, options: Record<T, unknown>): T => {
  const s = str(v, 40) as T;
  if (!(s in options)) throw new Invalid("Seçim geçersiz.");
  return s;
};

async function guard(): Promise<AdminUser | null> {
  const admin = await requireAdmin();
  return admin.preview ? null : admin;
}

function fail(e: unknown): OpsState {
  if (e instanceof Invalid) return { ok: false, message: e.message };
  const msg = e instanceof Error ? e.message : String(e);
  if (/duplicate key/i.test(msg)) return { ok: false, message: "Bu kayıt zaten var." };
  if (/violates foreign key/i.test(msg)) return { ok: false, message: "Bu kayıt başka kayıtlarda kullanıldığı için silinemez." };
  console.error("[ops]", msg);
  return { ok: false, message: "Kaydedilemedi. Tekrar dene." };
}

const db = () => supabaseAdmin();
/** Hata varsa fırlatır; sonuç boş olamaz (insert/select/single). */
async function check<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
}
/** maybeSingle(): kayıt yoksa null. */
async function maybe<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}
const refresh = (...paths: string[]) => {
  for (const p of [...paths, ""]) revalidatePath(adm(p));
};

/** Formdaki q_<variant_id> alanlarını okur. */
function quantities(form: FormData, prefix = "q_"): { variant_id: string; qty: number }[] {
  const out: { variant_id: string; qty: number }[] = [];
  for (const [k, v] of form.entries()) {
    if (!k.startsWith(prefix)) continue;
    const id = k.slice(prefix.length);
    const qty = int(v);
    if (qty && /^[0-9a-z-]{8,40}$/i.test(id)) out.push({ variant_id: id, qty });
  }
  return out;
}

// ═════════ stok ═════════

export async function stockIn(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const to = uuid(form.get("location_id"));
    if (!to) throw new Invalid("Konum seç.");
    const items = quantities(form);
    if (!items.length) throw new Invalid("En az bir numaraya adet yaz.");
    const occurred_on = date(form.get("occurred_on"))!;
    const note = str(form.get("note"));
    const kind = str(form.get("kind")) === "iade" ? "iade" : "giris";
    await check(db().from("stock_movements").insert(items.map((i) => ({ ...i, to_location: to, kind, occurred_on, note, created_by: admin.id }))));
    const total = items.reduce((s, i) => s + i.qty, 0);
    await audit(admin, "stock.in", "stock_movements", null, { adet: total, satir: items.length, not: note });
    refresh("/stok");
    return { ok: true, message: `${total} adet stoğa eklendi.` };
  } catch (e) {
    return fail(e);
  }
}

export async function stockMove(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const kind = oneOf(form.get("kind"), MOVEMENT_KINDS);
    const variant_id = str(form.get("variant_id"), 40);
    if (!variant_id) throw new Invalid("Model ve numara seç.");
    const qty = int(form.get("qty"), { min: 1, required: true })!;
    const from = uuid(form.get("from_location"));
    const to = uuid(form.get("to_location"));
    if (kind === "transfer" && (!from || !to || from === to)) throw new Invalid("Transfer için iki farklı konum seç.");
    if (kind === "fire" && !from) throw new Invalid("Firenin hangi konumdan düştüğünü seç.");
    if ((kind === "giris" || kind === "iade") && !to) throw new Invalid("Stoğun ekleneceği konumu seç.");
    if (!from && !to) throw new Invalid("Konum seç.");
    const row = {
      variant_id,
      qty,
      kind,
      from_location: kind === "giris" || kind === "iade" ? null : from,
      to_location: kind === "fire" ? null : to,
      occurred_on: date(form.get("occurred_on"))!,
      note: str(form.get("note")),
      created_by: admin.id,
    };
    await check(db().from("stock_movements").insert(row));
    await audit(admin, "stock.move", "stock_movements", null, { tur: kind, adet: qty, not: row.note });
    refresh("/stok");
    return { ok: true, message: "Hareket kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function stockCount(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const loc = uuid(form.get("location_id"));
    if (!loc) throw new Invalid("Konum seç.");
    const levels = await getStockLevels();
    const rows = [];
    for (const [k, v] of form.entries()) {
      if (!k.startsWith("c_") || String(v).trim() === "") continue;
      const variant_id = k.slice(2);
      const counted = int(v)!;
      const current = levels.get(variant_id)?.get(loc) ?? 0;
      const diff = counted - current;
      if (diff !== 0)
        rows.push({
          variant_id,
          qty: Math.abs(diff),
          kind: "sayim",
          from_location: diff < 0 ? loc : null,
          to_location: diff > 0 ? loc : null,
          occurred_on: date(form.get("occurred_on"))!,
          note: str(form.get("note")) || "Sayım",
          created_by: admin.id,
        });
    }
    if (!rows.length) return { ok: true, message: "Sayım mevcut stokla aynı, değişiklik yok." };
    await check(db().from("stock_movements").insert(rows));
    await audit(admin, "stock.count", "stock_movements", loc, { duzeltilen: rows.length });
    refresh("/stok");
    return { ok: true, message: `${rows.length} numarada stok sayıma göre düzeltildi.` };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMovement(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = await maybe(db().from("stock_movements").select("ref_type, qty, kind, note").eq("id", id).maybeSingle());
    if (!row) throw new Invalid("Kayıt bulunamadı.");
    if (row.ref_type) throw new Invalid("Bu hareket bir sevkiyattan geliyor; sevkiyatı düzenle.");
    await check(db().from("stock_movements").delete().eq("id", id));
    await audit(admin, "stock.delete", "stock_movements", id, row);
    refresh("/stok");
    return { ok: true, message: "Hareket silindi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveLocation(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const name = str(form.get("name"), 60);
    if (name.length < 2) throw new Invalid("Konum adı gerekli.");
    const kind = oneOf(form.get("kind"), LOCATION_KINDS);
    const active = form.get("active") === "on";
    if (id) {
      await check(db().from("stock_locations").update({ name, kind, active }).eq("id", id));
    } else {
      const code = `${kind}-${Date.now().toString(36)}`.slice(0, 30);
      await check(db().from("stock_locations").insert({ name, kind, active: true, code, sort: 50 }));
    }
    await audit(admin, id ? "location.update" : "location.add", "stock_locations", id, { ad: name, aktif: active });
    refresh("/stok", "/ayarlar");
    return { ok: true, message: "Konum kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveChannelSettings(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    for (const code of Object.keys(CHANNELS)) {
      const loc = uuid(form.get(`loc_${code}`));
      await check(db().from("sales_channels").update({ stock_location_id: loc }).eq("code", code));
    }
    const low = int(form.get("low_stock"));
    if (low !== null) await check(db().from("store_settings").upsert({ key: "private.ops", value: { low_stock: low } }));
    await audit(admin, "settings.ops", "sales_channels", null, { kritik_stok: low });
    refresh("/stok", "/ayarlar");
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

// ═════════ sevkiyatlar ═════════

async function syncShipmentCost(admin: AdminUser, id: string, number: number, cost: number, on: string) {
  const ref = { ref_type: "shipment", ref_id: id };
  if (cost > 0) {
    const cat = await maybe(db().from("finance_categories").select("id").eq("name", "Kargo ve lojistik").maybeSingle());
    const existing = await maybe(db().from("ledger_entries").select("id").match(ref).maybeSingle());
    const row = { kind: "gider", amount_kurus: cost, occurred_on: on, description: `Sevkiyat #${number} kargo`, category_id: cat?.id ?? null, method: "banka" };
    if (existing) await check(db().from("ledger_entries").update(row).eq("id", existing.id));
    else await check(db().from("ledger_entries").insert({ ...row, ...ref, created_by: admin.id }));
  } else {
    await check(db().from("ledger_entries").delete().match(ref));
  }
}

function shipmentFields(form: FormData) {
  const from_location = uuid(form.get("from_location"));
  const to_location = uuid(form.get("to_location"));
  if (!from_location || !to_location) throw new Invalid("Çıkış ve varış konumunu seç.");
  if (from_location === to_location) throw new Invalid("Çıkış ve varış konumu aynı olamaz.");
  const channel = str(form.get("channel"), 20);
  return {
    from_location,
    to_location,
    channel: channel in CHANNELS ? channel : null,
    reference: str(form.get("reference"), 80),
    status: oneOf(form.get("status") ?? "hazirlaniyor", SHIP_STATUS),
    shipped_on: date(form.get("shipped_on"), false),
    received_on: date(form.get("received_on"), false),
    carrier: str(form.get("carrier"), 80),
    tracking: str(form.get("tracking"), 120),
    box_count: int(form.get("box_count")),
    cost_kurus: tl(form.get("cost")) ?? 0,
    note: str(form.get("note"), 1000),
  };
}

export async function createShipment(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  let id: string | null = null;
  try {
    const fields = shipmentFields(form);
    const items = quantities(form);
    if (!items.length) throw new Invalid("Sevkiyata en az bir numara ekle.");
    if (fields.status !== "hazirlaniyor" && !fields.shipped_on) fields.shipped_on = new Date().toISOString().slice(0, 10);
    const s = await check(db().from("shipments").insert({ ...fields, created_by: admin.id }).select("id, number").single());
    id = s.id;
    await check(db().from("shipment_items").insert(items.map((i) => ({ shipment_id: s.id, variant_id: i.variant_id, qty_sent: i.qty }))));
    await check(db().rpc("sync_shipment_movements", { p_shipment: s.id }));
    await syncShipmentCost(admin, s.id, s.number, fields.cost_kurus, fields.shipped_on ?? new Date().toISOString().slice(0, 10));
    await audit(admin, "shipment.add", "shipments", String(s.number), { adet: items.reduce((a, i) => a + i.qty, 0), durum: fields.status, referans: fields.reference });
    refresh("/sevkiyatlar", "/stok", "/muhasebe");
    return { ok: true, message: `Sevkiyat #${s.number} oluşturuldu.` };
  } catch (e) {
    if (id) await db().from("shipments").delete().eq("id", id);
    return fail(e);
  }
}

export async function updateShipment(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    if (!id) throw new Invalid("Sevkiyat bulunamadı.");
    const fields = shipmentFields(form);
    if (["yolda", "teslim", "eksik"].includes(fields.status) && !fields.shipped_on) fields.shipped_on = new Date().toISOString().slice(0, 10);
    if (["teslim", "eksik"].includes(fields.status) && !fields.received_on) fields.received_on = new Date().toISOString().slice(0, 10);
    const s = await check(db().from("shipments").update(fields).eq("id", id).select("number").single());
    // Teslim alınan adetler
    for (const [k, v] of form.entries()) {
      if (!k.startsWith("r_")) continue;
      const itemId = uuid(k.slice(2));
      if (!itemId) continue;
      const received = String(v).trim() === "" ? null : int(v);
      await check(db().from("shipment_items").update({ qty_received: received }).eq("id", itemId).eq("shipment_id", id));
    }
    await check(db().rpc("sync_shipment_movements", { p_shipment: id }));
    await syncShipmentCost(admin, id, s.number, fields.cost_kurus, fields.shipped_on ?? new Date().toISOString().slice(0, 10));
    await audit(admin, "shipment.update", "shipments", String(s.number), { durum: fields.status });
    refresh("/sevkiyatlar", `/sevkiyatlar/${id}`, "/stok", "/muhasebe");
    return { ok: true, message: "Sevkiyat güncellendi." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteShipment(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const s = await check(db().from("shipments").select("number").eq("id", id).single());
    await check(db().from("ledger_entries").delete().match({ ref_type: "shipment", ref_id: id }));
    await check(db().from("shipments").delete().eq("id", id));
    await check(db().rpc("sync_shipment_movements", { p_shipment: id }));
    await audit(admin, "shipment.delete", "shipments", String(s.number), {});
    refresh("/sevkiyatlar", "/stok", "/muhasebe");
  } catch (e) {
    return fail(e);
  }
  redirect(adm("/sevkiyatlar"));
}

// ═════════ satışlar ═════════

export type ImportRow = {
  order_no: string;
  sold_on: string;
  sku: string;
  title: string;
  qty: number;
  gross: number;
  commission: number;
  shipping: number;
  other: number;
  type: "satis" | "iade";
};

export type ImportResult = { ok: boolean; message: string; inserted?: number; skipped?: number; unmatched?: number };

async function variantResolver(channel: string) {
  const [aliases, variants] = await Promise.all([
    check(db().from("sku_aliases").select("external_sku, variant_id").eq("channel", channel)),
    check(db().from("product_variants").select("id, sku, size_label, products(code)")),
  ]);
  const map = new Map<string, string>();
  const norm = (s: string) => s.toLowerCase().replace(/[\s_.]/g, "").replace(/–/g, "-");
  for (const v of variants as unknown as { id: string; sku: string; size_label: string; products: { code: string } }[]) {
    map.set(norm(v.sku), v.id);
    map.set(norm(`${v.products.code}-${v.size_label}`), v.id);
    map.set(norm(`${v.products.code}${v.size_label}`), v.id);
  }
  for (const a of aliases) map.set(norm(a.external_sku), a.variant_id);
  return (sku: string) => map.get(norm(sku)) ?? null;
}

export async function importSales(channel: string, fileName: string, rows: ImportRow[], mapping: ImportMapping): Promise<ImportResult> {
  const admin = await guard();
  if (!admin) return PREVIEW!;
  try {
    if (!(channel in CHANNELS)) throw new Invalid("Kanal seç.");
    if (!Array.isArray(rows) || !rows.length) throw new Invalid("Dosyada aktarılacak satır yok.");
    if (rows.length > 20000) throw new Invalid("Tek seferde en fazla 20.000 satır yüklenebilir.");
    const resolve = await variantResolver(channel);
    const kurus = (n: unknown) => Math.round(Math.abs(Number(n) || 0) * 100);
    const clean = rows
      .map((r) => ({
        channel,
        order_no: String(r.order_no ?? "").trim().slice(0, 80),
        line_key: String(r.sku ?? "").trim().slice(0, 120),
        type: r.type === "iade" ? "iade" : "satis",
        sold_on: /^\d{4}-\d{2}-\d{2}$/.test(String(r.sold_on)) ? r.sold_on : "",
        external_sku: String(r.sku ?? "").trim().slice(0, 120),
        product_title: String(r.title ?? "").trim().slice(0, 200),
        qty: Math.abs(Math.round(Number(r.qty) || 0)),
        gross_kurus: kurus(r.gross),
        commission_kurus: kurus(r.commission),
        shipping_kurus: kurus(r.shipping),
        other_fee_kurus: kurus(r.other),
        variant_id: resolve(String(r.sku ?? "")),
        created_by: admin.id,
      }))
      .filter((r) => r.order_no && r.sold_on && r.qty > 0);
    const invalid = rows.length - clean.length;
    if (!clean.length) throw new Invalid("Geçerli satır bulunamadı. Sipariş no, tarih ve adet sütunlarını kontrol et.");

    const imp = await check(db().from("sale_imports").insert({ channel, file_name: fileName.slice(0, 200), row_count: rows.length, created_by: admin.id }).select("id").single());
    let inserted = 0;
    for (let i = 0; i < clean.length; i += 500) {
      const chunk = clean.slice(i, i + 500).map((r) => ({ ...r, import_id: imp.id }));
      const res = await check(db().from("sales").upsert(chunk, { onConflict: "channel,order_no,line_key,type", ignoreDuplicates: true }).select("id"));
      inserted += res?.length ?? 0;
    }
    const skipped = rows.length - inserted;
    const unmatched = clean.filter((r) => !r.variant_id).length;
    await check(db().from("sale_imports").update({ inserted, skipped }).eq("id", imp.id));
    await check(db().from("sales_channels").update({ import_mapping: mapping }).eq("code", channel));
    await audit(admin, "sales.import", "sales", imp.id, { kanal: channel, dosya: fileName, eklenen: inserted, atlanan: skipped });
    refresh("/satislar", "/stok", "/kar");
    const parts = [`${inserted} satır eklendi`];
    if (skipped - invalid > 0) parts.push(`${skipped - invalid} satır zaten vardı`);
    if (invalid > 0) parts.push(`${invalid} satır eksik bilgi yüzünden atlandı`);
    if (unmatched > 0) parts.push(`${unmatched} satırın ürünü eşleşmedi (aşağıdan eşle)`);
    return { ok: true, message: parts.join(", ") + ".", inserted, skipped, unmatched };
  } catch (e) {
    return fail(e) as ImportResult;
  }
}

export async function addSale(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const channel = oneOf(form.get("channel"), CHANNELS);
    const variant_id = str(form.get("variant_id"), 40);
    if (!variant_id) throw new Invalid("Model ve numara seç.");
    const qty = int(form.get("qty"), { min: 1, required: true })!;
    const order_no = str(form.get("order_no"), 80) || `ELLE-${Date.now().toString(36).toUpperCase()}`;
    const row = {
      channel,
      order_no,
      line_key: variant_id,
      type: str(form.get("type")) === "iade" ? "iade" : "satis",
      sold_on: date(form.get("sold_on"))!,
      variant_id,
      qty,
      gross_kurus: tl(form.get("gross"), true)!,
      commission_kurus: tl(form.get("commission")) ?? 0,
      shipping_kurus: tl(form.get("shipping")) ?? 0,
      other_fee_kurus: tl(form.get("other")) ?? 0,
      note: str(form.get("note")),
      created_by: admin.id,
    };
    await check(db().from("sales").insert(row));
    await audit(admin, "sales.add", "sales", order_no, { kanal: channel, adet: qty, tutar: row.gross_kurus, tur: row.type });
    refresh("/satislar", "/stok", "/kar");
    return { ok: true, message: "Satış kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSale(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = await check(db().from("sales").select("channel, order_no, qty, gross_kurus").eq("id", id).single());
    await check(db().from("sales").delete().eq("id", id));
    await audit(admin, "sales.delete", "sales", row.order_no, row);
    refresh("/satislar", "/stok", "/kar");
    return { ok: true, message: "Satış silindi." };
  } catch (e) {
    return fail(e);
  }
}

export async function undoImport(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const imp = await check(db().from("sale_imports").select("channel, file_name, inserted").eq("id", id).single());
    await check(db().from("sales").delete().eq("import_id", id));
    await check(db().from("sale_imports").delete().eq("id", id));
    await audit(admin, "sales.undo_import", "sales", id, { kanal: imp.channel, dosya: imp.file_name, silinen: imp.inserted });
    refresh("/satislar", "/stok", "/kar");
    return { ok: true, message: "Yükleme geri alındı." };
  } catch (e) {
    return fail(e);
  }
}

export async function mapSku(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const channel = oneOf(form.get("channel"), CHANNELS);
    const sku = str(form.get("sku"), 120);
    const variant_id = str(form.get("variant_id"), 40);
    if (!sku || !variant_id) throw new Invalid("Model ve numara seç.");
    await check(db().from("sku_aliases").upsert({ channel, external_sku: sku, variant_id }));
    await check(db().from("sales").update({ variant_id }).eq("channel", channel).eq("external_sku", sku).is("variant_id", null));
    await audit(admin, "sales.map_sku", "sku_aliases", sku, { kanal: channel });
    refresh("/satislar", "/stok", "/kar");
    return { ok: true, message: "Eşlendi; bundan sonraki yüklemelerde otomatik tanınacak." };
  } catch (e) {
    return fail(e);
  }
}

// ═════════ muhasebe ═════════

export async function saveEntry(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const kind = oneOf(form.get("kind"), LEDGER_KINDS);
    const counterparty_id = uuid(form.get("counterparty_id"));
    if ((kind === "ortak_giris" || kind === "ortak_cikis") && !counterparty_id) throw new Invalid("Hangi ortak olduğunu seç.");
    const status = str(form.get("status")) === "bekliyor" ? "bekliyor" : "odendi";
    const row: Record<string, unknown> = {
      kind,
      category_id: kind === "gelir" || kind === "gider" ? uuid(form.get("category_id")) : null,
      counterparty_id,
      amount_kurus: tl(form.get("amount"), true),
      occurred_on: date(form.get("occurred_on")),
      status,
      due_on: status === "bekliyor" ? date(form.get("due_on"), false) : null,
      method: oneOf(form.get("method") ?? "banka", PAY_METHODS),
      description: str(form.get("description"), 500),
    };
    if (!row.amount_kurus) throw new Invalid("Tutar sıfır olamaz.");
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > 3.5 * 1024 * 1024) throw new Invalid("Dosya en fazla 3,5 MB olabilir; telefondaki fotoğrafı küçültüp ya da PDF olarak yükle.");
      if (!/^(application\/pdf|image\/(png|jpe?g|webp|heic))$/.test(file.type)) throw new Invalid("Yalnızca PDF ya da fotoğraf yüklenebilir.");
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
      const path = `${String(row.occurred_on).slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
      const { error } = await db().storage.from("finance-docs").upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      row.file_path = path;
    }
    if (id) await check(db().from("ledger_entries").update(row).eq("id", id));
    else await check(db().from("ledger_entries").insert({ ...row, created_by: admin.id }));
    await audit(admin, id ? "ledger.update" : "ledger.add", "ledger_entries", id, { tur: kind, tutar: row.amount_kurus, aciklama: row.description });
    refresh("/muhasebe", "/kar");
    return { ok: true, message: id ? "Kayıt güncellendi." : "Kayıt eklendi." };
  } catch (e) {
    return fail(e);
  }
}

export async function markPaid(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const today = new Date().toISOString().slice(0, 10);
    const row = await check(db().from("ledger_entries").update({ status: "odendi", occurred_on: today }).eq("id", id).select("kind, amount_kurus, description").single());
    await audit(admin, "ledger.paid", "ledger_entries", id, { tur: row.kind, tutar: row.amount_kurus, aciklama: row.description });
    refresh("/muhasebe");
    return { ok: true, message: row.kind === "gelir" ? "Tahsil edildi olarak işaretlendi." : "Ödendi olarak işaretlendi." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEntry(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = await check(db().from("ledger_entries").select("kind, amount_kurus, description, file_path, ref_type").eq("id", id).single());
    if (row.ref_type) throw new Invalid("Bu kayıt bir sevkiyattan geliyor; kargo tutarını sevkiyattan değiştir.");
    await check(db().from("ledger_entries").delete().eq("id", id));
    if (row.file_path) await db().storage.from("finance-docs").remove([row.file_path]);
    await audit(admin, "ledger.delete", "ledger_entries", id, { tur: row.kind, tutar: row.amount_kurus, aciklama: row.description });
    refresh("/muhasebe", "/kar");
    return { ok: true, message: "Kayıt silindi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveCounterparty(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = {
      name: str(form.get("name"), 100),
      kind: oneOf(form.get("kind"), COUNTERPARTY_KINDS),
      phone: str(form.get("phone"), 40),
      email: str(form.get("email"), 120),
      note: str(form.get("note"), 500),
    };
    if (row.name.length < 2) throw new Invalid("Ad gerekli.");
    if (id) await check(db().from("counterparties").update(row).eq("id", id));
    else await check(db().from("counterparties").insert(row));
    await audit(admin, id ? "counterparty.update" : "counterparty.add", "counterparties", id, { ad: row.name });
    refresh("/muhasebe");
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveCategory(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const name = str(form.get("name"), 60);
    if (name.length < 2) throw new Invalid("Kategori adı gerekli.");
    const kind = str(form.get("kind")) === "gelir" ? "gelir" : "gider";
    await check(db().from("finance_categories").insert({ name, kind, in_pnl: form.get("in_pnl") === "on", sort: 50 }));
    await audit(admin, "category.add", "finance_categories", null, { ad: name, tur: kind });
    refresh("/muhasebe");
    return { ok: true, message: "Kategori eklendi." };
  } catch (e) {
    return fail(e);
  }
}

// ═════════ birim maliyet ═════════

export async function saveUnitCosts(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const product_id = str(form.get("product_id"), 40);
    if (!product_id) throw new Invalid("Model seç.");
    const rows: { product_id: string; label: string; amount_kurus: number; sort: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const label = str(form.get(`label_${i}`), 60);
      const amount = tl(form.get(`amount_${i}`));
      if (label && amount !== null) rows.push({ product_id, label, amount_kurus: amount, sort: i });
    }
    await check(db().from("unit_costs").delete().eq("product_id", product_id));
    if (rows.length) await check(db().from("unit_costs").insert(rows));
    await audit(admin, "unitcost.save", "unit_costs", product_id, { toplam: rows.reduce((s, r) => s + r.amount_kurus, 0), kalem: rows.length });
    refresh("/kar");
    return { ok: true, message: "Birim maliyet kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

// ═════════ reklam ═════════

export async function saveAd(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const platform = oneOf(form.get("platform"), AD_PLATFORMS);
    const month = str(form.get("month"), 7);
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Invalid("Ay seç.");
    const row = {
      platform,
      month: `${month}-01`,
      budget_kurus: tl(form.get("budget")) ?? 0,
      spent_kurus: tl(form.get("spent")) ?? 0,
      ad_sales_kurus: tl(form.get("ad_sales")),
      note: str(form.get("note"), 300),
    };
    await check(db().from("ad_spend").upsert(row, { onConflict: "platform,month" }));
    await audit(admin, "ads.save", "ad_spend", `${platform} ${month}`, { butce: row.budget_kurus, harcanan: row.spent_kurus });
    refresh("/reklam", "/kar");
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAd(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    await check(db().from("ad_spend").delete().eq("id", id));
    await audit(admin, "ads.delete", "ad_spend", id, {});
    refresh("/reklam", "/kar");
    return { ok: true, message: "Silindi." };
  } catch (e) {
    return fail(e);
  }
}

// ═════════ sosyal medya ═════════

export async function saveSocialAccount(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const platform = oneOf(form.get("platform"), SOCIAL_PLATFORMS);
    const handle = str(form.get("handle"), 60).replace(/^@/, "");
    if (!handle) throw new Invalid("Kullanıcı adı gerekli.");
    const url = str(form.get("url"), 200);
    if (url && !/^https:\/\//.test(url)) throw new Invalid("Bağlantı https:// ile başlamalı.");
    await check(db().from("social_accounts").upsert({ platform, handle, url, sort: 10 }, { onConflict: "platform,handle" }));
    await audit(admin, "social.account", "social_accounts", handle, { platform });
    refresh("/sosyal");
    return { ok: true, message: "Hesap eklendi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSocialStat(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const account_id = uuid(form.get("account_id"));
    const month = str(form.get("month"), 7);
    if (!account_id || !/^\d{4}-\d{2}$/.test(month)) throw new Invalid("Hesap ve ay seç.");
    const followers = int(form.get("followers"), { required: true })!;
    await check(db().from("social_stats").upsert({ account_id, month: `${month}-01`, followers, posts: int(form.get("posts")) }));
    await audit(admin, "social.stat", "social_stats", account_id, { ay: month, takipci: followers });
    refresh("/sosyal");
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveContent(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = {
      platform: oneOf(form.get("platform"), SOCIAL_PLATFORMS),
      planned_on: date(form.get("planned_on")),
      title: str(form.get("title"), 160),
      caption: str(form.get("caption"), 2200),
      status: oneOf(form.get("status") ?? "fikir", CONTENT_STATUS),
      assignee: uuid(form.get("assignee")),
      link: str(form.get("link"), 300),
    };
    if (row.title.length < 2) throw new Invalid("Başlık gerekli.");
    if (id) await check(db().from("content_plan").update(row).eq("id", id));
    else await check(db().from("content_plan").insert({ ...row, created_by: admin.id }));
    await audit(admin, id ? "content.update" : "content.add", "content_plan", id, { baslik: row.title, durum: row.status });
    refresh("/sosyal");
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteContent(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = await check(db().from("content_plan").select("title").eq("id", id).single());
    await check(db().from("content_plan").delete().eq("id", id));
    await audit(admin, "content.delete", "content_plan", id, { baslik: row.title });
    refresh("/sosyal");
    return { ok: true, message: "Silindi." };
  } catch (e) {
    return fail(e);
  }
}

// ═════════ görevler ═════════

export async function saveTask(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = { title: str(form.get("title"), 200), note: str(form.get("note"), 1000), assignee: uuid(form.get("assignee")), due_on: date(form.get("due_on"), false) };
    if (row.title.length < 2) throw new Invalid("Görev gerekli.");
    if (id) await check(db().from("team_tasks").update(row).eq("id", id));
    else await check(db().from("team_tasks").insert({ ...row, created_by: admin.id }));
    await audit(admin, id ? "task.update" : "task.add", "team_tasks", id, { gorev: row.title });
    refresh("/gorevler");
    return { ok: true, message: "Görev kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleTask(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const done = form.get("done") === "1";
    const row = await check(db().from("team_tasks").update({ done, done_at: done ? new Date().toISOString() : null }).eq("id", id).select("title").single());
    await audit(admin, done ? "task.done" : "task.reopen", "team_tasks", id, { gorev: row.title });
    refresh("/gorevler");
    return { ok: true, message: done ? "Tamamlandı." : "Yeniden açıldı." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTask(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const row = await check(db().from("team_tasks").select("title").eq("id", id).single());
    await check(db().from("team_tasks").delete().eq("id", id));
    await audit(admin, "task.delete", "team_tasks", id, { gorev: row.title });
    refresh("/gorevler");
    return { ok: true, message: "Silindi." };
  } catch (e) {
    return fail(e);
  }
}

// ═════════ hesabım ═════════

export async function changePassword(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    const again = String(form.get("again") ?? "");
    if (next.length < 10) throw new Invalid("Yeni şifre en az 10 karakter olmalı.");
    if (next !== again) throw new Invalid("Yeni şifreler birbirini tutmuyor.");
    if (next === current) throw new Invalid("Yeni şifre eskisiyle aynı olamaz.");
    const supabase = await supabaseServer();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: admin.email, password: current });
    if (signInError) throw new Invalid("Şu anki şifre hatalı.");
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) throw new Invalid(/weak|short|pwned/i.test(error.message) ? "Bu şifre çok zayıf; daha uzun ve tahmin edilmesi zor bir şifre seç." : "Şifre değiştirilemedi.");
    await audit(admin, "account.password", "admins", admin.id, {});
    return { ok: true, message: "Şifren değişti." };
  } catch (e) {
    return fail(e);
  }
}

export async function saveDisplayName(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const name = str(form.get("name"), 40);
    if (name.length < 2) throw new Invalid("Ad gerekli.");
    await check(db().from("admins").update({ display_name: name }).eq("user_id", admin.id));
    await audit(admin, "account.name", "admins", admin.id, { ad: name });
    refresh("/hesabim", "/gorevler", "/gecmis");
    return { ok: true, message: "Kaydedildi." };
  } catch (e) {
    return fail(e);
  }
}

export async function setContentStatus(_: OpsState, form: FormData): Promise<OpsState> {
  const admin = await guard();
  if (!admin) return PREVIEW;
  try {
    const id = uuid(form.get("id"));
    const status = oneOf(form.get("status"), CONTENT_STATUS);
    const row = await check(db().from("content_plan").update({ status }).eq("id", id).select("title").single());
    await audit(admin, "content.status", "content_plan", id, { baslik: row.title, durum: status });
    refresh("/sosyal");
    return { ok: true, message: "Güncellendi." };
  } catch (e) {
    return fail(e);
  }
}
