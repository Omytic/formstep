import { adm } from "@/lib/admin-path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteFeature, deleteImage, deleteVariant, saveFeature, saveProduct, saveVariant, uploadImage } from "@/app/actions/admin";
import { ActionForm, F, T, Toggle } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCatalogForAdmin } from "@/lib/store/catalog";

const kurusToInput = (k: number | null) => (k == null ? "" : (k / 100).toFixed(2).replace(".", ","));

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  await requireAdmin();
  const { code } = await params;
  const p = (await getCatalogForAdmin()).find((x) => x.code === code.toUpperCase());
  if (!p) notFound();
  let images: { id: string; path: string }[] = [];
  if (supabaseConfigured()) {
    const { data } = await supabaseAdmin().from("product_images").select("id, path").eq("product_id", p.id).order("sort_order");
    images = data ?? [];
  }

  return (
    <div className="fs-enter space-y-6">
      <Link href={adm("/urunler")} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"><ArrowLeft size={15} /> Ürünler</Link>
      <h1 className="display text-4xl">{p.name}</h1>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Numaralar, fiyat ve stok</h2>
        <p className="mt-1 text-sm text-ink/55">Fiyatlar KDV dahil, TL. Örnek: 399,90. Stok 0 olan numara &quot;tükendi&quot; görünür.</p>
        <div className="mt-5 space-y-3">
          {p.variants.map((v) => (
            <div key={v.id} className="flex flex-wrap items-start gap-2 rounded-2xl bg-paper p-3">
              <ActionForm action={saveVariant} submit="Kaydet" className="flex flex-1 flex-wrap items-end gap-3 [&>div:last-child]:mt-0">
                <input type="hidden" name="id" value={v.id} />
                <input type="hidden" name="productId" value={p.id} />
                <div className="w-28"><F label="Numara" name="size" defaultValue={v.sizeLabel} /></div>
                <div className="w-36"><F label="SKU" name="sku" defaultValue={v.sku} /></div>
                <div className="w-28"><F label="Fiyat (TL)" name="price" defaultValue={kurusToInput(v.priceKurus)} inputMode="decimal" /></div>
                <div className="w-28"><F label="Eski fiyat" name="compareAt" defaultValue={kurusToInput(v.compareAtKurus)} inputMode="decimal" /></div>
                <div className="w-20"><F label="Stok" name="stock" type="number" min={0} defaultValue={v.stock} /></div>
                <div className="pb-3"><Toggle label="Aktif" name="active" defaultChecked={v.active} /></div>
              </ActionForm>
              <form action={deleteVariant} className="pt-7">
                <input type="hidden" name="id" value={v.id} />
                <button type="submit" className="grid size-10 place-items-center rounded-full text-ink/40 hover:bg-bad/10 hover:text-bad" aria-label="Numarayı sil"><Trash2 size={16} /></button>
              </form>
            </div>
          ))}
          <ActionForm action={saveVariant} submit="Numara ekle" resetOnSuccess className="rounded-2xl border-2 border-dashed border-line p-3">
            <input type="hidden" name="productId" value={p.id} />
            <input type="hidden" name="active" value="on" />
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-28"><F label="Numara" name="size" placeholder="36-37" /></div>
              <div className="w-36"><F label="SKU" name="sku" placeholder={`${p.code}-3637`} /></div>
              <div className="w-28"><F label="Fiyat (TL)" name="price" inputMode="decimal" /></div>
              <div className="w-28"><F label="Eski fiyat" name="compareAt" inputMode="decimal" /></div>
              <div className="w-20"><F label="Stok" name="stock" type="number" min={0} defaultValue={0} /></div>
            </div>
          </ActionForm>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Ürün bilgileri</h2>
        <ActionForm action={saveProduct} className="mt-5">
          <input type="hidden" name="id" value={p.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <F label="Ad" name="name" defaultValue={p.name} />
            <F label="Kısa tanım" name="tagline" defaultValue={p.tagline} />
            <div className="md:col-span-2"><T label="Açıklama" name="description" rows={4} defaultValue={p.description} /></div>
            <div className="md:col-span-2"><T label="Numara rehberi (isteğe bağlı)" name="sizeGuide" rows={3} defaultValue={p.sizeGuide} hint="Boş bırakılırsa ürün sayfasında gösterilmez." /></div>
            <F label="SEO başlığı" name="seoTitle" defaultValue={p.seoTitle ?? ""} maxLength={70} />
            <F label="SEO açıklaması" name="seoDescription" defaultValue={p.seoDescription ?? ""} maxLength={170} />
            <div>
              <label htmlFor="f-status" className="label">Durum</label>
              <select id="f-status" name="status" defaultValue={p.status} className="field">
                <option value="draft">Taslak (sitede satılmaz)</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşivde</option>
              </select>
            </div>
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Özellikler</h2>
        <p className="mt-1 text-sm text-ink/55">Yalnızca &quot;doğrulandı&quot; işaretli özellikler sitede görünür. Malzeme, ölçü ve teknik bilgiyi ambalaj ya da üretici belgesine göre gir.</p>
        <div className="mt-5 space-y-3">
          {p.allFeatures.map((f) => (
            <div key={f.id} className="flex items-start gap-2 rounded-2xl bg-paper p-3">
              <ActionForm action={saveFeature} className="flex-1">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="productId" value={p.id} />
                <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
                  <F label="Başlık" name="label" defaultValue={f.label} />
                  <F label="Açıklama" name="body" defaultValue={f.body} />
                  <div className="pb-3"><Toggle label="Doğrulandı" name="verified" defaultChecked={f.verified} /></div>
                </div>
              </ActionForm>
              <form action={deleteFeature} className="pt-7">
                <input type="hidden" name="id" value={f.id} />
                <button type="submit" className="grid size-10 place-items-center rounded-full text-ink/40 hover:bg-bad/10 hover:text-bad" aria-label="Sil"><Trash2 size={16} /></button>
              </form>
            </div>
          ))}
          <ActionForm action={saveFeature} submit="Özellik ekle" resetOnSuccess className="rounded-2xl border-2 border-dashed border-line p-3">
            <input type="hidden" name="productId" value={p.id} />
            <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
              <F label="Başlık" name="label" placeholder="Memory foam" />
              <F label="Açıklama" name="body" />
              <div className="pb-3"><Toggle label="Doğrulandı" name="verified" /></div>
            </div>
          </ActionForm>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Görseller</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {images.map((im) => (
            <div key={im.id} className="group relative size-32 rounded-2xl bg-ice">
              <Image src={im.path} alt="" fill sizes="128px" className="object-contain p-2" />
              <form action={deleteImage} className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                <input type="hidden" name="id" value={im.id} />
                <button type="submit" className="grid size-8 place-items-center rounded-full bg-white text-bad shadow" aria-label="Görseli kaldır"><Trash2 size={14} /></button>
              </form>
            </div>
          ))}
        </div>
        <ActionForm action={uploadImage} submit="Yükle" resetOnSuccess className="mt-5">
          <input type="hidden" name="productId" value={p.id} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="f-file" className="label">Görsel (PNG, JPG, WEBP · en fazla 5 MB)</label>
              <input id="f-file" name="file" type="file" accept="image/png,image/jpeg,image/webp" className="field" />
            </div>
            <F label="Alternatif metin" name="alt" placeholder={`FormStep ${p.name} tabanlık`} />
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
