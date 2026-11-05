const steps = [
  {
    n: "01",
    t: "Eski tabanlığı çıkar.",
    d: "Çıkarılabilir tabanlığı olan ayakkabından mevcut tabanlığı çek.",
    icon: (
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 44c8 0 14-3 22-3s14 3 22 3v6H10z" opacity=".35" />
        <path
          className="fs-lift"
          d="M14 30c6-1 12-3 18-3s12 2 18 3c2 .3 2 3 0 3H14c-2 0-2-2.7 0-3z"
        />
        <path className="fs-lift" d="M32 22V8m0 0-6 6m6-6 6 6" />
      </svg>
    ),
  },
  {
    n: "02",
    t: "FormStep'i yerleştir.",
    d: "Topuk kısmından başlayarak tabanlığı ayakkabının içine düzgünce oturt.",
    icon: (
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 44c8 0 14-3 22-3s14 3 22 3v6H10z" opacity=".35" />
        <path
          className="fs-drop"
          d="M14 30c6-1 12-3 18-3s12 2 18 3c2 .3 2 3 0 3H14c-2 0-2-2.7 0-3z"
        />
        <path className="fs-drop" d="M32 8v14m0 0-6-6m6 6 6-6" />
      </svg>
    ),
  },
  {
    n: "03",
    t: "Farkı ilk adımda hisset.",
    d: "Memory foam birkaç adımda ısınır ve ayağının şeklini almaya başlar.",
    icon: (
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 44c8 0 14-3 22-3s14 3 22 3v6H10z" opacity=".35" />
        <path d="M14 38c6-1 12-3 18-3s12 2 18 3" />
        <circle className="fs-spark" cx="22" cy="22" r="3" />
        <circle
          className="fs-spark"
          cx="34"
          cy="14"
          r="2.5"
          style={{ animationDelay: ".4s" }}
        />
        <circle
          className="fs-spark"
          cx="44"
          cy="24"
          r="3"
          style={{ animationDelay: ".8s" }}
        />
      </svg>
    ),
  },
];

export function HowTo() {
  return (
    <section className="bg-paper py-24 md:py-32" aria-labelledby="nasil-baslik">
      <div className="mx-auto max-w-7xl px-5">
        <p className="kicker text-blue" data-reveal>
          Kullanım
        </p>
        <h2 id="nasil-baslik" className="display mt-4 text-5xl md:text-7xl" data-reveal>
          Üç adımda hazır.
        </h2>
        <ol className="mt-14 grid gap-5 md:grid-cols-3" data-reveal-stagger>
          {steps.map((s) => (
            <li key={s.n}>
              <div className="group h-full rounded-[2rem] border border-line bg-white p-8 transition-colors duration-300 hover:border-blue">
                <div className="flex items-start justify-between">
                  <span className="display text-6xl text-ink/10 transition-colors duration-300 group-hover:text-blue">
                    {s.n}
                  </span>
                  <span className="size-16 text-blue">{s.icon}</span>
                </div>
                <h3 className="mt-10 text-2xl font-semibold tracking-tight">{s.t}</h3>
                <p className="mt-3 leading-7 text-ink/65">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
