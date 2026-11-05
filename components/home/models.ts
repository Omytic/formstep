export type HomeModel = {
  slug: "m100" | "m300" | "m900";
  code: string;
  tag: string;
  title: string;
  body: string;
  /** Vitrinde kısa etiketler. Renk yazılmaz. */
  facts: string[];
  /** Ürün sayfasındaki özellik kartları (yönetim panelinde onaylı özellik yoksa). */
  features: { label: string; body: string }[];
  /** Kimler için: ürün sayfasında ve model seçicide. */
  forWho: string[];
  image: string;
  alt: string;
  bg: string;
  fg: string;
  accent: string;
  muted: string;
  /** Ürünün kendi Amazon sayfası (varsa). */
  amazon?: string;
};

export const homeModels: HomeModel[] = [
  {
    slug: "m100",
    code: "M100",
    tag: "Günlük konfor",
    title: "Her gün, her ayakkabıda.",
    body: "İşe, okula, şehre. Hafif memory foam yapısıyla gün boyu yumuşak bir zemin. FormStep'in gündelik kullanım modeli.",
    facts: ["Gündelik kullanım", "Hafif ve esnek", "Memory foam"],
    features: [
      { label: "Gündelik kullanım için", body: "İşte, okulda, şehirde; spor ayakkabıdan günlük ayakkabıya her gün kullanılmak üzere tasarlandı." },
      { label: "Ayağının şeklini alır", body: "Memory foam üst katman vücut ısısı ve basınçla yumuşar, birkaç adımda ayağına göre şekillenir." },
      { label: "Hafif ve esnek", body: "İnce, hafif yapısı ayakkabının içinde yer kaplamaz; ayakkabını daraltmadan konfor katar." },
      { label: "Darbe emici", body: "Her adımda zemine çarpan yükü yumuşatarak gün sonunda ayaklarının daha az yorulmasına yardımcı olur." },
      { label: "Nefes alan yüzey", body: "Dokulu üst yüzey ayağının ayakkabı içinde daha ferah kalmasına yardımcı olur." },
    ],
    forWho: ["Gün boyu yürüyenler", "Ofiste, okulda, şehirde", "İlk kez tabanlık deneyenler"],
    image: "/assets/products/m100-2.png",
    alt: "FormStep M100 tabanlık",
    bg: "#E7EDF5",
    fg: "#10131D",
    accent: "#2477EA",
    muted: "rgba(16,19,29,0.62)",
    amazon: "https://www.amazon.com.tr/dp/B0GDQBGZMV",
  },
  {
    slug: "m300",
    code: "M300",
    tag: "İçe ve dışa basmaya özel",
    title: "Ayağın içe ya da dışa kaçıyorsa.",
    body: "Kavisli formu ve derin topuk yuvasıyla ayağını ortada tutar. İçe ya da dışa basanlarda adımı daha dengeli hâle getirmeye yardımcı olur.",
    facts: ["İçe / dışa basma", "Kavisli ark desteği", "Derin topuk yuvası"],
    features: [
      { label: "İçe ve dışa basmaya özel", body: "Ayağın basarken içe (pronasyon) ya da dışa (supinasyon) kaçıyorsa M300 adımını ortada tutmak için tasarlandı." },
      { label: "Kavisli ark desteği", body: "Ayak kemerinin altını dolduran kavisli form, ayağın içe çökmesini sınırlayarak daha dengeli bir basış sağlar." },
      { label: "Derin topuk yuvası", body: "Topuğu çanak gibi kavrayan yuva, topuğun yana kaymasını azaltır ve ayağı yerinde tutar." },
      { label: "Memory foam üst katman", body: "Destek yapısının üstündeki memory foam, sertlik hissi vermeden ayağının şeklini alır." },
      { label: "Uzun saatler ayakta", body: "Yürüyüşte ve ayakta geçen uzun saatlerde dengeli duruşu destekler." },
    ],
    forWho: ["İçe basanlar", "Dışa basanlar", "Ayakkabısının bir yanı çabuk aşınanlar"],
    image: "/assets/products/m300.png",
    alt: "FormStep M300 tabanlık, kavisli form ve topuk yuvası",
    bg: "#07090F",
    fg: "#F6F8FC",
    accent: "#0873E5",
    muted: "rgba(246,248,252,0.62)",
  },
  {
    slug: "m900",
    code: "M900",
    tag: "Topuk desteği",
    title: "Topuğunu en çok düşünen FormStep.",
    body: "Ekstra topuk dolgusu ve en kalın memory foam yapısıyla topuğa binen yükü yumuşatır. Topuk dikeni olanlar ve topuğunda hassasiyet yaşayanlar için en iyi seçimimiz.",
    facts: ["Ekstra topuk dolgusu", "Topuk dikeni için", "Nefes kanalları"],
    features: [
      { label: "Ekstra topuk dolgusu", body: "Topuk bölgesindeki ek dolgu, adım attığında topuğa binen yükü yayar ve darbeyi yumuşatır." },
      { label: "Topuk dikeni olanlar için", body: "Topuk dikeni ya da topukta hassasiyet yaşayanların, topuğa basarken daha yumuşak bir zemin hissetmesi için tasarlandı." },
      { label: "En kalın memory foam", body: "FormStep ailesinin en yumuşak ve en kalın modeli; ayağının şeklini alarak basıncı tüm tabana dağıtır." },
      { label: "Nefes kanalları", body: "Delikli üst yüzey ve hava kanalları, ayağının ayakkabı içinde daha ferah kalmasına yardımcı olur." },
      { label: "Darbe emici", body: "Uzun yürüyüşlerde ve ayakta geçen günlerde her adımın etkisini azaltır." },
    ],
    forWho: ["Topuk dikeni olanlar", "Topuğunda ağrı ya da hassasiyet yaşayanlar", "Gün boyu ayakta kalanlar"],
    image: "/assets/products/m900-2.png",
    alt: "FormStep M900 tabanlık, delikli yüzey ve topuk dolgusu",
    bg: "#0E1A36",
    fg: "#F6F8FC",
    accent: "#4EA1E1",
    muted: "rgba(246,248,252,0.62)",
    amazon: "https://www.amazon.com.tr/dp/B0CB71PGHV",
  },
];
