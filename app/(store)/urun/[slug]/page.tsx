import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Faq } from "@/components/home/Faq";
import { HowTo } from "@/components/home/HowTo";
import { homeModels } from "@/components/home/models";
import { ScrollEffects } from "@/components/home/ScrollEffects";
import { ProductView } from "@/components/product/ProductView";
import { siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/money";
import { fromPrice, getCatalog, getFaqs, getProduct, getSettings } from "@/lib/store/catalog";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const title = product.seoTitle || `${product.name} — ${product.tagline} memory foam tabanlık`;
  const description = product.seoDescription || product.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/urun/${product.slug}` },
    openGraph: { title: `FormStep ${title}`, description, images: product.images[0] ? [{ url: product.images[0].src }] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings, catalog, faqs] = await Promise.all([getProduct(slug), getSettings(), getCatalog(), getFaqs()]);
  if (!product || product.status === "archived") notFound();
  const model = homeModels.find((m) => m.slug === product.slug)!;
  const others = catalog.filter((p) => p.slug !== product.slug);
  const features = product.features.length ? product.features : model.features;

  const m = settings.marketplaces;
  const offerUrl = model.amazon || m.amazon || m.trendyol || m.hepsiburada;
  const price = fromPrice(product);
  const jsonLd = price !== null
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `FormStep ${product.name}`,
        description: product.description,
        brand: { "@type": "Brand", name: "FormStep" },
        image: product.images.map((i) => `${siteUrl()}${i.src}`),
        url: `${siteUrl()}/urun/${product.slug}`,
        offers: {
          "@type": "Offer",
          price: (price / 100).toFixed(2),
          priceCurrency: "TRY",
          availability: "https://schema.org/InStock",
          url: offerUrl || `${siteUrl()}/urun/${product.slug}`,
          seller: { "@type": "Organization", name: "OMY Ticaret" },
        },
      }
    : null;

  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}
      <ProductView product={product} model={model} marketplaces={settings.marketplaces} claim={settings.claims.find((c) => c.active)?.text} />

      <section className="bg-white py-24 md:py-32" aria-labelledby="ozellik-baslik">
        <div className="mx-auto max-w-7xl px-5">
          <p className="kicker" style={{ color: model.accent }} data-reveal>{product.name} yakından</p>
          <h2 id="ozellik-baslik" className="display mt-4 max-w-4xl text-5xl md:text-7xl" data-reveal>
            {model.title}
          </h2>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
            {features.map((f, i) => (
              <li key={f.label} className="group relative overflow-hidden rounded-[2rem] border border-line bg-paper p-8 transition-colors duration-500 hover:border-transparent" style={{ ["--a" as string]: model.accent }}>
                <span aria-hidden className="absolute inset-0 origin-bottom scale-y-0 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-y-100" style={{ backgroundColor: model.accent }} />
                <span className="relative block text-sm tabular-nums transition-colors group-hover:text-white/80" style={{ color: model.accent }}>0{i + 1}</span>
                <span className="relative mt-10 block text-2xl font-semibold tracking-tight transition-colors group-hover:text-white">{f.label}</span>
                {f.body ? <span className="relative mt-2 block leading-7 text-ink/60 transition-colors group-hover:text-white/85">{f.body}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 md:py-28" style={{ backgroundColor: model.bg, color: model.fg }} aria-labelledby="kimler-baslik">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <p className="kicker" style={{ color: model.accent }} data-reveal>Kimler için?</p>
            <h2 id="kimler-baslik" className="display mt-4 text-5xl md:text-6xl" data-reveal>{model.tag}.</h2>
            <p className="mt-5 max-w-md leading-7" style={{ color: model.muted }} data-reveal>{model.body}</p>
            <Link href={`/rehber#${{ m100: "gunluk", m300: "basis-tipi", m900: "topuk" }[model.slug]}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline" style={{ color: model.accent }} data-reveal>
              {{ m100: "Gün boyu ayakta kalanlar için rehber", m300: "İçe ve dışa basma hakkında", m900: "Topuk ağrısı ve topuk dikeni hakkında" }[model.slug]} <ArrowRight size={15} />
            </Link>
          </div>
          <ul className="grid gap-3 lg:col-span-6 lg:col-start-7" data-reveal-stagger>
            {model.forWho.map((w) => (
              <li key={w} className="flex items-center gap-4 rounded-2xl px-5 py-4 text-lg font-semibold" style={{ backgroundColor: model.fg === "#10131D" ? "white" : "rgba(255,255,255,0.06)" }}>
                <span className="grid size-9 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: model.accent }}><Check size={17} /></span>
                {w}
              </li>
            ))}
            <li className="px-1 pt-1 text-xs" style={{ color: model.muted }}>FormStep tıbbi cihaz değil, konfor tabanlığıdır. Bir rahatsızlığın varsa bir uzmana danışmanı öneririz.</li>
          </ul>
        </div>
      </section>

      {product.sizeGuide ? (
        <section id="numara-rehberi" className="bg-paper py-20" aria-labelledby="rehber-baslik">
          <div className="mx-auto max-w-3xl px-5">
            <h2 id="rehber-baslik" className="display text-4xl md:text-5xl" data-reveal>Numara rehberi</h2>
            <div className="prose-fs mt-6 whitespace-pre-line" data-reveal>
              <p>{product.sizeGuide}</p>
            </div>
          </div>
        </section>
      ) : null}

      <HowTo />

      <section className="bg-night py-24 text-paper md:py-32" aria-labelledby="diger-baslik">
        <div className="mx-auto max-w-7xl px-5">
          <h2 id="diger-baslik" className="display text-5xl md:text-6xl" data-reveal>Diğer modeller</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2" data-reveal-stagger>
            {others.map((p) => {
              const m = homeModels.find((x) => x.slug === p.slug)!;
              const price = fromPrice(p);
              return (
                <Link key={p.slug} href={`/urun/${p.slug}`} className="group relative flex items-center gap-6 overflow-hidden rounded-[2rem] p-6" style={{ backgroundColor: m.bg, color: m.fg }}>
                  <div className="relative size-36 shrink-0 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-rotate-12 group-hover:scale-110 md:size-44">
                    <Image src={m.image} alt={m.alt} fill sizes="176px" className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="kicker" style={{ color: m.accent }}>{m.tag}</p>
                    <p className="display mt-2 text-5xl">{p.name}</p>
                    <p className="mt-2 text-sm" style={{ color: m.muted }}>{price !== null ? `${formatPrice(price)} · ${m.tag}` : m.tag}</p>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border transition-all duration-500 group-hover:translate-x-1" style={{ borderColor: m.muted }}>
                    <ArrowRight size={18} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Faq items={faqs} title="Sık sorulanlar" />
      <ScrollEffects />
    </>
  );
}
