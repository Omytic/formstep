/** Operasyon panelindeki sabit seçenekler ve Türkçe etiketleri (hem sunucu hem tarayıcı kullanır). */

export const CHANNELS = {
  amazon: "Amazon",
  trendyol: "Trendyol",
  hepsiburada: "Hepsiburada",
  diger: "Diğer / elden",
} as const;
export type Channel = keyof typeof CHANNELS;

export const LOCATION_KINDS = {
  depo: "Depo",
  amazon: "Amazon",
  trendyol: "Trendyol",
  hepsiburada: "Hepsiburada",
  diger: "Diğer",
} as const;

export const MOVEMENT_KINDS = {
  giris: "Stok girişi",
  transfer: "Transfer",
  iade: "İade",
  fire: "Fire / kayıp",
  sayim: "Sayım düzeltmesi",
  duzeltme: "Düzeltme",
} as const;
export type MovementKind = keyof typeof MOVEMENT_KINDS;

export const SHIP_STATUS = {
  hazirlaniyor: { label: "Hazırlanıyor", tone: "bg-ink/5 text-ink/60" },
  yolda: { label: "Yolda", tone: "bg-blue/10 text-blue" },
  teslim: { label: "Teslim alındı", tone: "bg-good/10 text-good" },
  eksik: { label: "Eksik / fark var", tone: "bg-warn/10 text-warn" },
  iptal: { label: "İptal", tone: "bg-bad/10 text-bad" },
} as const;
export type ShipStatus = keyof typeof SHIP_STATUS;

export const LEDGER_KINDS = {
  gelir: { label: "Gelir", sign: 1, tone: "text-good" },
  gider: { label: "Gider", sign: -1, tone: "text-bad" },
  ortak_giris: { label: "Ortak para koydu", sign: 1, tone: "text-blue" },
  ortak_cikis: { label: "Ortak para çekti", sign: -1, tone: "text-warn" },
} as const;
export type LedgerKind = keyof typeof LEDGER_KINDS;

export const PAY_METHODS = { banka: "Banka", nakit: "Nakit", kart: "Kredi kartı", pazaryeri: "Pazaryeri", diger: "Diğer" } as const;

export const COUNTERPARTY_KINDS = {
  tedarikci: "Tedarikçi / üretici",
  pazaryeri: "Pazaryeri",
  ortak: "Ortak",
  hizmet: "Hizmet sağlayıcı",
  diger: "Diğer",
} as const;

export const AD_PLATFORMS = {
  amazon: "Amazon reklamları",
  trendyol: "Trendyol reklamları",
  hepsiburada: "Hepsiburada reklamları",
  meta: "Instagram / Facebook",
  google: "Google",
  tiktok: "TikTok",
  diger: "Diğer",
} as const;
export type AdPlatform = keyof typeof AD_PLATFORMS;

export const SOCIAL_PLATFORMS = {
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  diger: "Diğer",
} as const;
export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

export const CONTENT_STATUS = {
  fikir: { label: "Fikir", tone: "bg-ink/5 text-ink/60" },
  hazirlaniyor: { label: "Hazırlanıyor", tone: "bg-warn/10 text-warn" },
  planlandi: { label: "Planlandı", tone: "bg-blue/10 text-blue" },
  paylasildi: { label: "Paylaşıldı", tone: "bg-good/10 text-good" },
} as const;
export type ContentStatus = keyof typeof CONTENT_STATUS;

/** Excel içe aktarmada eşlenecek alanlar. */
export const IMPORT_FIELDS = [
  { key: "order_no", label: "Sipariş no", required: true },
  { key: "sold_on", label: "Tarih", required: true },
  { key: "sku", label: "SKU / barkod", required: true },
  { key: "title", label: "Ürün adı", required: false },
  { key: "qty", label: "Adet", required: true },
  { key: "gross", label: "Satış tutarı (toplam)", required: true },
  { key: "commission", label: "Komisyon", required: false },
  { key: "shipping", label: "Kargo kesintisi", required: false },
  { key: "other", label: "Diğer kesinti", required: false },
  { key: "status", label: "Durum (iade / iptal)", required: false },
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];
export type ImportMapping = Partial<Record<ImportField, string>>;

/** Satıcı panellerinden indirilen raporlardaki olası sütun adları (küçük harf, içerir). */
export const IMPORT_GUESS: Record<ImportField, string[]> = {
  order_no: ["sipariş numarası", "sipariş no", "siparis no", "order-id", "order id", "amazon-order-id", "paket no"],
  sold_on: ["sipariş tarihi", "siparis tarihi", "tarih", "purchase-date", "order date", "date"],
  sku: ["barkod", "satıcı stok kodu", "stok kodu", "merchant sku", "seller-sku", "sku", "asin"],
  title: ["ürün adı", "urun adi", "ürün ismi", "product-name", "title"],
  qty: ["adet", "miktar", "quantity-purchased", "quantity", "qty"],
  gross: ["faturalanacak tutar", "satış tutarı", "satis tutari", "tutar", "item-price", "total", "fiyat"],
  commission: ["komisyon", "commission", "fee"],
  shipping: ["kargo", "shipping"],
  other: ["hizmet bedeli", "diğer", "other"],
  status: ["sipariş statüsü", "durum", "statü", "status", "order-status"],
};

export const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** "2026-11" → "Kasım 2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_TR[m - 1]} ${y}`;
}

/** İstanbul saatine göre bugünün tarihi (YYYY-MM-DD). */
export function todayTR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Ayın son günü (YYYY-MM-DD). */
export function monthEnd(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return `${day} ${MONTHS_TR[m - 1].slice(0, 3)} ${y}`;
}

/** "2026-11-06" + n gün */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
