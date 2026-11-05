import Link from "next/link";
import { ArrowRight } from "lucide-react";

const cards = [
  { href: "/rehber#basis-tipi", n: "01", t: "İçe mi basıyorsun, dışa mı?", d: "Eski ayakkabının tabanı ve ıslak ayak izi ipucu verir. Nasıl anlaşılır, ne işe yarar?" },
  { href: "/rehber#topuk", n: "02", t: "Topuk ağrısı ve topuk dikeni", d: "Sabahki ilk adımlarda batma hissi neden olur, tabanlık nasıl yardımcı olur?" },
  { href: "/rehber#memory-foam", n: "03", t: "Memory foam nasıl çalışır?", d: "NASA'nın geliştirdiği köpük: ısıyla yumuşar, basıncı yayar, yavaşça geri döner." },
  { href: "/rehber#numara", n: "04", t: "Numara ve yerleştirme", d: "Doğru aralığı seç, topuktan oturt. Bakım ve ne zaman yenilemen gerektiği de rehberde." },
];

export function GuideTeaser() {
  return (
    <section className="bg-white py-24 md:py-32" aria-labelledby="rehber-baslik">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker text-blue" data-reveal>Tabanlık rehberi</p>
            <h2 id="rehber-baslik" className="display mt-4 text-5xl md:text-7xl" data-reveal>
              Ayağını tanı.
              <br />
              <span className="text-blue">Doğru seç.</span>
            </h2>
          </div>
          <Link href="/rehber" className="btn btn-dark" data-reveal>
            Rehberin tamamı <ArrowRight size={17} />
          </Link>
        </div>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal-stagger>
          {cards.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="group flex h-full flex-col rounded-[1.75rem] border border-line bg-paper p-7 transition duration-500 hover:-translate-y-1 hover:border-blue/40 hover:bg-ice">
                <span className="text-sm tabular-nums text-blue">{c.n}</span>
                <span className="mt-8 text-xl font-semibold tracking-tight">{c.t}</span>
                <span className="mt-2 flex-1 text-sm leading-6 text-ink/60">{c.d}</span>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-blue">
                  Oku <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
