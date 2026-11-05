"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { homeModels } from "./models";

const needs = [
  {
    id: "gunluk",
    label: "Günlük kullanım",
    hint: "İş, okul, şehirde yürümek",
    model: "m100",
  },
  {
    id: "ayakta",
    label: "Uzun saatler ayakta",
    hint: "Vardiya, mağaza, mutfak",
    model: "m300",
  },
  {
    id: "tempo",
    label: "Yoğun tempo ve spor",
    hint: "Yürüyüş, antrenman, seyahat",
    model: "m900",
  },
] as const;

export function Finder({ mapping }: { mapping: Record<"gunluk" | "ayakta" | "tempo", string> }) {
  const [pick, setPick] = useState<(typeof needs)[number]["id"]>("gunluk");
  const need = needs.find((n) => n.id === pick) ?? needs[0];
  const model = homeModels.find((m) => m.slug === (mapping[need.id] ?? need.model)) ?? homeModels[0];

  return (
    <section
      id="secici"
      className="bg-paper py-24 md:py-32"
      aria-labelledby="secici-baslik"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="kicker text-blue">Model seçici</p>
          <h2
            id="secici-baslik"
            className="display mt-4 text-5xl md:text-6xl"
            data-reveal
          >
            Sana hangisi
            <br />
            uygun?
          </h2>
          <p className="mt-5 max-w-sm leading-7 text-ink/65">
            Gününün nasıl geçtiğini seç, sana en yakın FormStep&apos;i gösterelim.
          </p>
          <div className="mt-8 grid gap-3" role="radiogroup" aria-label="İhtiyacın">
            {needs.map((n) => {
              const on = n.id === pick;
              return (
                <button
                  key={n.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPick(n.id)}
                  className={`flex min-h-16 items-center justify-between rounded-2xl border px-5 text-left transition-all duration-300 ${
                    on
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-white hover:border-ink/40"
                  }`}
                >
                  <span>
                    <span className="block text-lg font-semibold">{n.label}</span>
                    <span className={`block text-sm ${on ? "text-mist" : "text-ink/55"}`}>
                      {n.hint}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={`text-xl transition-transform ${on ? "translate-x-0" : "-translate-x-1 opacity-30"}`}
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div
            key={model.slug}
            className="fs-pop relative overflow-hidden rounded-[2rem] p-8 md:p-10"
            style={{ backgroundColor: model.bg, color: model.fg }}
            aria-live="polite"
          >
            <span
              aria-hidden
              className="display pointer-events-none absolute -right-6 -top-8 text-[10rem] leading-none"
              style={{
                color: "transparent",
                WebkitTextStroke: `1.5px ${model.accent}`,
                opacity: 0.4,
              }}
            >
              {model.code}
            </span>
            <p className="kicker relative" style={{ color: model.accent }}>
              Önerimiz
            </p>
            <p className="display relative mt-3 text-6xl">{model.code}</p>
            <p className="relative mt-2 max-w-xs" style={{ color: model.muted }}>
              {model.title}
            </p>
            <div className="relative mx-auto mt-2 w-[85%] animate-[fs-finder_0.9s_cubic-bezier(.16,1,.3,1)_both]">
              <Image
                src={model.image}
                alt={model.alt}
                width={800}
                height={800}
                sizes="(min-width:1024px) 36vw, 80vw"
              />
            </div>
            <Link
              href={`/urun/${model.slug}`}
              className="btn relative text-white"
              style={{ backgroundColor: model.accent }}
            >
              {model.code}&apos;ü incele
            </Link>
          </div>
        </div>
      </div>
      <style>{`@keyframes fs-finder{from{opacity:0;transform:rotate(-14deg) translateY(30px) scale(.9)}to{opacity:1;transform:none}}`}</style>
    </section>
  );
}
