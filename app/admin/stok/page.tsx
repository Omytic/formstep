import type { Metadata } from "next";
import { ArrowLeftRight, ClipboardCheck, PackagePlus } from "lucide-react";
import { deleteMovement, stockCount, stockIn, stockMove } from "@/app/actions/ops";
import { ActionForm, F } from "@/components/admin/ActionForm";
import { VariantSelect, Select } from "@/components/admin/ops/fields";
import { InlineAction } from "@/components/admin/ops/InlineAction";
import { Panel } from "@/components/admin/ops/Panel";
import { Empty, PageHead, Stat, n, td, th } from "@/components/admin/ops/ui";
import { VariantGrid } from "@/components/admin/ops/VariantGrid";
import { requireAdmin } from "@/lib/auth";
import { getLocations, getLowStockLimit, getMovements, getSales, getStockLevels, getTeam, getVariants, netUnits } from "@/lib/ops/data";
import { MOVEMENT_KINDS, addDays, fmtDate, todayTR } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Stok" };

export default async function StockPage() {
  await requireAdmin();
  const today = todayTR();
  const since = addDays(today, -30);
  const [{ models, byId }, locations, levels, movements, sales, low, team] = await Promise.all([
    getVariants(),
    getLocations(),
    getStockLevels(),
    getMovements(120),
    getSales(since, today),
    getLowStockLimit(),
    getTeam(),
  ]);
  const active = locations.filter((l) => l.active || [...levels.values()].some((m) => (m.get(l.id) ?? 0) !== 0));
  const locName = new Map(locations.map((l) => [l.id, l.name]));
  const who = new Map(team.map((m) => [m.id, m.name]));
  const depo = locations.find((l) => l.kind === "depo");

  const sold30 = new Map<string, number>();
  for (const s of sales) if (s.variant_id) sold30.set(s.variant_id, (sold30.get(s.variant_id) ?? 0) + netUnits(s));

  const qty = (v: string, l: string) => levels.get(v)?.get(l) ?? 0;
  const totalOf = (v: string) => active.reduce((s, l) => s + qty(v, l.id), 0);
  const locTotals = active.map((l) => models.reduce((s, m) => s + m.variants.reduce((a, v) => a + qty(v.id, l.id), 0), 0));
  const grand = locTotals.reduce((a, b) => a + b, 0);
  const lowCount = models.flatMap((m) => m.variants).filter((v) => totalOf(v.id) <= low).length;
  const depoHint = depo ? Object.fromEntries(models.flatMap((m) => m.variants.map((v) => [v.id, qty(v.id, depo.id)]))) : undefined;
  const locOptions = locations.filter((l) => l.active).map((l) => [l.id, l.name] as [string, string]);

  return (
    <div className="fs-enter space-y-8">
      <PageHead title="Stok">
        Model ve numara bazında her konumdaki adet. Stok girişi, sevkiyat ve pazaryeri satışları buraya otomatik yansır.
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Toplam stok" value={`${n(grand)} adet`} sub={`${active.length} konum`} />
        {active.slice(0, 2).map((l, i) => (
          <Stat key={l.id} label={l.name} value={`${n(locTotals[i])} adet`} />
        ))}
        <Stat label="Kritik numara" value={lowCount} sub={`Toplam stoğu ${low} adet ve altı`} tone={lowCount ? "text-warn" : ""} />
      </div>

      {models.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Model</th>
                <th className={th}>Numara</th>
                {active.map((l) => <th key={l.id} className={`${th} text-right`}>{l.name}</th>)}
                <th className={`${th} text-right`}>Toplam</th>
                <th className={`${th} text-right`}>Son 30 gün satış</th>
                <th className={`${th} text-right`}>Kaç gün yeter</th>
              </tr>
            </thead>
            {models.map((m) => (
              <tbody key={m.code} className="divide-y divide-line border-b-2 border-line">
                {m.variants.map((v, i) => {
                  const total = totalOf(v.id);
                  const sold = sold30.get(v.id) ?? 0;
                  const days = sold > 0 ? Math.floor(total / (sold / 30)) : null;
                  const isLow = total <= low;
                  return (
                    <tr key={v.id} className={isLow ? "bg-warn/[0.06]" : "hover:bg-paper/60"}>
                      <td className={`${td} py-2 font-semibold`}>{i === 0 ? <span className="display text-xl">{m.code}</span> : null}</td>
                      <td className={`${td} py-2 font-semibold tabular-nums`}>{v.size}</td>
                      {active.map((l) => {
                        const q = qty(v.id, l.id);
                        return <td key={l.id} className={`${td} py-2 text-right tabular-nums ${q < 0 ? "font-semibold text-bad" : q === 0 ? "text-ink/30" : ""}`}>{n(q)}</td>;
                      })}
                      <td className={`${td} py-2 text-right font-semibold tabular-nums ${isLow ? "text-warn" : ""}`}>{n(total)}</td>
                      <td className={`${td} py-2 text-right tabular-nums text-ink/60`}>{sold ? n(sold) : "—"}</td>
                      <td className={`${td} py-2 text-right tabular-nums ${days !== null && days < 30 ? "font-semibold text-warn" : "text-ink/60"}`}>{days === null ? "—" : `${n(days)} gün`}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      ) : (
        <Empty title="Henüz ürün yok">Ürünler sayfasından model ve numara ekleyince stok tablosu burada oluşur.</Empty>
      )}
      <p className="-mt-5 text-xs text-ink/45">Eksi görünen adet, kayıtlı stoktan fazla satış ya da sevkiyat yapıldığını gösterir; sayımla düzeltebilirsin.</p>

      <div className="space-y-3">
        <Panel title="Stok girişi" sub="Üreticiden gelen parti ya da depoya dönen ürün" icon={<PackagePlus size={18} />}>
          <ActionForm action={stockIn} submit="Stoğa ekle" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-4">
              <Select label="Konum" name="location_id" options={locOptions} defaultValue={depo?.id} required />
              <Select label="Tür" name="kind" options={[["giris", "Yeni stok (üretici / tedarikçi)"], ["iade", "İade (müşteriden geri geldi)"]]} />
              <F label="Tarih" name="occurred_on" type="date" defaultValue={today} required />
              <F label="Not" name="note" placeholder="Ör. 2. parti, fatura no" />
            </div>
            <div className="mt-5"><VariantGrid models={models} hint={depoHint} hintLabel="depoda" /></div>
          </ActionForm>
        </Panel>

        <Panel title="Tek hareket" sub="Konumlar arası transfer, fire / kayıp ya da düzeltme" icon={<ArrowLeftRight size={18} />}>
          <ActionForm action={stockMove} submit="Kaydet" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Hareket" name="kind" options={[["transfer", "Transfer"], ["fire", "Fire / kayıp"], ["duzeltme", "Düzeltme"], ["giris", "Stok girişi"], ["iade", "İade"]]} />
              <VariantSelect models={models} />
              <F label="Adet" name="qty" inputMode="numeric" required />
              <Select label="Çıkan konum" name="from_location" options={locOptions} empty="—" />
              <Select label="Giren konum" name="to_location" options={locOptions} empty="—" />
              <F label="Tarih" name="occurred_on" type="date" defaultValue={today} required />
            </div>
            <div className="mt-4"><F label="Not" name="note" placeholder="Neden?" /></div>
          </ActionForm>
        </Panel>

        <Panel title="Sayım" sub="Bir konumu say, sistem farkı otomatik düzeltsin" icon={<ClipboardCheck size={18} />}>
          <ActionForm action={stockCount} submit="Sayımı kaydet" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Sayılan konum" name="location_id" options={locOptions} defaultValue={depo?.id} required />
              <F label="Tarih" name="occurred_on" type="date" defaultValue={today} required />
              <F label="Not" name="note" placeholder="Ör. Ay sonu sayımı" />
            </div>
            <p className="mt-4 text-sm text-ink/55">Yalnızca saydığın numaraları doldur; boş bırakılanlar değişmez. Hücrenin altında sistemdeki depo adedi yazar.</p>
            <div className="mt-3"><VariantGrid models={models} prefix="c_" hint={depoHint} hintLabel="sistemde" /></div>
          </ActionForm>
        </Panel>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Son hareketler</h2>
        {movements.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Tarih</th>
                  <th className={th}>Hareket</th>
                  <th className={th}>Ürün</th>
                  <th className={`${th} text-right`}>Adet</th>
                  <th className={th}>Nereden → nereye</th>
                  <th className={th}>Not</th>
                  <th className={th}>Kim</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {movements.map((mv) => (
                  <tr key={mv.id} className="hover:bg-paper/60">
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(mv.occurred_on)}</td>
                    <td className={td}>{MOVEMENT_KINDS[mv.kind]}</td>
                    <td className={`${td} whitespace-nowrap font-medium`}>{byId.get(mv.variant_id)?.label ?? "—"}</td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{n(mv.qty)}</td>
                    <td className={`${td} text-ink/60`}>{mv.from_location ? locName.get(mv.from_location) : "Dışarıdan"} → {mv.to_location ? locName.get(mv.to_location) : "Dışarı"}</td>
                    <td className={`${td} max-w-56 truncate text-ink/60`} title={mv.note}>{mv.note || "—"}</td>
                    <td className={`${td} text-ink/60`}>{mv.created_by ? who.get(mv.created_by) ?? "—" : "—"}</td>
                    <td className={`${td} text-right`}>
                      {mv.ref_type ? <span className="text-xs text-ink/35">otomatik</span> : <InlineAction action={deleteMovement} fields={{ id: mv.id }} label="Sil" confirm="Bu hareket silinsin mi? Stok buna göre değişir." />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Henüz hareket yok">İlk stok girişini yukarıdaki &quot;Stok girişi&quot; panelinden yapabilirsin.</Empty>
        )}
      </section>
    </div>
  );
}
