"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { BestsellerBadge } from "@/components/ui/BestsellerBadge";
import { COLLAR_PATH, INSOLE_PATH, SHOE_BOX, SOLE_PATH, UPPER_PATH } from "./heroShapes";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Pin, React düğümü silmeden önce geri alınmalı; useEffect temizliği o sıradan sonra çalışır. */
const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TOP = "/assets/layers/m900-flat.png";

const svgMask = (d: string) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${SHOE_BOX.x} ${SHOE_BOX.y} ${SHOE_BOX.w} ${SHOE_BOX.h}' preserveAspectRatio='none'><path fill-rule='evenodd' d='${d}'/></svg>`,
  )}")`;

const maskStyle = (image: string): CSSProperties => ({
  WebkitMaskImage: image,
  maskImage: image,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
});

const INSOLE_MASK = maskStyle(`url(${TOP})`);
const SOLE_MASK = maskStyle(svgMask(SOLE_PATH));
const UPPER_MASK = maskStyle(svgMask(`${UPPER_PATH} ${COLLAR_PATH}`));

/** Ayakkabı parçaları tabanlıktan geniş; kutuyu her yandan SHOE_BOX payı kadar taşırır. */
const SHOE_FRAME: CSSProperties = {
  left: `${(SHOE_BOX.x / 1400) * 100}%`,
  top: `${(SHOE_BOX.y / 540) * 100}%`,
  width: `${(SHOE_BOX.w / 1400) * 100}%`,
  height: `${(SHOE_BOX.h / 540) * 100}%`,
};

const noise = (r: number, g: number, b: number, a: number) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${a} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )}")`;

/** Sayanın üstten görünüşü: örgü yüzey, bağcıklar, dil, topuk desteği ve bilek açıklığı. */
function UpperFace() {
  const eyelets = [0, 1, 2, 3, 4].map((i) => {
    const t = i / 4;
    const x = 600 + t * 330;
    const y = 314 - t * 24;
    return { x, y, up: y - 80, down: y + 80 };
  });
  return (
    <svg viewBox={`${SHOE_BOX.x} ${SHOE_BOX.y} ${SHOE_BOX.w} ${SHOE_BOX.h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="hx-knit" cx="38%" cy="46%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e9eef5" />
          <stop offset="1" stopColor="#c3cdda" />
        </radialGradient>
        <clipPath id="hx-upper-clip">
          <path clipRule="evenodd" d={`${UPPER_PATH} ${COLLAR_PATH}`} />
        </clipPath>
      </defs>
      <g clipPath="url(#hx-upper-clip)">
        <rect x={SHOE_BOX.x} y={SHOE_BOX.y} width={SHOE_BOX.w} height={SHOE_BOX.h} fill="url(#hx-knit)" />
        {/* burun kapağı */}
        <path d="M330 -60 C250 120 250 420 330 620 L-60 620 L-60 -60 Z" fill="rgba(14,26,54,0.08)" />
        <path d="M330 -60 C250 120 250 420 330 620" fill="none" stroke="rgba(14,26,54,0.22)" strokeWidth="3" strokeDasharray="10 9" />
        {/* topuk desteği */}
        <path d="M1185 -60 C1255 140 1250 360 1205 620 L1520 620 L1520 -60 Z" fill="#2477EA" />
        <path d="M1185 -60 C1255 140 1250 360 1205 620" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeDasharray="10 9" />
        {/* dikiş hattı */}
        <path d={INSOLE_PATH} fill="none" stroke="rgba(14,26,54,0.2)" strokeWidth="3" strokeDasharray="12 10" />
        {/* dil */}
        <path d="M540 300 C540 240 560 222 610 220 L960 196 C990 194 1000 214 1000 250 L1000 330 C1000 366 990 384 960 384 L610 392 C560 394 540 366 540 300 Z" fill="#dde4ee" stroke="rgba(14,26,54,0.18)" strokeWidth="3" />
        {/* bağcıklar */}
        {eyelets.slice(0, -1).map((e, i) => {
          const n = eyelets[i + 1];
          return (
            <g key={i} stroke="#18213a" strokeWidth="11" strokeLinecap="round">
              <line x1={e.x} y1={e.up} x2={n.x} y2={n.down} />
              <line x1={e.x} y1={e.down} x2={n.x} y2={n.up} />
            </g>
          );
        })}
        <path d={`M${eyelets[0].x} ${eyelets[0].up} L${eyelets[0].x} ${eyelets[0].down}`} stroke="#18213a" strokeWidth="11" strokeLinecap="round" />
        {eyelets.map((e) => (
          <g key={e.x}>
            <circle cx={e.x} cy={e.up} r="12" fill="#18213a" />
            <circle cx={e.x} cy={e.down} r="12" fill="#18213a" />
          </g>
        ))}
        {/* bağcık fiyongu */}
        <g fill="none" stroke="#18213a" strokeWidth="10" strokeLinecap="round">
          <path d="M935 292 C990 230 1030 250 1000 290 C985 308 955 300 935 292" />
          <path d="M935 292 C990 350 1030 340 1000 300" />
          <path d="M935 292 L1010 248 M935 292 L1015 352" strokeWidth="7" />
        </g>
      </g>
      {/* bilek açıklığının yastıklı kenarı */}
      <path d={COLLAR_PATH} fill="none" stroke="#18213a" strokeWidth="26" strokeLinejoin="round" />
      <path d={COLLAR_PATH} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

type Layer = {
  id: string;
  label: string;
  short: string;
  sub: string;
  exploded: number;
  explodedMobile: number;
  assembled: number;
  /** Kalınlık (px) ve dilim aralığı. */
  thickness: number;
  step: number;
  shoe: boolean;
  mask: CSSProperties;
  edge: (k: number, total: number) => string;
  face: "upper" | "insole-top" | CSSProperties;
};

/** Yukarıdan aşağıya: saya, tabanlığın iki katmanı, ayakkabının tabanı. */
const layers: Layer[] = [
  {
    id: "saya",
    label: "Ayakkabının üst kısmı",
    short: "Saya",
    sub: "Ayağını ve tabanlığı sarar",
    exploded: 330,
    explodedMobile: 255,
    assembled: 86,
    thickness: 62,
    step: 3,
    shoe: true,
    mask: UPPER_MASK,
    edge: (k, n) => `hsl(216 ${18 - (k / n) * 6}% ${86 - (k / n) * 18}%)`,
    face: "upper",
  },
  {
    id: "ust",
    label: "Tabanlığın üst katmanı",
    short: "Üst katman",
    sub: "Memory foam, ayağının şeklini alır",
    exploded: 205,
    explodedMobile: 140,
    assembled: 20,
    thickness: 6,
    step: 2,
    shoe: false,
    mask: INSOLE_MASK,
    edge: () => "#11141c",
    face: "insole-top",
  },
  {
    id: "alt",
    label: "Tabanlığın alt katmanı",
    short: "Alt katman",
    sub: "Destek tabanı, adımını dengeler",
    exploded: 105,
    explodedMobile: 70,
    assembled: 13,
    thickness: 12,
    step: 2,
    shoe: false,
    mask: INSOLE_MASK,
    edge: () => "#1F64A8",
    face: {
      backgroundColor: "#4EA1E1",
      backgroundImage: `${noise(0.1, 0.3, 0.6, 0.35)}, linear-gradient(100deg, #68b4ec, #3b8fd6 60%, #2f7fca)`,
    },
  },
  {
    id: "taban",
    label: "Ayakkabının tabanı",
    short: "Dış taban",
    sub: "Zeminle buluşan dış taban",
    exploded: 0,
    explodedMobile: 0,
    assembled: 0,
    thickness: 30,
    step: 2,
    shoe: true,
    mask: SOLE_MASK,
    edge: (k, n) => (k > n * 0.62 ? "#232a38" : `hsl(214 20% ${90 - k * 1.2}%)`),
    face: {
      backgroundColor: "#eef2f7",
      backgroundImage: `${noise(0.5, 0.55, 0.62, 0.35)}, radial-gradient(80% 120% at 35% 35%, #ffffff, #d9e0ea)`,
    },
  },
];

export function HeroExplode({ claim }: { claim?: string }) {
  const root = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useIsoLayout(() => {
    const el = root.current;
    const ov = overlay.current;
    if (!el || !ov) return;

    const rig = el.querySelector<HTMLElement>(".hx-rig");
    const layerEls = gsap.utils.toArray<HTMLElement>(".hx-layer", el);
    const faces = gsap.utils.toArray<HTMLElement>(".hx-face", el);
    const labels = gsap.utils.toArray<HTMLElement>(".hx-label", el);
    const lines = gsap.utils.toArray<HTMLElement>(".hx-line", el);
    if (!rig) return;

    gsap.set(rig, { clearProps: "transform" });
    gsap.set(rig, {
      x: 0,
      y: 0,
      xPercent: -50,
      yPercent: -50,
      rotateX: 62,
      rotateZ: -12,
    });
    gsap.set(".hx-sheen-bar", { xPercent: -160 });
    // Dar ekranda katmanlar birbirine daha yakın durur ki başlığın altına sığsın.
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const ex = (i: number) => (wide ? layers[i].exploded : layers[i].explodedMobile);
    layerEls.forEach((l, i) => gsap.set(l, { z: ex(i) }));

    const place = () => {
      const o = ov.getBoundingClientRect();
      if (o.width < 1024) return;
      const rects = faces.map((f) => f.getBoundingClientRect());
      const right = Math.max(...rects.map((r) => r.right)) - o.left;
      const labelX = Math.min(o.width - 200, right + 28);
      rects.forEach((r, i) => {
        const y = r.top + r.height * 0.5 - o.top;
        const x = r.left + r.width * 0.78 - o.left;
        gsap.set(labels[i], { left: labelX, top: y - 22 });
        gsap.set(lines[i], { left: x, top: y, width: Math.max(0, labelX - x - 12) });
      });
    };
    place();
    window.addEventListener("resize", place);

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const intro = gsap.timeline({ delay: 0.1, onComplete: place });
      intro
        .from(".hx-line-txt > span", {
          yPercent: 115,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
        })
        .from(
          layerEls,
          {
            z: (i: number) => ex(i) + 500,
            autoAlpha: 0,
            duration: 1.4,
            ease: "expo.out",
            stagger: 0.12,
          },
          0.1,
        )
        .from(
          ".hx-fade",
          { y: 20, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 },
          0.6,
        )
        .from(
          ".hx-line",
          {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.1,
          },
          1.0,
        )
        .from(
          ".hx-label-in, .hx-mlabels > li",
          { x: -16, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 },
          1.1,
        );

      const bobs = gsap.to(".hx-bob", {
        z: 14,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.5 },
      });
      let bobbing = true;

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=230%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            if (self.progress > 0.02 && bobbing) {
              bobbing = false;
              bobs.pause();
              gsap.to(".hx-bob", { z: 0, duration: 0.4 });
            } else if (self.progress <= 0.02 && !bobbing) {
              bobbing = true;
              bobs.play();
            }
          },
        },
      });

      tl.fromTo([".hx-label", ".hx-line", ".hx-mlabels"], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, immediateRender: false }, 0)
        .fromTo(".hx-head", { y: 0, autoAlpha: 1 }, { y: -90, autoAlpha: 0, duration: 0.45, immediateRender: false }, 0)
        // Önce tabanlığın iki katmanı ayakkabının tabanına oturur, ardından saya üstüne kapanır.
        .fromTo(layerEls[2], { z: ex(2) }, { z: layers[2].assembled, duration: 0.6, immediateRender: false }, 0.05)
        .fromTo(layerEls[1], { z: ex(1) }, { z: layers[1].assembled, duration: 0.65, immediateRender: false }, 0.12)
        .fromTo(layerEls[0], { z: ex(0) }, { z: layers[0].assembled, duration: 0.75, ease: "power3.inOut", immediateRender: false }, 0.42)
        .fromTo(
          rig,
          { rotateX: 62, rotateZ: -12, scale: 1, yPercent: -50 },
          { rotateX: 30, rotateZ: -16, scale: 1.08, yPercent: -46, duration: 1.15, immediateRender: false },
          0.75,
        )
        .to(".hx-shadow", { scaleX: 0.8, opacity: 0.95, duration: 1 }, 0.12)
        .to(".hx-glow", { opacity: 1, scale: 1.15, duration: 1 }, 0.4)
        .fromTo(
          ".hx-sheen-bar",
          { xPercent: -160, autoAlpha: 1 },
          { xPercent: 260, autoAlpha: 1, duration: 0.7, ease: "power1.inOut" },
          1.15,
        )
        .fromTo(
          ".hx-final > *",
          { y: 60, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.5 },
          0.85,
        )
        .to({}, { duration: 0.35 });

      requestAnimationFrame(place);
      return () => bobs.kill();
    });

    return () => {
      window.removeEventListener("resize", place);
      ScrollTrigger.getAll().forEach((t) => t.kill(true));
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#060A16] text-paper"
      aria-labelledby="hero-baslik"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_62%_12%,rgba(78,161,225,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="hx-glow pointer-events-none absolute left-1/2 top-[55%] h-[60vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(36,119,234,0.35),transparent)] opacity-40 lg:left-[64%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-[radial-gradient(60%_100%_at_50%_100%,rgba(200,215,235,0.16),transparent_70%)]"
      />

      <div ref={overlay} className="relative mx-auto h-full max-w-7xl px-5">
        <div className="hx-head absolute inset-x-5 top-[12%] z-20 max-w-xl lg:top-[17%]">
          {claim ? <div className="hx-fade mb-5"><BestsellerBadge text={claim} /></div> : null}
          <p className="hx-fade kicker text-[#8fb8f5]">FormStep · Memory foam tabanlık</p>
          <h1 id="hero-baslik" className="display mt-5 text-[clamp(3rem,6.6vw,6.2rem)]">
            <span className="hx-line-txt block overflow-hidden pb-[0.06em]">
              <span className="block">Her adımda</span>
            </span>
            <span className="hx-line-txt block overflow-hidden pb-[0.06em]">
              <span className="block">daha fazla</span>
            </span>
            <span className="hx-line-txt block overflow-hidden pb-[0.06em]">
              <span className="block text-[#4EA1E1]">konfor.</span>
            </span>
          </h1>
          <p className="hx-fade mt-6 hidden max-w-sm text-lg leading-8 text-mist sm:block">
            İki katmanlı tabanlık, ayakkabının içinde. Kaydır, birleşsin.
          </p>
        </div>

        <div className="hx-final absolute inset-x-5 top-[15%] z-20 max-w-xl lg:top-[16%]">
          <p className="kicker text-[#8fb8f5] invisible opacity-0">Ayakkabına yerleşir</p>
          <h2 className="display mt-4 text-[clamp(2.8rem,6.4vw,6.4rem)] invisible opacity-0">
            İki katmanlı
            <br />
            <span className="text-[#4EA1E1]">konfor.</span>
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 invisible opacity-0">
            <Link href="#modeller" className="btn btn-primary" data-magnetic>
              Modelleri keşfet
            </Link>
            <Link href="#secici" className="btn btn-quiet" data-magnetic>
              Bana hangisi uygun?
            </Link>
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-[7%] top-[50%] sm:top-[42%] lg:left-[50%] lg:right-[17%] lg:top-[12%] lg:bottom-[2%]"
          style={{ perspective: "1700px", perspectiveOrigin: "50% 30%" }}
        >
          <div
            aria-hidden
            className="hx-shadow absolute bottom-[10%] left-1/2 h-10 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/70 opacity-60 blur-2xl"
          />
          <div
            className="hx-rig absolute left-1/2 top-[56%] aspect-[1400/540] w-[min(66vw,460px)] lg:w-[min(29vw,470px)]"
            style={{
              transformStyle: "preserve-3d",
              transform: "translate(-50%,-50%) rotateX(62deg) rotateZ(-12deg)",
            }}
            role="img"
            aria-label="Ayakkabının üst kısmı, FormStep tabanlığın üst ve alt katmanı ve ayakkabının tabanı ayrı ayrı; kaydırdıkça birleşiyor"
          >
            {layers.map((l) => {
              const n = Math.ceil(l.thickness / l.step);
              const frame = l.shoe ? SHOE_FRAME : { inset: 0 };
              return (
                <div
                  key={l.id}
                  className="hx-layer absolute inset-0"
                  style={{ transformStyle: "preserve-3d", transform: `translateZ(${l.exploded}px)` }}
                >
                  <div className="hx-bob absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                    {Array.from({ length: n }).map((_, k) => (
                      <div
                        key={k}
                        className="absolute"
                        style={{
                          ...frame,
                          ...l.mask,
                          backgroundColor: l.edge(k, n),
                          transform: `translateZ(${-(k + 1) * l.step}px)`,
                        }}
                      />
                    ))}
                    {l.face === "upper" ? (
                      <div className="hx-face absolute" style={frame}>
                        <UpperFace />
                      </div>
                    ) : l.face === "insole-top" ? (
                      <div className="hx-face absolute inset-0">
                        <Image src={TOP} alt="" fill priority sizes="(min-width:1024px) 50vw, 90vw" className="object-fill" />
                        <div className="absolute inset-0 overflow-hidden" style={INSOLE_MASK}>
                          <div className="hx-sheen-bar absolute inset-y-0 left-0 w-1/3 opacity-0 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.45),transparent)]" />
                        </div>
                      </div>
                    ) : (
                      <div className="hx-face absolute" style={{ ...frame, ...l.mask, ...l.face }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {layers.map((l) => (
          <div key={l.id} className="contents">
            <span
              aria-hidden
              className="hx-line pointer-events-none absolute z-10 hidden h-px bg-gradient-to-r from-white/70 to-white/20 lg:block"
              style={{ left: 0, top: 0, width: 0 }}
            >
              <span className="absolute -left-1 -top-1 size-2 rounded-full bg-white shadow-[0_0_12px_rgba(78,161,225,0.9)]" />
            </span>
            <div
              className="hx-label pointer-events-none absolute z-10 hidden w-[190px] lg:block"
              style={{ left: -9999, top: 0 }}
            >
              <div className="hx-label-in">
                <p className="text-base font-semibold tracking-tight">{l.label}</p>
                <p className="text-sm text-mist/80">{l.sub}</p>
              </div>
            </div>
          </div>
        ))}

        <ul className="hx-mlabels absolute inset-x-5 bottom-[3%] z-10 flex flex-wrap justify-center gap-2 lg:hidden">
          {layers.map((l) => (
            <li
              key={l.id}
              className="chip border border-white/20 bg-white/5 backdrop-blur"
            >
              {l.short}
            </li>
          ))}
        </ul>

        <p className="hx-fade absolute bottom-4 right-5 z-10 hidden text-[11px] text-white/35 lg:block">
          Görsel temsilidir
        </p>
        <a
          href="#modeller"
          className="hx-fade absolute bottom-5 left-5 z-10 hidden items-center gap-2 text-xs uppercase tracking-[0.2em] text-mist/80 lg:inline-flex"
        >
          Kaydır{" "}
          <span aria-hidden className="fs-bob">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
