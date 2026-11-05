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

export default async function AdminHome() {
  await requireAdmin();
  if (!SALES_ENABLED) return <SiteHome />;
  return <SalesHome />;
}

/** Satış kapalıyken: sitenin içerik ve stok durumu. */
async function SiteHome() {
  const [catalog, settings] = await Promise.all([getCatalogForAdmin(), getSettings()]);
  const m = settings.marketplaces;
  const checks = [
    { label: "Veritabanı bağlı", ok: supabaseConfigured(), how: "Supabase anahtarları Vercel ortam değişkenlerinde olmalı" },
    { label: "Üç model yayında", ok: catalog.every((p) => p.status === "published"), how: "Ürünler sayfasından durumunu Yayında yap", href: adm("/urunler") },
    { label: "Pazaryeri bağlantıları", ok: Boolean(m.amazon && m.trendyol && m.hepsiburada), how: "İçerik sayfasından Amazon, Trendyol, Hepsiburada adresleri", href: adm("/icerik") },
    { label: "Satıcı bilgileri", ok: sellerComplete(settings.seller), how: "Adres, telefon ve e-posta", href: adm("/ayarlar") },
  ];
  return (
    <div className="fs-enter space-y-8">
      <div>
        <h1 className="display text-4xl">Özet</h1>
        <p className="mt-1 text-ink/55">formstep.tr tanıtım sitesi. Satışlar pazaryeri mağazalarında.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {catalog.map((p) => {
          const total = p.variants.reduce((a, v) => a + v.stock, 0);
          const price = p.variants.length ? Math.min(...p.variants.map((v) => v.priceKurus)) : null;
          return (
            <Link key={p.code} href={adm(`/urunler/${p.code}`)} className="card group p-6 transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p className="display text-3xl">{p.name}</p>
                <span className={`chip ${p.status === "published" ? "bg-good/10 text-good" : "bg-warn/10 text-warn"}`}>{p.status === "published" ? "Yayında" : p.status === "draft" ? "Taslak" : "Arşiv"}</span>
              </div>
              <p className="mt-1 text-sm text-ink/55">{p.tagline}</p>
              <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-ink/50">Fiyat</dt><dd className="font-semibold tabular-nums">{price !== null ? formatPrice(price) : "—"}</dd></div>
                <div><dt className="text-ink/50">Numara</dt><dd className="font-semibold tabular-nums">{p.variants.length}</dd></div>
                <div><dt className="text-ink/50">Stok</dt><dd className="font-semibold tabular-nums">{total}</dd></div>
              </dl>
              <p className="mt-5 flex items-center gap-1 text-sm text-blue">Düzenle <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Site kontrol listesi</h2>
          <ul className="mt-4 space-y-3">
            {checks.map((g) => (
              <li key={g.label} className="flex items-start gap-3 rounded-2xl bg-paper p-4">
                {g.ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-good" /> : <Circle size={20} className="mt-0.5 shrink-0 text-ink/25" />}
                <div className="text-sm">
                  <p className="font-semibold">{g.label}</p>
                  {!g.ok ? <p className="text-ink/55">{g.how}{g.href ? <> · <Link href={g.href} className="text-blue hover:underline">Düzenle</Link></> : null}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold">Hızlı erişim</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { href: adm("/stok"), t: "Stok", d: "Numara numara stok gir" },
              { href: adm("/urunler"), t: "Ürünler", d: "Açıklama, özellik, görsel, fiyat" },
              { href: adm("/icerik"), t: "İçerik", d: "Duyuru, SSS, pazaryeri linkleri, yasal metinler" },
              { href: adm("/ayarlar"), t: "Ayarlar", d: "Satıcı ve iletişim bilgileri" },
            ].map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="group block rounded-2xl bg-paper p-4 transition hover:bg-ice">
                  <p className="flex items-center gap-1 font-semibold">{q.t} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></p>
                  <p className="mt-0.5 text-sm text-ink/55">{q.d}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
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
