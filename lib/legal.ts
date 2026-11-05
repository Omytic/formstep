import { SELLER_DISPLAY_NAME, SELLER_LEGAL_NAME } from "@/lib/env";
import { formatTry } from "@/lib/money";
import type { Seller, Shipping } from "@/lib/store/types";

export const LEGAL_VERSION = 1;

export type LegalSlug =
  | "iletisim"
  | "hakkimizda"
  | "on-bilgilendirme"
  | "mesafeli-satis"
  | "iade-ve-cayma"
  | "teslimat"
  | "kvkk"
  | "cerez-politikasi"
  | "kullanim-kosullari";

export const LEGAL_NAV: { slug: LegalSlug; title: string }[] = [
  { slug: "iletisim", title: "İletişim" },
  { slug: "hakkimizda", title: "Hakkımızda" },
  { slug: "teslimat", title: "Teslimat ve kargo" },
  { slug: "iade-ve-cayma", title: "İade ve cayma" },
  { slug: "on-bilgilendirme", title: "Ön bilgilendirme formu" },
  { slug: "mesafeli-satis", title: "Mesafeli satış sözleşmesi" },
  { slug: "kvkk", title: "KVKK aydınlatma metni" },
  { slug: "cerez-politikasi", title: "Çerez politikası" },
  { slug: "kullanim-kosullari", title: "Kullanım koşulları" },
];

const M = (label: string) => `[${label} — yönetim panelinden girilecek]`;

export type SocialLinks = { instagram?: string; x?: string };

export function sellerBlock(s: Seller, social?: SocialLinks): string[] {
  const lines = [
    `Ünvan: ${SELLER_DISPLAY_NAME}`,
    `Adres: ${s.address || M("adres")}`,
    `Telefon: ${s.phone || M("telefon")}`,
    `E-posta: ${s.email || M("e-posta")}`,
  ];
  if (social?.instagram) lines.push(`Instagram: ${social.instagram}`);
  if (social?.x) lines.push(`X: ${social.x}`);
  return lines;
}

export function sellerComplete(s: Seller): boolean {
  return Boolean(s.address && s.phone && s.email);
}

export type LegalSection = { heading: string; paragraphs: string[]; items?: string[]; afterItems?: string[] };

export type LegalDoc = { slug: LegalSlug; title: string; intro: string; sections: LegalSection[] };

export type OrderContext = {
  number: string;
  date: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  address: string;
  lines: { name: string; size: string; qty: number; unitKurus: number }[];
  subtotalKurus: number;
  discountKurus: number;
  shippingKurus: number;
  totalKurus: number;
};

function orderSection(o: OrderContext) {
  return {
    heading: "Sipariş bilgileri",
    paragraphs: [
      `Sipariş no: ${o.number} · Tarih: ${o.date}`,
      `Alıcı: ${o.buyerName} · ${o.buyerEmail} · ${o.buyerPhone}`,
      `Teslimat adresi: ${o.address}`,
      ...o.lines.map((l) => `${l.name} (${l.size}) × ${l.qty} — birim fiyat ${formatTry(l.unitKurus)}, KDV dahil`),
      `Ara toplam: ${formatTry(o.subtotalKurus)}${o.discountKurus ? ` · İndirim: −${formatTry(o.discountKurus)}` : ""} · Kargo: ${o.shippingKurus ? formatTry(o.shippingKurus) : "ücretsiz"}`,
      `Toplam ödenecek tutar: ${formatTry(o.totalKurus)} (KDV dahil)`,
    ],
  };
}

export function legalDoc(slug: string, seller: Seller, shipping: Shipping, order?: OrderContext, social?: SocialLinks): LegalDoc | null {
  const seller6 = sellerBlock(seller, social);
  const fee =
    shipping.feeKurus === null
      ? M("kargo ücreti")
      : shipping.feeKurus === 0
        ? "ücretsiz"
        : `${formatTry(shipping.feeKurus)}${shipping.freeThresholdKurus ? `; ${formatTry(shipping.freeThresholdKurus)} ve üzeri siparişlerde ücretsiz` : ""}`;

  switch (slug as LegalSlug) {
    case "iletisim":
      return {
        slug: "iletisim",
        title: "İletişim",
        intro: "Siparişin, ürünlerimiz ya da iade sürecin hakkında bize ulaşabilirsin.",
        sections: [{ heading: "Satıcı bilgileri", paragraphs: seller6 }],
      };
    case "hakkimizda":
      return {
        slug: "hakkimizda",
        title: "Hakkımızda",
        intro: "Her adımda daha fazla konfor.",
        sections: [
          {
            heading: "",
            paragraphs: [
              "FormStep, günlük yaşamın temposunda konforu bir ayrıcalık değil, ihtiyaç olarak gören bir marka. Gün boyu ayakta çalışanlardan uzun yürüyüşleri sevenlere, hareketli bir yaşam sürenlerden günlük rahatlığına önem verenlere kadar herkesin adımlarına eşlik etmeyi amaçlıyor.",
              "**FormStep'in Türkiye distribütörlüğünü üstlenen OMY Ticaret**, kaliteyi, güvenilirliği ve müşteri memnuniyetini merkeze alan yaklaşımıyla markanın Türkiye'deki büyüme yolculuğunu sürdürüyor.",
              "Kumaş, tekstil ve ayakkabı tabanlığı gibi farklı ürün gruplarında faaliyet gösteren OMY Ticaret; ürün seçimi, tedarik ve lojistik süreçlerinde edindiği deneyimi FormStep'in Türkiye operasyonlarına taşıyor.",
            ],
          },
          {
            heading: "Türkiye'de iki yılı aşkın bir yolculuk",
            paragraphs: [
              "İki yılı aşkın süredir Türkiye pazarında faaliyet gösteren FormStep, kısa sürede geniş bir kullanıcı kitlesine ulaşarak Amazon Türkiye'de kendi kategorisinin en çok satan tabanlıkları arasında yer almayı başardı.",
              "Bu başarının arkasında yalnızca ürünlerimiz değil; kullanıcılarımızın ihtiyaçlarını anlamaya, doğru ürünü sunmaya ve satış sonrasında da güvenilir bir alışveriş deneyimi sağlamaya verdiğimiz önem bulunuyor.",
            ],
          },
          {
            heading: "Üç farklı model, ortak bir amaç",
            paragraphs: [
              "Her adımın ve her ihtiyacın aynı olmadığını biliyoruz.",
              "Bu nedenle FormStep ürün ailesinde üç farklı kullanım deneyimi sunuyoruz:",
            ],
            items: [
              "**M100 | Günlük rahatlık:** Hafif ve nefes alabilir yapısıyla günlük kullanıma eşlik eder.",
              "**M300 | Destek ve denge:** Kavisli tasarımıyla daha dengeli bir basış deneyimini destekler.",
              "**M900 | Premium konfor:** Ekstra topuk dolgusu ve nefes kanallarıyla gelişmiş konfor sunar.",
            ],
            afterItems: ["Üç modelimizin ortak noktası ise darbe emici memory foam teknolojisiyle ayak konforunu desteklemek."],
          },
          {
            heading: "Güvenle atılan her adımda",
            paragraphs: [
              "OMY Ticaret olarak ticareti yalnızca ürünlerin alınıp satıldığı bir süreç olarak görmüyoruz. Uzun vadeli müşteri ilişkilerinin, şeffaf iletişimin ve sürdürülebilir memnuniyetin gerçek başarının temelini oluşturduğuna inanıyoruz.",
              "Bugün Amazon, Trendyol ve Hepsiburada üzerinden kullanıcılarımızla buluşturduğumuz FormStep ürünlerini, kendi dijital mağazamız aracılığıyla da doğrudan sizlere ulaştırmayı hedefliyoruz.",
              "**Çünkü bizim için konfor, ilk adımla başlar; güven ise her adımda devam eder.**",
              "**FormStep Türkiye | OMY Ticaret**",
            ],
          },
        ],
      };
    case "teslimat":
      return {
        slug: "teslimat",
        title: "Teslimat ve kargo",
        intro: "Siparişlerin ödeme onayından sonra hazırlanır ve kargoya verilir.",
        sections: [
          {
            heading: "Kargo",
            paragraphs: [
              ...(shipping.carrier ? [`Kargo firması: ${shipping.carrier}`] : []),
              `Kargo ücreti: ${fee}`,
              ...(shipping.leadTimeText ? [`Teslimat süresi: ${shipping.leadTimeText}`] : []),
              "Siparişin kargoya verildiğinde takip numarası e-posta ile gönderilir ve Hesabım sayfasında görünür.",
              "Teslimat yalnızca Türkiye içindeki adreslere yapılır.",
            ],
          },
        ],
      };
    case "iade-ve-cayma":
      return {
        slug: "iade-ve-cayma",
        title: "İade ve cayma hakkı",
        intro: "Ürünü teslim aldığın tarihten itibaren 14 gün içinde, gerekçe göstermeden cayma hakkını kullanabilirsin.",
        sections: [
          {
            heading: "Cayma hakkı nasıl kullanılır?",
            paragraphs: [
              "Cayma bildirimini, teslim tarihinden itibaren 14 gün içinde aşağıdaki iletişim bilgilerinden bize yazılı olarak iletebilirsin.",
              "Ürün, bildirimden itibaren 10 gün içinde, satıcının belirttiği kargo ile ve faturasıyla birlikte geri gönderilmelidir.",
              "İade edilen ürün tarafımıza ulaştıktan sonra en geç 14 gün içinde ödemen, ödemeyi yaptığın yönteme iade edilir.",
              "Hijyen nedeniyle ambalajı açılmış ve kullanılmış ürünlerde cayma hakkı, ilgili mevzuattaki istisnalar çerçevesinde değerlendirilir.",
            ],
          },
          { heading: "İletişim", paragraphs: seller6 },
        ],
      };
    case "on-bilgilendirme":
      return {
        slug: "on-bilgilendirme",
        title: "Ön bilgilendirme formu",
        intro: "6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, sözleşme kurulmadan önce bilgilendirme.",
        sections: [
          { heading: "Satıcı", paragraphs: seller6 },
          ...(order ? [orderSection(order)] : []),
          {
            heading: "Ödeme ve teslimat",
            paragraphs: [
              "Ödeme, PayTR güvenli ödeme altyapısı üzerinden kredi kartı veya banka kartı ile alınır. Kart bilgilerin satıcı tarafından görülmez veya saklanmaz.",
              `Kargo ücreti: ${fee}. Teslimat yalnızca Türkiye içindeki adreslere yapılır.`,
            ],
          },
          {
            heading: "Cayma hakkı",
            paragraphs: [
              "Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.",
            ],
          },
          {
            heading: "Şikâyet ve itiraz",
            paragraphs: [
              "Şikâyet ve itirazlar için, Ticaret Bakanlığı'nca ilan edilen parasal sınırlar dahilinde, alıcının veya satıcının yerleşim yerindeki Tüketici Hakem Heyetine ya da Tüketici Mahkemesine başvurulabilir.",
            ],
          },
        ],
      };
    case "mesafeli-satis":
      return {
        slug: "mesafeli-satis",
        title: "Mesafeli satış sözleşmesi",
        intro: "İşbu sözleşme, aşağıda bilgileri bulunan satıcı ile alıcı arasında, alıcının formstep.tr üzerinden verdiği siparişe ilişkin olarak kurulmuştur.",
        sections: [
          { heading: "1. Satıcı", paragraphs: seller6 },
          ...(order ? [orderSection(order)] : [{ heading: "2. Alıcı ve sipariş", paragraphs: ["Alıcı bilgileri ve sipariş içeriği, sipariş anında bu sözleşmeye eklenir ve siparişle birlikte saklanır."] }]),
          {
            heading: "3. Konu",
            paragraphs: [
              "Sözleşmenin konusu, alıcının satıcıya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği ürünün satışı ve teslimi ile tarafların hak ve yükümlülükleridir.",
            ],
          },
          {
            heading: "4. Teslimat",
            paragraphs: [
              `Ürün, alıcının belirttiği Türkiye adresine${shipping.carrier ? ` ${shipping.carrier} ile` : ""} teslim edilir.${shipping.leadTimeText ? ` Teslim süresi: ${shipping.leadTimeText}.` : ""} Yasal azami süre 30 gündür. Kargo ücreti: ${fee}.`,
            ],
          },
          {
            heading: "5. Cayma hakkı",
            paragraphs: [
              "Alıcı, teslimden itibaren 14 gün içinde cayma hakkını kullanabilir. Ayrıntılar İade ve cayma sayfasında yer alır.",
            ],
          },
          {
            heading: "6. Uyuşmazlık",
            paragraphs: [
              "Uyuşmazlıklarda Ticaret Bakanlığı'nca ilan edilen değerlere kadar Tüketici Hakem Heyetleri, üzerindeki değerlerde Tüketici Mahkemeleri yetkilidir.",
            ],
          },
        ],
      };
    case "kvkk":
      return {
        slug: "kvkk",
        title: "KVKK aydınlatma metni",
        intro: `6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu ${SELLER_LEGAL_NAME}'dir.`,
        sections: [
          {
            heading: "İşlenen veriler ve amaç",
            paragraphs: [
              "Ad soyad, e-posta, telefon, teslimat ve fatura adresi; siparişin oluşturulması, ödemenin alınması, teslimat, fatura ve yasal saklama yükümlülükleri amacıyla işlenir.",
              "Kart bilgilerin PayTR tarafından işlenir; satıcıya iletilmez.",
              "Pazarlama iletileri yalnızca açık rızan varsa gönderilir; rızanı Hesabım sayfasından istediğin zaman geri alabilirsin.",
            ],
          },
          {
            heading: "Aktarım",
            paragraphs: [
              "Veriler; ödeme kuruluşu (PayTR), kargo firması, barındırma ve e-posta hizmet sağlayıcıları ile yalnızca hizmetin gerektirdiği ölçüde paylaşılır.",
            ],
          },
          {
            heading: "Hakların",
            paragraphs: [
              "KVKK 11. madde kapsamındaki taleplerini aşağıdaki iletişim bilgilerinden bize iletebilirsin.",
              ...seller6,
            ],
          },
        ],
      };
    case "cerez-politikasi":
      return {
        slug: "cerez-politikasi",
        title: "Çerez politikası",
        intro: "Sitenin çalışması için gerekli çerezler her zaman açıktır. Analiz çerezleri yalnızca onay verirsen çalışır.",
        sections: [
          {
            heading: "Kullanılan çerezler",
            paragraphs: [
              "Zorunlu: oturum, sepet ve güvenlik çerezleri.",
              "Analiz (isteğe bağlı): ziyaret istatistikleri için Google Analytics. Onay vermezsen yüklenmez.",
              "Tercihini, sayfanın altındaki Çerez tercihleri bağlantısından istediğin zaman değiştirebilirsin.",
            ],
          },
        ],
      };
    case "kullanim-kosullari":
      return {
        slug: "kullanim-kosullari",
        title: "Kullanım koşulları",
        intro: "formstep.tr'yi kullanarak aşağıdaki koşulları kabul etmiş olursun.",
        sections: [
          {
            heading: "Genel",
            paragraphs: [
              "Sitedeki görseller ve metinler FormStep'e aittir; izinsiz kopyalanamaz.",
              "Ürün görselleri temsilidir; ürünün kendisi ile ufak renk farklılıkları olabilir.",
              "Fiyatlar ve kampanyalar önceden haber verilmeksizin değişebilir; siparişin, sipariş anındaki fiyattan işlenir.",
            ],
          },
        ],
      };
    default:
      return null;
  }
}
