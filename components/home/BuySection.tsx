"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { useState, type PointerEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { SizePicker } from "@/components/product/SizePicker";
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
  const { add } = useCart();
  const available = product.variants.filter((v) => v.stock > 0);
  const [variantId, setVariantId] = useState<string | null>(available.length === 1 ? available[0].id : null);
  const [hint, setHint] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const price = variant?.priceKurus ?? (product.variants.length ? Math.min(...product.variants.map((v) => v.priceKurus)) : null);
  const sellable = available.length > 0;
  const firstStore = marketplaces.amazon || marketplaces.trendyol || marketplaces.hepsiburada;

  return (
    <article
      onPointerMove={spotlight}
      className="spotlight group relative flex h-full flex-col overflow-hidden rounded-[2rem] p-7"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="kicker" style={{ color: m.accent }}>{m.tag}</p>
          <Link href={`/urun/${product.slug}`} className="display mt-2 block text-5xl hover:opacity-80">{product.name}</Link>
        </div>
        {price !== null ? (
          <p className="text-right">
            <span className="block text-2xl font-bold tabular-nums">{formatPrice(price)}</span>
            <span className="text-xs" style={{ color: m.muted }}>KDV dahil</span>
          </p>
        ) : null}
      </div>

      <Link href={`/urun/${product.slug}`} className="relative my-4 block transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-rotate-6 group-hover:scale-[1.06]">
        <Image src={m.image} alt={m.alt} width={700} height={700} sizes="(min-width:768px) 30vw, 90vw" />
      </Link>

      <div className="mt-auto space-y-4">
        {sellable ? (
          <>
            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: m.muted }}>
                {hint && !variant ? <span className="text-warn">Önce numaranı seç</span> : "Numara"}
              </p>
              <SizePicker variants={product.variants} value={variantId} onChange={(id) => { setVariantId(id); setHint(false); }} accent={m.accent} tone={m.fg === "#10131D" ? "light" : "dark"} />
            </div>
            <button
              type="button"
              className="btn btn-block text-white"
              style={{ backgroundColor: m.accent }}
              onClick={() => {
                if (!variant) return setHint(true);
                add(variant.id, 1, { title: "Sepete eklendi", body: `FormStep ${product.name} · ${variant.sizeLabel}`, image: m.image });
              }}
            >
              <ShoppingBag size={17} /> Sepete ekle
            </button>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: m.muted }}>Sitede çok yakında. O zamana kadar pazaryeri mağazalarımızda.</p>
            {firstStore ? (
              <a href={firstStore} target="_blank" rel="noopener noreferrer" className="btn btn-block border" style={{ borderColor: m.muted }}>
                Pazaryerinde gör <ArrowUpRight size={16} />
              </a>
            ) : (
              <Link href={`/urun/${product.slug}`} className="btn btn-block border" style={{ borderColor: m.muted }}>
                {product.name}&apos;ü incele
              </Link>
            )}
          </>
        )}
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
              Tek karar.
            </h2>
          </div>
          <p className="max-w-sm leading-7 text-ink/65" data-reveal>
            Numaranı seç, sepete ekle. Ödemeni PayTR güvencesiyle kartınla yap; siparişini e-postayla takip et.
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
