import type { Metadata } from "next";
import { AlertTriangle, Download, Paperclip, Plus, Tags, Users } from "lucide-react";
import { deleteEntry, markPaid, saveCategory, saveCounterparty } from "@/app/actions/ops";
import { ActionForm, F, Toggle } from "@/components/admin/ActionForm";
import { EntryForm } from "@/components/admin/ops/EntryForm";
import { Select } from "@/components/admin/ops/fields";
import { InlineAction } from "@/components/admin/ops/InlineAction";
import { Panel } from "@/components/admin/ops/Panel";
import { Empty, MonthNav, PageHead, Stat, td, th, tl } from "@/components/admin/ops/ui";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { currentMonth, getAllEntries, getCategories, getCounterparties, getEntries, getTeam, monthRange } from "@/lib/ops/data";
import { COUNTERPARTY_KINDS, LEDGER_KINDS, PAY_METHODS, fmtDate, todayTR } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Aldı-verdi" };

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ ay?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const now = currentMonth();
  const month = /^\d{4}-\d{2}$/.test(sp.ay ?? "") ? sp.ay! : now;
  const [from, to] = monthRange(month);
  const [entries, allEntries, categories, counterparties, team] = await Promise.all([getEntries(from, to), getAllEntries(), getCategories(), getCounterparties(), getTeam()]);
  const today = todayTR();
  const cat = new Map(categories.map((c) => [c.id, c.name]));
  const cp = new Map(counterparties.map((c) => [c.id, c]));
  const who = new Map(team.map((m) => [m.id, m.name]));

  const done = entries.filter((e) => e.status === "odendi");
  const income = done.filter((e) => e.kind === "gelir").reduce((a, e) => a + e.amount_kurus, 0);
  const expense = done.filter((e) => e.kind === "gider").reduce((a, e) => a + e.amount_kurus, 0);

  const pending = allEntries.filter((e) => e.status === "bekliyor").sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999"));
  const toPay = pending.filter((e) => e.kind === "gider");
  const toCollect = pending.filter((e) => e.kind === "gelir");
  const overdue = pending.filter((e) => e.due_on && e.due_on < today);

  // Kasa: tüm zamanların ödenmiş hareketleri
  const cash = allEntries.filter((e) => e.status === "odendi").reduce((a, e) => a + LEDGER_KINDS[e.kind].sign * e.amount_kurus, 0);

  // Gider kategorileri (bu ay)
  const byCat = new Map<string, number>();
  for (const e of done.filter((x) => x.kind === "gider")) byCat.set(e.category_id ?? "", (byCat.get(e.category_id ?? "") ?? 0) + e.amount_kurus);
  const catRows = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  // Ortak hesabı ve cari bakiyeler (tüm zamanlar)
  const partners = counterparties.filter((c) => c.kind === "ortak").map((c) => {
    const list = allEntries.filter((e) => e.counterparty_id === c.id);
    const inn = list.filter((e) => e.kind === "ortak_giris").reduce((a, e) => a + e.amount_kurus, 0);
    const out = list.filter((e) => e.kind === "ortak_cikis").reduce((a, e) => a + e.amount_kurus, 0);
    return { c, inn, out };
  });
  const cari = counterparties.filter((c) => c.kind !== "ortak").map((c) => {
    const list = allEntries.filter((e) => e.counterparty_id === c.id);
    const owe = list.filter((e) => e.kind === "gider" && e.status === "bekliyor").reduce((a, e) => a + e.amount_kurus, 0);
    const due = list.filter((e) => e.kind === "gelir" && e.status === "bekliyor").reduce((a, e) => a + e.amount_kurus, 0);
    const paid = list.filter((e) => e.kind === "gider" && e.status === "odendi").reduce((a, e) => a + e.amount_kurus, 0);
    const got = list.filter((e) => e.kind === "gelir" && e.status === "odendi").reduce((a, e) => a + e.amount_kurus, 0);
    return { c, owe, due, paid, got };
  }).filter((x) => x.owe || x.due || x.paid || x.got || x.c.kind === "tedarikci");

  return (
    <div className="fs-enter space-y-8">
      <PageHead
        title="Aldı-verdi"
        actions={<a href={`${adm("/muhasebe/csv")}?ay=${month}`} className="btn btn-ghost btn-sm"><Download size={16} /> Excel (CSV)</a>}
      >
        Gelir, gider, vadeli ödemeler ve ortakların koyduğu / çektiği para. Resmî muhasebenin yerine geçmez; mali müşavire Excel olarak verilebilir.
      </PageHead>

      <MonthNav month={month} base={adm("/muhasebe")} max={now} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gelir" value={tl(income)} tone="text-good" sub="Bu ay tahsil edilen" />
        <Stat label="Gider" value={tl(expense)} tone="text-bad" sub="Bu ay ödenen" />
        <Stat label="Fark" value={tl(income - expense)} tone={income - expense < 0 ? "text-bad" : ""} sub="Gelir − gider" />
        <Stat label="Kasa" value={tl(cash)} sub="Tüm zamanlar: gelir − gider + ortak hareketleri" />
      </div>

      {pending.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "Ödenecekler", list: toPay, total: toPay.reduce((a, e) => a + e.amount_kurus, 0), verb: "Ödendi" },
            { title: "Tahsil edilecekler", list: toCollect, total: toCollect.reduce((a, e) => a + e.amount_kurus, 0), verb: "Tahsil edildi" },
          ].map((b) => (
            <div key={b.title} className="card min-w-0 p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold">{b.title}</h2>
                <span className="display text-2xl tabular-nums">{tl(b.total)}</span>
              </div>
              {b.list.length ? (
                <ul className="mt-4 divide-y divide-line text-sm">
                  {b.list.slice(0, 8).map((e) => {
                    const late = e.due_on && e.due_on < today;
                    return (
                      <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                        {late ? <AlertTriangle size={16} className="shrink-0 text-bad" /> : null}
                        <span className="min-w-0 flex-1 basis-40">
                          <span className="block truncate font-medium">{e.description || cat.get(e.category_id ?? "") || "—"}</span>
                          <span className={`text-xs ${late ? "text-bad" : "text-ink/50"}`}>{e.counterparty_id ? cp.get(e.counterparty_id)?.name + " · " : ""}{e.due_on ? `vade ${fmtDate(e.due_on)}` : "vade yok"}</span>
                        </span>
                        <span className="font-semibold tabular-nums">{tl(e.amount_kurus)}</span>
                        <InlineAction action={markPaid} fields={{ id: e.id }} label={b.verb} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink/70 hover:border-good hover:text-good" />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink/50">Bekleyen yok.</p>
              )}
            </div>
          ))}
        </div>
      ) : null}
      {overdue.length ? <p className="-mt-4 text-sm text-bad">{overdue.length} kaydın vadesi geçti.</p> : null}

      <Panel title="Yeni kayıt" sub="Gelir, gider ya da ortak parası" icon={<Plus size={18} />} open={!entries.length}>
        <EntryForm categories={categories} counterparties={counterparties} today={today} />
      </Panel>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Bu ayın kayıtları</h2>
        {entries.length ? (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Tarih</th>
                  <th className={th}>Tür</th>
                  <th className={th}>Açıklama</th>
                  <th className={th}>Kategori / kişi</th>
                  <th className={th}>Şekil</th>
                  <th className={`${th} text-right`}>Tutar</th>
                  <th className={th}>Giren</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((e) => {
                  const k = LEDGER_KINDS[e.kind];
                  return (
                    <tr key={e.id} className="hover:bg-paper/60">
                      <td className={`${td} whitespace-nowrap`}>{fmtDate(e.occurred_on)}</td>
                      <td className={td}>
                        <span className={`font-medium ${k.tone}`}>{k.label}</span>
                        {e.status === "bekliyor" ? <span className="chip ml-2 bg-warn/10 text-warn">Bekliyor</span> : null}
                      </td>
                      <td className={`${td} min-w-48 max-w-72 whitespace-normal`}>
                        <span className="line-clamp-2">{e.description || "—"}</span>
                        {e.file_path ? <a href={adm(`/muhasebe/dosya/${e.id}`)} target="_blank" className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue hover:underline"><Paperclip size={12} /> Dosya</a> : null}
                      </td>
                      <td className={`${td} min-w-40 whitespace-normal text-ink/65`}>{[e.category_id ? cat.get(e.category_id) : null, e.counterparty_id ? cp.get(e.counterparty_id)?.name : null].filter(Boolean).join(" · ") || "—"}</td>
                      <td className={`${td} text-ink/65`}>{PAY_METHODS[e.method as keyof typeof PAY_METHODS] ?? e.method}</td>
                      <td className={`${td} text-right font-semibold tabular-nums ${k.tone}`}>{k.sign < 0 ? "−" : "+"}{tl(e.amount_kurus)}</td>
                      <td className={`${td} text-ink/55`}>{e.created_by ? who.get(e.created_by) ?? "—" : "—"}</td>
                      <td className={`${td} text-right`}>{e.ref_type ? <span className="text-xs text-ink/35">sevkiyattan</span> : <InlineAction action={deleteEntry} fields={{ id: e.id }} label="Sil" confirm="Bu kayıt silinsin mi?" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Bu ay kayıt yok">Yukarıdaki &quot;Yeni kayıt&quot; panelinden ilk gelir ya da gideri ekle.</Empty>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-semibold">Bu ayın giderleri</h2>
          {catRows.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {catRows.map(([id, sum]) => (
                <li key={id} className="flex justify-between gap-3"><span className="text-ink/70">{cat.get(id) ?? "Kategorisiz"}</span><span className="font-semibold tabular-nums">{tl(sum)}</span></li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-ink/50">Henüz gider yok.</p>}
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Ortak hesabı</h2>
          <p className="text-xs text-ink/50">Tüm zamanlar</p>
          <ul className="mt-4 space-y-3 text-sm">
            {partners.map((p) => (
              <li key={p.c.id}>
                <div className="flex justify-between gap-3"><span className="font-medium">{p.c.name}</span><span className="font-semibold tabular-nums">{tl(p.inn - p.out)}</span></div>
                <p className="text-xs text-ink/50">Koydu {tl(p.inn)} · çekti {tl(p.out)}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Cari hesaplar</h2>
          <p className="text-xs text-ink/50">Tedarikçi ve pazaryeri bakiyeleri</p>
          {cari.length ? (
            <ul className="mt-4 space-y-3 text-sm">
              {cari.map((x) => (
                <li key={x.c.id}>
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{x.c.name}</span>
                    <span className={`font-semibold tabular-nums ${x.owe ? "text-bad" : x.due ? "text-good" : ""}`}>{x.owe ? `Borç ${tl(x.owe)}` : x.due ? `Alacak ${tl(x.due)}` : "Kapalı"}</span>
                  </div>
                  <p className="text-xs text-ink/50">{COUNTERPARTY_KINDS[x.c.kind as keyof typeof COUNTERPARTY_KINDS]} · ödenen {tl(x.paid)} · alınan {tl(x.got)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-ink/50">Henüz cari yok.</p>}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Tedarikçi / kişi ekle" sub="Üretici, kargo firması, ajans..." icon={<Users size={18} />}>
          <ActionForm action={saveCounterparty} submit="Ekle" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Ad" name="name" required />
              <Select label="Tür" name="kind" options={Object.entries(COUNTERPARTY_KINDS).filter(([k]) => k !== "ortak")} defaultValue="tedarikci" />
              <F label="Telefon" name="phone" />
              <F label="E-posta" name="email" type="email" />
              <div className="sm:col-span-2"><F label="Not" name="note" /></div>
            </div>
          </ActionForm>
        </Panel>
        <Panel title="Kategori ekle" sub="Gelir ya da gider kalemi" icon={<Tags size={18} />}>
          <ActionForm action={saveCategory} submit="Ekle" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <F label="Kategori adı" name="name" required />
              <Select label="Tür" name="kind" options={[["gider", "Gider"], ["gelir", "Gelir"]]} />
            </div>
            <div className="mt-4"><Toggle label="Kâr hesabına dahil et" name="in_pnl" defaultChecked /></div>
            <p className="mt-2 text-xs text-ink/50">Ürün alımı, pazaryeri komisyonu ve reklam kâr hesabında ayrıca sayıldığı için dahil edilmez.</p>
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
