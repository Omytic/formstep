import type { Faq, Product, StoreSettings } from "./types";

/**
 * YALNIZCA GELİŞTİRME ÖNİZLEMESİ. Supabase bağlı değilken sitenin akışlarını
 * gezebilmek için kullanılan veriler. Numaralar ve fiyat gerçek; stok örnektir;
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
      "M100, FormStep'in gündelik kullanım modeli. Hafif memory foam yapısıyla ayağının şeklini alır; işte, okulda, şehirde gün boyu yumuşak bir zemin sunar.",
    status: "published",
    sizeGuide: "",
    images: [
      { src: "/assets/products/m100-2.png", alt: "FormStep M100 tabanlık, üstten görünüm" },
      { src: "/assets/products/m100.png", alt: "FormStep M100 tabanlık, yandan görünüm" },
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
    tagline: "İçe ve dışa basmaya özel",
    description:
      "M300, içe ya da dışa basanlar için tasarlandı. Kavisli ark desteği ve derin topuk yuvası ayağını ortada tutar, adımını daha dengeli hâle getirmeye yardımcı olur.",
    status: "published",
    sizeGuide: "",
    images: [{ src: "/assets/products/m300.png", alt: "FormStep M300 tabanlık, kavisli form ve topuk yuvası" }],
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
    tagline: "Topuk desteği",
    description:
      "M900, topuk dikeni olanlar ve topuğunda hassasiyet yaşayanlar için en iyi seçimimiz. Ekstra topuk dolgusu ve FormStep'in en kalın memory foam yapısıyla topuğa binen yükü yumuşatır.",
    status: "published",
    sizeGuide: "",
    images: [
      { src: "/assets/products/m900-2.png", alt: "FormStep M900 tabanlık, delikli üst yüzey" },
      { src: "/assets/products/m900.png", alt: "FormStep M900 tabanlık, esnek yapı" },
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
  { id: "4", question: "Hangi model bana uygun?", answer: "Günlük kullanım için M100, içe ya da dışa basıyorsan M300, topuk dikeni ya da topukta hassasiyet yaşıyorsan M900. Model seçici bölümü de sana yardımcı olur." },
  { id: "5", question: "Nereden satın alabilirim?", answer: "FormStep'i Amazon, Trendyol ve Hepsiburada'daki resmî mağazalarımızdan satın alabilirsin. Tüm modeller tanesi 200 TL." },
  { id: "6", question: "İade edebilir miyim?", answer: "Evet. İade ve cayma hakkı, ürünü satın aldığın pazaryerinin (Amazon, Trendyol ya da Hepsiburada) iade süreci üzerinden kullanılır. Teslimden itibaren 14 günlük cayma hakkın saklıdır." },
  { id: "7", question: "Tıbbi bir ürün mü?", answer: "Hayır, FormStep tıbbi cihaz değil, bir konfor tabanlığıdır. Topuk dikeni gibi bir rahatsızlığın varsa tabanlığı bir uzmana danışarak kullanmanı öneririz." },
];
