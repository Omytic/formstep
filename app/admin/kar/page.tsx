import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import { saveUnitCosts } from "@/app/actions/ops";
import { ActionForm } from "@/components/admin/ActionForm";
import { Panel } from "@/components/admin/ops/Panel";
import { PageHead, Stat, n, pct, td, th, tl } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/auth";
import { getAdSpend, getAllEntries, getCategories, getSales, getUnitCosts, getVariants, lastMonths, monthRange, netAmount, grossAmount, netUnits } from "@/lib/ops/data";
import { CHANNELS, type Channel, monthLabel } from "@/lib/ops/meta";
import { getCatalogForAdmin } from "@/lib/store/catalog";

export const metadata: Metadata = { title: "Kâr ve raporlar" };

export default async function ProfitPage() {
  await requireAdmin();
  const months = lastMonths(12);
  const [from] = monthRange(months[0]);
  const [, to] = monthRange(months[months.length - 1]);
  const [sales, costs, products, { byId }, ads, entries, categories] = await Promise.all([
    getSales(from, to),
    getUnitCosts(),
    getCatalogForAdmin(),
    getVariants(),
    getAdSpend(months[0]),
    getAllEntries(),
    getCategories(),
  ]);

  const unitCost = new Map<string, number>(); // model kodu → kuruş
  for (const p of products) unitCost.set(p.code, costs.filter((c) => c.product_id === p.id).reduce((a, c) => a + c.amount_kurus, 0));
  const known = [...unitCost.values()].filter((v) => v > 0);
  const avgCost = known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : 0;
  const costOf = (variant: string | null) => (variant ? unitCost.get(byId.get(variant)?.code ?? "") || avgCost : avgCost);
  const pnlCats = new Set(categories.filter((c) => c.kind === "gider" && c.in_pnl).map((c) => c.id));

  const rows = months.map((m) => {
    const list = sales.filter((s) => s.sold_on.startsWith(m));
    const units = list.reduce((a, s) => a + netUnits(s), 0);
    const gross = list.reduce((a, s) => a + grossAmount(s), 0);
    const net = list.reduce((a, s) => a + netAmount(s), 0);
    const cogs = list.reduce((a, s) => a + netUnits(s) * costOf(s.variant_id), 0);
    const ad = ads.filter((x) => x.month.startsWith(m)).reduce((a, x) => a + x.spent_kurus, 0);
    const other = entries.filter((e) => e.kind === "gider" && e.occurred_on.startsWith(m) && (e.category_id === null || pnlCats.has(e.category_id))).reduce((a, e) => a + e.amount_kurus, 0);
    const profit = net - cogs - ad - other;
    return { m, units, gross, net, cogs, ad, other, profit };
  });
  const cur = rows[rows.length - 1];
  const year = rows.reduce((a, r) => ({ gross: a.gross + r.gross, profit: a.profit + r.profit, units: a.units + r.units }), { gross: 0, profit: 0, units: 0 });

  const thisMonth = sales.filter((s) => s.sold_on.startsWith(cur.m));
  const channels = (Object.keys(CHANNELS) as Channel[]).map((c) => {
    const list = thisMonth.filter((s) => s.channel === c);
    const units = list.reduce((a, s) => a + netUnits(s), 0);
    const gross = list.reduce((a, s) => a + grossAmount(s), 0);
    const net = list.reduce((a, s) => a + netAmount(s), 0);
    const cogs = list.reduce((a, s) => a + netUnits(s) * costOf(s.variant_id), 0);
    return { c, units, gross, fees: gross - net, net, cogs, contrib: net - cogs };
  });
  const noCost = !known.length;

  return (
    <div className="fs-enter space-y-8">
      <PageHead title="Kâr ve raporlar">
        Satışlardan pazaryeri kesintileri, ürün maliyeti, reklam ve diğer giderler düşülerek hesaplanır.
      </PageHead>

      {noCost ? (
        <p className="rounded-2xl bg-warn/10 px-5 py-4 text-sm text-warn">Kârın doğru çıkması için önce aşağıdan her modelin <strong>birim maliyetini</strong> gir. Girene kadar ürün maliyeti 0 sayılır.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`${monthLabel(cur.m)} kâr`} value={tl(cur.profit)} tone={cur.profit < 0 ? "text-bad" : "text-good"} sub={`Marj ${pct(cur.profit, cur.gross)}`} />
        <Stat label={`${monthLabel(cur.m)} ciro`} value={tl(cur.gross)} sub={`${n(cur.units)} adet`} />
        <Stat label="Son 12 ay kâr" value={tl(year.profit)} tone={year.profit < 0 ? "text-bad" : ""} sub={`Marj ${pct(year.profit, year.gross)}`} />
        <Stat label="Adet başı kâr (bu ay)" value={cur.units ? tl(Math.round(cur.profit / cur.units)) : "—"} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Aylık kâr-zarar</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Ay</th>
                <th className={`${th} text-right`}>Adet</th>
                <th className={`${th} text-right`}>Ciro</th>
                <th className={`${th} text-right`}>Pazaryeri kesintisi</th>
                <th className={`${th} text-right`}>Ürün maliyeti</th>
                <th className={`${th} text-right`}>Reklam</th>
                <th className={`${th} text-right`}>Diğer gider</th>
                <th className={`${th} text-right`}>Kâr</th>
                <th className={`${th} text-right`}>Marj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...rows].reverse().map((r) => (
                <tr key={r.m} className={r.gross || r.other || r.ad ? "hover:bg-paper/60" : "text-ink/35"}>
                  <td className={`${td} whitespace-nowrap font-medium`}>{monthLabel(r.m)}</td>
                  <td className={`${td} text-right tabular-nums`}>{n(r.units)}</td>
                  <td className={`${td} text-right tabular-nums`}>{tl(r.gross)}</td>
                  <td className={`${td} text-right tabular-nums text-ink/60`}>{tl(r.gross - r.net)}</td>
                  <td className={`${td} text-right tabular-nums text-ink/60`}>{tl(r.cogs)}</td>
                  <td className={`${td} text-right tabular-nums text-ink/60`}>{tl(r.ad)}</td>
                  <td className={`${td} text-right tabular-nums text-ink/60`}>{tl(r.other)}</td>
                  <td className={`${td} text-right font-semibold tabular-nums ${r.profit < 0 ? "text-bad" : ""}`}>{tl(r.profit)}</td>
                  <td className={`${td} text-right tabular-nums text-ink/60`}>{pct(r.profit, r.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink/50">Diğer gider: aldı-verdi&apos;deki giderler (ürün alımı, komisyon ve reklam kategorileri hariç; onlar ayrıca sayılıyor). Reklam: Reklam sayfasındaki harcamalar.</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Kanal karşılaştırması · {monthLabel(cur.m)}</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Kanal</th>
                <th className={`${th} text-right`}>Adet</th>
                <th className={`${th} text-right`}>Ciro</th>
                <th className={`${th} text-right`}>Kesinti</th>
                <th className={`${th} text-right`}>Ürün maliyeti</th>
                <th className={`${th} text-right`}>Katkı</th>
                <th className={`${th} text-right`}>Adet başı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {channels.map((x) => (
                <tr key={x.c} className={x.units ? "" : "text-ink/35"}>
                  <td className={`${td} font-medium`}>{CHANNELS[x.c]}</td>
                  <td className={`${td} text-right tabular-nums`}>{n(x.units)}</td>
                  <td className={`${td} text-right tabular-nums`}>{tl(x.gross)}</td>
                  <td className={`${td} text-right tabular-nums`}>{tl(x.fees)}{x.gross ? <span className="ml-1 text-xs text-ink/45">{pct(x.fees, x.gross)}</span> : null}</td>
                  <td className={`${td} text-right tabular-nums`}>{tl(x.cogs)}</td>
                  <td className={`${td} text-right font-semibold tabular-nums`}>{tl(x.contrib)}</td>
                  <td className={`${td} text-right tabular-nums`}>{x.units ? tl(Math.round(x.contrib / x.units)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink/50">Katkı: kesintiler ve ürün maliyeti düşüldükten sonra kanaldan kalan; reklam ve genel giderler hariç.</p>
      </section>

      <Panel title="Birim maliyet" sub="Bir tabanlığın size kaça mal olduğu (model başına)" icon={<Calculator size={18} />} open={noCost}>
        <div className="grid gap-4 lg:grid-cols-3">
          {products.map((p) => {
            const list = costs.filter((c) => c.product_id === p.id);
            const lines = [...list, ...Array.from({ length: Math.max(0, 4 - list.length) }, () => null)];
            return (
              <ActionForm key={p.id} action={saveUnitCosts} submit={`${p.code} kaydet`} className="rounded-2xl border border-line p-4">
                <input type="hidden" name="product_id" value={p.id} />
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="display text-2xl">{p.code}</span>
                  <span className="text-sm text-ink/55">Toplam <strong className="text-ink">{tl(unitCost.get(p.code) ?? 0)}</strong></span>
                </div>
                <div className="space-y-2">
                  {lines.map((c, i) => (
                    <div key={i} className="grid grid-cols-[1fr_110px] gap-2">
                      <input name={`label_${i}`} defaultValue={c?.label ?? (i === 0 ? "Tabanlık" : i === 1 ? "Kutu ve etiket" : "")} placeholder="Kalem" aria-label="Maliyet kalemi" className="field !py-2 text-sm" />
                      <input name={`amount_${i}`} defaultValue={c ? String(c.amount_kurus / 100).replace(".", ",") : ""} placeholder="TL" inputMode="decimal" aria-label="Tutar" className="field !py-2 text-right text-sm tabular-nums" />
                    </div>
                  ))}
                </div>
              </ActionForm>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ink/50">Ör. tabanlığın üreticiden geliş fiyatı, kutu, etiket, depoya iç kargo. Pazaryeri komisyonu ve kargo kesintisi buraya yazılmaz; satış raporlarından gelir.</p>
      </Panel>
    </div>
  );
}
