"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

const KEY = "fs_consent_v1";
type Choice = { analytics: boolean; at: string };

function readChoice(): Choice | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Choice) : null;
  } catch {
    return null;
  }
}

/** Çerez tercihi + yalnızca onay sonrası yüklenen Google Analytics. */
export function Consent({ gaId }: { gaId: string | null }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = readChoice();
    // Tarayıcı depolamasından okunan tercih, sunucu çıktısıyla uyuşsun diye ilk boyamadan sonra yüklenir.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(c);
    if (!c) {
      const t = window.setTimeout(() => setOpen(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener("fs:consent", reopen);
    return () => window.removeEventListener("fs:consent", reopen);
  }, []);

  function save(analytics: boolean) {
    const c = { analytics, at: new Date().toISOString() };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(c));
    } catch {
      /* depolama kapalı olabilir */
    }
    setChoice(c);
    setOpen(false);
  }

  return (
    <>
      {gaId && choice?.analytics ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}</Script>
        </>
      ) : null}
      {open ? (
        <div role="dialog" aria-label="Çerez tercihleri" className="fs-pop fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-3xl bg-ink p-5 text-paper shadow-2xl sm:inset-x-auto sm:left-5 sm:right-auto">
          <p className="font-semibold">Çerezleri kısaca konuşalım</p>
          <p className="mt-2 text-sm leading-6 text-mist">
            Sitenin çalışması için gerekli çerezler her zaman açık. Ziyaret istatistikleri için analiz çerezlerini yalnızca izin verirsen kullanırız.{" "}
            <Link href="/bilgilendirme/cerez-politikasi" className="underline underline-offset-4">Ayrıntılar</Link>
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-quiet btn-sm flex-1" onClick={() => save(false)}>
              Yalnızca gerekli
            </button>
            <button type="button" className="btn btn-primary btn-sm flex-1" onClick={() => save(true)}>
              Kabul et
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ConsentLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("fs:consent"))}>
      Çerez tercihleri
    </button>
  );
}
