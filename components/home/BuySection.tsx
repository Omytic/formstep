"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PointerEvent } from "react";
import { StoreButtons } from "@/components/ui/StoreButtons";
import { formatPrice } from "@/lib/money";
import type { Marketplaces, Product } from "@/lib/store/types";
import { homeModels } from "./models";

function spotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function BuyCard({ product, marketplaces }: { product: Product; marketplaces: Marketplaces }) {
  const m = homeModels.find((x) => x.slug === product.slug)!;
  const sizes = product.variants.filter((v) => v.active);
  const price = sizes.length ? Math.min(...sizes.map((v) => v.priceKurus)) : null;
  const range = sizes.length ? `${sizes[0].sizeLabel.split("-")[0]}–${sizes[sizes.length - 1].sizeLabel.split("-").pop()} numara` : "";

  return (
    <article
      onPointerMove={spotlight}
      className="spotlight group relative flex h-full flex-col overflow-hidden rounded-[2rem] p-7"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker" style={{ color: m.accent }}>{m.tag}</p>
          <Link href={`/urun/${product.slug}`} className="display mt-2 block text-5xl hover:opacity-80">{product.name}</Link>
        </div>
        {price !== null ? (
          <p className="shrink-0 text-right">
            <span className="block text-2xl font-bold tabular-nums">{formatPrice(price)}</span>
            <span className="text-xs" style={{ color: m.muted }}>KDV dahil</span>
          </p>
        ) : null}
      </div>

      <Link href={`/urun/${product.slug}`} className="relative my-4 block transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-rotate-6 group-hover:scale-[1.06]">
        <Image src={m.image} alt={m.alt} width={700} height={700} sizes="(min-width:768px) 30vw, 90vw" />
      </Link>

      <div className="mt-auto space-y-4">
        <p className="text-sm leading-6" style={{ color: m.muted }}>
          {m.forWho.slice(0, 2).join(" · ")}
          {range ? <><br />{range}</> : null}
        </p>
        <StoreButtons marketplaces={marketplaces} overrides={{ amazon: m.amazon }} product={product.name} />
        <Link href={`/urun/${product.slug}`} className="flex items-center justify-center gap-1.5 pt-1 text-sm font-semibold hover:underline" style={{ color: m.fg }}>
          {product.name}&apos;ü yakından incele <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export function BuySection({ products, marketplaces }: { products: Product[]; marketplaces: Marketplaces }) {
  return (
    <section id="satin-al" className="bg-white py-24 md:py-32" aria-labelledby="satin-al-baslik">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker text-blue" data-reveal>Satın al</p>
            <h2 id="satin-al-baslik" className="display mt-4 text-5xl md:text-7xl" data-reveal>
              Üç model.
              <br />
              Üç resmî mağaza.
            </h2>
          </div>
          <p className="max-w-sm leading-7 text-ink/65" data-reveal>
            FormStep&apos;i Amazon, Trendyol ve Hepsiburada&apos;daki resmî mağazalarımızdan al. Teslimat ve iade, alışveriş yaptığın mağazanın güvencesiyle.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3" data-reveal-stagger>
          {products.map((p) => (
            <div key={p.slug}>
              <BuyCard product={p} marketplaces={marketplaces} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
