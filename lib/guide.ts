/**
 * Tabanlık rehberi içeriği (/rehber). Sağlıkla ilgili bölümler genel bilgi amaçlıdır ve
 * kaynaklara dayanır; tıbbi tavsiye değildir. Metni değiştirirken kaynak listesini de güncelle.
 */

export type GuideSource = { title: string; url: string };

export type GuideSection = {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  paragraphs: string[];
  points?: { title: string; body: string }[];
  model?: { slug: "m100" | "m300" | "m900"; text: string };
  note?: string;
};

export const GUIDE_UPDATED = "Kasım 2026";

export const guideSections: GuideSection[] = [
  {
    id: "memory-foam",
    kicker: "Malzeme",
    title: "Memory foam nedir?",
    lead: "Isıyla yumuşayan, basınçla şekil alan ve yavaşça eski hâline dönen bir köpük.",
    paragraphs: [
      "Memory foam, teknik adıyla viskoelastik poliüretan köpüktür. İlk olarak 1966'da NASA'nın Ames Araştırma Merkezi'nde, uçak koltuklarını daha güvenli hâle getirmek için geliştirildi; o zamanlar adı \"yavaş geri dönen köpük\"tü.",
      "Vücut ısısına yakın sıcaklıkta yumuşar ve üzerine binen basınca göre şekil alır. Basınç kalktığında hemen değil, yavaşça eski hâline döner. Bu yüzden ayağının en çok yük bindirdiği noktalarda daha fazla çöker, basıncı tabanın geneline yayar.",
      "Açık hücreli yapısı havanın geçmesine izin verir. Soğukta biraz sertleşmesi normaldir; birkaç adımda vücut ısısıyla yeniden yumuşar.",
    ],
  },
  {
    id: "iki-katman",
    kicker: "Yapı",
    title: "Neden iki katman?",
    lead: "Biri konfor için, biri destek için. İkisi birlikte çalışır.",
    paragraphs: [
      "Yalnızca yumuşak bir tabanlık ilk anda rahat hissettirir ama ayağı yerinde tutmaz; yalnızca sert bir tabanlık destek verir ama gün boyu rahatsız edebilir. FormStep bu yüzden iki katmandan oluşur.",
    ],
    points: [
      { title: "Üst katman: memory foam", body: "Ayağına temas eden yumuşak katman. Isıyla şekil alır, adım darbesini yumuşatır, basıncı yayar." },
      { title: "Alt katman: destek tabanı", body: "Daha yoğun, formunu koruyan katman. Tabanlığa şeklini verir; modele göre ark desteği ve topuk yuvası bu katmandadır." },
    ],
  },
  {
    id: "basis-tipi",
    kicker: "Basış",
    title: "İçe mi basıyorsun, dışa mı?",
    lead: "Ayağın her adımda biraz içe döner; bu doğaldır. Fazlası ya da azı yük dağılımını değiştirir.",
    paragraphs: [
      "İçe basma (aşırı pronasyon), ayağın yere basarken fazla içe yuvarlanmasıdır ve çoğunlukla düşük ayak kemeriyle görülür. Dışa basma (supinasyon) ise tersidir: ayak dışa doğru yuvarlanır, daha çok yüksek kemerli ayaklarda görülür. İkisi de zamanla ayak, diz ve belde zorlanmaya yol açabilir.",
      "Evde iki basit yolla fikir edinebilirsin. Biri eski ayakkabının tabanına bakmak, diğeri ıslak ayak izi. En doğru sonucu ise yürüyüşünü inceleyen bir uzman verir.",
    ],
    points: [
      { title: "Ayakkabı aşınması", body: "Tabanın iç kenarı daha çok aşınmışsa içe, dış kenarı daha çok aşınmışsa dışa basıyor olabilirsin." },
      { title: "Islak ayak testi", body: "Ayağını ıslatıp düz bir zemine (kâğıt, karton) bas. İz neredeyse tam ayak şeklindeyse kemerin düşük, çok inceyse kemerin yüksek olabilir." },
      { title: "Ne işe yarar?", body: "Ark desteği ve topuğu kavrayan bir yuva, ayağın fazla içe ya da dışa kaymasını sınırlamaya yardımcı olur. Belirgin ağrın varsa uzmanın özel tabanlık (ortez) önerebilir." },
    ],
    model: { slug: "m300", text: "İçe ya da dışa basıyorsan: M300. Kavisli ark desteği ve derin topuk yuvası ayağını ortada tutar." },
  },
  {
    id: "topuk",
    kicker: "Topuk",
    title: "Topuk ağrısı ve topuk dikeni",
    lead: "Topuk ağrısının en sık nedeni plantar fasiittir. Sabahki ilk adımlarda batma hissiyle kendini gösterir.",
    paragraphs: [
      "Plantar fasya, topuk kemiğini parmak köklerine bağlayan kalın bir doku bandıdır; ayak kemerini taşır ve adımda darbe emer. Tekrarlayan gerilmeyle tahriş olduğunda topukta keskin, batıcı bir ağrı olur. Ağrı genellikle sabah ilk adımlarda ya da uzun süre oturduktan sonra kalkınca belirginleşir, hareket ettikçe azalır.",
      "Topuk dikeni, topuk kemiğinde oluşan küçük bir kemik çıkıntısıdır ve sıklıkla plantar fasiitle birlikte görülür. Çoğu kişi ameliyat olmadan; esneme egzersizleri, uygun ayakkabı ve tabanlık gibi yöntemlerle rahatlar.",
      "Uzun saatler ayakta kalmak ya da sert zeminde yürümek, fazla kilo, düz taban veya yüksek kemer, eskimiş ayakkabılar ve koşu gibi yüksek darbeli sporlar riski artırır.",
    ],
    points: [
      { title: "Destekleyici ayakkabı", body: "Kemer desteği ve yastıklaması olan, kalın tabanlı ayakkabılar seç. Uzun süre çıplak ayakla ve düz tabanla yürümekten kaçın." },
      { title: "Tabanlık", body: "Hazır ya da özel tabanlıklar basıncı ayağın geneline daha eşit yayarak topuğa binen yükü azaltabilir." },
      { title: "Esneme", body: "Ayak kemeri, baldır ve aşil tendonu için düzenli esneme egzersizleri önerilir." },
    ],
    model: { slug: "m900", text: "Topuk dikeni ya da topuk hassasiyeti yaşıyorsan: M900. Ekstra topuk dolgusu ve en kalın memory foam katmanıyla." },
    note: "Ağrın birkaç haftada geçmiyorsa, şişlik, uyuşma veya morarma varsa ya da yürümeni zorlaştırıyorsa bir hekime ya da fizyoterapiste başvur. FormStep tıbbi cihaz değildir ve tedavinin yerini tutmaz.",
  },
  {
    id: "gunluk",
    kicker: "Her gün",
    title: "Gün boyu ayaktaysan",
    lead: "Ağrın yoksa da sert zemin ve uzun saatler ayağı yorar.",
    paragraphs: [
      "Mağaza, mutfak, sınıf, şehir... Gün boyu ayakta kalmak ya da çok yürümek, özellikle ince tabanlı ayakkabılarla ayak tabanında yorgunluğa yol açar. Ayakkabının kendi tabanlığı çoğu zaman ince bir köpükten ibarettir ve kısa sürede çöker.",
      "Yumuşak bir memory foam tabanlık her adımın darbesini azaltır, ayakkabıyı değiştirmeden konforu artırır.",
    ],
    model: { slug: "m100", text: "Gündelik kullanım için: M100. Hafif yapısıyla her ayakkabıya uyar." },
  },
  {
    id: "numara",
    kicker: "Seçim",
    title: "Numaranı seç, doğru yerleştir",
    lead: "FormStep numaraları ikişerli aralıklarla gelir: 36-37'den 45-48'e.",
    paragraphs: [
      "Ayakkabı numaranın içinde bulunduğu aralığı seç. Numaran iki aralığın sınırındaysa (örneğin 40), ayakkabının kendi tabanlığının boyuna en yakın olanı tercih et.",
    ],
    points: [
      { title: "1. Eski tabanlığı çıkar", body: "FormStep, ayakkabının çıkarılabilir tabanlığının yerine kullanılır. İkisini üst üste koymak ayakkabıyı daraltır." },
      { title: "2. Karşılaştır", body: "Eski tabanlığı FormStep'in üstüne koy; boy ve genişlik yaklaşık aynı olmalı." },
      { title: "3. Topuktan oturt", body: "Tabanlığı önce topuk kısmından yerleştir, sonra burnu düzgünce ileri it. Kıvrılan ya da kabaran yer kalmasın." },
      { title: "4. Birkaç gün alış", body: "Destekli bir tabanlığa ilk günlerde birkaç saat kullanarak alışmak daha rahat olur." },
    ],
  },
  {
    id: "bakim",
    kicker: "Bakım",
    title: "Bakım ve ne zaman değiştirmeli?",
    lead: "Düzenli kullanımda tabanlıklar genellikle 6 ay civarında yenilenir; kullanım sıklığı ve aktiviteye göre değişir.",
    paragraphs: [
      "Genel bakım için tabanlığı ayakkabıdan çıkarıp havalandır; kirlendiğinde ılık su ve hafif sabunla elde sil, durulayıp gölgede kurumaya bırak. Memory foam yüksek ısıyı sevmez: çamaşır makinesi, kurutma makinesi, kalorifer ve doğrudan güneşten uzak tut. Ambalajdaki bakım talimatı varsa ona uy.",
    ],
    points: [
      { title: "Yastıklama çöktüyse", body: "Tabanlık incelmiş, eski yumuşaklığını kaybetmişse." },
      { title: "Şekil bozulduysa", body: "Kenarlar yıprandıysa, çatlak ya da kalıcı ezilme varsa." },
      { title: "Koku geçmiyorsa", body: "Temizlemene rağmen koku kalıyorsa." },
      { title: "Ağrı başladıysa", body: "Ayakta, dizde ya da belde yeni bir rahatsızlık hissediyorsan." },
    ],
  },
];

export const guideSources: GuideSource[] = [
  { title: "Mayo Clinic: Plantar fasciitis (Amerikan Hastanesi sağlık kütüphanesi)", url: "https://www.amerikanhastanesi.org/mayo-clinic-care-network/mayo-clinic-health-information-library/diseases-conditions/plantar-fasciitis" },
  { title: "Northwestern Medicine: Heel spur treatments", url: "https://www.nm.org/conditions-and-care-areas/orthopaedics/foot-and-ankle/heel-spur/treatments" },
  { title: "Banner Health: Do your feet under- or overpronate?", url: "https://www.bannerhealth.com/healthcareblog/teach-me/do-your-feet-under-or-overpronate-heres-how-to-tell" },
  { title: "Orthofeet: How long do shoe insoles last?", url: "https://orthofeet.com/blogs/news/how-long-do-shoe-insoles-last" },
  { title: "Memory foam (Wikipedia)", url: "https://en.wikipedia.org/wiki/Memory_foam" },
];
