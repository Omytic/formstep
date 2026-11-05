import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { adm } from "@/lib/admin-path";
import { getAdmin } from "@/lib/auth";
import { isPreview } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Yönetici girişi", robots: { index: false, follow: false } };

/** Tarayıcıda {ADMIN}/giris adresinde açılır (proxy.ts). Doğrudan /yonetim-giris 404 döner. */
export default async function AdminLoginPage() {
  if (!isPreview() && (await getAdmin())) redirect(adm());
  return (
    <main id="icerik" className="relative grid min-h-screen place-items-center overflow-hidden bg-night px-5 py-16 text-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_35%,rgba(36,119,234,0.32),transparent_70%)]" />
      <div className="fs-enter relative w-full max-w-sm">
        <Image src="/assets/brand/logo-white.png" alt="FormStep" width={150} height={34} className="mx-auto h-8 w-auto" priority />
        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight">Yönetici girişi</h1>
          <p className="mt-1 text-sm text-mist">Ürünleri, stoku ve içerikleri buradan yönetirsin.</p>
          <AdminLogin next={adm()} />
        </div>
      </div>
    </main>
  );
}
