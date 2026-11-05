"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SRC = "/assets/layers/m900-flat.png";
const mask: CSSProperties = {
  WebkitMaskImage: `url(${SRC})`,
  maskImage: `url(${SRC})`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

const points = [
  { t: "Topuk", d: "Adım topukta başlar; ilk temas burada yumuşar." },
  { t: "Ayak ortası", d: "Kavisli form, ağırlığın ayak boyunca akmasına eşlik eder." },
  { t: "Ön ayak", d: "Adım ön ayakta biter; memory foam her seferinde geri döner." },
];

export function Pressure() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 65%", end: "bottom 60%", scrub: 0.8 },
        });
        tl.fromTo(
          ".pr-insole",
          { rotate: -8, scale: 0.9, autoAlpha: 0.3 },
          { rotate: 0, scale: 1, autoAlpha: 1, duration: 1 },
        )
          .fromTo(
            ".pr-heat-heel",
            { scale: 0.2, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1 },
            0.3,
          )
          .fromTo(
            ".pr-heat-mid",
            { scale: 0.2, opacity: 0 },
            { scale: 1, opacity: 0.8, duration: 1 },
            0.8,
          )
          .fromTo(
            ".pr-heat-fore",
            { scale: 0.2, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1 },
            1.3,
          )
          .fromTo(
            ".pr-point",
            { autoAlpha: 0.15, x: 30 },
            { autoAlpha: 1, x: 0, stagger: 0.5, duration: 0.6 },
            0.3,
          );
        gsap.to(".pr-ring", {
          scale: 1.6,
          opacity: 0,
          duration: 2.2,
          ease: "power1.out",
          repeat: -1,
          stagger: 0.7,
        });
      }, el);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative overflow-hidden bg-[#070B17] py-24 text-paper md:py-36"
      aria-labelledby="basinc-baslik"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_60%_at_25%_50%,rgba(36,119,234,0.18),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-12">
        <div className="relative lg:col-span-6">
          <div className="pr-insole relative mx-auto aspect-[540/1400] w-[min(44vw,210px)] lg:w-[min(16vw,230px)]">
            <div className="absolute left-1/2 top-1/2 aspect-[1400/540] w-[259%] -translate-x-1/2 -translate-y-1/2 rotate-90">
              <Image
                src={SRC}
                alt="FormStep M900 üstten görünüm"
                fill
                sizes="(min-width:1024px) 40vw, 80vw"
                className="object-fill opacity-90"
              />
              <div
                className="absolute inset-0 overflow-hidden mix-blend-screen"
                style={mask}
              >
                <span className="pr-heat-heel absolute right-[2%] top-[8%] h-[84%] w-[30%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.95),rgba(78,161,225,0.85)_35%,rgba(36,119,234,0.35)_65%,transparent)] blur-md" />
                <span className="pr-heat-mid absolute left-[38%] top-[20%] h-[60%] w-[26%] rounded-full bg-[radial-gradient(closest-side,rgba(78,161,225,0.7),rgba(36,119,234,0.25)_60%,transparent)] blur-md" />
                <span className="pr-heat-fore absolute left-[8%] top-[4%] h-[92%] w-[34%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),rgba(78,161,225,0.85)_35%,rgba(36,119,234,0.35)_65%,transparent)] blur-md" />
              </div>
            </div>
            <span
              aria-hidden
              className="pr-ring absolute bottom-[10%] left-1/2 size-24 -translate-x-1/2 rounded-full border border-[#4EA1E1]/60"
            />
            <span
              aria-hidden
              className="pr-ring absolute bottom-[10%] left-1/2 size-24 -translate-x-1/2 rounded-full border border-[#4EA1E1]/60"
            />
          </div>
          <p className="mt-6 text-center text-[11px] text-white/35">
            Temsili görselleştirme
          </p>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <p className="kicker text-[#8fb8f5]" data-reveal>
            Adımın anatomisi
          </p>
          <h2
            id="basinc-baslik"
            className="display mt-4 text-5xl md:text-7xl"
            data-reveal
          >
            Günde binlerce adım.
            <br />
            <span className="text-[#4EA1E1]">Her biri burada.</span>
          </h2>
          <ol className="mt-12 grid gap-8">
            {points.map((p, i) => (
              <li key={p.t} className="pr-point flex gap-5 border-t border-white/10 pt-6">
                <span className="text-sm tabular-nums text-[#4EA1E1]">0{i + 1}</span>
                <span>
                  <span className="block text-2xl font-semibold tracking-tight">
                    {p.t}
                  </span>
                  <span className="mt-2 block max-w-md leading-7 text-mist">{p.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
