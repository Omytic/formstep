import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { deleteAd, saveAd } from "@/app/actions/ops";
import { ActionForm, F } from "@/components/admin/ActionForm";
import { Select } from "@/components/admin/ops/fields";
import { InlineAction } from "@/components/admin/ops/InlineAction";
import { Panel } from "@/components/admin/ops/Panel";
import { Bar, Empty, PageHead, Stat, pct, td, th, tl } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/auth";
import { currentMonth, getAdSpend, getSales, grossAmount, lastMonths, monthRange } from "@/lib/ops/data";
import { AD_PLATFORMS, monthLabel } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Reklam" };

export default async function AdsPage() {
  await requireAdmin();
  const months = lastMonths(6);
  const [from] = monthRange(months[0]);
  const [, to] = monthRange(months[months.length - 1]);
  const [ads, sales] = await Promise.all([getAdSpend(months[0]), getSales(from, to)]);
  const now = currentMonth();
  const cur = ads.filter((a) => a.month.startsWith(now));
  const budget = cur.reduce((a, x) => a + x.budget_kurus, 0);
  const spent = cur.reduce((a, x) => a + x.spent_kurus, 0);
  const adSales = cur.reduce((a, x) => a + (x.ad_sales_kurus ?? 0), 0);
  const monthSales = (m: string) => sales.filter((s) => s.sold_on.startsWith(m)).reduce((a, s) => a + grossAmount(s), 0);

  return (
    <div className="fs-enter space-y-8">
      <PageHead title="Reklam">
        Kanal bazında aylık reklam bütçesi ve harcaması. ACoS: reklam harcamasının reklamdan gelen satışa oranı; TACoS: toplam satışa oranı.
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`${monthLabel(now)} bütçe`} value={tl(budget)} />
        <Stat label="Harcanan" value={tl(spent)} sub={budget ? `Bütçenin ${pct(spent, budget)}'i` : undefined} tone={budget && spent > budget ? "text-bad" : ""} />
        <Stat label="ACoS" value={pct(spent, adSales)} sub="Reklam / reklamdan gelen satış" />
        <Stat label="TACoS" value={pct(spent, monthSales(now))} sub="Reklam / toplam satış" />
      </div>

      <Panel title="Ay ekle ya da güncelle" sub="Aynı kanal ve ay tekrar girilirse üzerine yazılır" icon={<Plus size={18} />} open={!ads.length}>
        <ActionForm action={saveAd} submit="Kaydet" resetOnSuccess>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Select label="Kanal" name="platform" options={Object.entries(AD_PLATFORMS)} defaultValue="amazon" />
            <F label="Ay" name="month" type="month" defaultValue={now} required />
            <F label="Bütçe (TL)" name="budget" inputMode="decimal" />
            <F label="Harcanan (TL)" name="spent" inputMode="decimal" />
            <F label="Reklamdan satış (TL)" name="ad_sales" inputMode="decimal" hint="Reklam panelindeki satış" />
            <F label="Not" name="note" />
          </div>
        </ActionForm>
      </Panel>

      {ads.length ? (
        <div className="space-y-6">
          {[...months].reverse().map((m) => {
            const list = ads.filter((a) => a.month.startsWith(m));
            if (!list.length) return null;
            const total = list.reduce((a, x) => a + x.spent_kurus, 0);
            return (
              <section key={m}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="font-semibold">{monthLabel(m)}</h2>
                  <span className="text-sm text-ink/55">Toplam {tl(total)} · TACoS {pct(total, monthSales(m))}</span>
                </div>
                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-line">
                        <th className={th}>Kanal</th>
                        <th className={`${th} w-1/4`}>Harcama / bütçe</th>
                        <th className={`${th} text-right`}>Bütçe</th>
                        <th className={`${th} text-right`}>Harcanan</th>
                        <th className={`${th} text-right`}>Reklamdan satış</th>
                        <th className={`${th} text-right`}>ACoS</th>
                        <th className={th}></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {list.map((a) => (
                        <tr key={a.id}>
                          <td className={`${td} whitespace-normal font-medium`}>{AD_PLATFORMS[a.platform]}{a.note ? <span className="block text-xs font-normal text-ink/50">{a.note}</span> : null}</td>
                          <td className={`${td} min-w-32`}><Bar value={a.spent_kurus} max={a.budget_kurus || a.spent_kurus} tone={a.budget_kurus && a.spent_kurus > a.budget_kurus ? "bg-bad" : "bg-blue"} /></td>
                          <td className={`${td} text-right tabular-nums`}>{tl(a.budget_kurus)}</td>
                          <td className={`${td} text-right font-semibold tabular-nums`}>{tl(a.spent_kurus)}</td>
                          <td className={`${td} text-right tabular-nums`}>{a.ad_sales_kurus !== null ? tl(a.ad_sales_kurus) : "—"}</td>
                          <td className={`${td} text-right tabular-nums`}>{a.ad_sales_kurus ? pct(a.spent_kurus, a.ad_sales_kurus) : "—"}</td>
                          <td className={`${td} text-right`}><InlineAction action={deleteAd} fields={{ id: a.id }} label="Sil" confirm="Bu satır silinsin mi?" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Empty title="Henüz reklam kaydı yok">Her ay sonunda Amazon reklam panelinden ve Instagram&apos;dan harcamayı buraya gir; ACoS ve TACoS kendiliğinden hesaplanır.</Empty>
      )}
    </div>
  );
}
