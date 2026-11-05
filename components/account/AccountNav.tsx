"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/hesabim", label: "Siparişlerim" },
  { href: "/hesabim/adresler", label: "Adreslerim" },
  { href: "/hesabim/ayarlar", label: "Hesap ayarları" },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Hesap" className="flex gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const on = t.href === "/hesabim" ? path === "/hesabim" || path.startsWith("/hesabim/siparisler") : path.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${on ? "bg-white text-ink" : "text-paper/70 hover:text-white"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
