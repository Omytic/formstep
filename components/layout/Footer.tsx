import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SELLER_LEGAL_NAME } from "@/lib/env";
import { LEGAL_NAV } from "@/lib/legal";
import { getSettings } from "@/lib/store/catalog";
import { ConsentLink } from "./Consent";
import { SocialRow } from "./SocialRow";
import { BestsellerBadge } from "@/components/ui/BestsellerBadge";

export async function Footer() {
  const { marketplaces: m, claims } = await getSettings();
  const claim = claims.find((c) => c.active)?.text;
  const stores = [
    { href: m.amazon, label: "Amazon", src: "/assets/brand/stores/amazon.png", w: 319, h: 96 },
    { href: m.trendyol, label: "Trendyol", src: "/assets/brand/stores/trendyol.png", w: 418, h: 162 },
    { href: m.hepsiburada, label: "Hepsiburada", src: "/assets/brand/stores/hepsiburada.png", w: 565, h: 162 },
  ].filter((s) => s.href);

  return (
    <footer className="relative overflow-hidden bg-night text-paper">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[80%] -translate-x-1/2 rounded-full bg-blue/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Image src="/assets/brand/logo-white.png" alt="FormStep" width={180} height={40} className="h-9 w-auto" />
            {claim ? <div className="mt-6"><BestsellerBadge text={claim} size="sm" /></div> : null}
            <p className="mt-6 max-w-sm text-lg leading-8 text-mist">Ayağının şeklini alan memory foam tabanlıklar. Her adımda daha fazla konfor.</p>
            <SocialRow instagram={m.instagram} x={m.x} className="mt-6" />
            <Link href="/#modeller" className="btn btn-primary mt-8">
              Modelleri keşfet
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="kicker text-mist/70">Modeller</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link className="hover:text-sky" href="/urun/m100">M100 · Günlük konfor</Link></li>
                <li><Link className="hover:text-sky" href="/urun/m300">M300 · Destek ve denge</Link></li>
                <li><Link className="hover:text-sky" href="/urun/m900">M900 · Premium konfor</Link></li>
                <li><Link className="hover:text-sky" href="/#secici">Hangisi bana uygun?</Link></li>
              </ul>
            </div>
            <div>
              <p className="kicker text-mist/70">Yardım</p>
              <ul className="mt-4 space-y-3 text-sm">
                {LEGAL_NAV.slice(0, 4).map((l) => (
                  <li key={l.slug}><Link className="hover:text-sky" href={`/bilgilendirme/${l.slug}`}>{l.title}</Link></li>
                ))}
                <li><Link className="hover:text-sky" href="/hesabim">Siparişlerim</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="kicker text-mist/70">Mağazalarımız</p>
              <ul className="mt-4 flex flex-col gap-2">
                {stores.length ? (
                  stores.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${s.label} mağazamız`}
                        className="group flex h-10 w-full items-center justify-between gap-3 overflow-hidden rounded-xl border border-white/15 px-3 transition hover:border-sky hover:bg-white/[0.04]"
                      >
                        <Image src={s.src} alt="" width={s.w} height={s.h} className="w-auto max-w-[7.25rem] object-contain object-left" style={{ height: 22, width: "auto" }} />
                        <ArrowUpRight size={15} className="shrink-0 text-mist transition group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-sky" />
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-mist/70">Amazon · Trendyol · Hepsiburada</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <p aria-hidden className="display pointer-events-none mt-20 select-none text-center text-[22vw] leading-[0.8] text-white/[0.04] lg:text-[17rem]">
          FormStep
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-mist/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} FormStep · {SELLER_LEGAL_NAME}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_NAV.slice(4).map((l) => (
              <Link key={l.slug} className="hover:text-paper" href={`/bilgilendirme/${l.slug}`}>{l.title}</Link>
            ))}
            <ConsentLink className="hover:text-paper" />
          </div>
        </div>
        <p className="mt-4 text-xs text-mist/50">Ödemeler PayTR güvencesiyle alınır. Kart bilgilerin FormStep tarafından görülmez ve saklanmaz.</p>
      </div>
    </footer>
  );
}
