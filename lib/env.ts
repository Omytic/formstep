
function present(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

export const SELLER_LEGAL_NAME = "OMY TEKSTİL TURİZM GIDA SANAYİ TİCARET LİMİTED ŞİRKETİ";
/** İletişim ve sözleşmelerde görünen kısa ünvan. */
export const SELLER_DISPLAY_NAME = "OMY Tekstil Turizm Gıda San. Tic. Ltd. Şti.";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function supabaseConfigured(): boolean {
  return (
    present("NEXT_PUBLIC_SUPABASE_URL") &&
    present("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    present("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function paytrConfigured(): boolean {
  return present("PAYTR_MERCHANT_ID") && present("PAYTR_MERCHANT_KEY") && present("PAYTR_MERCHANT_SALT");
}

export function paytrTestMode(): boolean {
  return process.env.PAYTR_TEST_MODE !== "0";
}

export function emailConfigured(): boolean {
  return present("RESEND_API_KEY") && present("EMAIL_FROM");
}

/**
 * Önizleme modu: Supabase bağlı değilken, yalnızca geliştirme ortamında,
 * sitenin tüm akışlarını örnek katalogla gezebilmek için. Canlıda asla açılmaz.
 */
export function isPreview(): boolean {
  return process.env.NODE_ENV !== "production" && !supabaseConfigured();
}
