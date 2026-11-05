import { ArrowUpRight, CreditCard, RotateCcw, Truck } from "lucide-react";
import { SocialRow } from "@/components/layout/SocialRow";
import { formatPrice } from "@/lib/money";
import type { StoreSettings } from "@/lib/store/types";

export function Trust({ settings }: { settings: StoreSettings }) {
  const { shipping, marketplaces: m, claims } = settings;
  const claim = claims.find((c) => c.active);
  const stores = [
    { href: m.amazon, label: "Amazon" },
    { href: m.trendyol, label: "Trendyol" },
    { href: m.hepsiburada, label: "Hepsiburada" },
  ];
  const shipText =
    shipping.feeKurus === null
      ? "Siparişin özenle paketlenip kargoya verilir."
      : shipping.freeThresholdKurus
        ? `${formatPrice(shipping.freeThresholdKurus)} ve üzeri siparişlerde kargo bedava.`
        : shipping.feeKurus === 0
          ? "Tüm siparişlerde kargo bedava."
          : `Kargo ücreti ${formatPrice(shipping.feeKurus)}.`;

  const items = [
    { icon: CreditCard, title: "Güvenli ödeme", body: "Kartınla PayTR güvencesiyle öde. Kart bilgilerin bizde saklanmaz." },
    { icon: Truck, title: shipping.leadTimeText ? `${shipping.leadTimeText} kargoda` : "Kargo", body: shipText },
    { icon: RotateCcw, title: "14 gün cayma hakkı", body: "Teslimden itibaren 14 gün içinde cayma hakkını kullanabilirsin." },
  ];

  return (
    <section className="relative overflow-hidden bg-night py-24 text-paper md:py-32" aria-labelledby="guven-baslik">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_80%_0%,rgba(36,119,234,0.25),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="kicker text-sky" data-reveal>Neden FormStep?</p>
            <h2 id="guven-baslik" className="display mt-4 text-5xl md:text-7xl" data-reveal>
              {claim ? claim.text : (
                <>
                  Binlerce adımda
                  <br />
                  <span className="text-sky">denendi.</span>
                </>
              )}
            </h2>
            {claim ? (
              <p className="mt-4 text-sm text-mist/70" data-reveal>
                <a href={claim.evidenceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Amazon&apos;daki ürün sayfamızı gör</a> · yaklaşık iki yıldır Amazon, Trendyol ve Hepsiburada&apos;da satışta
              </p>
            ) : (
              <p className="mt-6 max-w-md text-lg leading-8 text-mist" data-reveal>
                FormStep yaklaşık iki yıldır Amazon, Trendyol ve Hepsiburada&apos;da satışta. Şimdi kendi mağazamızda.
              </p>
            )}
            <div className="mt-10 flex flex-wrap items-center gap-3" data-reveal>
              <SocialRow instagram={m.instagram} x={m.x} />
              {stores.map((s) =>
                s.href ? (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
                    {s.label} <ArrowUpRight size={15} />
                  </a>
                ) : (
                  <span key={s.label} className="chip border border-white/15 text-mist">{s.label}</span>
                ),
              )}
            </div>
          </div>
          <ul className="grid gap-4 lg:col-span-6" data-reveal-stagger>
            {items.map(({ icon: Icon, title, body }) => (
              <li key={title} className="group flex gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-500 hover:border-sky/50 hover:bg-white/[0.06]">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue/15 text-sky transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <Icon size={22} />
                </span>
                <span>
                  <span className="block text-xl font-semibold">{title}</span>
                  <span className="mt-1 block leading-7 text-mist">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
