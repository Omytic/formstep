/**
 * Yönetim panelinin adresi. Dosyalar app/admin altında; panel doğrudan /admin'den açılır.
 * Eski /secretgate adresi proxy.ts'de /admin'e yönlenir.
 * Güvenlik adresin gizliliğinden değil, şifreden ve giriş deneme sınırından gelir.
 */
export const ADMIN = "/admin";
/** Eski panel adresi; yer imleri bozulmasın diye yönlendirilir. */
export const LEGACY_ADMIN = "/secretgate";

export function adm(path = ""): string {
  return ADMIN + path;
}
