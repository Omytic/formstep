import type { Metadata } from "next";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { addSale, deleteSale, mapSku, undoImport } from "@/app/actions/ops";
import { ActionForm, F } from "@/components/admin/ActionForm";
import { Select, VariantSelect } from "@/components/admin/ops/fields";
import { InlineAction } from "@/components/admin/ops/InlineAction";
import { Panel } from "@/components/admin/ops/Panel";
import { Bar, Empty, MonthNav, PageHead, Stat, n, pct, td, th, tl } from "@/components/admin/ops/ui";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { currentMonth, getImports, getSales, getTeam, getUnmatchedSkus, getVariants, grossAmount, monthRange, netAmount, netUnits } from "@/lib/ops/data";
import { CHANNELS, type Channel, fmtDate, todayTR } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Satışlar" };

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ ay?: string; kanal?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const now = currentMonth();
  const month = /^\d{4}-\d{2}$/.test(sp.ay ?? "") ? sp.ay! : now;
  const channel = sp.kanal && sp.kanal in CHANNELS ? (sp.kanal as Channel) : undefined;
  const [from, to] = monthRange(month);
  const [all, { models, byId }, unmatched, imports, team] = await Promise.all([getSales(from, to), getVariants(), getUnmatchedSkus(), getImports(), getTeam()]);
  const sales = channel ? all.filter((s) => s.channel === channel) : all;
  const who = new Map(team.map((m) => [m.id, m.name]));

  const sum = (f: (s: (typeof sales)[number]) => number, list = sales) => list.reduce((a, s) => a + f(s), 0);
  const units = sum(netUnits);
  const gross = sum(grossAmount);
  const net = sum(netAmount);
  const returns = sales.filter((s) => s.type === "iade").reduce((a, s) => a + s.qty, 0);

  const byChannel = (Object.keys(CHANNELS) as Channel[]).map((c) => {
    const list = all.filter((s) => s.channel === c);
    return { c, units: sum(netUnits, list), gross: sum(grossAmount, list), net: sum(netAmount, list) };
  });
  const maxCh = Math.max(1, ...byChannel.map((x) => x.gross));

  const byVariant = new Map<string, number>();
  for (const s of sales) if (s.variant_id) byVariant.set(s.variant_id, (byVariant.get(s.variant_id) ?? 0) + netUnits(s));
  const top = [...byVariant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const byModel = models.map((m) => ({ code: m.code, units: m.variants.reduce((a, v) => a + (byVariant.get(v.id) ?? 0), 0) }));
  const maxModel = Math.max(1, ...byModel.map((x) => x.units));

  const q = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (month !== now) p.set("ay", month);
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    const s = p.toString();
    return adm("/satislar") + (s ? `?${s}` : "");
  };

  return (
    <div className="fs-enter space-y-8">
      <PageHead
        title="Satışlar"
        actions={
          <>
            <a href={`${adm("/satislar/csv")}?ay=${month}${channel ? `&kanal=${channel}` : ""}`} className="btn btn-ghost btn-sm"><Download size={16} /> Excel (CSV)</a>
            <Link href={adm("/satislar/yukle")} className="btn btn-primary btn-sm"><Upload size={16} /> Rapor yükle</Link>
          </>
        }
      >
        Amazon, Trendyol ve Hepsiburada satışları. Rapor yükleyerek ya da tek tek ekleyerek girilir.
      </PageHead>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav month={month} base={adm("/satislar")} max={now} />
        <div className="flex flex-wrap gap-1.5">
          <Link href={q({})} className={`chip border ${!channel ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/65 hover:border-ink/30"}`}>Tümü</Link>
          {(Object.keys(CHANNELS) as Channel[]).map((c) => (
            <Link key={c} href={q({ kanal: c })} className={`chip border ${channel === c ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/65 hover:border-ink/30"}`}>{CHANNELS[c]}</Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Satılan" value={`${n(units)} adet`} sub={returns ? `${returns} adet iade düşüldü` : "İade yok"} />
        <Stat label="Ciro" value={tl(gross)} />
        <Stat label="Kesintiler" value={tl(gross - net)} sub={`Komisyon, kargo ve diğer · ${pct(gross - net, gross)}`} />
        <Stat label="Elimize geçen" value={tl(net)} tone="text-good" sub="Kesintiler düşülmüş" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Kanallar</h2>
          <ul className="mt-4 space-y-4">
            {byChannel.map((x) => (
              <li key={x.c}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{CHANNELS[x.c]}</span>
                  <span className="tabular-nums text-ink/60">{n(x.units)} adet · <strong className="text-ink">{tl(x.gross)}</strong></span>
                </div>
                <Bar value={x.gross} max={maxCh} tone={x.c === "amazon" ? "bg-[#ff9900]" : x.c === "trendyol" ? "bg-[#f27a1a]" : x.c === "hepsiburada" ? "bg-[#ff6000]" : "bg-ink/40"} />
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Modeller ve en çok satan numaralar</h2>
          <ul className="mt-4 space-y-3">
            {byModel.map((m) => (
              <li key={m.code} className="flex items-center gap-3 text-sm">
                <span className="w-12 font-semibold">{m.code}</span>
                <span className="flex-1"><Bar value={m.units} max={maxModel} /></span>
                <span className="w-16 text-right tabular-nums">{n(m.units)}</span>
              </li>
            ))}
          </ul>
          {top.length ? (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {top.map(([id, u]) => <span key={id} className="chip bg-paper text-ink/70">{byId.get(id)?.label} · <strong className="ml-1 text-ink">{u}</strong></span>)}
            </div>
          ) : null}
        </div>
      </div>

      {unmatched.length ? (
        <section className="card border-warn/30 p-6">
          <h2 className="font-semibold">Eşlenmemiş ürünler</h2>
          <p className="mt-1 text-sm text-ink/55">Bu kodlar bizdeki bir model-numarayla eşleşmedi; stoktan düşmüyorlar. Bir kez eşlediğinde eski ve yeni satışlar düzelir.</p>
          <ul className="mt-4 divide-y divide-line">
            {unmatched.slice(0, 30).map((u) => (
              <li key={`${u.channel}|${u.sku}`} className="py-3">
                <ActionForm action={mapSku} submit="Eşle" className="grid items-end gap-3 sm:grid-cols-[1fr_260px_auto]">
                  <input type="hidden" name="channel" value={u.channel} />
                  <input type="hidden" name="sku" value={u.sku} />
                  <div className="text-sm">
                    <p className="font-mono font-semibold">{u.sku || "(boş kod)"}</p>
                    <p className="text-ink/55">{CHANNELS[u.channel]} · {u.rows} satır{u.title ? ` · ${u.title}` : ""}</p>
                  </div>
                  <VariantSelect models={models} label="Bizdeki karşılığı" />
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Panel title="Elle satış ekle" sub="Rapor yüklemeden tek bir satış ya da iade girmek için">
        <ActionForm action={addSale} submit="Kaydet" resetOnSuccess>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Kanal" name="channel" options={Object.entries(CHANNELS)} defaultValue="amazon" />
            <Select label="Tür" name="type" options={[["satis", "Satış"], ["iade", "İade"]]} />
            <F label="Tarih" name="sold_on" type="date" defaultValue={todayTR()} required />
            <F label="Sipariş no" name="order_no" placeholder="Boş bırakılabilir" />
            <VariantSelect models={models} />
            <F label="Adet" name="qty" inputMode="numeric" defaultValue="1" required />
            <F label="Satış tutarı (TL, toplam)" name="gross" inputMode="decimal" required />
            <F label="Komisyon (TL)" name="commission" inputMode="decimal" />
            <F label="Kargo kesintisi (TL)" name="shipping" inputMode="decimal" />
            <F label="Diğer kesinti (TL)" name="other" inputMode="decimal" />
            <div className="sm:col-span-2"><F label="Not" name="note" /></div>
          </div>
        </ActionForm>
      </Panel>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Satış satırları <span className="text-sm font-normal text-ink/45">({n(sales.length)})</span></h2>
        {sales.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Tarih</th>
                  <th className={th}>Kanal</th>
                  <th className={th}>Sipariş</th>
                  <th className={th}>Ürün</th>
                  <th className={`${th} text-right`}>Adet</th>
                  <th className={`${th} text-right`}>Tutar</th>
                  <th className={`${th} text-right`}>Kesinti</th>
                  <th className={`${th} text-right`}>Net</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sales.slice(0, 300).map((s) => (
                  <tr key={s.id} className={s.type === "iade" ? "bg-bad/[0.04]" : "hover:bg-paper/60"}>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(s.sold_on)}</td>
                    <td className={td}>{CHANNELS[s.channel]}{s.type === "iade" ? <span className="chip ml-2 bg-bad/10 text-bad">İade</span> : null}</td>
                    <td className={`${td} font-mono text-xs`}>{s.order_no}</td>
                    <td className={`${td} whitespace-nowrap`}>{s.variant_id ? byId.get(s.variant_id)?.label : <span className="text-warn" title={s.product_title}>{s.external_sku || "?"}</span>}</td>
                    <td className={`${td} text-right tabular-nums`}>{s.qty}</td>
                    <td className={`${td} text-right tabular-nums`}>{s.type === "iade" ? "−" : ""}{tl(s.gross_kurus)}</td>
                    <td className={`${td} text-right tabular-nums text-ink/55`}>{tl(s.gross_kurus - s.net_kurus)}</td>
                    <td className={`${td} text-right font-semibold tabular-nums ${s.type === "iade" ? "text-bad" : ""}`}>{s.type === "iade" ? "−" : ""}{tl(s.net_kurus)}</td>
                    <td className={`${td} text-right`}><InlineAction action={deleteSale} fields={{ id: s.id }} label="Sil" confirm="Bu satış satırı silinsin mi?" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length > 300 ? <p className="border-t border-line px-4 py-3 text-sm text-ink/50">İlk 300 satır gösteriliyor; tamamı için Excel (CSV) indir.</p> : null}
          </div>
        ) : (
          <Empty title="Bu ay satış kaydı yok">
            Pazaryerinden indirdiğin raporu <Link href={adm("/satislar/yukle")} className="text-blue hover:underline">yükle</Link> ya da yukarıdan elle ekle.
          </Empty>
        )}
      </section>

      {imports.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Son yüklemeler</h2>
          <div className="card divide-y divide-line">
            {imports.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="font-medium">{CHANNELS[i.channel]}</span>
                <span className="min-w-0 flex-1 truncate text-ink/60">{i.file_name}</span>
                <span className="tabular-nums text-ink/60">{i.inserted} eklendi · {i.skipped} atlandı</span>
                <span className="text-ink/45">{i.created_by ? who.get(i.created_by) : ""} · {fmtDate(i.created_at)}</span>
                <InlineAction action={undoImport} fields={{ id: i.id }} label="Geri al" confirm="Bu yüklemeyle eklenen tüm satışlar silinsin mi?" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
