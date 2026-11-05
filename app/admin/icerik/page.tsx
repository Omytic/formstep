import { Trash2 } from "lucide-react";
import { deleteFaq, saveFaq, saveLegal, saveSetting } from "@/app/actions/admin";
import { ActionForm, F, T, Toggle } from "@/components/admin/ActionForm";
import { getSettingsRaw, listFaqs, listLegalOverrides } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { LEGAL_NAV } from "@/lib/legal";

type R = Record<string, unknown>;

export default async function Page() {
  const admin = await requireAdmin();
  const [raw, faqs, legal] = await Promise.all([getSettingsRaw(), listFaqs(), listLegalOverrides()]);
  const mk = (raw["public.marketplaces"] ?? {}) as R;
  const ann = (raw["public.announcement"] ?? {}) as R;
  const claim = ((raw["public.claims"] as R[]) ?? [])[0] ?? {};
  const finder = (raw["public.finder"] ?? {}) as R;
  const sel = (name: string, v: unknown) => (
    <select name={name} defaultValue={String(v ?? "")} className="field">
      <option value="m100">M100</option><option value="m300">M300</option><option value="m900">M900</option>
    </select>
  );

  return (
    <div className="fs-enter space-y-6">
      <h1 className="display text-4xl">İçerik</h1>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Duyuru şeridi</h2>
        <ActionForm action={saveSetting} className="mt-4">
          <input type="hidden" name="key" value="public.announcement" />
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <F label="Metin" name="text" defaultValue={String(ann.text ?? "")} placeholder="M900 şimdi Amazon'da indirimde" maxLength={140} />
            <div className="pb-3"><Toggle label="Yayında" name="active" defaultChecked={Boolean(ann.active)} /></div>
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Pazaryeri ve sosyal medya bağlantıları</h2>
        <ActionForm action={saveSetting} className="mt-4">
          <input type="hidden" name="key" value="public.marketplaces" />
          <div className="grid gap-4 md:grid-cols-2">
            {[["amazon", "Amazon"], ["trendyol", "Trendyol"], ["hepsiburada", "Hepsiburada"], ["instagram", "Instagram"], ["x", "X"]].map(([k, label]) => (
              <F key={k} label={label} name={k} type="url" defaultValue={String(mk[k] ?? "")} placeholder="https://" />
            ))}
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Kanıtlı iddia</h2>
        <p className="mt-1 text-sm text-ink/55">Örn. &quot;Amazon Türkiye&apos;nin en çok satan tabanlığı&quot;. Kategori adını metne yaz; kanıt bağlantısı ve tarih olmadan sitede görünmez.</p>
        <ActionForm action={saveSetting} className="mt-4">
          <input type="hidden" name="key" value="public.claims" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><F label="İddia metni" name="text" defaultValue={String(claim.text ?? "")} maxLength={120} /></div>
            <F label="Kanıt bağlantısı (ekran görüntüsü / sayfa)" name="evidence" type="url" defaultValue={String(claim.evidence_url ?? "")} />
            <F label="Tarih ve kategori" name="date" defaultValue={String(claim.date ?? "")} placeholder="Amazon TR, Tabanlıklar, Ekim 2026" />
            <Toggle label="Sitede göster" name="active" defaultChecked={Boolean(claim.active)} />
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">&quot;Hangisi bana uygun?&quot; eşleşmeleri</h2>
        <ActionForm action={saveSetting} className="mt-4">
          <input type="hidden" name="key" value="public.finder" />
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className="label">Günlük kullanım</label>{sel("gunluk", finder.gunluk ?? "m100")}</div>
            <div><label className="label">İçe ya da dışa basıyorum</label>{sel("ayakta", finder.ayakta ?? "m300")}</div>
            <div><label className="label">Topuğum hassas</label>{sel("tempo", finder.tempo ?? "m900")}</div>
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Sık sorulan sorular</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="flex items-start gap-2 rounded-2xl bg-paper p-4">
              <ActionForm action={saveFaq} className="flex-1">
                <input type="hidden" name="id" value={f.id} />
                <div className="grid gap-3 md:grid-cols-[1fr_80px]">
                  <F label="Soru" name="question" defaultValue={f.question} />
                  <F label="Sıra" name="sort" type="number" defaultValue={f.sort_order} />
                  <div className="md:col-span-2"><T label="Cevap" name="answer" rows={2} defaultValue={f.answer} /></div>
                  <Toggle label="Yayında" name="published" defaultChecked={f.published} />
                </div>
              </ActionForm>
              <form action={deleteFaq}>
                <input type="hidden" name="id" value={f.id} />
                <button type="submit" className="grid size-10 place-items-center rounded-full text-ink/40 hover:bg-bad/10 hover:text-bad" aria-label="Sil"><Trash2 size={16} /></button>
              </form>
            </div>
          ))}
          <ActionForm action={saveFaq} submit="Soru ekle" resetOnSuccess className="rounded-2xl border-2 border-dashed border-line p-4">
            <input type="hidden" name="published" value="on" />
            <div className="grid gap-3 md:grid-cols-[1fr_80px]">
              <F label="Soru" name="question" />
              <F label="Sıra" name="sort" type="number" defaultValue={faqs.length + 1} />
              <div className="md:col-span-2"><T label="Cevap" name="answer" rows={2} /></div>
            </div>
          </ActionForm>
        </div>
      </section>

      {admin.role === "owner" ? (
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Yasal metinler</h2>
          <p className="mt-1 text-sm text-ink/55">Boş bırakılan sayfalar, satıcı ve kargo ayarlarından otomatik doldurulan şablonu kullanır. Avukatınızın onayladığı metni buraya yapıştırarak şablonun yerine koyabilirsiniz; siparişler o anki metnin kopyasını saklar.</p>
          <div className="mt-4 space-y-3">
            {LEGAL_NAV.map((l) => {
              const o = legal.find((x) => x.slug === l.slug);
              return (
                <details key={l.slug} className="rounded-2xl bg-paper p-4">
                  <summary className="cursor-pointer font-medium">{l.title} {o ? <span className="chip ml-2 bg-blue/10 text-blue">Özel metin · v{o.version}</span> : <span className="chip ml-2 bg-ink/5 text-ink/50">Şablon</span>}</summary>
                  <ActionForm action={saveLegal} submit="Yayınla" className="mt-4">
                    <input type="hidden" name="slug" value={l.slug} />
                    <input type="hidden" name="title" value={l.title} />
                    <T label="Metin (paragraflar arasında boş satır)" name="body" rows={10} defaultValue={o?.body ?? ""} hint="Tamamen silip yayınlarsanız şablona dönülür." />
                  </ActionForm>
                </details>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
