import { adm } from "@/lib/admin-path";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { getCatalogForAdmin } from "@/lib/store/catalog";

const STATUS = { draft: "Taslak", published: "Yayında", archived: "Arşivde" };

export default async function Page() {
  await requireAdmin();
  const products = await getCatalogForAdmin();
  return (
    <div className="fs-enter space-y-6">
      <h1 className="display text-4xl">Ürünler ve stok</h1>
      <div className="grid gap-5 md:grid-cols-3">
        {products.map((p) => {
          const stock = p.variants.reduce((s, v) => s + (v.active ? v.stock : 0), 0);
          const prices = p.variants.map((v) => v.priceKurus);
          return (
            <Link key={p.id} href={adm(`/urunler/${p.code}`)} className="card group overflow-hidden transition-shadow hover:shadow-xl">
              <div className="relative aspect-[4/3] bg-ice">
                <Image src={p.images[0]?.src ?? "/assets/products/m900-2.png"} alt="" fill sizes="33vw" className="object-contain p-6 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3" />
                <span className={`chip absolute left-4 top-4 ${p.status === "published" ? "bg-good text-white" : "bg-white text-ink/70"}`}>{STATUS[p.status]}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="display text-3xl">{p.name}</p>
                  <ArrowRight size={18} className="text-ink/30 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-1 text-sm text-ink/55">{p.variants.length} numara · {stock} adet stok</p>
                <p className="text-sm text-ink/55">{prices.length ? `${formatPrice(Math.min(...prices))}${Math.max(...prices) !== Math.min(...prices) ? ` – ${formatPrice(Math.max(...prices))}` : ""}` : "Fiyat girilmedi"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
