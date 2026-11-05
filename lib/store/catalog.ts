import { cache } from "react";
import { isPreview, supabaseConfigured } from "@/lib/env";
import { SALES_ENABLED } from "@/lib/features";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { previewFaqs, previewProducts, previewSettings } from "./preview";
import type { Claim, Faq, Product, ProductSlug, StoreSettings } from "./types";

const FALLBACK_IMAGES: Record<ProductSlug, Product["images"]> = {
  m100: previewProducts[0].images,
  m300: previewProducts[1].images,
  m900: previewProducts[2].images,
};

/** Supabase yokken (ve önizleme kapalıyken) ürün kimlikleri satışa kapalı olarak görünür. */
function offlineCatalog(): Product[] {
  // Satış kapalıyken numara ve fiyat yalnızca bilgi amaçlı gösterilir.
  if (!SALES_ENABLED) return previewProducts;
  return previewProducts.map((p) => ({ ...p, status: "draft", variants: [] }));
}

type Row = Record<string, unknown>;

function mapProduct(row: Row): Product {
  const images = ((row.product_images as Row[]) ?? [])
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((i) => ({ src: String(i.path), alt: String(i.alt ?? "") }));
  const slug = String(row.slug) as ProductSlug;
  return {
    id: String(row.id),
    code: row.code as Product["code"],
    slug,
    name: String(row.name),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    status: row.status as Product["status"],
    sizeGuide: String(row.size_guide ?? ""),
    images: images.length ? images : FALLBACK_IMAGES[slug] ?? [],
    features: ((row.product_features as Row[]) ?? [])
      .filter((f) => f.verified)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((f) => ({ label: String(f.label), body: String(f.body ?? "") })),
    variants: ((row.product_variants as Row[]) ?? [])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((v) => ({
        id: String(v.id),
        sizeLabel: String(v.size_label),
        sku: String(v.sku),
        priceKurus: Number(v.price_kurus),
        compareAtKurus: v.compare_at_kurus == null ? null : Number(v.compare_at_kurus),
        stock: Number(v.stock),
        active: Boolean(v.active),
      })),
    seoTitle: (row.seo_title as string) ?? null,
    seoDescription: (row.seo_description as string) ?? null,
  };
}

const SELECT =
  "id, code, slug, name, tagline, description, status, size_guide, sort_order, seo_title, seo_description, product_images(path, alt, sort_order), product_features(label, body, verified, sort_order), product_variants(id, size_label, sku, price_kurus, compare_at_kurus, stock, active, sort_order)";

/** Mağaza vitrini: herkese açık ürünler, yalnızca aktif varyantlar. */
export const getCatalog = cache(async (): Promise<Product[]> => {
  if (isPreview()) return previewProducts;
  if (!supabaseConfigured()) return offlineCatalog();
  const { data, error } = await supabaseAdmin().from("products").select(SELECT).order("sort_order");
  if (error || !data) {
    console.error("[catalog]", error?.message);
    return offlineCatalog();
  }
  return data.map((row) => {
    const p = mapProduct(row);
    // Satış kapalıyken taslak ürünler de tanıtılır; yalnızca arşivlenenler gizlenir.
    const visible = SALES_ENABLED ? p.status === "published" : p.status !== "archived";
    if (!visible) return { ...p, variants: [] };
    return { ...p, variants: p.variants.filter((v) => v.active) };
  });
});

/** Yönetim paneli: tüm ürünler, tüm varyantlar ve doğrulanmamış özellikler dahil. */
export async function getCatalogForAdmin(): Promise<(Product & { allFeatures: { id: string; label: string; body: string; verified: boolean }[] })[]> {
  if (!supabaseConfigured()) return (isPreview() ? previewProducts : offlineCatalog()).map((p) => ({ ...p, allFeatures: [] }));
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select(SELECT.replace("product_features(label, body, verified, sort_order)", "product_features(id, label, body, verified, sort_order)"))
    .order("sort_order");
  if (error || !data) throw new Error(error?.message ?? "Ürünler okunamadı");
  return (data as unknown as Row[]).map((row) => ({
    ...mapProduct(row),
    allFeatures: ((row.product_features as Row[]) ?? [])
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map((f) => ({ id: String(f.id), label: String(f.label), body: String(f.body ?? ""), verified: Boolean(f.verified) })),
  }));
}

export async function getProduct(slug: string): Promise<Product | null> {
  const all = await getCatalog();
  return all.find((p) => p.slug === slug) ?? null;
}

export function isSellable(p: Product): boolean {
  return p.status === "published" && p.variants.some((v) => v.active && v.stock > 0);
}

export function fromPrice(p: Product): number | null {
  const prices = p.variants.filter((v) => v.active).map((v) => v.priceKurus);
  return prices.length ? Math.min(...prices) : null;
}

const DEFAULT_SETTINGS: StoreSettings = {
  ...previewSettings,
  shipping: { feeKurus: null, freeThresholdKurus: null, carrier: "", leadTimeText: "" },
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export const getSettings = cache(async (): Promise<StoreSettings> => {
  if (isPreview()) return previewSettings;
  if (!supabaseConfigured()) return DEFAULT_SETTINGS;
  const { data, error } = await supabaseAdmin().from("store_settings").select("key, value").like("key", "public.%");
  if (error || !data) return DEFAULT_SETTINGS;
  const map = Object.fromEntries(data.map((r) => [r.key, r.value])) as Record<string, Row>;
  const ship = map["public.shipping"] ?? {};
  const seller = map["public.seller"] ?? {};
  const mk = map["public.marketplaces"] ?? {};
  const finder = (map["public.finder"] ?? {}) as Row;
  const ann = map["public.announcement"] ?? {};
  const claims = Array.isArray(map["public.claims"]) ? (map["public.claims"] as unknown as Row[]) : [];
  const slug = (v: unknown, d: ProductSlug): ProductSlug => (v === "m100" || v === "m300" || v === "m900" ? v : d);
  return {
    shipping: {
      feeKurus: numOrNull(ship.fee_kurus),
      freeThresholdKurus: numOrNull(ship.free_threshold_kurus),
      carrier: str(ship.carrier),
      leadTimeText: str(ship.lead_time_text),
    },
    seller: {
      address: str(seller.address),
      phone: str(seller.phone),
      email: str(seller.email),
      taxOffice: str(seller.tax_office),
      taxNumber: str(seller.tax_number),
      mersis: str(seller.mersis),
      etbis: str(seller.etbis),
    },
    marketplaces: {
      amazon: str(mk.amazon),
      trendyol: str(mk.trendyol),
      hepsiburada: str(mk.hepsiburada),
      instagram: str(mk.instagram),
      x: str(mk.x),
    },
    claims: claims
      .map((c): Claim => ({ text: str(c.text), evidenceUrl: str(c.evidence_url), date: str(c.date), active: Boolean(c.active) }))
      .filter((c) => c.text && c.evidenceUrl && c.date),
    finder: {
      gunluk: slug(finder.gunluk, "m100"),
      ayakta: slug(finder.ayakta, "m300"),
      tempo: slug(finder.tempo, "m900"),
    },
    announcement: { text: str(ann.text), active: Boolean(ann.active) },
  };
});

export const getFaqs = cache(async (): Promise<Faq[]> => {
  if (!supabaseConfigured()) return previewFaqs;
  const { data } = await supabaseAdmin()
    .from("faq_items")
    .select("id, question, answer")
    .eq("published", true)
    .order("sort_order");
  return data?.length ? data.map((f) => ({ id: String(f.id), question: f.question, answer: f.answer })) : previewFaqs;
});
