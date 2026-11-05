"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="icerik" className="grid min-h-screen place-items-center bg-paper px-5 text-center">
      <div className="fs-enter">
        <h1 className="display text-5xl">Bir şeyler ters gitti</h1>
        <p className="mx-auto mt-4 max-w-sm text-ink/60">Sayfa yüklenirken bir sorun oluştu. Tekrar dener misin?</p>
        <div className="mt-8 flex justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Tekrar dene</button>
          <Link href="/" className="btn btn-ghost">Ana sayfa</Link>
        </div>
      </div>
    </main>
  );
}
