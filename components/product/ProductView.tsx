"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Ruler, Store } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import gsap from "gsap";
import { formatPrice } from "@/lib/money";
import type { Marketplaces, Product } from "@/lib/store/types";
import type { HomeModel } from "@/components/home/models";
import { BestsellerBadge } from "@/components/ui/BestsellerBadge";
import { StoreButtons } from "@/components/ui/StoreButtons";

export function ProductView({
  product,
  model,
  marketplaces,
  claim,
}: {
  claim?: string;
  product: Product;
  model: HomeModel;
  marketplaces: Marketplaces;
}) {
  const [img, setImg] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const buyBox = useRef<HTMLDivElement>(null);

  const sizes = product.variants.filter((v) => v.active);
  const price = sizes.length ? Math.min(...sizes.map((v) => v.priceKurus)) : null;
  const dark = model.fg !== "#10131D";
  const amazon = model.amazon || marketplaces.amazon;

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".pv-in", { y: 40, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.07, delay: 0.1 });
      gsap.from(".pv-img", { y: 120, rotate: 14, scale: 0.85, autoAlpha: 0, duration: 1.4, ease: "expo.out" });
    });
    return () => mm.revert();
  }, []);

  useEffect(() => {
    const box = buyBox.current;
    if (!box) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(box);
    return () => io.disconnect();
  }, []);

  function tilt(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(".pv-img", { rotateY: x * 18, rotateX: -y * 14, x: x * 20, y: y * 20, duration: 0.8, ease: "power3.out" });
  }
  function untilt() {
    gsap.to(".pv-img", { rotateY: 0, rotateX: 0, x: 0, y: 0, duration: 1.2, ease: "elastic.out(1,0.5)" });
  }

  return (
    <>
      <section ref={stage} className="relative overflow-hidden pt-16" style={{ backgroundColor: model.bg, color: model.fg }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(55% 60% at 30% 45%, ${model.accent}40, transparent 70%)` }} />
        <span aria-hidden className="display pointer-events-none absolute -left-[3vw] top-24 select-none text-[30vw] leading-none lg:text-[22vw]" style={{ color: "transparent", WebkitTextStroke: `1.5px ${model.accent}`, opacity: 0.25 }}>
          {product.code}
        </span>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 lg:grid-cols-12 lg:pb-24 lg:pt-14">
          <nav aria-label="Konum" className="pv-in text-sm lg:col-span-12" style={{ color: model.muted }}>
            <Link href="/" className="hover:underline">Ana sayfa</Link> <span aria-hidden>/</span> <span aria-current="page">{product.name}</span>
          </nav>

          <div className="lg:col-span-7">
            <div onPointerMove={tilt} onPointerLeave={untilt} className="relative mx-auto aspect-square w-full max-w-[620px]" style={{ perspective: "1200px" }}>
              <div aria-hidden className="absolute inset-[12%] rounded-full blur-3xl" style={{ backgroundColor: `${model.accent}55` }} />
              <div className="pv-img relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
                {product.images.map((im, i) => (
                  <Image
                    key={im.src}
                    src={im.src}
                    alt={im.alt}
                    fill
                    priority={i === 0}
                    sizes="(min-width:1024px) 55vw, 95vw"
                    className={`object-contain drop-shadow-[0_50px_60px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${i === img ? "opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
                  />
                ))}
              </div>
            </div>
            {product.images.length > 1 ? (
              <div className="pv-in mt-4 flex justify-center gap-3" role="tablist" aria-label="Görseller">
                {product.images.map((im, i) => (
                  <button
                    key={im.src}
                    type="button"
                    role="tab"
                    aria-selected={i === img}
                    aria-label={`Görsel ${i + 1}`}
                    onClick={() => setImg(i)}
                    className={`relative size-20 overflow-hidden rounded-2xl border-2 transition-all duration-300 ${i === img ? "scale-105" : "opacity-60 hover:opacity-100"}`}
                    style={{ borderColor: i === img ? model.accent : "transparent", backgroundColor: dark ? "rgba(255,255,255,0.06)" : "white" }}
                  >
                    <Image src={im.src} alt="" fill sizes="80px" className="object-contain p-1.5" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5 lg:pt-6">
            {claim ? <div className="pv-in mb-4"><BestsellerBadge text={claim} tone={dark ? "dark" : "light"} size="sm" /></div> : null}
            <p className="pv-in kicker" style={{ color: model.accent }}>{product.tagline}</p>
            <h1 className="pv-in display mt-3 text-[clamp(4rem,9vw,7.5rem)]">{product.name}</h1>
            <p className="pv-in mt-3 text-2xl font-semibold tracking-tight">{model.title}</p>
            <p className="pv-in mt-4 max-w-md leading-7" style={{ color: model.muted }}>{product.description}</p>

            <div ref={buyBox} className="pv-in mt-8 rounded-[1.75rem] p-6" style={{ backgroundColor: dark ? "rgba(255,255,255,0.05)" : "white", border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#dde3ec"}` }}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: model.muted }}>Fiyat</p>
                  <p className="display mt-1 text-4xl tabular-nums">{price !== null ? formatPrice(price) : "—"}</p>
                </div>
                <p className="text-right text-sm" style={{ color: model.muted }}>KDV dahil</p>
              </div>

              {sizes.length ? (
                <div id="numara" className="mt-6">
                  <p className="mb-2.5 flex items-center gap-2 text-sm font-medium"><Ruler size={15} style={{ color: model.accent }} /> Numaralar</p>
                  <ul className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label="Numara seçenekleri">
                    {sizes.map((v) => (
                      <li key={v.id} className="grid min-h-11 place-items-center rounded-xl border text-sm font-semibold tabular-nums" style={{ borderColor: dark ? "rgba(255,255,255,0.16)" : "#dde3ec" }}>
                        {v.sizeLabel}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs" style={{ color: model.muted }}>Ayakkabı numarana denk gelen aralığı seç.</p>
                </div>
              ) : null}

              <p className="mt-7 text-sm font-semibold">Resmî mağazalarımızdan satın al</p>
              <StoreButtons className="mt-3" marketplaces={marketplaces} overrides={{ amazon }} product={product.name} />

              <ul className="mt-6 space-y-2.5 text-sm" style={{ color: model.muted }}>
                <li className="flex items-center gap-2.5"><BadgeCheck size={16} style={{ color: model.accent }} /> Amazon Türkiye&apos;nin en çok satan tabanlığı</li>
                <li className="flex items-center gap-2.5"><Store size={16} style={{ color: model.accent }} /> Satıcı: OMY Ticaret, FormStep Türkiye distribütörü</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {amazon ? (
        <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 px-4 py-3 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] lg:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">FormStep {product.name}</p>
              <p className="text-sm text-ink/60">{price !== null ? formatPrice(price) : model.tag}</p>
            </div>
            <a href={amazon} target="_blank" rel="noopener noreferrer" className="btn text-white" style={{ backgroundColor: model.accent }}>
              Amazon&apos;da al <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
