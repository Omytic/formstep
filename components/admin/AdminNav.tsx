"use client";

import { adm } from "@/lib/admin-path";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SALES_ENABLED } from "@/lib/features";
import { Boxes, FileText, LayoutDashboard, Package, Settings, ShoppingCart, Tag } from "lucide-react";

const items = [
  { href: adm(""), label: "Özet", icon: LayoutDashboard },
  ...(SALES_ENABLED ? [{ href: adm("/siparisler"), label: "Siparişler", icon: ShoppingCart }] : []),
  { href: adm("/stok"), label: "Stok", icon: Boxes },
  { href: adm("/urunler"), label: "Ürünler", icon: Package },
  ...(SALES_ENABLED ? [{ href: adm("/kuponlar"), label: "Kuponlar", icon: Tag }] : []),
  { href: adm("/icerik"), label: "İçerik", icon: FileText },
  { href: adm("/ayarlar"), label: "Ayarlar", icon: Settings },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Yönetim" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const on = href === adm() ? path === adm() : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${on ? "bg-white text-ink shadow-sm" : "text-paper/70 hover:bg-white/10 hover:text-white"}`}>
            <Icon size={17} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
