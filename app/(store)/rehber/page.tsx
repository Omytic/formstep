import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info } from "lucide-react";
import { homeModels } from "@/components/home/models";
import { ScrollEffects } from "@/components/home/ScrollEffects";
import { StoreButtons } from "@/components/ui/StoreButtons";
import { GUIDE_UPDATED, guideSections, guideSources } from "@/lib/guide";
import { getSettings } from "@/lib/store/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tabanlık rehberi",
  description:
    "Memory foam nedir, içe ve dışa basma nasıl anlaşılır, topuk dikeni ve topuk ağrısında tabanlık ne işe yarar, numara nasıl seçilir? FormStep tabanlık rehberi.",
  alternates: { canonical: "/rehber" },
};

export default async function GuidePage() {
  const { marketplaces } = await getSettings();
  return (
    <div className="bg-paper">
      <header className="relative overflow-hidden bg-night pb-20 pt-32 text-paper md:pb-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_80%_20%,rgba(36,119,234,0.3),transparent_70%)]" />
        <div className="fs-enter relative mx-auto max-w-7xl px-5">
          <p className="kicker text-sky">Tabanlık rehberi</p>
          <h1 className="display mt-4 max-w-4xl text-5xl md:text-7xl">
            Ayağını tanı,
            <br />
            <span className="text-sky">doğru tabanlığı seç.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">
            Memory foam&apos;un nasıl çalıştığından basış tipine, topuk ağrısından numara seçimine kadar bilmen gerekenler. Kısa, sade ve kaynaklı.
          </p>
          <nav aria-label="Rehber bölümleri" className="mt-10 flex flex-wrap gap-2">
            {guideSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="chip border border-white/15 bg-white/5 text-paper transition hover:border-sky hover:text-white">
                {s.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-16 md:py-24">
        {guideSections.map((s, i) => {
          const m = s.model ? homeModels.find((x) => x.slug === s.model!.slug) : null;
          return (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-line py-14 first:pt-0 last:border-0 md:py-20" aria-labelledby={`${s.id}-baslik`}>
              <div className="grid gap-10 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <p className="kicker text-blue" data-reveal>{String(i + 1).padStart(2, "0")} · {s.kicker}</p>
                  <h2 id={`${s.id}-baslik`} className="display mt-4 text-4xl md:text-5xl" data-reveal>{s.title}</h2>
                  <p className="mt-5 text-lg leading-8 text-ink/70" data-reveal>{s.lead}</p>
                  {m && s.model ? (
                    <Link href={`/urun/${m.slug}`} className="group mt-8 flex items-center gap-4 rounded-[1.5rem] p-4 transition hover:-translate-y-0.5" style={{ backgroundColor: m.bg, color: m.fg }} data-reveal>
                      <span className="relative size-20 shrink-0 transition-transform duration-700 group-hover:-rotate-12">
                        <Image src={m.image} alt={m.alt} fill sizes="80px" className="object-contain" />
                      </span>
                      <span className="flex-1 text-sm leading-6">{s.model.text}</span>
                      <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ) : null}
                </div>
                <div className="lg:col-span-7">
                  <div className="prose-fs space-y-4" data-reveal>
                    {s.paragraphs.map((p, k) => <p key={k}>{p}</p>)}
                  </div>
                  {s.points?.length ? (
                    <ul className={`mt-8 grid gap-3 ${s.points.length > 2 ? "sm:grid-cols-2" : ""}`} data-reveal-stagger>
                      {s.points.map((pt) => (
                        <li key={pt.title} className="rounded-2xl border border-line bg-white p-5">
                          <p className="font-semibold">{pt.title}</p>
                          <p className="mt-1 text-sm leading-6 text-ink/65">{pt.body}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {s.note ? (
                    <p className="mt-6 flex gap-3 rounded-2xl bg-warn/10 px-5 py-4 text-sm leading-6 text-ink/80" data-reveal>
                      <Info size={18} className="mt-0.5 shrink-0 text-warn" /> {s.note}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="bg-night py-20 text-paper md:py-28" aria-labelledby="rehber-satin-al">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="kicker text-sky">Hâlâ emin değil misin?</p>
            <h2 id="rehber-satin-al" className="display mt-4 text-4xl md:text-6xl">Sana hangisi uygun, birlikte bulalım.</h2>
            <Link href="/#secici" className="btn btn-primary mt-8">Model seçiciye git <ArrowRight size={17} /></Link>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="mb-3 text-sm font-semibold text-mist">Resmî mağazalarımız</p>
            <StoreButtons marketplaces={marketplaces} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14" aria-labelledby="kaynaklar">
        <h2 id="kaynaklar" className="text-lg font-semibold">Kaynaklar</h2>
        <p className="mt-1 text-sm text-ink/55">Son güncelleme: {GUIDE_UPDATED}. Bu sayfa genel bilgi amaçlıdır, tıbbi tavsiye yerine geçmez.</p>
        <ul className="mt-4 space-y-2 text-sm">
          {guideSources.map((src) => (
            <li key={src.url}>
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue underline-offset-4 hover:underline">
                {src.title} <ArrowUpRight size={13} />
              </a>
            </li>
          ))}
        </ul>
      </section>
      <ScrollEffects />
    </div>
  );
}
