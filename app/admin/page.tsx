import { adm } from "@/lib/admin-path";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { StatusBadge } from "@/components/account/StatusBadge";
import { getDashboard, getSettingsRaw } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { launchGates } from "@/lib/launch";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/orders";
import { supabaseConfigured } from "@/lib/env";
import { SALES_ENABLED } from "@/lib/features";
import { sellerComplete } from "@/lib/legal";
import { getCatalogForAdmin, getSettings } from "@/lib/store/catalog";
import { Stat, n, tl } from "@/components/admin/ops/ui";
import { auditSentence } from "@/lib/ops/audit-text";
import { currentMonth, getAdSpend, getAllEntries, getAudit, getLocations, getLowStockLimit, getSales, getShipments, getStockLevels, getTasks, getTeam, getUnitCosts, getVariants, grossAmount, monthRange, netAmount, netUnits } from "@/lib/ops/data";
import { SHIP_STATUS, addDays, fmtDate, monthLabel, todayTR } from "@/lib/ops/meta";

export default async function AdminHome() {
  const me = await requireAdmin();
  if (!SALES_ENABLED) return <OpsHome name={me.name} meId={me.id} />;
  return <SalesHome />;
}

/** Operasyon özeti: satış, stok, para, sevkiyat, görev ve son işlemler tek bakışta. */
async function OpsHome({ name, meId }: { name: string; meId: string }) {
  const today = todayTR();
  const month = currentMonth();
  const [mFrom] = monthRange(month);
  const d30 = addDays(today, -29);
  const from = d30 < mFrom ? d30 : mFrom;
  const [sales, { models, byId }, locations, levels, entries, shipments, tasks, audit, team, low, catalog, settings, ads, costs] = await Promise.all([
    getSales(from, today),
    getVariants(),
    getLocations(),
    getStockLevels(),
    getAllEntries(),
    getShipments(),
    getTasks(),
    getAudit(6),
    getTeam(),
    getLowStockLimit(),
    getCatalogForAdmin(),
    getSettings(),
    getAdSpend(month),
    getUnitCosts(),
  ]);
  const who = new Map(team.map((m) => [m.id, m.name]));

  // Bu ay
  const thisMonth = sales.filter((s) => s.sold_on >= mFrom);
  const units = thisMonth.reduce((a, s) => a + netUnits(s), 0);
  const gross = thisMonth.reduce((a, s) => a + grossAmount(s), 0);
  const net = thisMonth.reduce((a, s) => a + netAmount(s), 0);
  const unitCost = new Map<string, number>(catalog.map((p) => [p.code, costs.filter((c) => c.product_id === p.id).reduce((a, c) => a + c.amount_kurus, 0)]));
  const cogs = thisMonth.reduce((a, s) => a + netUnits(s) * (s.variant_id ? unitCost.get(byId.get(s.variant_id)?.code ?? "") ?? 0 : 0), 0);
  const adSpent = ads.filter((x) => x.month.startsWith(month)).reduce((a, x) => a + x.spent_kurus, 0);

  // Son 30 gün, günlük
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const daily = days.map((d) => sales.filter((s) => s.sold_on === d).reduce((a, s) => a + netUnits(s), 0));
  const maxDay = Math.max(1, ...daily);
  const sold30 = new Map<string, number>();
  for (const s of sales.filter((x) => x.sold_on >= d30)) if (s.variant_id) sold30.set(s.variant_id, (sold30.get(s.variant_id) ?? 0) + netUnits(s));

  // Stok
  const active = locations.filter((l) => l.active);
  const locTotal = (id: string) => [...levels.values()].reduce((a, m) => a + (m.get(id) ?? 0), 0);
  const variants = models.flatMap((m) => m.variants);
  const totalOf = (v: string) => [...(levels.get(v)?.values() ?? [])].reduce((a, b) => a + b, 0);
  const critical = variants.filter((v) => totalOf(v.id) <= low).sort((a, b) => totalOf(a.id) - totalOf(b.id));
  const fba = locations.find((l) => l.kind === "amazon");
  const runningOut = fba
    ? variants
        .map((v) => ({ v, qty: levels.get(v.id)?.get(fba.id) ?? 0, perDay: (sold30.get(v.id) ?? 0) / 30 }))
        .filter((x) => x.perDay > 0 && x.qty / x.perDay < 21)
        .sort((a, b) => a.qty / a.perDay - b.qty / b.perDay)
    : [];

  // Para
  const pending = entries.filter((e) => e.status === "bekliyor");
  const overdue = pending.filter((e) => e.due_on && e.due_on < today);
  const soon = pending.filter((e) => e.due_on && e.due_on >= today && e.due_on <= addDays(today, 7));
  const openShip = shipments.filter((s) => s.status === "hazirlaniyor" || s.status === "yolda" || s.status === "eksik");
  const myTasks = tasks.filter((t) => !t.done && (t.assignee === meId || t.assignee === null)).slice(0, 5);
  const lateTasks = tasks.filter((t) => !t.done && t.due_on && t.due_on < today);

  const m = settings.marketplaces;
  const checks = [
    { label: "Veritabanı bağlı", ok: supabaseConfigured(), href: null },
    { label: "Üç model yayında", ok: catalog.every((p) => p.status === "published"), href: adm("/urunler") },
    { label: "Pazaryeri bağlantıları", ok: Boolean(m.amazon && m.trendyol && m.hepsiburada), href: adm("/icerik") },
    { label: "Satıcı bilgileri", ok: sellerComplete(settings.seller), href: adm("/ayarlar") },
    { label: "Birim maliyetler", ok: costs.length > 0, href: adm("/kar") },
  ];
  const alerts = [
    ...overdue.map((e) => ({ tone: "bad", text: `Vadesi geçti: ${e.description || "kayıt"} · ${formatPrice(e.amount_kurus)}`, href: adm("/muhasebe") })),
    ...(critical.length ? [{ tone: "warn", text: `${critical.length} numarada stok ${low} adet ve altında (${critical.slice(0, 4).map((v) => v.label).join(", ")}${critical.length > 4 ? "…" : ""})`, href: adm("/stok") }] : []),
    ...runningOut.slice(0, 3).map((x) => ({ tone: "warn", text: `Amazon'da ${x.v.label} yaklaşık ${Math.max(0, Math.floor(x.qty / x.perDay))} gün yeter (${x.qty} adet)`, href: adm("/sevkiyatlar/yeni") })),
    ...shipments.filter((s) => s.status === "eksik").map((s) => ({ tone: "warn", text: `Sevkiyat #${s.number}: teslim farkı var`, href: adm(`/sevkiyatlar/${s.id}`) })),
    ...(lateTasks.length ? [{ tone: "warn", text: `${lateTasks.length} görevin tarihi geçti`, href: adm("/gorevler") }] : []),
    ...soon.map((e) => ({ tone: "info", text: `${fmtDate(e.due_on)}: ${e.kind === "gelir" ? "tahsilat" : "ödeme"} ${formatPrice(e.amount_kurus)} · ${e.description || ""}`, href: adm("/muhasebe") })),
  ];
  const hour = Number(new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "numeric", hour12: false }).format(new Date()));
  const hello = hour < 6 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "Merhaba" : "İyi akşamlar";

  return (
    <div className="fs-enter space-y-8">
      <div>
        <p className="text-sm text-ink/50">{new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
        <h1 className="display mt-1 text-4xl">{hello}, {name}.</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`${monthLabel(month)} satış`} value={`${n(units)} adet`} sub={tl(gross) + " ciro"} />
        <Stat label="Elimize geçen" value={tl(net)} sub="Pazaryeri kesintileri düşülmüş" />
        <Stat label="Tahmini kâr" value={tl(net - cogs - adSpent)} sub={costs.length ? "Ürün maliyeti ve reklam düşülmüş" : "Birim maliyet girilmedi"} tone={net - cogs - adSpent < 0 ? "text-bad" : "text-good"} />
        <Stat label="Toplam stok" value={`${n(active.reduce((a, l) => a + locTotal(l.id), 0))} adet`} sub={active.map((l) => `${l.name.replace(/ \(.*\)/, "")} ${n(locTotal(l.id))}`).join(" · ")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Son 30 gün</h2>
            <Link href={adm("/satislar")} className="text-sm text-blue hover:underline">Satışlar</Link>
          </div>
          <div className="mt-5 flex h-36 items-end gap-[3px]" aria-label="Günlük satış adedi">
            {daily.map((u, i) => (
              <div key={days[i]} className="group relative flex h-full flex-1 items-end">
                <div className={`w-full rounded-t ${days[i] === today ? "bg-blue" : "bg-blue/35 group-hover:bg-blue/60"}`} style={{ height: `${u ? Math.max(4, (u / maxDay) * 100) : 1.5}%` }} />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[11px] text-white group-hover:block">{fmtDate(days[i]).replace(/ \d{4}$/, "")}: {u}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ink/40"><span>{fmtDate(days[0]).replace(/ \d{4}$/, "")}</span><span>Bugün</span></div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold">Dikkat</h2>
          {alerts.length ? (
            <ul className="mt-4 space-y-2.5 text-sm">
              {alerts.slice(0, 7).map((a, i) => (
                <li key={i}>
                  <Link href={a.href} className="flex gap-2.5 rounded-xl p-2 -m-2 hover:bg-paper">
                    {a.tone === "info" ? <Circle size={16} className="mt-0.5 shrink-0 text-blue" /> : <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${a.tone === "bad" ? "text-bad" : "text-warn"}`} />}
                    <span>{a.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-good"><CheckCircle2 size={17} /> Acil bir şey yok.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Açık sevkiyatlar</h2>
            <Link href={adm("/sevkiyatlar/yeni")} className="text-sm text-blue hover:underline">Yeni</Link>
          </div>
          {openShip.length ? (
            <ul className="mt-4 space-y-3 text-sm">
              {openShip.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link href={adm(`/sevkiyatlar/${s.id}`)} className="flex items-center justify-between gap-3 hover:text-blue">
                    <span>#{s.number} · {n(s.items.reduce((a, i) => a + i.qty_sent, 0))} adet</span>
                    <span className={`chip ${SHIP_STATUS[s.status].tone}`}>{SHIP_STATUS[s.status].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-ink/50">Yolda sevkiyat yok.</p>}
        </div>
        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Görevlerim</h2>
            <Link href={adm("/gorevler")} className="text-sm text-blue hover:underline">Tümü</Link>
          </div>
          {myTasks.length ? (
            <ul className="mt-4 space-y-2.5 text-sm">
              {myTasks.map((t) => (
                <li key={t.id} className="flex gap-2.5">
                  <Circle size={15} className="mt-0.5 shrink-0 text-ink/30" />
                  <span className="min-w-0 flex-1">{t.title}{t.due_on ? <span className={`block text-xs ${t.due_on < today ? "text-bad" : "text-ink/45"}`}>{fmtDate(t.due_on)}</span> : null}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-ink/50">Sana atanmış açık görev yok.</p>}
        </div>
        <div className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Son işlemler</h2>
            <Link href={adm("/gecmis")} className="text-sm text-blue hover:underline">Geçmiş</Link>
          </div>
          {audit.length ? (
            <ul className="mt-4 space-y-2.5 text-sm">
              {audit.map((r) => (
                <li key={r.id} className="leading-5">
                  <strong>{r.admin_id ? who.get(r.admin_id) ?? "—" : "Sistem"}</strong> {auditSentence(r.action)}
                  <span className="block text-xs text-ink/45">{new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(r.created_at))}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-sm text-ink/50">Henüz işlem yok.</p>}
        </div>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold">Kurulum</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {checks.map((c) => (
            <li key={c.label}>
              {c.href && !c.ok ? (
                <Link href={c.href} className="chip border border-line bg-white px-3 py-1.5 text-ink/65 hover:border-blue hover:text-blue"><Circle size={14} /> {c.label}</Link>
              ) : (
                <span className={`chip px-3 py-1.5 ${c.ok ? "bg-good/10 text-good" : "bg-ink/5 text-ink/50"}`}>{c.ok ? <CheckCircle2 size={14} /> : <Circle size={14} />} {c.label}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function SalesHome() {
  const [d, catalog, settings, raw] = await Promise.all([getDashboard(), getCatalogForAdmin(), getSettings(), getSettingsRaw()]);
  const gates = launchGates({ catalog, settings, raw });
  const done = gates.filter((g) => g.ok).length;
  const totalUnits = Object.values(d.units).reduce((a, b) => a + b, 0);

  return (
    <div className="fs-enter space-y-8">
      <div>
        <h1 className="display text-4xl">Özet</h1>
        <p className="mt-1 text-ink/55">Ödenmiş siparişler üzerinden.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Bugün", v: d.revenue.today, n: d.orders.today },
          { label: "Son 7 gün", v: d.revenue.week, n: d.orders.week },
          { label: "Son 30 gün", v: d.revenue.month, n: d.orders.month },
        ].map((k) => (
          <div key={k.label} className="card p-6">
            <p className="text-sm text-ink/55">{k.label}</p>
            <p className="display mt-2 text-3xl tabular-nums">{formatPrice(k.v)}</p>
            <p className="mt-1 text-sm text-ink/55">{k.n} sipariş</p>
          </div>
        ))}
        <Link href={adm("/siparisler?durum=acik")} className="card group bg-ink p-6 text-paper">
          <p className="text-sm text-mist">Kargolanacak</p>
          <p className="display mt-2 text-3xl">{d.orders.toShip}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-sky">Siparişlere git <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></p>
        </Link>
      </div>

      {d.orders.stockIssue ? (
        <Link href={adm("/siparisler?durum=stock_issue")} className="flex items-center gap-3 rounded-2xl bg-bad/10 px-5 py-4 text-sm text-bad">
          <AlertTriangle size={18} /> {d.orders.stockIssue} siparişte ödeme alındı ama stok yetmedi. İade ya da tedarik gerekli.
        </Link>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Son siparişler</h2>
            <Link href={adm("/siparisler")} className="text-sm text-blue hover:underline">Tümü</Link>
          </div>
          {d.recent.length ? (
            <ul className="mt-4 divide-y divide-line">
              {d.recent.map((o) => (
                <li key={o.id}>
                  <Link href={adm(`/siparisler/${o.id}`)} className="flex items-center gap-4 py-3 hover:bg-paper">
                    <span className="w-20 font-semibold tabular-nums">{o.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{o.fullName}<span className="text-ink/45"> · {formatDate(o.createdAt, true)}</span></span>
                    <span className="hidden tabular-nums sm:block">{formatPrice(o.totalKurus)}</span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-ink/50">Henüz sipariş yok.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Model dağılımı · 30 gün</h2>
            <div className="mt-4 space-y-3">
              {["M100", "M300", "M900"].map((c) => {
                const n = d.units[c] ?? 0;
                return (
                  <div key={c}>
                    <div className="flex justify-between text-sm"><span>{c}</span><span className="tabular-nums text-ink/60">{n} adet</span></div>
                    <div className="mt-1.5 h-2 rounded-full bg-ice"><div className="h-full rounded-full bg-blue transition-[width] duration-1000" style={{ width: `${totalUnits ? (n / totalUnits) * 100 : 0}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Azalan stok</h2>
            {d.lowStock.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {d.lowStock.slice(0, 8).map((s) => (
                  <li key={`${s.product}-${s.size}`} className="flex justify-between"><span>{s.product} · {s.size}</span><span className={s.stock === 0 ? "font-semibold text-bad" : "text-warn"}>{s.stock}</span></li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink/50">Sorun yok.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Canlı satış kontrol listesi</h2>
          <span className="chip bg-blue/10 text-blue">{done} / {gates.length}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-ice"><div className="h-full rounded-full bg-good transition-[width] duration-1000" style={{ width: `${(done / gates.length) * 100}%` }} /></div>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {gates.map((g) => (
            <li key={g.id} className="flex items-start gap-3 rounded-2xl bg-paper p-4">
              {g.ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-good" /> : <Circle size={20} className="mt-0.5 shrink-0 text-ink/25" />}
              <div className="text-sm">
                <p className="font-semibold">{g.label}</p>
                {!g.ok ? <p className="text-ink/55">{g.how}{g.href ? <> · <Link href={g.href} className="text-blue hover:underline">Düzenle</Link></> : null}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
