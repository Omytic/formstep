import { isPreview, supabaseConfigured } from "@/lib/env";
import { mapOrder, ORDER_SELECT, type Order, type OrderStatus } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PAID_STATES: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

export type Dashboard = {
  revenue: { today: number; week: number; month: number };
  orders: { today: number; week: number; month: number; toShip: number; stockIssue: number };
  units: Record<string, number>;
  recent: Order[];
  lowStock: { product: string; size: string; stock: number }[];
};

function since(days: number): string {
  const d = new Date();
  if (days === 0) {
    const ist = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
    return new Date(`${ist}T00:00:00+03:00`).toISOString();
  }
  return new Date(d.getTime() - days * 86400_000).toISOString();
}

export async function getDashboard(): Promise<Dashboard> {
  const empty: Dashboard = { revenue: { today: 0, week: 0, month: 0 }, orders: { today: 0, week: 0, month: 0, toShip: 0, stockIssue: 0 }, units: {}, recent: [], lowStock: [] };
  if (!supabaseConfigured()) return empty;
  const db = supabaseAdmin();
  const [{ data: month }, { data: recent }, { data: variants }, { data: notify }] = await Promise.all([
    db.from("orders").select("total_kurus, paid_at, status, order_items(product_code, qty)").in("status", PAID_STATES).gte("paid_at", since(30)),
    db.from("orders").select(ORDER_SELECT).neq("status", "expired").order("created_at", { ascending: false }).limit(8),
    db.from("product_variants").select("size_label, stock, active, products(name)").eq("active", true).order("stock"),
    db.from("store_settings").select("value").eq("key", "private.notify").maybeSingle(),
  ]);
  const lowLimit = Number((notify?.value as Record<string, unknown>)?.low_stock ?? 5);
  const t0 = since(0);
  const w0 = since(7);
  const d = { ...empty, revenue: { ...empty.revenue }, orders: { ...empty.orders }, units: {} as Record<string, number> };
  for (const o of month ?? []) {
    const paid = String(o.paid_at);
    d.revenue.month += o.total_kurus;
    d.orders.month += 1;
    if (paid >= w0) {
      d.revenue.week += o.total_kurus;
      d.orders.week += 1;
    }
    if (paid >= t0) {
      d.revenue.today += o.total_kurus;
      d.orders.today += 1;
    }
    for (const i of (o.order_items as { product_code: string; qty: number }[]) ?? []) d.units[i.product_code] = (d.units[i.product_code] ?? 0) + i.qty;
  }
  const [{ count: toShip }, { count: stockIssue }] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "preparing"]),
    db.from("orders").select("id", { count: "exact", head: true }).eq("status", "stock_issue"),
  ]);
  d.orders.toShip = toShip ?? 0;
  d.orders.stockIssue = stockIssue ?? 0;
  d.recent = (recent ?? []).map(mapOrder);
  d.lowStock = (variants ?? [])
    .filter((v) => v.stock <= lowLimit)
    .map((v) => ({ product: String((v.products as unknown as { name: string })?.name ?? ""), size: v.size_label, stock: v.stock }));
  return d;
}

export async function listOrders(opts: { status?: string; q?: string; page?: number }): Promise<{ orders: Order[]; total: number }> {
  if (!supabaseConfigured()) return { orders: [], total: 0 };
  const page = Math.max(1, opts.page ?? 1);
  let query = supabaseAdmin().from("orders").select(ORDER_SELECT, { count: "exact" }).order("created_at", { ascending: false });
  if (opts.status === "acik") query = query.in("status", ["paid", "preparing", "stock_issue"]);
  else if (opts.status && opts.status !== "hepsi") query = query.eq("status", opts.status);
  else query = query.neq("status", "expired");
  if (opts.q) {
    const q = opts.q.replace(/[%,()]/g, "").slice(0, 60);
    query = query.or(`number.ilike.%${q}%,email.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const { data, count } = await query.range((page - 1) * 25, page * 25 - 1);
  return { orders: (data ?? []).map(mapOrder), total: count ?? 0 };
}

export async function getAdminOrder(id: string) {
  if (!supabaseConfigured()) return null;
  const db = supabaseAdmin();
  const { data } = await db.from("orders").select(`${ORDER_SELECT}, legal_snapshot, marketing_consent`).eq("id", id).maybeSingle();
  if (!data) return null;
  const { data: callbacks } = await db.from("payment_callbacks").select("status, total_amount, hash_valid, outcome, received_at").eq("merchant_oid", data.merchant_oid).order("received_at", { ascending: false });
  return { order: mapOrder(data), legal: data.legal_snapshot as Record<string, unknown>, marketing: Boolean(data.marketing_consent), callbacks: callbacks ?? [] };
}

export type CouponRow = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  minSubtotalKurus: number;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  maxUsesPerEmail: number | null;
  usedCount: number;
  active: boolean;
  note: string;
};

export async function listCoupons(): Promise<CouponRow[]> {
  if (!supabaseConfigured()) return [];
  const { data } = await supabaseAdmin().from("coupons").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    kind: c.kind,
    value: c.value,
    minSubtotalKurus: c.min_subtotal_kurus,
    startsAt: c.starts_at,
    endsAt: c.ends_at,
    maxUses: c.max_uses,
    maxUsesPerEmail: c.max_uses_per_email,
    usedCount: c.used_count,
    active: c.active,
    note: c.note,
  }));
}

export async function getSettingsRaw(): Promise<Record<string, Record<string, unknown> | unknown[]>> {
  if (!supabaseConfigured()) return {};
  const { data } = await supabaseAdmin().from("store_settings").select("key, value");
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export async function listFaqs() {
  if (!supabaseConfigured()) return [];
  const { data } = await supabaseAdmin().from("faq_items").select("*").order("sort_order");
  return data ?? [];
}

export async function listLegalOverrides() {
  if (!supabaseConfigured()) return [];
  const { data } = await supabaseAdmin().from("legal_pages").select("slug, title, body, published, version, updated_at");
  return data ?? [];
}

export async function listAudit() {
  if (!supabaseConfigured()) return [];
  const { data } = await supabaseAdmin().from("audit_log").select("action, entity, entity_id, created_at, admin_id").order("created_at", { ascending: false }).limit(100);
  return data ?? [];
}

export const preview = isPreview;
