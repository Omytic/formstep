/**
 * Yönetim panelinin tarayıcıda görünen gizli adresi. Dosyalar app/admin altında durur;
 * proxy.ts bu adresi içeride /admin'e yönlendirir ve doğrudan /admin isteklerine 404 döner.
 * Değiştirmek için Vercel'de NEXT_PUBLIC_ADMIN_PATH ortam değişkenini ayarla (örn. /kapi-8k2f).
 */
function normalize(p: string): string {
  const clean = "/" + p.trim().replace(/^\/+|\/+$/g, "");
  return /^\/[a-z0-9-]{4,40}$/i.test(clean) && clean.toLowerCase() !== "/admin" ? clean : "/secretgate";
}

export const ADMIN = normalize(process.env.NEXT_PUBLIC_ADMIN_PATH || "/secretgate");

export function adm(path = ""): string {
  return ADMIN + path;
}
