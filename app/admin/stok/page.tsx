import Link from "next/link";
import { StockGrid, type StockRow } from "@/components/admin/StockGrid";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { getCatalogForAdmin } from "@/lib/store/catalog";

export default async function Page() {
  await requireAdmin();
  const products = await getCatalogForAdmin();
  const sizes = [...new Set(products.flatMap((p) => p.variants.map((v) => v.sizeLabel)))];
  const order = (s: string) => Number(s.split("-")[0]) || 999;
  sizes.sort((a, b) => order(a) - order(b));
  const rows: StockRow[] = sizes.map((size) => ({
    size,
    cells: products.map((p) => {
      const v = p.variants.find((x) => x.sizeLabel === size);
      return v ? { id: v.id, stock: v.stock } : null;
    }),
  }));

  return (
    <div className="fs-enter space-y-6">
      <div>
        <h1 className="display text-4xl">Stok</h1>
        <p className="mt-1 max-w-2xl text-ink/55">
          Her model ve numara için elindeki adedi yaz, ya da − / + ile değiştir; en alttan hepsini birden kaydet. Satış oldukça stok otomatik düşer, iptal ve iadede geri eklenir. Stoğu 0 olan numara sitede &quot;tükendi&quot; görünür.
        </p>
      </div>
      {rows.length ? (
        <StockGrid models={products.map((p) => ({ code: p.code, status: p.status }))} rows={rows} />
      ) : (
        <p className="card p-6 text-sm text-ink/60">Henüz numara yok. <Link href={adm("/urunler")} className="text-blue hover:underline">Ürünler</Link> sayfasından numara ekle.</p>
      )}
      <p className="text-sm text-ink/50">Fiyat, numara ekleme/çıkarma ve modeli yayına alma: <Link href={adm("/urunler")} className="text-blue hover:underline">Ürünler</Link>.</p>
    </div>
  );
}
