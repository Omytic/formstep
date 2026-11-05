"use client";

import { useActionState } from "react";
import { requestDeletion, saveProfile } from "@/app/actions/account";
import { ResetForm } from "./AuthForms";

function Note({ s }: { s: { ok: boolean; message: string } | null }) {
  return s ? <p className={`fs-pop rounded-xl px-4 py-3 text-sm ${s.ok ? "bg-good/10 text-good" : "bg-bad/10 text-bad"}`}>{s.message}</p> : null;
}

export function SettingsForms({ profile }: { profile: { fullName: string; phone: string; marketing: boolean } }) {
  const [ps, pa, pp] = useActionState(saveProfile, null);
  const [ds, da, dp] = useActionState(requestDeletion, null);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form action={pa} className="card space-y-5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Kişisel bilgiler</h2>
        <div>
          <label htmlFor="fullName" className="label">Ad soyad</label>
          <input id="fullName" name="fullName" defaultValue={profile.fullName} className="field" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Cep telefonu</label>
          <input id="phone" name="phone" type="tel" defaultValue={profile.phone} className="field" />
        </div>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input type="checkbox" name="marketing" defaultChecked={profile.marketing} className="check mt-0.5" />
          Kampanya ve yeniliklerden e-posta ile haberdar olmak istiyorum.
        </label>
        <Note s={ps} />
        <button type="submit" className="btn btn-primary" disabled={pp}>Kaydet</button>
      </form>
      <div className="space-y-5">
        <div className="card p-6 sm:p-8"><ResetForm compact /></div>
        <form action={da} className="card space-y-3 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Hesabımı sil</h2>
          <p className="text-sm leading-6 text-ink/60">Hesabını silme talebinde bulunabilirsin. Fatura ve sipariş kayıtları, yasal saklama süresi boyunca tutulmaya devam eder.</p>
          <Note s={ds} />
          {!ds?.ok ? <button type="submit" className="btn btn-ghost text-bad" disabled={dp}>Silme talebi gönder</button> : null}
        </form>
      </div>
    </div>
  );
}
