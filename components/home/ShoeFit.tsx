"use client";

import { Check } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Pin, React düğümü silmeden önce geri alınmalı; useEffect temizliği o sıradan sonra çalışır. */
const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Tabanlığın yandan kesiti: üstte siyah dokulu yüzey, altta mavi taban. */
const INSOLE_TOP =
  "M112 246 C112 236 118 231 129 231 C150 239 190 251 240 251 C300 251 338 236 382 235 C432 235 470 251 540 255 C640 261 740 261 806 265 C815 266 819 271 813 276";
const INSOLE_BODY = `${INSOLE_TOP} L112 276 Z`;

const SHOE = {
  sole: "M70 296 C66 322 84 338 120 338 L740 338 C800 338 846 320 852 296 C853 288 846 282 836 282 L94 282 C80 282 72 288 70 296 Z",
  upper:
    "M92 282 C70 240 72 182 96 152 C120 128 165 132 205 150 C235 162 262 160 290 140 L330 98 C338 88 352 86 362 94 C420 150 520 190 640 215 C720 232 800 250 832 282",
  seam: "M150 282 C190 222 262 206 334 216 C400 226 470 246 560 248",
  heelTab: "M96 152 C92 132 100 116 116 112",
  tread: "M130 338 L130 331 M200 338 L200 331 M270 338 L270 331 M340 338 L340 331 M410 338 L410 331 M480 338 L480 331 M550 338 L550 331 M620 338 L620 331 M690 338 L690 331",
  laces: "M342 120 L392 144 M368 142 L424 166 M398 164 L458 186 M430 184 L494 204",
};

export function ShoeFit() {
  const root = useRef<HTMLElement>(null);

  useIsoLayout(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    const build = (tl: gsap.core.Timeline) => {
      tl.fromTo(".sf-draw", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: "power2.inOut", stagger: 0.08 }, 0)
        .fromTo(".sf-sole-fill", { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.6)
        .fromTo(".sf-insole", { y: -230, rotate: -9, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 1, ease: "power3.inOut" }, 0.55)
        .fromTo(".sf-front", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.35)
        .fromTo(".sf-glow", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, 1.4)
        .fromTo(".sf-step", { autoAlpha: 0.25, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.45 }, 0.2)
        .to({}, { duration: 0.3 });
    };
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "+=140%", pin: true, scrub: 0.8 } });
      build(tl);
    });
    mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 65%" } });
      build(tl);
      tl.timeScale(0.9);
    });
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill(true));
      mm.revert();
    };
  }, []);

  const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <section ref={root} className="relative overflow-hidden bg-[#060A16] text-paper lg:h-screen" aria-labelledby="ayakkabi-baslik">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_65%_60%,rgba(36,119,234,0.22),transparent_70%)]" />
      <div className="relative mx-auto grid h-full max-w-7xl items-center gap-10 px-5 py-24 lg:grid-cols-12 lg:py-0">
        <div className="lg:col-span-4">
          <p className="kicker text-sky">Ayakkabına yerleşir</p>
          <h2 id="ayakkabi-baslik" className="display mt-4 text-5xl md:text-6xl">
            Tek hamlede.
            <br />
            <span className="text-sky">Her adımda.</span>
          </h2>
          <ol className="mt-10 space-y-5">
            {[
              ["Eski tabanlığı çıkar", "Çıkarılabilir tabanlığı olan ayakkabılarda kullanılır."],
              ["FormStep'i topuktan oturt", "Topuk yuvası ayakkabının arkasına tam yerleşir."],
              ["Giy ve yürü", "Memory foam birkaç adımda ayağının şeklini alır."],
            ].map(([t, d], i) => (
              <li key={t} className="sf-step flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue/15 text-sky">
                  {i === 2 ? <Check size={16} /> : <span className="text-sm font-semibold">{i + 1}</span>}
                </span>
                <span>
                  <span className="block text-lg font-semibold">{t}</span>
                  <span className="block text-sm leading-6 text-mist">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-8">
          <svg viewBox="40 60 840 320" className="w-full text-white/80" role="img" aria-label="FormStep tabanlığın bir spor ayakkabının içine yerleştiği çizim">
            <defs>
              <linearGradient id="sf-blue" x1="0" x2="1">
                <stop offset="0" stopColor="#4EA1E1" />
                <stop offset="1" stopColor="#2477EA" />
              </linearGradient>
              <radialGradient id="sf-glow">
                <stop offset="0" stopColor="#4EA1E1" stopOpacity="0.7" />
                <stop offset="1" stopColor="#4EA1E1" stopOpacity="0" />
              </radialGradient>
              <clipPath id="sf-inside">
                <path d="M92 282 C70 240 72 182 96 152 C120 128 165 132 205 150 C235 162 262 160 290 140 L330 98 C338 88 352 86 362 94 C420 150 520 190 640 215 C720 232 800 250 832 282 Z" />
              </clipPath>
            </defs>

            <ellipse className="sf-glow" cx="460" cy="262" rx="380" ry="46" fill="url(#sf-glow)" style={{ transformOrigin: "460px 282px" }} />

            {/* ayakkabının iç tarafı (koyu) */}
            <path className="sf-sole-fill" d={`${SHOE.upper} Z`} fill="rgba(255,255,255,0.035)" />
            <path className="sf-sole-fill" d={SHOE.sole} fill="rgba(255,255,255,0.08)" />

            {/* tabanlık */}
            <g className="sf-insole" style={{ transformOrigin: "460px 255px" }}>
              <path d={INSOLE_BODY} fill="url(#sf-blue)" />
              <path d={INSOLE_TOP} fill="none" stroke="#0b0d14" strokeWidth="9" strokeLinecap="round" />
              <path d={INSOLE_TOP} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="2 7" strokeLinecap="round" />
            </g>

            {/* ayakkabı çizgileri */}
            <g {...stroke} strokeWidth="3">
              <path className="sf-draw" pathLength={1} strokeDasharray="1" d={SHOE.sole} />
              <path className="sf-draw" pathLength={1} strokeDasharray="1" d={SHOE.upper} />
              <path className="sf-draw" pathLength={1} strokeDasharray="1" d={SHOE.heelTab} />
            </g>
            <g {...stroke} strokeWidth="1.6" opacity="0.55">
              <path className="sf-draw" pathLength={1} strokeDasharray="1" d={SHOE.seam} />
              <path className="sf-draw" pathLength={1} strokeDasharray="1" d={SHOE.laces} />
              <path className="sf-draw" pathLength={1} strokeDasharray="1" d={SHOE.tread} />
            </g>

            {/* ayakkabının dış yan paneli: tabanlık içeri girince önüne geçer */}
            <g className="sf-front" clipPath="url(#sf-inside)">
              <path d="M70 282 L860 282 L860 232 C760 226 640 206 560 210 C470 214 400 226 330 218 C260 210 190 226 150 262 C120 270 96 276 70 282 Z" fill="rgba(6,10,22,0.42)" />
              <path d="M150 262 C190 226 260 210 330 218 C400 226 470 214 560 210" fill="none" stroke="rgba(143,184,245,0.35)" strokeWidth="1" />
              <path d={SHOE.seam} {...stroke} strokeWidth="1.6" opacity="0.55" />
            </g>
          </svg>
          <p className="mt-2 text-right text-[11px] text-white/35">Temsili çizim</p>
        </div>
      </div>
    </section>
  );
}
