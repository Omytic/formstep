import { SELLER_DISPLAY_NAME, SELLER_LEGAL_NAME } from "@/lib/env";
import { SALES_ENABLED } from "@/lib/features";
import { formatTry } from "@/lib/money";
import type { Seller, Shipping } from "@/lib/store/types";

export const LEGAL_VERSION = 2;
/** Metinlerin yürürlük tarihi; metni değiştirdiğinde güncelle. */
export const LEGAL_UPDATED = "5 Kasım 2026";

export type LegalSlug =
  | "iletisim"
  | "hakkimizda"
  | "on-bilgilendirme"
  | "mesafeli-satis"
  | "iade-ve-cayma"
  | "kvkk"
  | "cerez-politikasi"
  | "kullanim-kosullari";

export const LEGAL_NAV: { slug: LegalSlug; title: string }[] = [
  { slug: "iletisim", title: "İletişim" },
  { slug: "hakkimizda", title: "Hakkımızda" },
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
        intro: "Ürünlerimiz, model seçimi ya da pazaryerlerinden verdiğin siparişler hakkında bize ulaşabilirsin.",
        sections: [
          { heading: "FormStep Türkiye", paragraphs: seller6 },
          {
            heading: "Siparişinle ilgili sorular",
            paragraphs: [
              "FormStep ürünleri Amazon, Trendyol ve Hepsiburada'daki resmî mağazalarımızda satılır. Kargo, teslimat ve iade işlemlerini en hızlı şekilde, siparişini verdiğin pazaryerinin mesajlaşma ve sipariş ekranından başlatabilirsin.",
              "Hafta içi mesai saatlerinde e-postalarına en geç iki iş günü içinde dönüş yaparız.",
            ],
          },
        ],
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
              "**M100 | Günlük konfor:** Hafif ve nefes alabilir yapısıyla gündelik kullanıma eşlik eder.",
              "**M300 | İçe ve dışa basmaya özel:** Kavisli ark desteği ve derin topuk yuvasıyla içe ya da dışa basanlarda daha dengeli bir adımı destekler.",
              "**M900 | Topuk desteği:** Ekstra topuk dolgusu ve nefes kanallarıyla, topuk dikeni olanlar ve topuğunda hassasiyet yaşayanlar için en iyi seçimimiz.",
            ],
            afterItems: ["Üç modelimizin ortak noktası ise darbe emici memory foam teknolojisiyle ayak konforunu desteklemek."],
          },
          {
            heading: "Güvenle atılan her adımda",
            paragraphs: [
              "OMY Ticaret olarak ticareti yalnızca ürünlerin alınıp satıldığı bir süreç olarak görmüyoruz. Uzun vadeli müşteri ilişkilerinin, şeffaf iletişimin ve sürdürülebilir memnuniyetin gerçek başarının temelini oluşturduğuna inanıyoruz.",
              "FormStep ürünlerini bugün Amazon, Trendyol ve Hepsiburada'daki resmî mağazalarımız üzerinden kullanıcılarımızla buluşturuyoruz. formstep.tr ise markanın tanıtım ve bilgi sitesi.",
              "**Çünkü bizim için konfor, ilk adımla başlar; güven ise her adımda devam eder.**",
              "**FormStep Türkiye | OMY Ticaret**",
            ],
          },
        ],
      };
    case "iade-ve-cayma":
      if (SALES_ENABLED || order) return salesReturns(seller6);
      return {
        slug: "iade-ve-cayma",
        title: "İade ve cayma hakkı",
        intro: "FormStep'i pazaryeri mağazalarımızdan aldıysan, ürünü teslim aldığın tarihten itibaren 14 gün içinde gerekçe göstermeden cayma hakkını kullanabilirsin.",
        sections: [
          {
            heading: "İade nasıl yapılır?",
            paragraphs: [
              "İade ve cayma talebini, ürünü satın aldığın pazaryerinin (Amazon, Trendyol ya da Hepsiburada) sipariş ekranındaki iade adımlarıyla başlatırsın. Pazaryeri sana iade kargo kodunu ve gönderim bilgilerini iletir.",
              "Ürün, cayma bildiriminden itibaren 10 gün içinde, faturası ve mümkünse orijinal ambalajıyla birlikte geri gönderilmelidir.",
              "İade tarafımıza ulaştıktan sonra ödemen, en geç 14 gün içinde pazaryeri aracılığıyla ödemeyi yaptığın yönteme iade edilir.",
            ],
          },
          {
            heading: "Hijyen istisnası",
            paragraphs: [
              "Tabanlıklar doğrudan ayakla temas eden ürünlerdir. Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca, teslimden sonra koruyucu ambalajı açılmış ve iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde cayma hakkı kullanılamayabilir. Ürünü denemeden önce numaranı kontrol etmeni öneririz.",
              "Ayıplı (kusurlu) ya da yanlış gönderilen ürünlerde bu istisna uygulanmaz; 6502 sayılı Kanun'daki seçimlik hakların saklıdır.",
            ],
          },
          { heading: "İletişim", paragraphs: seller6 },
        ],
      };
    case "on-bilgilendirme":
      if (SALES_ENABLED || order) return salesPreInfo(seller6, fee, order);
      return {
        slug: "on-bilgilendirme",
        title: "Ön bilgilendirme formu",
        intro: "6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında, pazaryerlerinde satılan FormStep ürünlerine ilişkin genel ön bilgilendirme.",
        sections: [
          {
            heading: "1. Bu formun kapsamı",
            paragraphs: [
              "formstep.tr bir tanıtım ve bilgi sitesidir; bu site üzerinden sipariş alınmaz ve ödeme yapılmaz.",
              "FormStep ürünleri, aşağıda bilgileri yer alan satıcı tarafından Amazon, Trendyol ve Hepsiburada'daki resmî mağazalarda satılır. Siparişine özel ön bilgilendirme formu ve mesafeli satış sözleşmesi, ödeme adımından önce ilgili pazaryerinde sana sunulur ve onayınla kurulur. Bu form, o metinlerin yerine geçmez; FormStep ürünleri hakkında genel bilgi verir.",
            ],
          },
          { heading: "2. Satıcı", paragraphs: seller6 },
          {
            heading: "3. Ürünlerin temel nitelikleri",
            paragraphs: [
              "FormStep M100, M300 ve M900; iki katmanlı (memory foam üst katman ve destek tabanı) ayakkabı tabanlıklarıdır.",
              "M100 gündelik kullanım, M300 içe ve dışa basmaya özel, M900 topuk desteği için tasarlanmıştır. Tabanlıklar tıbbi cihaz değildir.",
              "Numara seçenekleri: 36-37, 37-38, 38-39, 39-40, 40-41, 41-42, 42-43, 43-44, 44-45 ve 45-48.",
            ],
          },
          {
            heading: "4. Fiyat, ödeme ve teslimat",
            paragraphs: [
              "Ürünün vergiler dahil satış fiyatı, varsa kargo ücreti, ödeme seçenekleri ve tahmini teslim süresi sipariş anında ilgili pazaryerinde gösterilir. formstep.tr'de yer alan fiyatlar bilgi amaçlıdır; pazaryerindeki kampanyalar nedeniyle farklılık gösterebilir.",
              "Ödeme, ilgili pazaryerinin ödeme altyapısıyla alınır. Kart bilgilerin satıcıyla paylaşılmaz. Teslimat yalnızca Türkiye içindeki adreslere yapılır; yasal azami teslim süresi 30 gündür.",
            ],
          },
          {
            heading: "5. Cayma hakkı",
            paragraphs: [
              "Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma bildirimi, siparişin verildiği pazaryeri üzerinden ya da satıcının iletişim bilgilerinden yapılabilir.",
              "Teslimden sonra koruyucu ambalajı açılmış ve iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde cayma hakkı, Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi kapsamında kullanılamayabilir. Ayrıntılar İade ve cayma sayfasındadır.",
            ],
          },
          {
            heading: "6. Şikâyet ve itiraz",
            paragraphs: [
              "Şikâyetlerini satıcının iletişim bilgilerine ya da siparişin verildiği pazaryerine iletebilirsin.",
              "Uyuşmazlıklarda, Ticaret Bakanlığı'nca her yıl ilan edilen parasal sınırlar dahilinde, tüketicinin veya satıcının yerleşim yerindeki Tüketici Hakem Heyetine; bu sınırların üzerindeki uyuşmazlıklarda Tüketici Mahkemesine başvurulabilir.",
            ],
          },
        ],
      };
    case "mesafeli-satis":
      if (SALES_ENABLED || order) return salesContract(seller6, fee, shipping, order);
      return {
        slug: "mesafeli-satis",
        title: "Mesafeli satış sözleşmesi",
        intro: "Pazaryerlerinde satılan FormStep ürünlerine ilişkin mesafeli satış sözleşmesinin genel hükümleri.",
        sections: [
          {
            heading: "1. Kapsam",
            paragraphs: [
              "formstep.tr üzerinden satış yapılmaz. Bu metin, satıcının Amazon, Trendyol ve Hepsiburada'daki resmî mağazalarında sattığı FormStep ürünleri için geçerli genel hükümleri bilgi amacıyla açıklar.",
              "Siparişine ait sözleşme; alıcı bilgileri, ürün, fiyat ve teslimat ayrıntılarıyla birlikte satın alma sırasında ilgili pazaryerinde düzenlenir ve elektronik ortamda sana iletilir. Bu metin ile pazaryerinde onayladığın sözleşme arasında fark olursa pazaryerindeki sözleşme esas alınır.",
            ],
          },
          { heading: "2. Satıcı", paragraphs: seller6 },
          {
            heading: "3. Konu",
            paragraphs: [
              "Sözleşmenin konusu, alıcının pazaryeri üzerinden elektronik ortamda sipariş verdiği FormStep ürününün satışı ve teslimi ile 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca tarafların hak ve yükümlülükleridir.",
            ],
          },
          {
            heading: "4. Satıcının yükümlülükleri",
            paragraphs: [
              "Satıcı, ürünü siparişte belirtilen niteliklere uygun, sağlam ve eksiksiz olarak, faturasıyla birlikte, yasal azami süre olan 30 gün içinde alıcının Türkiye'deki teslimat adresine teslim etmekle yükümlüdür.",
              "Ürünün tedarik edilememesi halinde satıcı, bu durumu öğrendiği tarihten itibaren 3 gün içinde alıcıyı bilgilendirir ve ödenen tutarı 14 gün içinde iade eder.",
            ],
          },
          {
            heading: "5. Alıcının yükümlülükleri",
            paragraphs: [
              "Alıcı, sipariş sırasında verdiği bilgilerin doğru olduğunu, ürünün temel nitelikleri, fiyatı ve teslimat koşulları hakkında bilgilendirildiğini kabul eder. Teslim sırasında hasarlı paketi kargo görevlisine tutanakla bildirmesi önerilir.",
            ],
          },
          {
            heading: "6. Cayma hakkı",
            paragraphs: [
              "Alıcı, teslimden itibaren 14 gün içinde gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma bildiriminin ardından ürün 10 gün içinde geri gönderilir; bedel, ürünün satıcıya ulaşmasından itibaren 14 gün içinde ödemenin yapıldığı yönteme iade edilir.",
              "Teslimden sonra koruyucu ambalajı açılmış ve iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde cayma hakkı kullanılamayabilir (Mesafeli Sözleşmeler Yönetmeliği md. 15/1-ğ).",
            ],
          },
          {
            heading: "7. Ayıplı ürün",
            paragraphs: [
              "Ayıplı ürünlerde alıcı; sözleşmeden dönme, bedelden indirim, ücretsiz onarım ya da ayıpsız misliyle değişim haklarından birini kullanabilir.",
            ],
          },
          {
            heading: "8. Uyuşmazlık",
            paragraphs: [
              "Uyuşmazlıklarda Ticaret Bakanlığı'nca ilan edilen parasal sınırlara kadar Tüketici Hakem Heyetleri, bu sınırların üzerinde Tüketici Mahkemeleri yetkilidir.",
            ],
          },
        ],
      };
    case "kvkk":
      return {
        slug: "kvkk",
        title: "KVKK aydınlatma metni",
        intro: `6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi uyarınca, formstep.tr'yi ziyaret ettiğinde ve bizimle iletişime geçtiğinde kişisel verilerinin nasıl işlendiğini açıklarız.`,
        sections: [
          {
            heading: "1. Veri sorumlusu",
            paragraphs: [`Veri sorumlusu: ${SELLER_LEGAL_NAME} ("OMY Ticaret").`, ...seller6.slice(1)],
          },
          {
            heading: "2. İşlenen kişisel veriler",
            paragraphs: [],
            items: [
              "**İşlem güvenliği verileri:** IP adresi, tarayıcı ve cihaz bilgisi, ziyaret tarihi ve saati gibi sunucu kayıtları.",
              "**Çerez verileri:** Zorunlu çerezler ve yalnızca onay verirsen analiz çerezleri (bkz. Çerez politikası).",
              "**İletişim verileri:** Bize e-posta, telefon ya da sosyal medya üzerinden ulaştığında paylaştığın ad soyad, e-posta adresi, telefon numarası ve mesaj içeriği.",
              "**Müşteri işlem verileri:** Pazaryerlerinden verdiğin siparişle ilgili bize ulaştığında sipariş numarası ve talep içeriği.",
              ...(SALES_ENABLED
                ? ["**Sipariş verileri:** formstep.tr üzerinden sipariş verdiğinde ad soyad, teslimat ve fatura adresi, sipariş içeriği. Kart bilgilerin ödeme kuruluşu tarafından işlenir, bize iletilmez."]
                : []),
            ],
            afterItems: ["formstep.tr'de üyelik ve satış bulunmadığından bu site üzerinden ödeme ya da adres bilgisi toplanmaz."],
          },
          {
            heading: "3. İşleme amaçları ve hukuki sebepler",
            paragraphs: [],
            items: [
              "Sitenin güvenli ve kesintisiz çalışması, kötüye kullanımın önlenmesi: KVKK md. 5/2-f (meşru menfaat) ve md. 5/2-ç (hukuki yükümlülük).",
              "Soru, öneri ve şikâyetlerinin yanıtlanması, satış sonrası destek: md. 5/2-c (sözleşmenin kurulması veya ifası) ve md. 5/2-f.",
              "Ziyaret istatistiklerinin ölçülmesi (analiz çerezleri): md. 5/1 (açık rıza). Onay vermezsen analiz çerezleri hiç yüklenmez.",
              "Yasal saklama ve bilgi verme yükümlülüklerinin yerine getirilmesi: md. 5/2-ç.",
            ],
          },
          {
            heading: "4. Toplama yöntemi",
            paragraphs: [
              "Kişisel verilerin; siteyi ziyaret ettiğinde otomatik yollarla (sunucu kayıtları, çerezler) ve bizimle iletişime geçtiğinde e-posta, telefon veya sosyal medya kanallarıyla elektronik ortamda toplanır.",
            ],
          },
          {
            heading: "5. Aktarım",
            paragraphs: [
              "Kişisel verilerin, yalnızca yukarıdaki amaçlarla sınırlı ve ölçülü olarak; barındırma ve altyapı hizmeti aldığımız sağlayıcılara (Vercel, Supabase), e-posta hizmet sağlayıcılarına, analiz hizmeti için Google'a (yalnızca açık rızanla) ve talep halinde yetkili kamu kurum ve kuruluşlarına aktarılabilir.",
              "Bu hizmet sağlayıcıların sunucuları yurt dışında bulunabilir. Yurt dışına aktarım, KVKK'nın 9. maddesinde öngörülen şartlara (uygun güvenceler, standart sözleşme veya açık rıza) uygun olarak yapılır.",
              "Pazaryerlerinden verdiğin siparişlerde kişisel verilerin, ilgili pazaryerinin kendi aydınlatma metni kapsamında işlenir; siparişin teslimi için satıcı olarak tarafımızla paylaşılan bilgiler yalnızca bu amaçla kullanılır.",
            ],
          },
          {
            heading: "6. Saklama süresi",
            paragraphs: [
              "Kişisel verilerin, işleme amacının gerektirdiği süre ve ilgili mevzuattaki zamanaşımı ve saklama süreleri boyunca saklanır; süre sona erdiğinde silinir, yok edilir veya anonim hâle getirilir. Sunucu kayıtları en fazla 2 yıl, iletişim yazışmaları talebin sonuçlanmasından itibaren 10 yıl saklanır.",
            ],
          },
          {
            heading: "7. Hakların",
            paragraphs: ["KVKK'nın 11. maddesi uyarınca veri sorumlusuna başvurarak:"],
            items: [
              "Kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme,",
              "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
              "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,",
              "Eksik veya yanlış işlenmişse düzeltilmesini, KVKK md. 7 şartları çerçevesinde silinmesini veya yok edilmesini isteme ve bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
              "Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonucun ortaya çıkmasına itiraz etme,",
              "Kanuna aykırı işleme nedeniyle zarara uğraman halinde zararın giderilmesini talep etme haklarına sahipsin.",
            ],
            afterItems: [
              `Başvurunu, kimliğini tespit edici bilgilerle birlikte yazılı olarak yukarıdaki adrese ya da ${seller.email || "e-posta adresimize"} adresine, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun şekilde iletebilirsin. Başvurun en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.`,
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
            heading: "Çerez nedir?",
            paragraphs: [
              "Çerezler, bir web sitesini ziyaret ettiğinde tarayıcına kaydedilen küçük metin dosyalarıdır. Benzer amaçla tarayıcının yerel depolama alanı da kullanılabilir; bu politikada hepsine çerez diyoruz.",
            ],
          },
          {
            heading: "Kullandığımız çerezler",
            paragraphs: [],
            items: [
              "**Zorunlu çerezler:** Sitenin güvenli çalışması ve çerez tercihinin hatırlanması için gereklidir (ör. fs_consent_v1). Bu çerezler KVKK md. 5/2-f kapsamında, onay aranmadan kullanılır ve kapatılamaz.",
              "**Analiz çerezleri (isteğe bağlı):** Ziyaretçi sayısı ve en çok gezilen sayfalar gibi istatistikler için Google Analytics. Yalnızca açık onayınla yüklenir; onay vermezsen hiçbir analiz kodu çalışmaz.",
              ...(SALES_ENABLED ? ["**Sepet ve oturum:** Sepetinin ve oturumunun korunması için zorunlu çerezler."] : []),
            ],
          },
          {
            heading: "Reklam çerezleri",
            paragraphs: ["formstep.tr'de reklam ve yeniden hedefleme çerezleri kullanılmaz."],
          },
          {
            heading: "Tercihini yönetme",
            paragraphs: [
              "Tercihini, sayfanın altındaki Çerez tercihleri bağlantısından istediğin zaman değiştirebilir ya da geri alabilirsin.",
              "Tarayıcının ayarlarından da çerezleri silebilir veya engelleyebilirsin; zorunlu çerezleri engellersen sitenin bazı bölümleri düzgün çalışmayabilir.",
              "Kişisel verilerinin işlenmesine ilişkin ayrıntılar KVKK aydınlatma metninde yer alır.",
            ],
          },
        ],
      };
    case "kullanim-kosullari":
      return {
        slug: "kullanim-kosullari",
        title: "Kullanım koşulları",
        intro: "formstep.tr'yi ziyaret ederek aşağıdaki koşulları kabul etmiş olursun.",
        sections: [
          {
            heading: "1. Site hakkında",
            paragraphs: [
              `formstep.tr, FormStep markasının Türkiye tanıtım ve bilgi sitesidir ve ${SELLER_LEGAL_NAME} tarafından işletilir.`,
              SALES_ENABLED
                ? "Sitede sunulan ürünler, siparişin onaylandığı andaki fiyat ve koşullarla satılır."
                : "Bu site üzerinden satış yapılmaz. FormStep ürünleri Amazon, Trendyol ve Hepsiburada'daki resmî mağazalarımızda satılır; bu mağazalardan yapılan alışverişlerde ilgili pazaryerinin kullanım ve satış koşulları geçerlidir.",
            ],
          },
          {
            heading: "2. Bilgilerin doğruluğu",
            paragraphs: [
              "Sitedeki ürün bilgilerini doğru ve güncel tutmaya özen gösteririz. Fiyatlar bilgi amaçlıdır; güncel fiyat ve kampanyalar pazaryeri mağazalarında gösterilir.",
              "Ürün görselleri temsilidir; ekran ayarlarına bağlı olarak ürünün kendisiyle küçük renk farklılıkları olabilir. Animasyonlar ve çizimler ürünün yapısını anlatmak içindir.",
              "FormStep tabanlıkları tıbbi cihaz değildir; sitedeki içerikler tıbbi tavsiye yerine geçmez. Ayağınla ilgili bir rahatsızlığın varsa bir uzmana danış.",
            ],
          },
          {
            heading: "3. Fikrî mülkiyet",
            paragraphs: [
              "FormStep adı ve logosu, sitedeki metinler, görseller, çizimler ve tasarım, ilgili hak sahiplerine aittir ve 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 sayılı Sınai Mülkiyet Kanunu kapsamında korunur. Yazılı izin olmadan kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz.",
              "Amazon, Trendyol ve Hepsiburada adları ve logoları ilgili şirketlerin markalarıdır; yalnızca mağazalarımıza yönlendirmek için kullanılır.",
            ],
          },
          {
            heading: "4. Dış bağlantılar",
            paragraphs: [
              "Site, pazaryeri mağazalarına ve sosyal medya hesaplarımıza bağlantılar içerir. Bu sitelerin içeriği ve gizlilik uygulamaları kendi koşullarına tabidir.",
            ],
          },
          {
            heading: "5. Sorumluluk",
            paragraphs: [
              "Sitenin kesintisiz ve hatasız çalışması için gereken özeni gösteririz; ancak teknik arızalar, bakım çalışmaları ya da üçüncü taraf hizmetlerinden kaynaklanan kesintilerden doğabilecek dolaylı zararlardan sorumlu tutulamayız.",
            ],
          },
          {
            heading: "6. Değişiklikler ve uygulanacak hukuk",
            paragraphs: [
              "Bu koşulları gerektiğinde güncelleyebiliriz; güncel metin her zaman bu sayfada yayımlanır.",
              "Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici işlemlerinde 6502 sayılı Kanun hükümleri saklıdır.",
            ],
          },
          { heading: "İletişim", paragraphs: seller6 },
        ],
      };
    default:
      return null;
  }
}

/* ── Sitede satış açıksa (NEXT_PUBLIC_SALES_ENABLED=1) kullanılan sipariş metinleri ── */

function salesReturns(seller6: string[]): LegalDoc {
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
}

function salesPreInfo(seller6: string[], fee: string, order?: OrderContext): LegalDoc {
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
}

function salesContract(seller6: string[], fee: string, shipping: Shipping, order?: OrderContext): LegalDoc {
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
}
