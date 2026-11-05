import { adm } from "@/lib/admin-path";
import { emailConfigured, paytrConfigured, paytrTestMode, supabaseConfigured } from "@/lib/env";
import { sellerComplete } from "@/lib/legal";
import type { Product, StoreSettings } from "@/lib/store/types";

export type Gate = { id: string; label: string; ok: boolean; how: string; href?: string };

export function launchGates(input: { catalog: Product[]; settings: StoreSettings; raw: Record<string, unknown> }): Gate[] {
  const launch = (input.raw["private.launch"] ?? {}) as Record<string, boolean>;
  const notify = (input.raw["private.notify"] ?? {}) as Record<string, string>;
  return [
    { id: "supabase", label: "Veritabanı bağlı", ok: supabaseConfigured(), how: "Yeni FormStep Supabase projesi + anahtarlar (DEPLOYMENT.md)" },
    { id: "paytr-keys", label: "PayTR anahtarları girildi", ok: paytrConfigured(), how: "FormStep'e ait PayTR mağazasının merchant ID / key / salt değerleri Vercel'e" },
    { id: "paytr-live", label: "PayTR canlı mod onayı", ok: Boolean(launch.paytr_approved) && !paytrTestMode(), how: "Test ödemesi Başarılı görününce PAYTR_TEST_MODE=0 ve aşağıdan onay", href: adm("/ayarlar") },
    { id: "products", label: "En az bir model satışta", ok: input.catalog.some((p) => p.status === "published" && p.variants.some((v) => v.stock > 0)), how: "Numara, fiyat, stok gir ve yayına al", href: adm("/urunler") },
    { id: "shipping", label: "Kargo ücreti girildi", ok: input.settings.shipping.feeKurus !== null, how: "Kargo ücreti ve ücretsiz kargo sınırı", href: adm("/ayarlar") },
    { id: "seller", label: "Satıcı bilgileri tam", ok: sellerComplete(input.settings.seller), how: "Adres, telefon ve e-posta", href: adm("/ayarlar") },
    { id: "legal", label: "Yasal metinler incelendi", ok: Boolean(launch.legal_reviewed), how: "Avukat/muhasebeci onayı sonrası işaretle", href: adm("/ayarlar") },
    { id: "email", label: "E-posta gönderimi hazır", ok: emailConfigured() && Boolean(launch.email_dns_verified) && Boolean(notify.admin_email), how: "Resend anahtarı, alan adı DNS doğrulaması, bildirim adresi", href: adm("/ayarlar") },
  ];
}
