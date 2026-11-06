import { adm } from "@/lib/admin-path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { opsSchemaReady } from "@/lib/ops/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s — FormStep yönetim" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const schema = await opsSchemaReady();
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-night px-4 py-5 text-paper lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <div className="flex items-center justify-between px-2 lg:mb-8">
          <Link href={adm("")}><Image src="/assets/brand/logo-white.png" alt="FormStep" width={120} height={27} className="h-6 w-auto" /></Link>
          <span className="chip bg-white/10 text-[10px] uppercase tracking-wider text-mist">Yönetim</span>
        </div>
        <div className="mt-4 lg:mt-0"><AdminNav /></div>
        <div className="mt-auto hidden space-y-1 border-t border-white/10 pt-4 text-sm lg:mt-8 lg:block">
          <Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-4 py-2 text-paper/70 hover:text-white"><ExternalLink size={15} /> Siteyi aç</Link>
          <p className="px-4 pt-2 text-sm font-semibold text-paper">{admin.name}</p>
          <form action={signOut}><button type="submit" className="flex items-center gap-2 px-4 py-1.5 text-paper/70 hover:text-white"><LogOut size={15} /> Çıkış</button></form>
        </div>
      </aside>
      <main id="icerik" className="min-w-0 px-5 py-8 lg:px-10">
        {admin.preview ? (
          <p className="mb-6 rounded-2xl bg-warn/10 px-4 py-3 text-sm text-warn">
            <strong>Önizleme modu.</strong> Veritabanı bağlı değil; gördüğün rakamlar örnek, formlar kayıt yapmaz.
          </p>
        ) : null}
        {schema.ok ? (
          children
        ) : (
          <div className="card max-w-2xl p-8">
            <h1 className="display text-3xl">Veritabanı güncellenmeli</h1>
            <p className="mt-3 leading-7 text-ink/65">
              Panelin yeni bölümleri (stok, sevkiyat, satış, aldı-verdi...) için veritabanına yeni tablolar eklenmesi gerekiyor. Cursor terminalinde proje klasöründe şunu çalıştır, sonra bu sayfayı yenile:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-night px-5 py-4 text-sm text-paper">npx supabase db push</pre>
            <p className="mt-4 text-xs text-ink/45">Teknik ayrıntı: {schema.reason}</p>
          </div>
        )}
      </main>
    </div>
  );
}
