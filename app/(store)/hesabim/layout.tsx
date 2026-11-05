import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { AccountNav } from "@/components/account/AccountNav";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Hesabım", robots: { index: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const first = (user.fullName || user.email).split(" ")[0];
  return (
    <div className="min-h-screen bg-paper pb-24">
      <div className="relative overflow-hidden bg-night pb-8 pt-28 text-paper">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_85%_0%,rgba(36,119,234,0.3),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-5">
          <div className="fs-enter flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker text-sky">Hesabım</p>
              <h1 className="display mt-3 text-5xl md:text-6xl">Merhaba, {first}</h1>
              <p className="mt-2 text-sm text-mist">{user.email}</p>
            </div>
            <form action={signOut}>
              <button type="submit" className="btn btn-quiet btn-sm"><LogOut size={15} /> Çıkış yap</button>
            </form>
          </div>
          <div className="mt-8"><AccountNav /></div>
        </div>
      </div>
      {user.preview ? <p className="mx-auto mt-6 max-w-5xl px-5 text-sm text-warn">Önizleme modu: Supabase bağlanınca giriş yapan müşteri kendi siparişlerini burada görür.</p> : null}
      <div className="mx-auto mt-8 max-w-5xl px-5">{children}</div>
    </div>
  );
}
