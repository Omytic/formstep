export type ProductSlug = "m100" | "m300" | "m900";

export type Variant = {
  id: string;
  sizeLabel: string;
  sku: string;
  priceKurus: number;
  compareAtKurus: number | null;
  stock: number;
  active: boolean;
};

export type ProductImage = { src: string; alt: string };

export type Feature = { label: string; body: string };

export type Product = {
  id: string;
  code: "M100" | "M300" | "M900";
  slug: ProductSlug;
  name: string;
  tagline: string;
  description: string;
  status: "draft" | "published" | "archived";
  sizeGuide: string;
  images: ProductImage[];
  features: Feature[];
  variants: Variant[];
  seoTitle: string | null;
  seoDescription: string | null;
};

export type Shipping = {
  feeKurus: number | null;
  freeThresholdKurus: number | null;
  carrier: string;
  leadTimeText: string;
};

export type Seller = {
  address: string;
  phone: string;
  email: string;
  taxOffice: string;
  taxNumber: string;
  mersis: string;
  etbis: string;
};

export type Marketplaces = {
  amazon: string;
  trendyol: string;
  hepsiburada: string;
  instagram: string;
  x: string;
};

export type Claim = { text: string; evidenceUrl: string; date: string; active: boolean };

export type Faq = { id: string; question: string; answer: string };

export type StoreSettings = {
  shipping: Shipping;
  seller: Seller;
  marketplaces: Marketplaces;
  claims: Claim[];
  finder: Record<"gunluk" | "ayakta" | "tempo", ProductSlug>;
  announcement: { text: string; active: boolean };
};

export type CartLine = { variantId: string; qty: number };

export type QuoteLine = {
  variantId: string;
  slug: ProductSlug;
  code: string;
  name: string;
  sizeLabel: string;
  sku: string;
  image: string;
  unitKurus: number;
  qty: number;
  lineKurus: number;
  maxQty: number;
};

export type Quote = {
  lines: QuoteLine[];
  problems: string[];
  subtotalKurus: number;
  discountKurus: number;
  couponCode: string | null;
  couponError: string | null;
  shippingKurus: number | null;
  freeShippingRemainingKurus: number | null;
  totalKurus: number;
  canCheckout: boolean;
};
