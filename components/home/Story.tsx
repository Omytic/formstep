import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Story() {
  return (
    <section className="bg-paper px-5 py-24 md:py-32" aria-labelledby="hikaye-baslik">
      <div className="mx-auto max-w-7xl" data-reveal>
        <div className="rounded-[2rem] bg-navy px-8 py-12 text-paper md:px-14 md:py-16">
          <p className="kicker text-sky">FormStep Türkiye</p>
          <h2 id="hikaye-baslik" className="display mt-5 max-w-4xl text-4xl text-white md:text-6xl">
            Her adımın arkasında bir güven var.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">
            İki yılı aşkın süredir Türkiye&apos;de kullanıcılarla buluşan FormStep, OMY Ticaret güvencesiyle günlük yaşamın her adımına konfor katmayı amaçlıyor.
          </p>
          <Link href="/bilgilendirme/hakkimizda" className="mt-8 inline-flex items-center gap-2 font-medium text-sky transition hover:text-white">
            <ArrowUpRight size={18} />
            Hikâyemizi keşfet
          </Link>
        </div>
      </div>
    </section>
  );
}
