import { supabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "payment_failed"
  | "expired"
  | "stock_issue";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Ödeme bekleniyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
  payment_failed: "Ödeme başarısız",
  expired: "Süresi doldu",
  stock_issue: "Stok sorunu",
};

export const STATUS_TONE: Record<OrderStatus, "neutral" | "good" | "warn" | "bad" | "info"> = {
  pending_payment: "warn",
  paid: "good",
  preparing: "info",
  shipped: "info",
  delivered: "good",
  cancelled: "neutral",
  refunded: "neutral",
  payment_failed: "bad",
  expired: "neutral",
  stock_issue: "bad",
};

/** Müşterinin gördüğü ilerleme adımları. */
export const PROGRESS: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

export type OrderItem = {
  productCode: string;
  productName: string;
  sizeLabel: string;
  sku: string;
  unitKurus: number;
  qty: number;
};

export type OrderEvent = { toStatus: string; actor: string; note: string; at: string };

export type Order = {
  id: string;
  number: string;
  merchantOid: string;
  publicToken: string;
  userId: string | null;
  email: string;
  phone: string;
  fullName: string;
  address: { city: string; district: string; line: string; postal_code?: string };
  billing: Record<string, string>;
  subtotalKurus: number;
  discountKurus: number;
  shippingKurus: number;
  totalKurus: number;
  couponCode: string | null;
  status: OrderStatus;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  invoiceNo: string | null;
  internalNote: string;
  failedReason: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  items: OrderItem[];
  events: OrderEvent[];
};

type Row = Record<string, unknown>;

export const ORDER_SELECT =
  "id, number, merchant_oid, public_token, user_id, email, phone, full_name, shipping_address, billing, subtotal_kurus, discount_kurus, shipping_kurus, total_kurus, coupon_code, status, tracking_carrier, tracking_number, invoice_no, internal_note, failed_reason, created_at, paid_at, shipped_at, order_items(product_code, product_name, size_label, sku, unit_price_kurus, qty), order_events(to_status, actor, note, created_at)";

export function mapOrder(r: Row): Order {
  return {
    id: String(r.id),
    number: String(r.number),
    merchantOid: String(r.merchant_oid),
    publicToken: String(r.public_token),
    userId: (r.user_id as string) ?? null,
    email: String(r.email),
    phone: String(r.phone),
    fullName: String(r.full_name),
    address: (r.shipping_address as Order["address"]) ?? { city: "", district: "", line: "" },
    billing: (r.billing as Record<string, string>) ?? {},
    subtotalKurus: Number(r.subtotal_kurus),
    discountKurus: Number(r.discount_kurus),
    shippingKurus: Number(r.shipping_kurus),
    totalKurus: Number(r.total_kurus),
    couponCode: (r.coupon_code as string) ?? null,
    status: r.status as OrderStatus,
    trackingCarrier: (r.tracking_carrier as string) ?? null,
    trackingNumber: (r.tracking_number as string) ?? null,
    invoiceNo: (r.invoice_no as string) ?? null,
    internalNote: String(r.internal_note ?? ""),
    failedReason: (r.failed_reason as string) ?? null,
    createdAt: String(r.created_at),
    paidAt: (r.paid_at as string) ?? null,
    shippedAt: (r.shipped_at as string) ?? null,
    items: ((r.order_items as Row[]) ?? []).map((i) => ({
      productCode: String(i.product_code),
      productName: String(i.product_name),
      sizeLabel: String(i.size_label),
      sku: String(i.sku),
      unitKurus: Number(i.unit_price_kurus),
      qty: Number(i.qty),
    })),
    events: ((r.order_events as Row[]) ?? [])
      .map((e) => ({ toStatus: String(e.to_status), actor: String(e.actor), note: String(e.note ?? ""), at: String(e.created_at) }))
      .sort((a, b) => a.at.localeCompare(b.at)),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Misafir sipariş sayfası: tahmin edilemez belirteçle erişim. */
export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!supabaseConfigured() || !UUID.test(token)) return null;
  const { data } = await supabaseAdmin().from("orders").select(ORDER_SELECT).eq("public_token", token).maybeSingle();
  return data ? mapOrder(data) : null;
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (!supabaseConfigured()) return [];
  const { data } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .neq("status", "expired")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map(mapOrder);
}

export async function getOrderForUser(id: string, userId: string): Promise<Order | null> {
  if (!supabaseConfigured() || !UUID.test(id)) return null;
  const { data } = await supabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data ? mapOrder(data) : null;
}

export function formatDate(iso: string, withTime = false): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Istanbul",
  }).format(new Date(iso));
}
