import type { Faq, Product, StoreSettings } from "./types";

/**
 * YALNIZCA GELİŞTİRME ÖNİZLEMESİ. Supabase bağlı değilken sitenin akışlarını
 * gezebilmek için kullanılan veriler. Numaralar, fiyat ve kargo ücreti gerçek; stok örnektir;
 * sitede "önizleme" şeridiyle işaretlenir ve canlı ortamda hiçbir zaman yüklenmez.
 */
/** FormStep'in tüm modellerdeki numara aralıkları (gerçek). */
export const SIZES = ["36-37", "37-38", "38-39", "39-40", "40-41", "41-42", "42-43", "43-44", "44-45", "45-48"];
/** Gerçek satış fiyatı: tanesi 200 TL (KDV dahil). */
export const UNIT_PRICE_KURUS = 20000;
const sizes = SIZES;

function variants(code: string, price: number) {
  return sizes.map((size, i) => ({
    id: `preview-${code}-${i}`,
    sizeLabel: size,
    sku: `${code}-${size.replace("-", "")}`,
    priceKurus: price,
    compareAtKurus: null,
    stock: i === sizes.length - 1 ? 3 : 25, // örnek stok
    active: true,
  }));
}

/** FormStep'in gerçek pazaryeri mağazaları. */
export const MARKETPLACES = {
  amazon: "https://www.amazon.com.tr/s?me=A1D8844Z4S0BOA&marketplaceID=A33AVAJ2PDY3EV",
  trendyol: "https://www.trendyol.com/sr?mid=1288801&os=1",
  hepsiburada: "https://www.hepsiburada.com/magaza/omy",
  instagram: "https://www.instagram.com/formsteptr",
  x: "https://x.com/formsteptr",
};

export const BESTSELLER_CLAIM = {
  text: "Amazon Türkiye'nin en çok satan tabanlığı",
  evidenceUrl: "https://www.amazon.com.tr/dp/B0CB71PGHV",
  date: "Amazon Türkiye",
  active: true,
};

export const previewProducts: Product[] = [
  {
    id: "preview-m100",
    code: "M100",
    slug: "m100",
    name: "M100",
    tagline: "Günlük konfor",
    description:
      "M100, FormStep'in her gün kullanılan modeli. Gri dokulu yüzeyi ve memory foam gövdesiyle ayağının şeklini alır; işte, okulda, şehirde gün boyu yumuşak bir zemin sunar.",
    status: "published",
    sizeGuide: "",
    images: [
      { src: "/assets/products/m100-2.png", alt: "FormStep M100 gri tabanlık, üstten görünüm" },
      { src: "/assets/products/m100.png", alt: "FormStep M100 gri tabanlık, yandan görünüm" },
    ],
    features: [],
    variants: variants("M100", UNIT_PRICE_KURUS),
    seoTitle: null,
    seoDescription: null,
  },
  {
    id: "preview-m300",
    code: "M300",
    slug: "m300",
    name: "M300",
    tagline: "Destek ve denge",
    description:
      "M300, kavisli formu ve belirgin topuk yuvasıyla ayağını yerinde tutmak için tasarlandı. Memory foam yüzeyi ve mavi tabanıyla uzun saatler ayakta kalanların modeli.",
    status: "published",
    sizeGuide: "",
    images: [{ src: "/assets/products/m300.png", alt: "FormStep M300 siyah tabanlık, mavi taban ve topuk yuvası" }],
    features: [],
    variants: variants("M300", UNIT_PRICE_KURUS),
    seoTitle: null,
    seoDescription: null,
  },
  {
    id: "preview-m900",
    code: "M900",
    slug: "m900",
    name: "M900",
    tagline: "Premium konfor",
    description:
      "M900, FormStep'in en yumuşak modeli. Delikli, dokulu siyah yüzeyi ve kalın gök mavisi tabanıyla tempoyu artırdığın günler için.",
    status: "published",
    sizeGuide: "",
    images: [
      { src: "/assets/products/m900-2.png", alt: "FormStep M900 delikli siyah yüzeyli tabanlık" },
      { src: "/assets/products/m900.png", alt: "FormStep M900 esnetilmiş, mavi taban görünüyor" },
    ],
    features: [],
    variants: variants("M900", UNIT_PRICE_KURUS),
    seoTitle: null,
    seoDescription: null,
  },
];

export const previewSettings: StoreSettings = {
  shipping: { feeKurus: 6990, freeThresholdKurus: 100000, carrier: "", leadTimeText: "" },
  seller: {
    address: "Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. Ataköy Towers A Blok No: 20/1, Bakırköy/İSTANBUL",
    phone: "+90 553 588 69 36",
    email: "info@omytic.com",
    taxOffice: "",
    taxNumber: "",
    mersis: "",
    etbis: "",
  },
  marketplaces: MARKETPLACES,
  claims: [BESTSELLER_CLAIM],
  finder: { gunluk: "m100", ayakta: "m300", tempo: "m900" },
  announcement: { text: "", active: false },
};

export const previewCoupons: Record<string, { kind: "percent" | "fixed"; value: number; min: number }> = {
  ONIZLEME10: { kind: "percent", value: 10, min: 0 },
};

export const previewFaqs: Faq[] = [
  { id: "1", question: "Memory foam ne demek?", answer: "Vücut ısısı ve basınçla yumuşayıp ayağının şeklini alan, ardından yavaşça eski hâline dönen bir köpük türü." },
  { id: "2", question: "Hangi ayakkabılarla kullanabilirim?", answer: "Çıkarılabilir tabanlığı olan ayakkabılarda, eski tabanlığı çıkarıp yerine FormStep'i yerleştirerek kullanabilirsin." },
  { id: "3", question: "Numaramı nasıl seçerim?", answer: "Ayakkabı numarana göre seçersin. Her modelin numara seçenekleri ürün sayfasında yer alır." },
  { id: "4", question: "Kargo ve teslimat nasıl işliyor?", answer: "Kargo ücreti 69,90 TL. 1.000 TL ve üzeri siparişlerde kargo ücretsiz. Teslimat yalnızca Türkiye içindeki adreslere yapılır." },
  { id: "5", question: "İade edebilir miyim?", answer: "Mesafeli satış mevzuatı kapsamındaki cayma hakkın saklıdır. Ayrıntılar İade ve cayma sayfasında." },
  { id: "6", question: "Tıbbi bir ürün mü?", answer: "Hayır, FormStep bir konfor tabanlığıdır. Ayağınla ilgili bir rahatsızlığın varsa bir uzmana danışmanı öneririz." },
];
