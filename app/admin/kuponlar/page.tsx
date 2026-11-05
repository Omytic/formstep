import { saveCoupon, toggleCoupon } from "@/app/actions/admin";
import { ActionForm, F, T } from "@/components/admin/ActionForm";
import { listCoupons } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/orders";

export default async function Page() {
  await requireAdmin();
  const coupons = await listCoupons();
  return (
    <div className="fs-enter space-y-6">
      <h1 className="display text-4xl">Kuponlar</h1>
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Yeni kupon</h2>
        <ActionForm action={saveCoupon} submit="Kupon oluştur" resetOnSuccess className="mt-5">
          <div className="grid gap-4 md:grid-cols-4">
            <F label="Kod" name="code" placeholder="HOSGELDIN10" className="field uppercase" />
            <div>
              <label htmlFor="f-kind" className="label">Tür</label>
              <select id="f-kind" name="kind" className="field"><option value="percent">Yüzde (%)</option><option value="fixed">Tutar (TL)</option></select>
            </div>
            <F label="Değer" name="value" inputMode="decimal" hint="Yüzde için 10, tutar için 50,00" />
            <F label="En az sepet (TL)" name="min" inputMode="decimal" placeholder="0" />
            <F label="Başlangıç" name="startsAt" type="datetime-local" />
            <F label="Bitiş" name="endsAt" type="datetime-local" />
            <F label="Toplam kullanım" name="maxUses" type="number" min={1} placeholder="Sınırsız" />
            <F label="Kişi başı kullanım" name="maxPerEmail" type="number" min={1} placeholder="Sınırsız" />
            <div className="md:col-span-4"><T label="Not (yalnızca yönetim)" name="note" rows={2} /></div>
          </div>
        </ActionForm>
      </section>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-ink/50">
            <tr><th className="px-5 py-3 font-medium">Kod</th><th className="px-5 py-3 font-medium">İndirim</th><th className="px-5 py-3 font-medium">Koşul</th><th className="px-5 py-3 font-medium">Kullanım</th><th className="px-5 py-3 font-medium">Geçerlilik</th><th className="px-5 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {coupons.map((c) => (
              <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                <td className="px-5 py-3 font-semibold tracking-wide">{c.code}<p className="text-xs font-normal text-ink/45">{c.note}</p></td>
                <td className="px-5 py-3">{c.kind === "percent" ? `%${c.value}` : formatPrice(c.value)}</td>
                <td className="px-5 py-3 text-ink/65">{c.minSubtotalKurus ? `En az ${formatPrice(c.minSubtotalKurus)}` : "—"}{c.maxUsesPerEmail ? ` · kişi başı ${c.maxUsesPerEmail}` : ""}</td>
                <td className="px-5 py-3 tabular-nums">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                <td className="px-5 py-3 text-ink/65">{c.endsAt ? `${formatDate(c.endsAt)}'e kadar` : "Süresiz"}</td>
                <td className="px-5 py-3 text-right">
                  <form action={toggleCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                    <button type="submit" className="btn btn-ghost btn-sm">{c.active ? "Durdur" : "Etkinleştir"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!coupons.length ? <p className="px-5 py-10 text-center text-sm text-ink/50">Henüz kupon yok.</p> : null}
      </div>
    </div>
  );
}
