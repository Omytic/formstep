export type HomeModel = {
  slug: "m100" | "m300" | "m900";
  code: string;
  tag: string;
  title: string;
  body: string;
  facts: string[];
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
    body: "İşe, okula, şehre. Gri dokulu yüzeyi ve memory foam gövdesiyle gün boyu yumuşak bir zemin.",
    facts: ["Memory foam", "Gri dokulu yüzey", "Mavi taban"],
    image: "/assets/products/m100-2.png",
    alt: "FormStep M100 gri tabanlık, mavi taban",
    bg: "#E7EDF5",
    fg: "#10131D",
    accent: "#2477EA",
    muted: "rgba(16,19,29,0.62)",
    amazon: "https://www.amazon.com.tr/dp/B0GDQBGZMV",
  },
  {
    slug: "m300",
    code: "M300",
    tag: "Destek ve denge",
    title: "Topuk yuvasıyla daha dengeli adımlar.",
    body: "Kavisli formu ve belirgin topuk yuvasıyla ayağını yerinde tutar. Uzun saatler ayakta kalanlar için.",
    facts: ["Memory foam", "Topuk yuvası", "Kavisli form"],
    image: "/assets/products/m300.png",
    alt: "FormStep M300 siyah tabanlık, kraliyet mavisi taban ve topuk yuvası",
    bg: "#07090F",
    fg: "#F6F8FC",
    accent: "#0873E5",
    muted: "rgba(246,248,252,0.62)",
  },
  {
    slug: "m900",
    code: "M900",
    tag: "Premium konfor",
    title: "En yumuşak FormStep.",
    body: "Delikli, dokulu siyah yüzey ve kalın, gök mavisi taban. Tempoyu artırdığın günler için.",
    facts: ["Memory foam", "Delikli yüzey", "Kalın mavi taban"],
    image: "/assets/products/m900-2.png",
    alt: "FormStep M900 delikli siyah yüzeyli tabanlık, gök mavisi taban",
    bg: "#0E1A36",
    fg: "#F6F8FC",
    accent: "#4EA1E1",
    muted: "rgba(246,248,252,0.62)",
    amazon: "https://www.amazon.com.tr/dp/B0CB71PGHV",
  },
];
