"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { SocialRow } from "@/components/layout/SocialRow";
import { ACCOUNTS_ENABLED, SALES_ENABLED } from "@/lib/features";

const links = [
  { href: "/urun/m100", label: "M100" },
  { href: "/urun/m300", label: "M300" },
  { href: "/urun/m900", label: "M900" },
  { href: "/rehber", label: "Rehber" },
  { href: "/#secici", label: "Hangisi bana uygun?" },
];

export function Header({ announcement, instagram, x }: { announcement?: string; instagram?: string; x?: string }) {
  const { count, setOpen, ready } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bump, setBump] = useState(false);
  const last = useRef(0);
  const prevCount = useRef(count);
  const pathname = usePathname();
  // Üstü koyu renkli sayfalarda menü şeffaf başlar; açık renkli sayfalarda baştan koyu cam zemin alır.
  const darkTop = pathname === "/" || /^\/urun\/m(3|9)00/.test(pathname) || pathname.startsWith("/bilgilendirme") || pathname.startsWith("/rehber");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 400 && y > last.current + 4);
      if (y < last.current - 4) setHidden(false);
      last.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (ready && count > prevCount.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 600);
      prevCount.current = count;
      return () => window.clearTimeout(t);
    }
    prevCount.current = count;
  }, [count, ready]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 text-paper transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
          hidden && !menu ? "-translate-y-full" : ""
        } ${scrolled || menu || !darkTop ? "glass border-b border-white/[0.07]" : "border-b border-transparent"}`}
      >
        {announcement ? <div className="bg-blue px-4 py-2 text-center text-[13px] font-medium text-white">{announcement}</div> : null}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" aria-label="FormStep ana sayfa" className="relative z-10 transition-opacity hover:opacity-80">
            <Image src="/assets/brand/logo-white.png" alt="FormStep" width={140} height={31} priority className="h-[26px] w-auto" />
          </Link>

          <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Ana menü">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href} className={`group relative rounded-full px-4 py-2 transition-colors ${active ? "text-white" : "text-paper/75 hover:text-white"}`}>
                  {l.label}
                  <span className={`absolute inset-x-4 -bottom-0.5 h-px origin-left bg-sky transition-transform duration-500 ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 flex items-center gap-1">
            <SocialRow instagram={instagram} x={x} className="mr-1" />
            {ACCOUNTS_ENABLED ? (
              <Link href="/hesabim" className="hidden size-11 place-items-center rounded-full transition hover:bg-white/10 md:grid" aria-label="Hesabım">
                <User size={19} />
              </Link>
            ) : null}
            {SALES_ENABLED ? (
              <button type="button" onClick={() => setOpen(true)} className="relative grid size-11 place-items-center rounded-full transition hover:bg-white/10" aria-label={`Sepet, ${count} ürün`}>
                <ShoppingBag size={19} className={bump ? "animate-[fs-bag_0.6s_cubic-bezier(.16,1,.3,1)]" : ""} />
                {count > 0 ? (
                  <span key={count} className="fs-pop absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-blue px-1 text-[10px] font-bold leading-[18px] text-white">
                    {count}
                  </span>
                ) : null}
              </button>
            ) : (
              <Link href="/#satin-al" className="ml-1 hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1c68d4] sm:inline-flex">
                Satın al <ArrowUpRight size={15} />
              </Link>
            )}
            <button type="button" onClick={() => setMenu((v) => !v)} className="grid size-11 place-items-center rounded-full transition hover:bg-white/10 lg:hidden" aria-expanded={menu} aria-controls="mobil-menu" aria-label={menu ? "Menüyü kapat" : "Menüyü aç"}>
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        <style>{`@keyframes fs-bag{0%{transform:scale(1)}30%{transform:scale(1.3) rotate(-8deg)}60%{transform:scale(.92) rotate(4deg)}100%{transform:scale(1)}}`}</style>
      </header>

      {menu ? (
        <div id="mobil-menu" className="fs-backdrop fixed inset-0 z-40 overflow-y-auto bg-night pt-20 text-paper lg:hidden" role="dialog" aria-modal="true" aria-label="Menü">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_80%_20%,rgba(36,119,234,0.3),transparent_70%)]" />
          <nav className="fs-enter relative flex flex-col px-6" aria-label="Mobil menü">
            {[
              ...links,
              ...(ACCOUNTS_ENABLED ? [{ href: "/hesabim", label: "Hesabım" }] : []),
              SALES_ENABLED ? { href: "/sepet", label: "Sepet" } : { href: "/#satin-al", label: "Satın al" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenu(false)} className="display border-b border-white/10 py-5 text-4xl">
                {l.label}
              </Link>
            ))}
            <SocialRow instagram={instagram} x={x} className="mt-8" />
          </nav>
        </div>
      ) : null}
    </>
  );
}
