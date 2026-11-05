"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Faq as FaqItem } from "@/lib/store/types";

export function Faq({ items, title = "Merak edilenler" }: { items: FaqItem[]; title?: string }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <section className="bg-paper py-24 md:py-32" aria-labelledby="sss-baslik">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="kicker text-blue" data-reveal>Sorular</p>
          <h2 id="sss-baslik" className="display mt-4 text-5xl md:text-6xl" data-reveal>{title}</h2>
          <p className="mt-5 max-w-xs leading-7 text-ink/60" data-reveal>
            Aradığın cevap burada yoksa <Link className="text-blue underline-offset-4 hover:underline" href="/bilgilendirme/iletisim">bize yaz</Link>.
          </p>
        </div>
        <div className="divide-y divide-line border-y border-line lg:col-span-8" data-reveal-stagger>
          {items.map((f) => {
            const on = open === f.id;
            return (
              <div key={f.id}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setOpen(on ? null : f.id)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-xl font-semibold tracking-tight transition-colors hover:text-blue"
                  >
                    {f.question}
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ${on ? "rotate-45 border-blue bg-blue text-white" : "border-line"}`}>
                      <Plus size={18} />
                    </span>
                  </button>
                </h3>
                <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-6 leading-7 text-ink/65">{f.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
