import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { changePassword, saveDisplayName } from "@/app/actions/ops";
import { ActionForm, F } from "@/components/admin/ActionForm";
import { PageHead } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Hesabım" };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <div className="fs-enter max-w-3xl space-y-6">
      <PageHead title="Hesabım">
        Giriş yaptığın hesap: <strong>{me.email}</strong>. Giriş ekranında kullanıcı adı olarak yalnızca <strong>{me.email.split("@")[0]}</strong> yazman yeterli.
      </PageHead>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Şifre değiştir</h2>
        <p className="mt-1 text-sm text-ink/55">İlk girişten sonra herkese verilen ortak şifreyi kendine özel bir şifreyle değiştir. En az 10 karakter.</p>
        <ActionForm action={changePassword} submit="Şifreyi değiştir" resetOnSuccess className="mt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <F label="Şu anki şifre" name="current" type="password" autoComplete="current-password" required />
            <F label="Yeni şifre" name="next" type="password" autoComplete="new-password" minLength={10} required />
            <F label="Yeni şifre (tekrar)" name="again" type="password" autoComplete="new-password" minLength={10} required />
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">Görünen ad</h2>
        <p className="mt-1 text-sm text-ink/55">Görevlerde ve işlem geçmişinde bu ad görünür.</p>
        <ActionForm action={saveDisplayName} submit="Kaydet" className="mt-5">
          <div className="max-w-xs"><F label="Ad" name="name" defaultValue={me.name} required /></div>
        </ActionForm>
      </section>

      <form action={signOut}>
        <button type="submit" className="btn btn-ghost btn-sm"><LogOut size={16} /> Çıkış yap</button>
      </form>
    </div>
  );
}
