import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Faq } from "@/components/home/Faq";
import { HowTo } from "@/components/home/HowTo";
import { homeModels } from "@/components/home/models";
import { ScrollEffects } from "@/components/home/ScrollEffects";
import { ProductView } from "@/components/product/ProductView";
import { siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/money";
import { fromPrice, getCatalog, getFaqs, getProduct, getSettings, isSellable } from "@/lib/store/catalog";

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
  const features = product.features.length ? product.features : model.facts.map((f) => ({ label: f, body: "" }));

  const jsonLd = isSellable(product)
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `FormStep ${product.name}`,
        description: product.description,
        brand: { "@type": "Brand", name: "FormStep" },
        image: product.images.map((i) => `${siteUrl()}${i.src}`),
        offers: product.variants.map((v) => ({
          "@type": "Offer",
          sku: v.sku,
          price: (v.priceKurus / 100).toFixed(2),
          priceCurrency: "TRY",
          availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${siteUrl()}/urun/${product.slug}`,
        })),
      }
    : null;

  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /> : null}
      <ProductView product={product} model={model} shipping={settings.shipping} marketplaces={settings.marketplaces} claim={settings.claims.find((c) => c.active)?.text} />

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
                    <p className="mt-2 text-sm" style={{ color: m.muted }}>{price !== null ? `${formatPrice(price)}` : "Sitede çok yakında"}</p>
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
