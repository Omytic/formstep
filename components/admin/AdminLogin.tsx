"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { signIn } from "@/app/actions/auth";

export function AdminLogin({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, null);
  const [show, setShow] = useState(false);
  const field = "w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-paper outline-none transition placeholder:text-mist/50 focus:border-sky focus:bg-white/[0.09]";
  return (
    <form action={action} className="mt-7 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="kullanici" className="mb-1.5 block text-sm font-medium text-mist">Kullanıcı adı</label>
        <input id="kullanici" name="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required className={field} />
      </div>
      <div>
        <label htmlFor="sifre" className="mb-1.5 block text-sm font-medium text-mist">Şifre</label>
        <div className="relative">
          <input id="sifre" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className={`${field} pr-12`} />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-mist" aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      {state && !state.ok ? <p role="alert" className="rounded-2xl bg-bad/15 px-4 py-3 text-sm text-[#ffb4b4]">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary btn-block min-h-13">
        {pending ? <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "Giriş yap"}
      </button>
    </form>
  );
}
