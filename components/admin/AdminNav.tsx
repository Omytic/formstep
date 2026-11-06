"use client";

import { adm } from "@/lib/admin-path";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SALES_ENABLED } from "@/lib/features";
import {
  BarChart3,
  Boxes,
  CheckSquare,
  FileText,
  History,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  Share2,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

const groups = [
  { title: null, items: [{ href: adm(""), label: "Özet", icon: LayoutDashboard }] },
  {
    title: "Operasyon",
    items: [
      { href: adm("/stok"), label: "Stok", icon: Boxes },
      { href: adm("/sevkiyatlar"), label: "Sevkiyatlar", icon: Truck },
      { href: adm("/satislar"), label: "Satışlar", icon: Store },
    ],
  },
  {
    title: "Para",
    items: [
      { href: adm("/muhasebe"), label: "Aldı-verdi", icon: Wallet },
      { href: adm("/kar"), label: "Kâr ve raporlar", icon: BarChart3 },
      { href: adm("/reklam"), label: "Reklam", icon: Megaphone },
    ],
  },
  {
    title: "Ekip",
    items: [
      { href: adm("/sosyal"), label: "Sosyal medya", icon: Share2 },
      { href: adm("/gorevler"), label: "Görevler", icon: CheckSquare },
      { href: adm("/gecmis"), label: "İşlem geçmişi", icon: History },
    ],
  },
  {
    title: "Site",
    items: [
      ...(SALES_ENABLED ? [{ href: adm("/siparisler"), label: "Siparişler", icon: ShoppingCart }, { href: adm("/kuponlar"), label: "Kuponlar", icon: Tag }] : []),
      { href: adm("/urunler"), label: "Ürünler", icon: Package },
      { href: adm("/icerik"), label: "İçerik", icon: FileText },
      { href: adm("/ayarlar"), label: "Ayarlar", icon: Settings },
      { href: adm("/hesabim"), label: "Hesabım", icon: UserRound },
    ],
  },
];

export function AdminNav() {
  const path = usePathname();
  const isOn = (href: string) => (href === adm() ? path === adm() : path === href || path.startsWith(href + "/"));
  return (
    <nav aria-label="Yönetim" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:block lg:space-y-5 lg:overflow-visible lg:px-0">
      {groups.map((g, gi) => (
        <div key={gi} className="flex shrink-0 gap-1 lg:block lg:space-y-0.5">
          {g.title ? <p className="hidden px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/50 lg:block">{g.title}</p> : null}
          {g.items.map(({ href, label, icon: Icon }) => {
            const on = isOn(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${on ? "bg-white text-ink shadow-sm" : "text-paper/70 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={17} /> {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
