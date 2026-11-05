import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseConfigured } from "@/lib/env";
import { Emphasis, LegalParagraph } from "@/components/legal/LegalParagraph";
import { LEGAL_NAV, LEGAL_UPDATED, legalDoc } from "@/lib/legal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/store/catalog";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

/** Yönetim panelinden düzenlenmiş bir metin varsa onu, yoksa şablonu gösterir. */
async function override(slug: string): Promise<{ title: string; body: string; updated_at: string } | null> {
  if (!supabaseConfigured()) return null;
  const { data } = await supabaseAdmin().from("legal_pages").select("title, body, updated_at").eq("slug", slug).eq("published", true).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const nav = LEGAL_NAV.find((l) => l.slug === slug);
  if (!nav) return {};
  const settings = await getSettings();
  const doc = legalDoc(slug, settings.seller, settings.shipping, undefined, settings.marketplaces);
  return { title: nav.title, description: doc?.intro.slice(0, 160), alternates: { canonical: `/bilgilendirme/${slug}` } };
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const settings = await getSettings();
  const doc = legalDoc(slug, settings.seller, settings.shipping, undefined, settings.marketplaces);
  if (!doc) notFound();
  const custom = await override(slug);

  return (
    <div className="min-h-screen bg-paper pb-24">
      <div className="bg-night pb-16 pt-32 text-paper">
        <div className="fs-enter mx-auto max-w-5xl px-5">
          <p className="kicker text-sky">Bilgilendirme</p>
          <h1 className="display mt-4 text-5xl md:text-7xl">{custom?.title ?? doc.title}</h1>
          {!custom ? <p className="mt-5 max-w-2xl text-lg leading-8 text-mist">{doc.intro}</p> : null}
          {slug !== "hakkimizda" && slug !== "iletisim" ? (
            <p className="mt-6 text-sm text-mist/70">Son güncelleme: {custom ? new Date(custom.updated_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : LEGAL_UPDATED}</p>
          ) : null}
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-10 px-5 pt-12 lg:grid-cols-12">
        <nav aria-label="Bilgilendirme sayfaları" className="lg:col-span-4">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:gap-1">
            {LEGAL_NAV.map((l) => (
              <li key={l.slug} className="shrink-0">
                <Link
                  href={`/bilgilendirme/${l.slug}`}
                  aria-current={l.slug === slug ? "page" : undefined}
                  className={`block rounded-xl px-4 py-2.5 text-sm transition-colors ${l.slug === slug ? "bg-ink font-semibold text-white" : "text-ink/65 hover:bg-white"}`}
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="prose-fs fs-enter lg:col-span-8">
          {custom ? (
            <div className="space-y-4 whitespace-pre-line">{custom.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
          ) : (
            doc.sections.map((s, index) => (
              <section key={s.heading || `bolum-${index}`} className={slug === "hakkimizda" ? "mb-12" : "mb-10"}>
                {s.heading ? <h2 className="text-2xl font-semibold tracking-tight">{s.heading}</h2> : null}
                <div className={`${s.heading ? "mt-3" : ""} ${slug === "hakkimizda" ? "space-y-4" : "space-y-2"}`}>
                  {s.paragraphs.map((p, i) => <LegalParagraph key={i} text={p} />)}
                  {s.items?.length ? (
                    <ul className="space-y-3">
                      {s.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span aria-hidden className="mt-[0.65em] size-1.5 shrink-0 rounded-full bg-blue" />
                          <span className="leading-8"><Emphasis text={item} /></span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {s.afterItems?.map((p, i) => <LegalParagraph key={`sonra-${i}`} text={p} />)}
                </div>
              </section>
            ))
          )}
        </article>
      </div>
    </div>
  );
}
