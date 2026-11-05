import { adm } from "@/lib/admin-path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s — FormStep yönetim" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-night px-4 py-5 text-paper lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex items-center justify-between px-2 lg:mb-8">
          <Link href={adm("")}><Image src="/assets/brand/logo-white.png" alt="FormStep" width={120} height={27} className="h-6 w-auto" /></Link>
          <span className="chip bg-white/10 text-[10px] uppercase tracking-wider text-mist">Yönetim</span>
        </div>
        <div className="mt-4 lg:mt-0"><AdminNav /></div>
        <div className="mt-auto hidden space-y-1 border-t border-white/10 pt-4 text-sm lg:block">
          <Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-4 py-2 text-paper/70 hover:text-white"><ExternalLink size={15} /> Mağazayı aç</Link>
          <p className="px-4 pt-2 text-xs text-mist/70">{admin.email} · {admin.role === "owner" ? "Sahip" : "Personel"}</p>
          <form action={signOut}><button type="submit" className="flex items-center gap-2 px-4 py-2 text-paper/70 hover:text-white"><LogOut size={15} /> Çıkış</button></form>
        </div>
      </aside>
      <main id="icerik" className="min-w-0 px-5 py-8 lg:px-10">
        {admin.preview ? (
          <p className="mb-6 rounded-2xl bg-warn/10 px-4 py-3 text-sm text-warn">
            <strong>Önizleme modu.</strong> Panel tasarımı ve formlar görünür; Supabase bağlanana kadar kayıt yapılmaz ve sipariş verisi yoktur.
          </p>
        ) : null}
        {children}
      </main>
    </div>
  );
}
