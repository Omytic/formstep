import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { StatusBadge } from "@/components/account/StatusBadge";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate, getOrdersForUser } from "@/lib/orders";

const IMG: Record<string, string> = { M100: "/assets/products/m100-2.png", M300: "/assets/products/m300.png", M900: "/assets/products/m900-2.png" };

export default async function Page() {
  const user = await requireUser();
  const orders = user.preview ? [] : await getOrdersForUser(user.id);
  if (!orders.length) {
    return (
      <div className="fs-enter card flex flex-col items-center px-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-full bg-ice"><Package size={26} className="text-blue" /></div>
        <p className="mt-5 text-xl font-semibold">Henüz siparişin yok</p>
        <p className="mt-2 text-ink/60">İlk FormStep&apos;ini seçtiğinde siparişlerin burada görünecek.</p>
        <Link href="/#satin-al" className="btn btn-primary mt-7">Alışverişe başla</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-4" data-reveal-stagger>
      {orders.map((o) => (
        <li key={o.id} className="fs-pop">
          <Link href={`/hesabim/siparisler/${o.id}`} className="card group flex items-center gap-5 p-5 transition-shadow hover:shadow-xl">
            <div className="flex -space-x-6">
              {[...new Set(o.items.map((i) => i.productCode))].slice(0, 3).map((c) => (
                <div key={c} className="relative size-16 rounded-2xl border-2 border-white bg-ice">
                  <Image src={IMG[c] ?? IMG.M900} alt="" fill sizes="64px" className="object-contain p-1" />
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Sipariş {o.number}</p>
              <p className="text-sm text-ink/55">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} ürün · {formatPrice(o.totalKurus)}</p>
            </div>
            <StatusBadge status={o.status} />
            <ChevronRight size={18} className="text-ink/30 transition-transform group-hover:translate-x-1" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
