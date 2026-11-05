import { BadgeCheck, RotateCcw, Store } from "lucide-react";
import { SocialRow } from "@/components/layout/SocialRow";
import { StoreButtons } from "@/components/ui/StoreButtons";
import type { StoreSettings } from "@/lib/store/types";

export function Trust({ settings }: { settings: StoreSettings }) {
  const { marketplaces: m, claims } = settings;
  const claim = claims.find((c) => c.active);

  const items = [
    { icon: BadgeCheck, title: "Amazon'da en çok satan", body: "FormStep, Amazon Türkiye'de kendi kategorisinin en çok satan tabanlıkları arasında." },
    { icon: Store, title: "Resmî mağazalar", body: "Amazon, Trendyol ve Hepsiburada'da satıcı OMY Ticaret: FormStep'in Türkiye distribütörü." },
    { icon: RotateCcw, title: "Kolay iade", body: "İade ve cayma hakkını, satın aldığın mağazanın iade süreciyle kolayca kullanırsın." },
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
                <a href={claim.evidenceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Amazon&apos;daki ürün sayfamızı gör</a> · iki yılı aşkın süredir Amazon, Trendyol ve Hepsiburada&apos;da
              </p>
            ) : (
              <p className="mt-6 max-w-md text-lg leading-8 text-mist" data-reveal>
                FormStep iki yılı aşkın süredir Amazon, Trendyol ve Hepsiburada&apos;da.
              </p>
            )}
            <div className="mt-10 max-w-md" data-reveal>
              <StoreButtons marketplaces={m} />
              <SocialRow instagram={m.instagram} x={m.x} className="mt-5" />
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
