"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { quoteCart } from "@/app/actions/cart";
import type { CartLine, Quote } from "@/lib/store/types";

const KEY = "fs_cart_v1";
const COUPON_KEY = "fs_coupon_v1";

type Toast = { id: number; title: string; body?: string; image?: string };

type CartCtx = {
  lines: CartLine[];
  count: number;
  quote: Quote | null;
  pending: boolean;
  ready: boolean;
  coupon: string;
  open: boolean;
  toast: Toast | null;
  setOpen: (v: boolean) => void;
  add: (variantId: string, qty: number, toast?: Omit<Toast, "id">) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => void;
  dismissToast: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* gizli mod vb. */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState("");
  const [ready, setReady] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pending, start] = useTransition();
  const seq = useRef(0);

  useEffect(() => {
    const stored = read<CartLine[]>(KEY, []);
    // Tarayıcı depolamasından gelen veri yalnızca biçim olarak doğrulanır; fiyatlar her zaman sunucudan gelir.
    const valid = Array.isArray(stored)
      ? stored.filter((l) => l && typeof l.variantId === "string" && Number.isInteger(l.qty) && l.qty > 0).slice(0, 10)
      : [];
    // Sepet yalnızca tarayıcıda tutulur; sunucu çıktısıyla uyuşsun diye ilk boyamadan sonra yüklenir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(valid);
    setCoupon(read<string>(COUPON_KEY, ""));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    write(KEY, lines);
    write(COUPON_KEY, coupon);
    const id = ++seq.current;
    if (lines.length === 0) return;
    start(async () => {
      const q = await quoteCart(lines, coupon || null);
      if (id !== seq.current) return;
      setQuote(q);
      // Sunucunun düzelttiği satırları (tükenen, limit aşan) yerelde de uygula.
      const fixed = q.lines.map((l) => ({ variantId: l.variantId, qty: l.qty }));
      const same = fixed.length === lines.length && fixed.every((f, i) => f.variantId === lines[i]?.variantId && f.qty === lines[i]?.qty);
      if (!same) setLines(fixed);
    });
  }, [lines, coupon, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const add = useCallback((variantId: string, qty: number, t?: Omit<Toast, "id">) => {
    setLines((prev) => {
      const found = prev.find((l) => l.variantId === variantId);
      if (found) return prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(10, l.qty + qty) } : l));
      return [...prev, { variantId, qty }].slice(0, 10);
    });
    if (t) setToast({ ...t, id: Date.now() });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(10, qty) } : l))));
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      quote: lines.length ? quote : null,
      pending,
      ready,
      coupon,
      open,
      toast,
      setOpen,
      add,
      setQty,
      remove: (id) => setLines((prev) => prev.filter((l) => l.variantId !== id)),
      clear: () => {
        setLines([]);
        setCoupon("");
      },
      applyCoupon: (code) => setCoupon(code.trim().toUpperCase()),
      dismissToast: () => setToast(null),
    }),
    [lines, quote, pending, ready, coupon, open, toast, add, setQty],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalı");
  return ctx;
}
