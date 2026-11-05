"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatPrice } from "@/lib/money";
import { homeModels } from "./models";

gsap.registerPlugin(ScrollTrigger);

/** Pin, React düğümü silmeden önce geri alınmalı; useEffect temizliği o sıradan sonra çalışır. */
const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ModelShowcase({ prices }: { prices: Record<string, number | null> }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);

  useIsoLayout(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      setPinned(true);
      const panels = gsap.utils.toArray<HTMLElement>(".sc-panel", el);
      const q = (p: HTMLElement, s: string) => p.querySelector(s);
      gsap.set(panels.slice(1), { autoAlpha: 0 });
      gsap.set(el, { backgroundColor: homeModels[0].bg, color: homeModels[0].fg });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: `+=${panels.length * 90}%`,
          pin: true,
          scrub: 0.7,
          onUpdate: (self) =>
            setActive(
              Math.min(
                panels.length - 1,
                Math.round(self.progress * (panels.length - 1)),
              ),
            ),
        },
      });
      tl.addLabel("p0").to({}, { duration: 0.35 });
      panels.forEach((panel, i) => {
        if (i === 0) return;
        const prev = panels[i - 1];
        const at = `t${i}`;
        tl.addLabel(at)
          .to(
            q(prev, ".sc-img"),
            {
              xPercent: -45,
              yPercent: 10,
              rotate: -28,
              scale: 0.8,
              autoAlpha: 0,
              duration: 1,
            },
            at,
          )
          .to(q(prev, ".sc-copy"), { y: -70, autoAlpha: 0, duration: 0.55 }, at)
          .to(q(prev, ".sc-code"), { xPercent: -25, autoAlpha: 0, duration: 1 }, at)
          .to(
            el,
            { backgroundColor: homeModels[i].bg, color: homeModels[i].fg, duration: 1 },
            at,
          )
          .set(panel, { autoAlpha: 1 }, at)
          .fromTo(
            q(panel, ".sc-img"),
            { xPercent: 45, yPercent: -10, rotate: 28, scale: 0.8, autoAlpha: 0 },
            { xPercent: 0, yPercent: 0, rotate: 0, scale: 1, autoAlpha: 1, duration: 1 },
            `${at}+=0.15`,
          )
          .fromTo(
            q(panel, ".sc-code"),
            { xPercent: 25, autoAlpha: 0 },
            { xPercent: 0, autoAlpha: 1, duration: 1 },
            `${at}+=0.1`,
          )
          .fromTo(
            q(panel, ".sc-copy"),
            { y: 70, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.6 },
            `${at}+=0.5`,
          )
          .set(prev, { autoAlpha: 0 })
          .addLabel(`p${i}`)
          .to({}, { duration: 0.35 });
      });
      return () => {
        setPinned(false);
        setActive(0);
      };
    });
    mm.add("(max-width: 1023px), (prefers-reduced-motion: reduce)", () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".sc-panel", el).forEach((panel) => {
          gsap.from(panel.querySelectorAll(".sc-img, .sc-copy"), {
            y: 50,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: { trigger: panel, start: "top 75%" },
          });
        });
      }, el);
      return () => ctx.revert();
    });
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill(true));
      mm.revert();
    };
  }, []);

  return (
    <section
      id="modeller"
      ref={root}
      aria-label="FormStep modelleri"
      className="relative lg:motion-safe:h-screen lg:motion-safe:overflow-hidden"
    >
      {homeModels.map((m, i) => (
        <article
          key={m.slug}
          className="sc-panel relative bg-[var(--panel-bg)] py-20 text-[var(--panel-fg)] lg:motion-safe:absolute lg:motion-safe:inset-0 lg:motion-safe:bg-transparent lg:motion-safe:py-0 lg:motion-safe:text-inherit"
          style={{ "--panel-bg": m.bg, "--panel-fg": m.fg } as CSSProperties}
        >
          <div className="relative mx-auto grid h-full max-w-7xl items-center gap-10 px-5 lg:grid-cols-12 lg:pt-16">
            <span
              aria-hidden
              className="sc-code display pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 select-none text-center text-[34vw] leading-none lg:text-[min(26vw,48vh)]"
              style={{
                color: "transparent",
                WebkitTextStroke: `1.5px ${m.accent}`,
                opacity: 0.35,
              }}
            >
              {m.code}
            </span>

            <div className="sc-copy relative z-10 lg:col-span-5">
              <p className="kicker" style={{ color: m.accent }}>
                0{i + 1} — {m.tag}
              </p>
              <h2 className="display mt-4 text-[clamp(4rem,min(9vw,14vh),8rem)]">{m.code}</h2>
              <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight">
                {m.title}
              </p>
              <p className="mt-4 max-w-md text-base leading-7" style={{ color: m.muted }}>
                {m.body}
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {m.facts.map((f) => (
                  <li key={f} className="chip border" style={{ borderColor: m.muted }}>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/urun/${m.slug}`}
                  className="btn text-white"
                  data-magnetic
                  style={{ backgroundColor: m.accent }}
                >
                  {m.code}&apos;ü incele
                </Link>
                <span className="text-sm" style={{ color: m.muted }}>
                  {prices[m.slug] != null ? (
                    <>
                      <span className="text-lg font-semibold" style={{ color: m.fg }}>{formatPrice(prices[m.slug]!)}</span>
                      {"  "}KDV dahil
                    </>
                  ) : (
                    "Sitede çok yakında"
                  )}
                </span>
              </div>
            </div>

            <div className="sc-img relative z-10 mx-auto w-full max-w-[520px] lg:col-span-7 lg:max-w-[min(460px,58vh)]">
              <Image
                src={m.image}
                alt={m.alt}
                width={1100}
                height={1100}
                sizes="(min-width:1024px) 50vw, 90vw"
                className="drop-shadow-[0_50px_60px_rgba(0,0,0,0.35)]"
              />
            </div>
          </div>
        </article>
      ))}

      {pinned ? (
        <div
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3"
          aria-hidden
        >
          {homeModels.map((m, i) => (
            <span
              key={m.slug}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: active === i ? 40 : 12,
                backgroundColor: active === i ? m.accent : "currentColor",
                opacity: active === i ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
