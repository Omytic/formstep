"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, CreditCard, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import gsap from "gsap";
import { useCart } from "@/components/cart/CartProvider";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { formatPrice } from "@/lib/money";
import type { Marketplaces, Product, Shipping } from "@/lib/store/types";
import type { HomeModel } from "@/components/home/models";
import { SizePicker } from "./SizePicker";
import { BestsellerBadge } from "@/components/ui/BestsellerBadge";

export function ProductView({
  product,
  model,
  shipping,
  marketplaces,
  claim,
}: {
  claim?: string;
  product: Product;
  model: HomeModel;
  shipping: Shipping;
  marketplaces: Marketplaces;
}) {
  const { add, setOpen } = useCart();
  const available = product.variants.filter((v) => v.stock > 0);
  const [variantId, setVariantId] = useState<string | null>(available.length === 1 ? available[0].id : null);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [hint, setHint] = useState(false);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const buyBox = useRef<HTMLDivElement>(null);

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const minPrice = product.variants.length ? Math.min(...product.variants.map((v) => v.priceKurus)) : null;
  const price = variant?.priceKurus ?? minPrice;
  const sellable = available.length > 0;
  const dark = model.fg !== "#10131D";
  const store = model.amazon || marketplaces.amazon || marketplaces.trendyol || marketplaces.hepsiburada;

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

  function addToCart(openDrawer = false) {
    if (!variant) {
      setHint(true);
      document.getElementById("numara")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    add(variant.id, qty, openDrawer ? undefined : { title: "Sepete eklendi", body: `FormStep ${product.name} · ${variant.sizeLabel} × ${qty}`, image: product.images[0]?.src });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    if (openDrawer) setOpen(true);
  }

  const shipLine =
    shipping.feeKurus === null
      ? "Kargo ücreti ödeme adımında gösterilir."
      : shipping.freeThresholdKurus
        ? `${formatPrice(shipping.freeThresholdKurus)} üzeri kargo bedava`
        : shipping.feeKurus === 0
          ? "Kargo bedava"
          : `Kargo ${formatPrice(shipping.feeKurus)}`;

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
              {sellable ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <p className="display text-4xl tabular-nums">{price !== null ? formatPrice(price) : ""}</p>
                    <p className="text-sm" style={{ color: model.muted }}>KDV dahil</p>
                  </div>
                  <div id="numara" className="mt-6">
                    <div className="mb-2.5 flex items-center justify-between text-sm">
                      <span className={hint && !variant ? "font-semibold text-warn" : "font-medium"}>{hint && !variant ? "Önce numaranı seç" : "Numara"}</span>
                      {product.sizeGuide ? <a href="#numara-rehberi" className="underline underline-offset-4" style={{ color: model.muted }}>Numara rehberi</a> : null}
                    </div>
                    <SizePicker variants={product.variants} value={variantId} onChange={(id) => { setVariantId(id); setHint(false); setQty(1); }} accent={model.accent} tone={dark ? "dark" : "light"} />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <QtyStepper value={qty} max={Math.min(10, variant?.stock ?? 10)} onChange={setQty} tone={dark ? "dark" : "light"} />
                    <button type="button" onClick={() => addToCart()} className="btn flex-1 text-white" style={{ backgroundColor: model.accent }}>
                      {added ? <><Check size={18} /> Eklendi</> : <><ShoppingBag size={17} /> Sepete ekle</>}
                    </button>
                  </div>
                  <button type="button" onClick={() => addToCart(true)} className={`btn btn-block mt-3 ${dark ? "bg-white text-ink hover:bg-white/90" : "btn-dark"}`}>
                    Hemen satın al
                  </button>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold">Sitede çok yakında</p>
                  <p className="mt-1 text-sm" style={{ color: model.muted }}>
                    {product.name} şu an pazaryeri mağazalarımızda satışta. Sitemizde satış açıldığında numara ve fiyatlar burada olacak.
                  </p>
                  {store ? (
                    <a href={store} target="_blank" rel="noopener noreferrer" className="btn btn-block mt-5 text-white" style={{ backgroundColor: model.accent }}>
                      Pazaryerinde satın al <ArrowUpRight size={16} />
                    </a>
                  ) : null}
                </>
              )}
              <ul className="mt-6 space-y-2.5 text-sm" style={{ color: model.muted }}>
                <li className="flex items-center gap-2.5"><Truck size={16} style={{ color: model.accent }} /> {shipLine}</li>
                <li className="flex items-center gap-2.5"><CreditCard size={16} style={{ color: model.accent }} /> PayTR ile güvenli ödeme</li>
                <li className="flex items-center gap-2.5"><RotateCcw size={16} style={{ color: model.accent }} /> 14 gün cayma hakkı</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {sellable ? (
        <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 px-4 py-3 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] lg:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">FormStep {product.name}{variant ? ` · ${variant.sizeLabel}` : ""}</p>
              <p className="text-sm text-ink/60">{price !== null ? formatPrice(price) : ""}</p>
            </div>
            <button type="button" onClick={() => addToCart()} className="btn text-white" style={{ backgroundColor: model.accent }}>
              <ShoppingBag size={17} /> {variant ? "Sepete ekle" : "Numara seç"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
