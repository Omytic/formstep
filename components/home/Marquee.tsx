"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const top = ["Memory foam", "M100", "Her adımda konfor", "M300", "Ayağının şeklini alır", "M900"];
const bottom = ["Günlük konfor", "Destek ve denge", "Premium konfor", "Üç model", "Tek amaç"];

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="size-[0.6em] shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      <path d="M12 4.6l2 5.6h5.8l-4.7 3.4 1.8 5.6L12 15.8l-4.9 3.4 1.8-5.6-4.7-3.4H10z" fill="#2477EA" />
    </svg>
  );
}

/** Kaydırma hızına göre hızlanan ve eğilen çift şerit. */
export function Marquee({ claim }: { claim?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rows = gsap.utils.toArray<HTMLElement>(".mq-row", el);
      const tweens = rows.map((row, i) =>
        gsap.to(row, { xPercent: i === 0 ? -50 : 0, duration: i === 0 ? 40 : 50, ease: "none", repeat: -1, startAt: { xPercent: i === 0 ? 0 : -50 } }),
      );
      const skew = gsap.quickTo(el, "skewY", { duration: 0.6, ease: "power3" });
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 300);
          skew(-v * 0.35);
          tweens.forEach((t, i) => {
            const dir = i === 0 ? 1 : -1;
            gsap.to(t, { timeScale: 1 + Math.abs(v) * 0.8 * (self.direction === dir ? 1 : -1), duration: 0.3, overwrite: true });
          });
        },
      });
      const settle = () => tweens.forEach((t) => gsap.to(t, { timeScale: 1, duration: 1.2 }));
      ScrollTrigger.addEventListener("scrollEnd", settle);
      return () => {
        st.kill();
        tweens.forEach((t) => t.kill());
        ScrollTrigger.removeEventListener("scrollEnd", settle);
      };
    });
    return () => mm.revert();
  }, []);

  const row = (words: string[]) => [...words, ...words, ...words, ...words];
  const topWords = claim ? [claim, ...top.slice(0, 3), claim, ...top.slice(3)] : top;

  return (
    <div ref={root} className="relative z-10 -my-6 overflow-hidden py-6" aria-hidden>
      <div className="-rotate-2 bg-blue py-5 text-white shadow-[0_20px_60px_-20px_rgba(36,119,234,0.7)]">
        <div className="mq-row flex w-max gap-10 whitespace-nowrap">
          {row(topWords).map((w, i) => (
            <span key={i} className="display flex items-center gap-10 text-4xl md:text-6xl">
              {w}
              <Star />
            </span>
          ))}
        </div>
      </div>
      <div className="-mt-3 rotate-1 bg-night py-4 text-paper">
        <div className="mq-row flex w-max gap-8 whitespace-nowrap">
          {row(bottom).map((w, i) => (
            <span key={i} className="flex items-center gap-8 text-xl font-semibold text-mist md:text-2xl">
              {w}
              <span className="size-1.5 rounded-full bg-sky" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
