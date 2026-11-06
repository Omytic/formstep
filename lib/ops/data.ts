/* Yalnızca sunucuda (sayfalar ve sunucu eylemleri) kullanılır; servis anahtarıyla okur. */
import { isPreview, supabaseConfigured } from "@/lib/env";
import { getCatalogForAdmin } from "@/lib/store/catalog";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AdPlatform, Channel, ContentStatus, LedgerKind, MovementKind, ShipStatus, SocialPlatform } from "./meta";
import { monthEnd, shiftMonth, todayTR } from "./meta";
import { previewOps } from "./preview";

/* Operasyon panelinin okuma katmanı. Tüm fonksiyonlar yalnızca requireAdmin() sonrası çağrılır. */

const live = () => supabaseConfigured();
const db = () => supabaseAdmin();

/** Supabase tek sorguda en fazla 1000 satır döndürür; büyük tabloları sayfa sayfa okur. */
async function all<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

// ───────── ekip ─────────

export type Member = { id: string; name: string; email: string };

export async function getTeam(): Promise<Member[]> {
  if (!live()) return isPreview() ? previewOps.team : [];
  const { data } = await db().from("admins").select("user_id, display_name, role");
  const members: Member[] = [];
  for (const a of data ?? []) {
    const { data: u } = await db().auth.admin.getUserById(a.user_id);
    const email = u.user?.email ?? "";
    members.push({ id: a.user_id, name: a.display_name || String(u.user?.user_metadata?.full_name ?? "") || email.split("@")[0], email });
  }
  return members.sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

// ───────── ürün / numara listesi ─────────

export type VariantRef = { id: string; code: string; size: string; sku: string; label: string };

export async function getVariants(): Promise<{ models: { code: string; variants: VariantRef[] }[]; byId: Map<string, VariantRef> }> {
  const products = await getCatalogForAdmin();
  const order = (s: string) => Number(s.split("-")[0]) || 999;
  const models = products.map((p) => ({
    code: p.code,
    variants: [...p.variants]
      .sort((a, b) => order(a.sizeLabel) - order(b.sizeLabel))
      .map((v) => ({ id: v.id, code: p.code, size: v.sizeLabel, sku: v.sku, label: `${p.code} · ${v.sizeLabel}` })),
  }));
  return { models, byId: new Map(models.flatMap((m) => m.variants.map((v) => [v.id, v] as const))) };
}

// ───────── stok ─────────

export type Location = { id: string; code: string; name: string; kind: string; active: boolean };

export async function getLocations(): Promise<Location[]> {
  if (!live()) return isPreview() ? previewOps.locations : [];
  const { data } = await db().from("stock_locations").select("id, code, name, kind, active").order("sort");
  return (data ?? []) as Location[];
}

/** variant_id → location_id → adet */
export async function getStockLevels(): Promise<Map<string, Map<string, number>>> {
  const rows = !live()
    ? isPreview()
      ? previewOps.levels
      : []
    : await all<{ variant_id: string; location_id: string; qty: number }>((f, t) => db().from("stock_levels").select("variant_id, location_id, qty").range(f, t));
  const map = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!map.has(r.variant_id)) map.set(r.variant_id, new Map());
    map.get(r.variant_id)!.set(r.location_id, r.qty);
  }
  return map;
}

export type Movement = {
  id: string;
  variant_id: string;
  from_location: string | null;
  to_location: string | null;
  qty: number;
  kind: MovementKind;
  occurred_on: string;
  note: string;
  ref_type: string | null;
  created_by: string | null;
  created_at: string;
};

export async function getMovements(limit = 150): Promise<Movement[]> {
  if (!live()) return isPreview() ? previewOps.movements : [];
  const { data } = await db()
    .from("stock_movements")
    .select("id, variant_id, from_location, to_location, qty, kind, occurred_on, note, ref_type, created_by, created_at")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Movement[];
}

export async function getLowStockLimit(): Promise<number> {
  if (!live()) return 10;
  const { data } = await db().from("store_settings").select("value").eq("key", "private.ops").maybeSingle();
  return Number((data?.value as { low_stock?: number })?.low_stock ?? 10);
}

// ───────── sevkiyatlar ─────────

export type Shipment = {
  id: string;
  number: number;
  channel: Channel | null;
  from_location: string;
  to_location: string;
  reference: string;
  status: ShipStatus;
  shipped_on: string | null;
  received_on: string | null;
  carrier: string;
  tracking: string;
  box_count: number | null;
  cost_kurus: number;
  note: string;
  created_by: string | null;
  created_at: string;
  items: { id: string; variant_id: string; qty_sent: number; qty_received: number | null }[];
};

const SHIP_SELECT = "id, number, channel, from_location, to_location, reference, status, shipped_on, received_on, carrier, tracking, box_count, cost_kurus, note, created_by, created_at, items:shipment_items(id, variant_id, qty_sent, qty_received)";

export async function getShipments(): Promise<Shipment[]> {
  if (!live()) return isPreview() ? previewOps.shipments : [];
  const { data } = await db().from("shipments").select(SHIP_SELECT).order("created_at", { ascending: false }).limit(200);
  return (data ?? []) as unknown as Shipment[];
}

export async function getShipment(id: string): Promise<Shipment | null> {
  if (!live()) return isPreview() ? (previewOps.shipments.find((s) => s.id === id) ?? null) : null;
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db().from("shipments").select(SHIP_SELECT).eq("id", id).maybeSingle();
  return (data as unknown as Shipment) ?? null;
}

// ───────── satışlar ─────────

export type ChannelRow = { code: Channel; name: string; stock_location_id: string | null; import_mapping: Record<string, string> };

export async function getChannels(): Promise<ChannelRow[]> {
  if (!live()) return isPreview() ? previewOps.channels : [];
  const { data } = await db().from("sales_channels").select("code, name, stock_location_id, import_mapping").order("sort");
  return (data ?? []) as ChannelRow[];
}

export type Sale = {
  id: string;
  channel: Channel;
  order_no: string;
  type: "satis" | "iade";
  sold_on: string;
  variant_id: string | null;
  external_sku: string;
  product_title: string;
  qty: number;
  gross_kurus: number;
  commission_kurus: number;
  shipping_kurus: number;
  other_fee_kurus: number;
  net_kurus: number;
  import_id: string | null;
};

const SALE_COLS = "id, channel, order_no, type, sold_on, variant_id, external_sku, product_title, qty, gross_kurus, commission_kurus, shipping_kurus, other_fee_kurus, net_kurus, import_id";

export async function getSales(from: string, to: string, channel?: string): Promise<Sale[]> {
  if (!live()) return isPreview() ? previewOps.sales.filter((s) => s.sold_on >= from && s.sold_on <= to && (!channel || s.channel === channel)) : [];
  return all<Sale>((f, t) => {
    let q = db().from("sales").select(SALE_COLS).gte("sold_on", from).lte("sold_on", to);
    if (channel) q = q.eq("channel", channel);
    return q.order("sold_on", { ascending: false }).order("created_at", { ascending: false }).range(f, t);
  });
}

export async function getUnmatchedSkus(): Promise<{ channel: Channel; sku: string; title: string; rows: number }[]> {
  if (!live()) return [];
  const rows = await all<{ channel: Channel; external_sku: string; product_title: string }>((f, t) =>
    db().from("sales").select("channel, external_sku, product_title").is("variant_id", null).range(f, t),
  );
  const m = new Map<string, { channel: Channel; sku: string; title: string; rows: number }>();
  for (const r of rows) {
    const k = `${r.channel}|${r.external_sku}`;
    const e = m.get(k) ?? { channel: r.channel, sku: r.external_sku, title: r.product_title, rows: 0 };
    e.rows += 1;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.rows - a.rows);
}

export async function getImports(): Promise<{ id: string; channel: Channel; file_name: string; row_count: number; inserted: number; skipped: number; created_by: string | null; created_at: string }[]> {
  if (!live()) return [];
  const { data } = await db().from("sale_imports").select("*").order("created_at", { ascending: false }).limit(20);
  return data ?? [];
}

// ───────── muhasebe ─────────

export type Category = { id: string; name: string; kind: "gelir" | "gider"; in_pnl: boolean; active: boolean };
export type Counterparty = { id: string; name: string; kind: string; phone: string; email: string; note: string; active: boolean };
export type Entry = {
  id: string;
  kind: LedgerKind;
  category_id: string | null;
  counterparty_id: string | null;
  amount_kurus: number;
  occurred_on: string;
  status: "odendi" | "bekliyor";
  due_on: string | null;
  method: string;
  description: string;
  file_path: string | null;
  ref_type: string | null;
  created_by: string | null;
  created_at: string;
};

export async function getCategories(): Promise<Category[]> {
  if (!live()) return isPreview() ? previewOps.categories : [];
  const { data } = await db().from("finance_categories").select("id, name, kind, in_pnl, active").order("kind").order("sort");
  return (data ?? []) as Category[];
}

export async function getCounterparties(): Promise<Counterparty[]> {
  if (!live()) return isPreview() ? previewOps.counterparties : [];
  const { data } = await db().from("counterparties").select("id, name, kind, phone, email, note, active").order("kind").order("name");
  return (data ?? []) as Counterparty[];
}

const ENTRY_COLS = "id, kind, category_id, counterparty_id, amount_kurus, occurred_on, status, due_on, method, description, file_path, ref_type, created_by, created_at";

export async function getEntries(from: string, to: string): Promise<Entry[]> {
  if (!live()) return isPreview() ? previewOps.entries.filter((e) => e.occurred_on >= from && e.occurred_on <= to) : [];
  return all<Entry>((f, t) => db().from("ledger_entries").select(ENTRY_COLS).gte("occurred_on", from).lte("occurred_on", to).order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).range(f, t));
}

/** Tüm zamanların bekleyen kayıtları ve cari bakiyeleri için. */
export async function getAllEntries(): Promise<Entry[]> {
  if (!live()) return isPreview() ? previewOps.entries : [];
  return all<Entry>((f, t) => db().from("ledger_entries").select(ENTRY_COLS).order("occurred_on", { ascending: false }).range(f, t));
}

// ───────── maliyet ─────────

export type UnitCost = { id: string; product_id: string; label: string; amount_kurus: number };

export async function getUnitCosts(): Promise<UnitCost[]> {
  if (!live()) return isPreview() ? previewOps.unitCosts : [];
  const { data } = await db().from("unit_costs").select("id, product_id, label, amount_kurus").order("sort").order("created_at");
  return (data ?? []) as UnitCost[];
}

// ───────── reklam ─────────

export type AdRow = { id: string; platform: AdPlatform; month: string; budget_kurus: number; spent_kurus: number; ad_sales_kurus: number | null; note: string };

export async function getAdSpend(fromMonth: string): Promise<AdRow[]> {
  if (!live()) return isPreview() ? previewOps.ads.filter((a) => a.month >= `${fromMonth}-01`) : [];
  const { data } = await db().from("ad_spend").select("id, platform, month, budget_kurus, spent_kurus, ad_sales_kurus, note").gte("month", `${fromMonth}-01`).order("month", { ascending: false });
  return (data ?? []) as AdRow[];
}

// ───────── sosyal medya ─────────

export type SocialAccount = { id: string; platform: SocialPlatform; handle: string; url: string; stats: { month: string; followers: number; posts: number | null }[] };
export type ContentItem = { id: string; platform: SocialPlatform; planned_on: string; title: string; caption: string; status: ContentStatus; assignee: string | null; link: string };

export async function getSocial(): Promise<SocialAccount[]> {
  if (!live()) return isPreview() ? previewOps.social : [];
  const { data } = await db().from("social_accounts").select("id, platform, handle, url, stats:social_stats(month, followers, posts)").order("sort");
  return ((data ?? []) as unknown as SocialAccount[]).map((a) => ({ ...a, stats: [...a.stats].sort((x, y) => x.month.localeCompare(y.month)) }));
}

export async function getContent(from: string, to: string): Promise<ContentItem[]> {
  if (!live()) return isPreview() ? previewOps.content : [];
  const { data } = await db().from("content_plan").select("id, platform, planned_on, title, caption, status, assignee, link").gte("planned_on", from).lte("planned_on", to).order("planned_on");
  return (data ?? []) as ContentItem[];
}

// ───────── görevler ─────────

export type Task = { id: string; title: string; note: string; assignee: string | null; due_on: string | null; done: boolean; done_at: string | null; created_by: string | null; created_at: string };

export async function getTasks(): Promise<Task[]> {
  if (!live()) return isPreview() ? previewOps.tasks : [];
  const { data } = await db().from("team_tasks").select("*").order("done").order("due_on", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false }).limit(300);
  return (data ?? []) as Task[];
}

// ───────── işlem geçmişi ─────────

export type AuditRow = { id: number; admin_id: string | null; action: string; entity: string; entity_id: string | null; diff: Record<string, unknown>; created_at: string };

export async function getAudit(limit = 200, adminId?: string): Promise<AuditRow[]> {
  if (!live()) return isPreview() ? previewOps.audit : [];
  let q = db().from("audit_log").select("id, admin_id, action, entity, entity_id, diff, created_at").order("created_at", { ascending: false }).limit(limit);
  if (adminId) q = q.eq("admin_id", adminId);
  const { data } = await q;
  return (data ?? []) as AuditRow[];
}

// ───────── yardımcılar ─────────

export function currentMonth(): string {
  return todayTR().slice(0, 7);
}

export function monthRange(ym: string): [string, string] {
  return [`${ym}-01`, monthEnd(ym)];
}

export function lastMonths(n: number, end = currentMonth()): string[] {
  return Array.from({ length: n }, (_, i) => shiftMonth(end, i - n + 1));
}

/** Satış adetleri: iade düşülmüş net adet. */
export function netUnits(s: Pick<Sale, "type" | "qty">): number {
  return s.type === "iade" ? -s.qty : s.qty;
}

/** Satırın kâra etkisi: iade satırları negatif sayılır. */
export function netAmount(s: Pick<Sale, "type" | "net_kurus">): number {
  return s.type === "iade" ? -s.net_kurus : s.net_kurus;
}
export function grossAmount(s: Pick<Sale, "type" | "gross_kurus">): number {
  return s.type === "iade" ? -s.gross_kurus : s.gross_kurus;
}
