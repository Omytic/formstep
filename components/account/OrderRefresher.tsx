"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Ödeme bildirimi gelene kadar sayfayı birkaç saniyede bir tazeler (en fazla 3 dakika). */
export function OrderRefresher() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = window.setInterval(() => {
      if (++n > 60) return window.clearInterval(t);
      router.refresh();
    }, 3000);
    return () => window.clearInterval(t);
  }, [router]);
  return null;
}
