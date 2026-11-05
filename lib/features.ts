/**
 * Sitenin hangi bölümlerinin açık olduğu. Şu an formstep.tr yalnızca tanıtım sitesi:
 * satışlar Amazon, Trendyol ve Hepsiburada'da yapılır, müşteri üyeliği kapalıdır.
 *
 * Sepet, ödeme (PayTR) ve üyelik kodları silinmedi; ileride açmak için Vercel'de
 *   NEXT_PUBLIC_SALES_ENABLED=1     → sepet, ödeme, sipariş takibi
 *   NEXT_PUBLIC_ACCOUNTS_ENABLED=1  → müşteri girişi, kayıt, Hesabım
 * ortam değişkenlerini ayarlamak yeterli. Yönetim paneli her durumda açıktır.
 */
export const SALES_ENABLED = process.env.NEXT_PUBLIC_SALES_ENABLED === "1";
export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED === "1";

/** Satış kapalıyken 404 dönen yollar. */
export const SALES_PATHS = /^\/(sepet|odeme|siparis)(\/|$)/;
/** Üyelik kapalıyken 404 dönen yollar. */
export const ACCOUNT_PATHS = /^\/(hesabim|giris|kayit|sifremi-unuttum|sifre-sifirla|auth\/callback)(\/|$)/;
