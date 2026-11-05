import { saveSetting } from "@/app/actions/admin";
import { ActionForm, F, Toggle } from "@/components/admin/ActionForm";
import { getSettingsRaw } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { paytrConfigured, paytrTestMode, siteUrl } from "@/lib/env";

type R = Record<string, unknown>;
const k2tl = (v: unknown) => (typeof v === "number" ? (v / 100).toFixed(2).replace(".", ",") : "");

export default async function Page() {
  const admin = await requireAdmin();
  const raw = await getSettingsRaw();
  const ship = (raw["public.shipping"] ?? {}) as R;
  const seller = (raw["public.seller"] ?? {}) as R;
  const notify = (raw["private.notify"] ?? {}) as R;
  const launch = (raw["private.launch"] ?? {}) as R;

  return (
    <div className="fs-enter space-y-6">
      <h1 className="display text-4xl">Ayarlar</h1>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Kargo</h2>
        <p className="mt-1 text-sm text-ink/55">Kargo ücreti girilmeden ödeme açılmaz. Tüm siparişlerde ücretsiz kargo için 0 yaz.</p>
        <ActionForm action={saveSetting} className="mt-4">
          <input type="hidden" name="key" value="public.shipping" />
          <div className="grid gap-4 md:grid-cols-4">
            <F label="Kargo ücreti (TL)" name="fee" inputMode="decimal" defaultValue={k2tl(ship.fee_kurus)} />
            <F label="Ücretsiz kargo sınırı (TL)" name="free" inputMode="decimal" defaultValue={k2tl(ship.free_threshold_kurus)} hint="Boş: sınır yok" />
            <F label="Kargo firması" name="carrier" defaultValue={String(ship.carrier ?? "")} />
            <F label="Teslim süresi" name="lead" defaultValue={String(ship.lead_time_text ?? "")} placeholder="1–3 iş günü içinde" />
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Satıcı bilgileri</h2>
        <p className="mt-1 text-sm text-ink/55">Mesafeli satış sözleşmesi, ön bilgilendirme formu ve alt bilgide görünür.</p>
        <ActionForm action={saveSetting} className="mt-4">
          <input type="hidden" name="key" value="public.seller" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><F label="Açık adres" name="address" defaultValue={String(seller.address ?? "")} /></div>
            <F label="Telefon" name="phone" defaultValue={String(seller.phone ?? "")} />
            <F label="E-posta" name="email" type="email" defaultValue={String(seller.email ?? "")} />
            <F label="Vergi dairesi" name="tax_office" defaultValue={String(seller.tax_office ?? "")} />
            <F label="Vergi numarası" name="tax_number" defaultValue={String(seller.tax_number ?? "")} />
            <F label="MERSİS no" name="mersis" defaultValue={String(seller.mersis ?? "")} />
            <F label="ETBİS kayıt no" name="etbis" defaultValue={String(seller.etbis ?? "")} />
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Bildirimler</h2>
        <ActionForm action={saveSetting} className="mt-4">
          <input type="hidden" name="key" value="private.notify" />
          <div className="grid gap-4 md:grid-cols-2">
            <F label="Yeni sipariş bildirimi gidecek e-posta" name="adminEmail" type="email" defaultValue={String(notify.admin_email ?? "")} />
            <F label="Azalan stok uyarı sınırı" name="lowStock" type="number" min={0} defaultValue={Number(notify.low_stock ?? 5)} />
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Ödeme (PayTR)</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-paper p-4"><dt className="text-ink/55">Anahtarlar</dt><dd className="mt-1 font-semibold">{paytrConfigured() ? "Girildi" : "Girilmedi"}</dd></div>
          <div className="rounded-2xl bg-paper p-4"><dt className="text-ink/55">Mod</dt><dd className="mt-1 font-semibold">{paytrTestMode() ? "Test" : "Canlı"}</dd></div>
          <div className="rounded-2xl bg-paper p-4"><dt className="text-ink/55">Bildirim URL&apos;si (PayTR paneline)</dt><dd className="mt-1 break-all font-mono text-xs">{siteUrl()}/api/paytr/notify</dd></div>
        </dl>
        {admin.role === "owner" ? (
          <ActionForm action={saveSetting} className="mt-5">
            <input type="hidden" name="key" value="private.launch" />
            <p className="mb-3 text-sm text-ink/55">Canlı satış, bu üç onay ve satıcı bilgileri tamamlanmadan açılmaz.</p>
            <div className="space-y-3">
              <Toggle label="PayTR, formstep.tr için FormStep mağazasını onayladı ve test ödemesi Başarılı göründü" name="paytr" defaultChecked={Boolean(launch.paytr_approved)} />
              <Toggle label="Yasal metinler avukat/muhasebeci tarafından incelendi" name="legal" defaultChecked={Boolean(launch.legal_reviewed)} />
              <Toggle label="E-posta alan adı (SPF/DKIM) doğrulandı" name="email" defaultChecked={Boolean(launch.email_dns_verified)} />
            </div>
          </ActionForm>
        ) : null}
      </section>
    </div>
  );
}
