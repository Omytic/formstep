"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { requestReset, signIn, signUp, updatePassword, type AuthState } from "@/app/actions/auth";

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" className="btn btn-primary btn-block min-h-14" disabled={pending}>
      {pending ? <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : children}
    </button>
  );
}

function Notice({ state }: { state: AuthState }) {
  if (!state) return null;
  return (
    <p role="status" className={`fs-pop rounded-2xl px-4 py-3 text-sm ${state.ok ? "bg-good/10 text-good" : "bg-bad/10 text-bad"}`}>
      {state.message}
    </p>
  );
}

function PasswordInput({ id, name, autoComplete }: { id: string; name: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required minLength={8} className="field pr-12" />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-ink/50" aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function LoginRegister({ next, initialTab, linkError }: { next: string; initialTab: "giris" | "kayit"; linkError: boolean }) {
  const [tab, setTab] = useState(initialTab);
  const [inState, inAction, inPending] = useActionState(signIn, linkError ? { ok: false, message: "Bağlantının süresi dolmuş. Tekrar dene." } : null);
  const [upState, upAction, upPending] = useActionState(signUp, null);

  return (
    <div>
      <h1 className="display text-5xl">{tab === "giris" ? "Tekrar hoş geldin" : "Hesap oluştur"}</h1>
      <p className="mt-3 text-ink/60">{tab === "giris" ? "Siparişlerini ve adreslerini görmek için giriş yap." : "Siparişlerini takip et, adreslerini kaydet, ödemeyi hızlandır."}</p>

      <div className="relative mt-8 grid grid-cols-2 rounded-full bg-white p-1" role="tablist">
        <span aria-hidden className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-ink transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${tab === "kayit" ? "translate-x-[calc(100%+0px)]" : "translate-x-0"}`} style={{ left: 4 }} />
        {(["giris", "kayit"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative z-10 min-h-11 rounded-full text-sm font-semibold transition-colors ${tab === t ? "text-white" : "text-ink/60"}`}>
            {t === "giris" ? "Giriş yap" : "Kayıt ol"}
          </button>
        ))}
      </div>

      {tab === "giris" ? (
        <form action={inAction} className="fs-pop mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="label">E-posta</label>
            <input id="email" name="email" type="text" inputMode="email" autoComplete="username" required className="field" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="label">Şifre</label>
              <Link href="/sifremi-unuttum" className="mb-1.5 text-sm text-blue hover:underline">Şifremi unuttum</Link>
            </div>
            <PasswordInput id="password" name="password" autoComplete="current-password" />
          </div>
          <Notice state={inState} />
          <Submit pending={inPending}>Giriş yap</Submit>
        </form>
      ) : (
        <form action={upAction} className="fs-pop mt-8 space-y-5">
          <div>
            <label htmlFor="fullName" className="label">Ad soyad</label>
            <input id="fullName" name="fullName" autoComplete="name" required className="field" />
          </div>
          <div>
            <label htmlFor="email2" className="label">E-posta</label>
            <input id="email2" name="email" type="email" autoComplete="email" required className="field" />
          </div>
          <div>
            <label htmlFor="password2" className="label">Şifre (en az 8 karakter)</label>
            <PasswordInput id="password2" name="password" autoComplete="new-password" />
          </div>
          <label className="flex items-start gap-3 text-sm leading-6 text-ink/70">
            <input type="checkbox" name="kvkk" className="check mt-0.5" required />
            <span><Link href="/bilgilendirme/kvkk" target="_blank" className="text-blue hover:underline">KVKK aydınlatma metnini</Link> okudum.</span>
          </label>
          <Notice state={upState} />
          {!upState?.ok ? <Submit pending={upPending}>Hesap oluştur</Submit> : null}
        </form>
      )}
      <p className="mt-8 text-center text-sm text-ink/55">Üye olmadan da alışveriş yapabilirsin.</p>
    </div>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestReset, null);
  return (
    <form action={action} className="space-y-5">
      <h1 className="display text-5xl">Şifreni mi unuttun?</h1>
      <p className="text-ink/60">E-posta adresini yaz, sana şifre sıfırlama bağlantısı gönderelim.</p>
      <div>
        <label htmlFor="email" className="label">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <Notice state={state} />
      <Submit pending={pending}>Bağlantı gönder</Submit>
      <p className="text-center text-sm"><Link href="/giris" className="text-blue hover:underline">Girişe dön</Link></p>
    </form>
  );
}

export function ResetForm({ compact = false }: { compact?: boolean }) {
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="space-y-5">
      {compact ? <h2 className="text-xl font-semibold">Şifreni değiştir</h2> : <h1 className="display text-5xl">Yeni şifre</h1>}
      <div>
        <label htmlFor="password" className="label">Yeni şifre</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="password2" className="label">Yeni şifre (tekrar)</label>
        <PasswordInput id="password2" name="password2" autoComplete="new-password" />
      </div>
      <Notice state={state} />
      {state?.ok && !compact ? <Link href="/hesabim" className="btn btn-primary btn-block">Hesabıma git</Link> : <Submit pending={pending}>Şifreyi güncelle</Submit>}
    </form>
  );
}
