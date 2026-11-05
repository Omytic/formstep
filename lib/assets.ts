export type AssetRole = "primary" | "secondary" | "logo" | "logo-on-dark";

export type AssetRecord = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  role: AssetRole;
  productSlug: "m100" | "m300" | "m900" | null;
  notes: string;
};

/**
 * Inspected on disk (Nov 2026):
 * logo.png is a dark wordmark on transparency (light backgrounds).
 * logo-white.png is the solid white wordmark (dark backgrounds).
 * Product PNGs are 2000×2000 RGBA. There is no m400.png in this tree.
 * Historical brief: a file once called m400.png is the M300 product.
 * The file present for that product is public/assets/products/m300.png.
 * Product pixels are not recolored or redrawn.
 */
export const assets = {
  logo: {
    id: "logo",
    src: "/assets/brand/logo.png",
    width: 1789,
    height: 401,
    alt: "FormStep",
    role: "logo",
    productSlug: null,
    notes: "Koyu wordmark, açık zemin.",
  },
  logoOnDark: {
    id: "logo-white",
    src: "/assets/brand/logo-white.png",
    width: 1789,
    height: 401,
    alt: "FormStep",
    role: "logo-on-dark",
    productSlug: null,
    notes: "Beyaz wordmark, koyu zemin. Tipografi yeniden çizilmedi.",
  },
  m100: {
    id: "m100",
    src: "/assets/products/m100.png",
    width: 2000,
    height: 2000,
    alt: "FormStep M100 gri tabanlık, topuk baskısı görünecek şekilde çapraz açı",
    role: "primary",
    productSlug: "m100",
    notes: "Gri dokulu yüzey, mavi kenar.",
  },
  m100Alt: {
    id: "m100-2",
    src: "/assets/products/m100-2.png",
    width: 2000,
    height: 2000,
    alt: "FormStep M100 gri tabanlık, üstten görünüm",
    role: "secondary",
    productSlug: "m100",
    notes: "Üstten görünüm.",
  },
  m300: {
    id: "m300",
    src: "/assets/products/m300.png",
    width: 2000,
    height: 2000,
    alt: "FormStep M300 siyah tabanlık, mavi kenar ve topuk çukuru",
    role: "primary",
    productSlug: "m300",
    notes:
      "Tek kare. Eski m400 dosya adı bu ürünün yanlış etiketidir; kimlik M300 olarak kalır.",
  },
  m900: {
    id: "m900",
    src: "/assets/products/m900.png",
    width: 2000,
    height: 2000,
    alt: "FormStep M900 mavi tabanı görünen, esnetilmiş tabanlık",
    role: "primary",
    productSlug: "m900",
    notes: "Esnetilmiş kare, mavi taban.",
  },
  m900Alt: {
    id: "m900-2",
    src: "/assets/products/m900-2.png",
    width: 2000,
    height: 2000,
    alt: "FormStep M900 siyah dokulu yüzey ve mavi taban, üstten görünüm",
    role: "secondary",
    productSlug: "m900",
    notes: "Siyah dokulu üst yüzey, mavi taban.",
  },
} as const satisfies Record<string, AssetRecord>;

export const assetList: AssetRecord[] = Object.values(assets);

export function assetsForProduct(slug: "m100" | "m300" | "m900"): AssetRecord[] {
  return assetList.filter((asset) => asset.productSlug === slug);
}
