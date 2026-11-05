"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Building2, Lock, ShieldCheck, User, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { startCheckout, type CheckoutResult } from "@/app/actions/checkout";
import { useCart } from "@/components/cart/CartProvider";
import { Totals } from "@/components/cart/CartSummary";
import { LegalParagraph } from "@/components/legal/LegalParagraph";
import { TR_PROVINCES } from "@/lib/geo/provinces";
import { legalDoc, type LegalDoc, type SocialLinks } from "@/lib/legal";
import { formatPrice } from "@/lib/money";
import type { Seller, Shipping } from "@/lib/store/types";

type SavedAddress = { id: string; title: string; fullName: string; phone: string; city: string; district: string; line: string; postalCode: string };

type Form = {
  email: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  postalCode: string;
  billingType: "individual" | "corporate";
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  acceptTerms: boolean;
  marketing: boolean;
};

const DRAFT = "fs_checkout_draft_v1";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error ? <p className="field-error" id={`${id}-hata`}>{error}</p> : null}
    </div>
  );
}

export function Checkout({
  seller,
  shipping,
  social,
  user,
  addresses,
  preview,
}: {
  seller: Seller;
  shipping: Shipping;
  social: SocialLinks;
  user: { email: string; fullName: string } | null;
  addresses: SavedAddress[];
  preview: boolean;
}) {
  const { quote, lines, ready, coupon, clear } = useCart();
  const [form, setForm] = useState<Form>({
    email: user?.email ?? "",
    fullName: user?.fullName ?? "",
    phone: "",
    city: "",
    district: "",
    line: "",
    postalCode: "",
    billingType: "individual",
    companyName: "",
    taxOffice: "",
    taxNumber: "",
    acceptTerms: false,
    marketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(DRAFT);
      if (raw) {
        const d = JSON.parse(raw) as Partial<Form>;
        // Yarım kalan form taslağı yalnızca tarayıcıdadır; ilk boyamadan sonra yüklenir.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((f) => ({ ...f, ...d, email: f.email || d.email || "", acceptTerms: false }));
      } else if (addresses[0]) {
        const a = addresses[0];
        setForm((f) => ({ ...f, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, line: a.line, postalCode: a.postalCode }));
      }
    } catch {
      /* depolama kapalı */
    }
  }, [addresses]);

  useEffect(() => {
    try {
      const rest: Partial<Form> = { ...form };
      delete rest.acceptTerms;
      window.sessionStorage.setItem(DRAFT, JSON.stringify(rest));
    } catch {
      /* depolama kapalı */
    }
  }, [form]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const orderCtx = useMemo(
    () =>
      quote
        ? {
            number: "Sipariş onayında atanır",
            date: new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date()),
            buyerName: form.fullName || "—",
            buyerEmail: form.email || "—",
            buyerPhone: form.phone || "—",
            address: form.line ? `${form.line}, ${form.district} / ${form.city}` : "—",
            lines: quote.lines.map((l) => ({ name: `FormStep ${l.name}`, size: l.sizeLabel, qty: l.qty, unitKurus: l.unitKurus })),
            subtotalKurus: quote.subtotalKurus,
            discountKurus: quote.discountKurus,
            shippingKurus: quote.shippingKurus ?? 0,
            totalKurus: quote.totalKurus,
          }
        : undefined,
    [quote, form],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    start(async () => {
      const r = await startCheckout({ ...form, coupon, cart: lines });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        setMessage(r.message);
        const first = r.fieldErrors ? Object.keys(r.fieldErrors)[0] : null;
        if (first) document.getElementById(first)?.focus();
        return;
      }
      setResult(r);
      try {
        window.sessionStorage.removeItem(DRAFT);
      } catch {}
      if (r.mode === "preview") clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (result?.ok && result.mode === "paytr") {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <div className="flex items-center justify-between">
          <h1 className="display text-4xl">Ödeme</h1>
          <p className="flex items-center gap-2 text-sm text-ink/60"><ShieldCheck size={16} className="text-good" /> PayTR güvenli ödeme</p>
        </div>
        <div className="mt-6 overflow-hidden rounded-[1.75rem] bg-white p-2">
          <Script src="https://www.paytr.com/js/iframeResizer.min.js" strategy="afterInteractive" onLoad={() => (window as unknown as { iFrameResize: (o: object, s: string) => void }).iFrameResize({}, "#paytriframe")} />
          <iframe id="paytriframe" title="PayTR ödeme formu" src={`https://www.paytr.com/odeme/guvenli/${result.iframeToken}`} className="min-h-[640px] w-full border-0" />
        </div>
        <p className="mt-4 text-center text-xs text-ink/50">Ödemen tamamlanınca sipariş sayfana yönlendirileceksin. Kart bilgilerin FormStep&apos;e iletilmez.</p>
      </div>
    );
  }

  if (result?.ok && result.mode === "preview") {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-5 pt-20 text-center">
        <svg viewBox="0 0 52 52" className="size-24" aria-hidden>
          <circle cx="26" cy="26" r="25" fill="#2477EA" className="fs-pop" />
          <path d="M15 27l7 7 15-15" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="fs-check-draw" />
        </svg>
        <h1 className="display mt-8 text-5xl">Her şey hazır!</h1>
        <p className="mt-4 text-ink/65">
          Önizleme modundasın; gerçek ödeme alınmadı. Supabase ve PayTR bağlandığında bu adımda PayTR&apos;nin güvenli ödeme formu açılır ve {formatPrice(result.totalKurus)} tahsil edilir.
        </p>
        <Link href="/" className="btn btn-primary mt-8">Ana sayfaya dön</Link>
      </div>
    );
  }

  if (ready && lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 pt-20 text-center">
        <h1 className="display text-5xl">Sepetin boş</h1>
        <p className="mt-3 text-ink/60">Ödemeye geçmeden önce sepetine bir FormStep ekle.</p>
        <Link href="/#satin-al" className="btn btn-primary mt-8">Alışverişe başla</Link>
      </div>
    );
  }

  const err = (k: keyof Form) => errors[k] || undefined;
  const inv = (k: keyof Form) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${k}-hata` : undefined });

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-28">
      <Link href="/sepet" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"><ArrowLeft size={15} /> Sepete dön</Link>
      <h1 className="display mt-4 text-5xl md:text-6xl">Ödeme</h1>

      <form onSubmit={submit} noValidate className="mt-10 grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <fieldset className="card fs-pop p-6 sm:p-8">
            <legend className="sr-only">İletişim bilgileri</legend>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-xl font-semibold"><span className="grid size-8 place-items-center rounded-full bg-blue text-sm text-white">1</span> İletişim</h2>
              {!user && !preview ? <Link href="/giris?next=/odeme" className="text-sm text-blue hover:underline">Giriş yap</Link> : null}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="email" label="E-posta" error={err("email")}>
                  <input id="email" type="email" autoComplete="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} {...inv("email")} />
                </Field>
              </div>
              <Field id="fullName" label="Ad soyad" error={err("fullName")}>
                <input id="fullName" autoComplete="name" className="field" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} {...inv("fullName")} />
              </Field>
              <Field id="phone" label="Cep telefonu" error={err("phone")}>
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} {...inv("phone")} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="card fs-pop p-6 sm:p-8" style={{ animationDelay: "60ms" }}>
            <legend className="sr-only">Teslimat adresi</legend>
            <h2 className="flex items-center gap-3 text-xl font-semibold"><span className="grid size-8 place-items-center rounded-full bg-blue text-sm text-white">2</span> Teslimat adresi</h2>
            {addresses.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button key={a.id} type="button" className="chip border border-line bg-paper hover:border-blue" onClick={() => setForm((f) => ({ ...f, fullName: a.fullName, phone: a.phone, city: a.city, district: a.district, line: a.line, postalCode: a.postalCode }))}>
                    {a.title}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field id="city" label="İl" error={err("city")}>
                <select id="city" className="field" value={form.city} onChange={(e) => set("city", e.target.value)} {...inv("city")}>
                  <option value="">Seç</option>
                  {TR_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field id="district" label="İlçe" error={err("district")}>
                <input id="district" className="field" value={form.district} onChange={(e) => set("district", e.target.value)} {...inv("district")} />
              </Field>
              <div className="sm:col-span-2">
                <Field id="line" label="Açık adres" error={err("line")}>
                  <textarea id="line" autoComplete="street-address" rows={3} className="field" placeholder="Mahalle, cadde/sokak, bina no, daire" value={form.line} onChange={(e) => set("line", e.target.value)} {...inv("line")} />
                </Field>
              </div>
              <Field id="postalCode" label="Posta kodu (isteğe bağlı)">
                <input id="postalCode" inputMode="numeric" autoComplete="postal-code" className="field" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="card fs-pop p-6 sm:p-8" style={{ animationDelay: "120ms" }}>
            <legend className="sr-only">Fatura bilgileri</legend>
            <h2 className="flex items-center gap-3 text-xl font-semibold"><span className="grid size-8 place-items-center rounded-full bg-blue text-sm text-white">3</span> Fatura</h2>
            <div className="mt-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Fatura türü">
              {([["individual", "Bireysel", User], ["corporate", "Kurumsal", Building2]] as const).map(([v, label, Icon]) => (
                <button key={v} type="button" role="radio" aria-checked={form.billingType === v} onClick={() => set("billingType", v)} className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 font-semibold transition-all ${form.billingType === v ? "border-blue bg-blue/5 text-blue" : "border-line"}`}>
                  <Icon size={17} /> {label}
                </button>
              ))}
            </div>
            {form.billingType === "corporate" ? (
              <div className="fs-pop mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field id="companyName" label="Şirket ünvanı" error={err("companyName")}>
                    <input id="companyName" className="field" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} {...inv("companyName")} />
                  </Field>
                </div>
                <Field id="taxOffice" label="Vergi dairesi" error={err("taxOffice")}>
                  <input id="taxOffice" className="field" value={form.taxOffice} onChange={(e) => set("taxOffice", e.target.value)} {...inv("taxOffice")} />
                </Field>
                <Field id="taxNumber" label="Vergi numarası" error={err("taxNumber")}>
                  <input id="taxNumber" inputMode="numeric" className="field" value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value.replace(/\D/g, ""))} {...inv("taxNumber")} />
                </Field>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/55">Fatura, teslimat bilgilerindeki ad soyad adına düzenlenir.</p>
            )}
          </fieldset>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-5">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Sipariş özeti</h2>
            <ul className="mt-4 space-y-3">
              {quote?.lines.map((l) => (
                <li key={l.variantId} className="flex items-center gap-3">
                  <div className="relative size-16 shrink-0 rounded-xl bg-ice">
                    <Image src={l.image} alt="" fill sizes="64px" className="object-contain p-1" />
                    <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">{l.qty}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">FormStep {l.name}</p>
                    <p className="text-sm text-ink/55">Numara {l.sizeLabel}</p>
                  </div>
                  <p className="tabular-nums">{formatPrice(l.lineKurus)}</p>
                </li>
              )) ?? <li className="skeleton h-16" />}
            </ul>
            <div className="mt-5 border-t border-line pt-5">{quote ? <Totals quote={quote} /> : <div className="skeleton h-32" />}</div>
          </div>

          <div className="card space-y-4 p-6">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
              <input id="acceptTerms" type="checkbox" className="check mt-0.5" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} {...inv("acceptTerms")} />
              <span>
                <button type="button" className="font-semibold text-blue underline-offset-4 hover:underline" onClick={() => setDoc(legalDoc("on-bilgilendirme", seller, shipping, orderCtx, social))}>Ön bilgilendirme formunu</button> ve{" "}
                <button type="button" className="font-semibold text-blue underline-offset-4 hover:underline" onClick={() => setDoc(legalDoc("mesafeli-satis", seller, shipping, orderCtx, social))}>mesafeli satış sözleşmesini</button> okudum, onaylıyorum.
              </span>
            </label>
            {errors.acceptTerms ? <p className="field-error">{errors.acceptTerms}</p> : null}
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-ink/70">
              <input type="checkbox" className="check mt-0.5" checked={form.marketing} onChange={(e) => set("marketing", e.target.checked)} />
              <span>Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum. (İsteğe bağlı)</span>
            </label>
            {message ? <p role="alert" className="rounded-2xl bg-bad/10 px-4 py-3 text-sm text-bad">{message}</p> : null}
            <button type="submit" className="btn btn-primary btn-block min-h-14 text-base" disabled={pending || !quote?.canCheckout}>
              {pending ? (
                <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Lock size={17} /> {quote ? `${formatPrice(quote.totalKurus)} öde` : "Öde"}
                </>
              )}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink/50"><ShieldCheck size={14} /> Ödeme PayTR altyapısıyla, 3D Secure ile alınır.</p>
          </div>
        </aside>
      </form>

      {doc ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={doc.title}>
          <button type="button" aria-label="Kapat" className="fs-backdrop absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={() => setDoc(null)} />
          <div className="fs-pop relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white p-7 sm:rounded-[2rem]">
            <div className="flex items-start justify-between gap-4">
              <h2 className="display text-3xl">{doc.title}</h2>
              <button type="button" onClick={() => setDoc(null)} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-black/5" aria-label="Kapat"><X size={19} /></button>
            </div>
            <p className="mt-3 text-sm text-ink/60">{doc.intro}</p>
            {doc.sections.map((s) => (
              <section key={s.heading} className="mt-6">
                <h3 className="font-semibold">{s.heading}</h3>
                <div className="mt-2 space-y-1.5 text-sm leading-6 text-ink/75">{s.paragraphs.map((p, i) => <LegalParagraph key={i} text={p} />)}</div>
              </section>
            ))}
            <button type="button" className="btn btn-primary btn-block mt-8" onClick={() => { set("acceptTerms", true); setDoc(null); }}>Okudum, onaylıyorum</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
