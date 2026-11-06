/**
 * YALNIZCA GELİŞTİRME ÖNİZLEMESİ. Supabase bağlı değilken operasyon panelinin dolu hâlini
 * görebilmek için örnek kayıtlar. Canlı ortamda hiçbir zaman yüklenmez (bkz. isPreview).
 */
import { SIZES } from "@/lib/store/preview";
import type { AdRow, AuditRow, Category, ChannelRow, ContentItem, Counterparty, Entry, Location, Member, Movement, Sale, Shipment, SocialAccount, Task, UnitCost } from "./data";

const U = { yunus: "p-yunus", yusuf: "p-yusuf", omer: "p-omer" };
const v = (code: string, size: string) => `preview-${code}-${SIZES.indexOf(size)}`;
const L = { depo: "l-depo", fba: "l-fba", ty: "l-ty", hb: "l-hb" };

const today = new Date();
const iso = (daysAgo: number) => new Date(today.getTime() - daysAgo * 86400_000).toISOString().slice(0, 10);

// Basit, her seferinde aynı sonucu veren sayı üreteci
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const models = ["M100", "M300", "M900"];
const popular = ["39-40", "40-41", "41-42", "42-43", "38-39", "43-44"];

const sales: Sale[] = [];
for (let d = 0; d < 120; d++) {
  const n = Math.floor(rnd() * 5) + (d < 30 ? 2 : 1);
  for (let i = 0; i < n; i++) {
    const code = models[Math.floor(rnd() * (rnd() < 0.55 ? 1 : 3))] === "M100" ? (rnd() < 0.5 ? "M900" : "M100") : models[Math.floor(rnd() * 3)];
    const size = popular[Math.floor(rnd() * popular.length)];
    const channel = (["amazon", "amazon", "amazon", "trendyol", "trendyol", "hepsiburada"] as const)[Math.floor(rnd() * 6)];
    const qty = rnd() < 0.85 ? 1 : 2;
    const gross = qty * 20000;
    const type = rnd() < 0.04 ? "iade" : "satis";
    const commission = Math.round(gross * (channel === "amazon" ? 0.15 : channel === "trendyol" ? 0.19 : 0.17));
    const shipping = channel === "amazon" ? Math.round(qty * 4200) : 3500;
    sales.push({
      id: `s-${d}-${i}`,
      channel,
      order_no: `${channel.slice(0, 2).toUpperCase()}-${100000 + d * 10 + i}`,
      type,
      sold_on: iso(d),
      variant_id: v(code, size),
      external_sku: `${code}-${size}`,
      product_title: `FormStep ${code} ${size}`,
      qty,
      gross_kurus: gross,
      commission_kurus: commission,
      shipping_kurus: shipping,
      other_fee_kurus: 0,
      net_kurus: gross - commission - shipping,
      import_id: null,
    });
  }
}

const levels: { variant_id: string; location_id: string; qty: number }[] = [];
for (const code of models) {
  SIZES.forEach((size, i) => {
    const core = popular.includes(size);
    levels.push({ variant_id: v(code, size), location_id: L.depo, qty: core ? 30 + ((i * 13) % 50) : (i * 7) % 12 });
    levels.push({ variant_id: v(code, size), location_id: L.fba, qty: core ? 8 + ((i * 11) % 30) : (i * 3) % 6 });
  });
}

export const previewOps = {
  team: [
    { id: U.omer, name: "Ömer", email: "omer@formstep.tr" },
    { id: U.yunus, name: "Yunus", email: "yunus@formstep.tr" },
    { id: U.yusuf, name: "Yusuf", email: "yusuf@formstep.tr" },
  ] satisfies Member[],
  locations: [
    { id: L.depo, code: "depo", name: "Ana depo", kind: "depo", active: true },
    { id: L.fba, code: "amazon-fba", name: "Amazon deposu (FBA)", kind: "amazon", active: true },
    { id: L.ty, code: "trendyol", name: "Trendyol deposu", kind: "trendyol", active: false },
    { id: L.hb, code: "hepsiburada", name: "Hepsiburada deposu", kind: "hepsiburada", active: false },
  ] satisfies Location[],
  channels: [
    { code: "amazon", name: "Amazon", stock_location_id: L.fba, import_mapping: {} },
    { code: "trendyol", name: "Trendyol", stock_location_id: L.depo, import_mapping: {} },
    { code: "hepsiburada", name: "Hepsiburada", stock_location_id: L.depo, import_mapping: {} },
    { code: "diger", name: "Diğer / elden", stock_location_id: L.depo, import_mapping: {} },
  ] satisfies ChannelRow[],
  levels,
  movements: [
    { id: "m1", variant_id: v("M900", "41-42"), from_location: null, to_location: L.depo, qty: 120, kind: "giris", occurred_on: iso(3), note: "Üreticiden yeni parti", ref_type: null, created_by: U.yunus, created_at: iso(3) },
    { id: "m2", variant_id: v("M900", "41-42"), from_location: L.depo, to_location: L.fba, qty: 40, kind: "transfer", occurred_on: iso(5), note: "Sevkiyat #3", ref_type: "shipment", created_by: U.omer, created_at: iso(5) },
    { id: "m3", variant_id: v("M100", "39-40"), from_location: L.depo, to_location: null, qty: 2, kind: "fire", occurred_on: iso(9), note: "Ambalajı hasarlı", ref_type: null, created_by: U.yusuf, created_at: iso(9) },
  ] satisfies Movement[],
  shipments: [
    {
      id: "00000000-0000-4000-8000-000000000003", number: 3, channel: "amazon", from_location: L.depo, to_location: L.fba, reference: "FBA18X9QK2", status: "yolda",
      shipped_on: iso(5), received_on: null, carrier: "UPS", tracking: "1Z999AA10123456784", box_count: 4, cost_kurus: 185000, note: "", created_by: U.omer, created_at: iso(6),
      items: [
        { id: "i1", variant_id: v("M900", "41-42"), qty_sent: 40, qty_received: null },
        { id: "i2", variant_id: v("M900", "42-43"), qty_sent: 40, qty_received: null },
        { id: "i3", variant_id: v("M100", "40-41"), qty_sent: 30, qty_received: null },
      ],
    },
    {
      id: "00000000-0000-4000-8000-000000000002", number: 2, channel: "amazon", from_location: L.depo, to_location: L.fba, reference: "FBA17T2LM8", status: "eksik",
      shipped_on: iso(34), received_on: iso(29), carrier: "Yurtiçi Kargo", tracking: "", box_count: 3, cost_kurus: 142000, note: "Amazon 2 adet eksik saydı, talep açıldı", created_by: U.yunus, created_at: iso(35),
      items: [
        { id: "i4", variant_id: v("M900", "40-41"), qty_sent: 50, qty_received: 48 },
        { id: "i5", variant_id: v("M300", "41-42"), qty_sent: 30, qty_received: 30 },
      ],
    },
    {
      id: "00000000-0000-4000-8000-000000000001", number: 1, channel: "amazon", from_location: L.depo, to_location: L.fba, reference: "FBA16P0AA1", status: "teslim",
      shipped_on: iso(70), received_on: iso(64), carrier: "Yurtiçi Kargo", tracking: "", box_count: 5, cost_kurus: 160000, note: "", created_by: U.omer, created_at: iso(71),
      items: [{ id: "i6", variant_id: v("M900", "41-42"), qty_sent: 100, qty_received: 100 }],
    },
  ] satisfies Shipment[],
  sales,
  categories: [
    { id: "c1", name: "Pazaryeri hakedişi", kind: "gelir", in_pnl: false, active: true },
    { id: "c2", name: "Diğer gelir", kind: "gelir", in_pnl: true, active: true },
    { id: "c3", name: "Ürün alımı / üretim", kind: "gider", in_pnl: false, active: true },
    { id: "c4", name: "Ambalaj", kind: "gider", in_pnl: true, active: true },
    { id: "c5", name: "Kargo ve lojistik", kind: "gider", in_pnl: true, active: true },
    { id: "c6", name: "Pazaryeri komisyonu", kind: "gider", in_pnl: false, active: true },
    { id: "c7", name: "Reklam", kind: "gider", in_pnl: false, active: true },
    { id: "c8", name: "Vergi ve harç", kind: "gider", in_pnl: true, active: true },
    { id: "c9", name: "Muhasebe ve hukuk", kind: "gider", in_pnl: true, active: true },
    { id: "c10", name: "Diğer gider", kind: "gider", in_pnl: true, active: true },
  ] satisfies Category[],
  counterparties: [
    { id: "k1", name: "Yunus", kind: "ortak", phone: "", email: "", note: "", active: true },
    { id: "k2", name: "Yusuf", kind: "ortak", phone: "", email: "", note: "", active: true },
    { id: "k3", name: "Ömer", kind: "ortak", phone: "", email: "", note: "", active: true },
    { id: "k4", name: "Amazon", kind: "pazaryeri", phone: "", email: "", note: "", active: true },
    { id: "k5", name: "Trendyol", kind: "pazaryeri", phone: "", email: "", note: "", active: true },
    { id: "k6", name: "Örnek Tabanlık Üretim", kind: "tedarikci", phone: "", email: "", note: "Önizleme kaydı", active: true },
  ] satisfies Counterparty[],
  entries: [
    { id: "e1", kind: "gider", category_id: "c3", counterparty_id: "k6", amount_kurus: 4800000, occurred_on: iso(3), status: "bekliyor", due_on: iso(-12), method: "banka", description: "1.200 adet tabanlık, 2. parti", file_path: null, ref_type: null, created_by: U.yunus, created_at: iso(3) },
    { id: "e2", kind: "gelir", category_id: "c1", counterparty_id: "k4", amount_kurus: 3125000, occurred_on: iso(8), status: "odendi", due_on: null, method: "pazaryeri", description: "Amazon hakedişi", file_path: null, ref_type: null, created_by: U.omer, created_at: iso(8) },
    { id: "e3", kind: "gider", category_id: "c5", counterparty_id: null, amount_kurus: 185000, occurred_on: iso(5), status: "odendi", due_on: null, method: "kart", description: "Sevkiyat #3 kargo", file_path: null, ref_type: "shipment", created_by: U.omer, created_at: iso(5) },
    { id: "e4", kind: "gider", category_id: "c4", counterparty_id: null, amount_kurus: 640000, occurred_on: iso(12), status: "odendi", due_on: null, method: "banka", description: "Kutu ve etiket baskısı", file_path: null, ref_type: null, created_by: U.yusuf, created_at: iso(12) },
    { id: "e5", kind: "ortak_giris", category_id: null, counterparty_id: "k3", amount_kurus: 5000000, occurred_on: iso(20), status: "odendi", due_on: null, method: "banka", description: "Parti alımı için sermaye", file_path: null, ref_type: null, created_by: U.omer, created_at: iso(20) },
    { id: "e6", kind: "gelir", category_id: "c1", counterparty_id: "k5", amount_kurus: 1240000, occurred_on: iso(-4), status: "bekliyor", due_on: iso(-4), method: "pazaryeri", description: "Trendyol hakedişi (bekleniyor)", file_path: null, ref_type: null, created_by: U.yusuf, created_at: iso(1) },
    { id: "e7", kind: "gider", category_id: "c9", counterparty_id: null, amount_kurus: 250000, occurred_on: iso(36), status: "odendi", due_on: null, method: "banka", description: "Mali müşavir", file_path: null, ref_type: null, created_by: U.yunus, created_at: iso(36) },
  ] satisfies Entry[],
  unitCosts: [
    { id: "u1", product_id: "preview-m900", label: "Tabanlık", amount_kurus: 4000 },
    { id: "u2", product_id: "preview-m900", label: "Kutu ve etiket", amount_kurus: 550 },
    { id: "u3", product_id: "preview-m100", label: "Tabanlık", amount_kurus: 3200 },
    { id: "u4", product_id: "preview-m100", label: "Kutu ve etiket", amount_kurus: 550 },
  ] satisfies UnitCost[],
  ads: [0, 1, 2, 3].flatMap((k) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - k, 1)).toISOString().slice(0, 10);
    return [
      { id: `a${k}1`, platform: "amazon" as const, month: d, budget_kurus: 300000, spent_kurus: k === 0 ? 62000 : 260000 - k * 20000, ad_sales_kurus: k === 0 ? 310000 : 1150000 - k * 60000, note: "" },
      { id: `a${k}2`, platform: "meta" as const, month: d, budget_kurus: 100000, spent_kurus: k === 0 ? 21000 : 94000, ad_sales_kurus: null, note: "" },
    ];
  }) satisfies AdRow[],
  social: [
    {
      id: "sa1", platform: "instagram", handle: "formsteptr", url: "https://www.instagram.com/formsteptr",
      stats: [3, 2, 1, 0].map((k, i) => ({ month: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - k, 1)).toISOString().slice(0, 10), followers: 1840 + i * 160, posts: 8 + i })),
    },
    { id: "sa2", platform: "x", handle: "formsteptr", url: "https://x.com/formsteptr", stats: [] },
  ] satisfies SocialAccount[],
  content: [
    { id: "ct1", platform: "instagram", planned_on: iso(-2), title: "M900 topuk desteği reels", caption: "", status: "hazirlaniyor", assignee: U.yusuf, link: "" },
    { id: "ct2", platform: "instagram", planned_on: iso(-6), title: "İçe basma nasıl anlaşılır? (karusel)", caption: "", status: "planlandi", assignee: U.yunus, link: "" },
    { id: "ct3", platform: "instagram", planned_on: iso(4), title: "Amazon çok satan rozeti duyurusu", caption: "", status: "paylasildi", assignee: U.omer, link: "https://www.instagram.com/formsteptr" },
    { id: "ct4", platform: "x", planned_on: iso(-9), title: "Müşteri yorumlarından seçkiler", caption: "", status: "fikir", assignee: null, link: "" },
  ] satisfies ContentItem[],
  tasks: [
    { id: "t1", title: "Amazon'daki 2 eksik adet için talep takibi", note: "Sevkiyat #2", assignee: U.omer, due_on: iso(-2), done: false, done_at: null, created_by: U.yunus, created_at: iso(4) },
    { id: "t2", title: "Yeni parti için kutu baskısı siparişi", note: "", assignee: U.yusuf, due_on: iso(1), done: false, done_at: null, created_by: U.yunus, created_at: iso(6) },
    { id: "t3", title: "Trendyol ürün görsellerini yenile", note: "", assignee: U.yunus, due_on: null, done: false, done_at: null, created_by: U.omer, created_at: iso(8) },
    { id: "t4", title: "Ekim ayı satış raporunu yükle", note: "", assignee: U.yusuf, due_on: iso(5), done: true, done_at: iso(5), created_by: U.omer, created_at: iso(10) },
  ] satisfies Task[],
  audit: [
    { id: 5, admin_id: U.yunus, action: "stock.in", entity: "stock_movements", entity_id: null, diff: { adet: 120, not: "Üreticiden yeni parti" }, created_at: new Date(today.getTime() - 3 * 3600_000).toISOString() },
    { id: 4, admin_id: U.omer, action: "shipment.update", entity: "shipments", entity_id: "3", diff: { durum: "yolda" }, created_at: new Date(today.getTime() - 26 * 3600_000).toISOString() },
    { id: 3, admin_id: U.yusuf, action: "sales.import", entity: "sales", entity_id: null, diff: { kanal: "trendyol", eklenen: 46, atlanan: 2 }, created_at: new Date(today.getTime() - 50 * 3600_000).toISOString() },
    { id: 2, admin_id: U.omer, action: "ledger.add", entity: "ledger_entries", entity_id: null, diff: { tur: "gelir", tutar: 3125000 }, created_at: new Date(today.getTime() - 8 * 86400_000).toISOString() },
  ] satisfies AuditRow[],
};
