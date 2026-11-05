"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { deleteAddress, saveAddress } from "@/app/actions/account";
import { TR_PROVINCES } from "@/lib/geo/provinces";

export type Address = { id: string; title: string; fullName: string; phone: string; city: string; district: string; line: string; postalCode: string; isDefault: boolean };

function AddressForm({ initial, onDone }: { initial?: Address; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveAddress, null);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  const e = state?.errors ?? {};
  const f = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`a-${name}`} className="label">{label}</label>
      <input id={`a-${name}`} name={name} className="field" aria-invalid={Boolean(e[name])} {...props} />
      {e[name] ? <p className="field-error">{e[name]}</p> : null}
    </div>
  );
  return (
    <form action={action} className="card fs-pop grid gap-4 p-6 sm:grid-cols-2">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      {f("title", "Adres adı", { defaultValue: initial?.title ?? "Ev", placeholder: "Ev, iş…" })}
      {f("fullName", "Ad soyad", { defaultValue: initial?.fullName, autoComplete: "name" })}
      {f("phone", "Cep telefonu", { defaultValue: initial?.phone, type: "tel", autoComplete: "tel" })}
      <div>
        <label htmlFor="a-city" className="label">İl</label>
        <select id="a-city" name="city" className="field" defaultValue={initial?.city ?? ""} aria-invalid={Boolean(e.city)}>
          <option value="">Seç</option>
          {TR_PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </select>
        {e.city ? <p className="field-error">{e.city}</p> : null}
      </div>
      {f("district", "İlçe", { defaultValue: initial?.district })}
      {f("postalCode", "Posta kodu", { defaultValue: initial?.postalCode, inputMode: "numeric" })}
      <div className="sm:col-span-2">
        <label htmlFor="a-line" className="label">Açık adres</label>
        <textarea id="a-line" name="line" rows={3} className="field" defaultValue={initial?.line} aria-invalid={Boolean(e.line)} />
        {e.line ? <p className="field-error">{e.line}</p> : null}
      </div>
      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="isDefault" className="check" defaultChecked={initial?.isDefault} /> Varsayılan adresim olsun
      </label>
      {state && !state.ok ? <p className="text-sm text-bad sm:col-span-2">{state.message}</p> : null}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Kaydediliyor…" : "Kaydet"}</button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>Vazgeç</button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {editing === "new" ? <AddressForm onDone={() => setEditing(null)} /> : (
        <button type="button" onClick={() => setEditing("new")} className="flex w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-line py-6 font-semibold text-ink/60 transition-colors hover:border-blue hover:text-blue">
          <Plus size={18} /> Yeni adres ekle
        </button>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <div key={a.id} className="sm:col-span-2"><AddressForm initial={a} onDone={() => setEditing(null)} /></div>
          ) : (
            <div key={a.id} className="card fs-pop p-6">
              <div className="flex items-start justify-between">
                <p className="flex items-center gap-2 font-semibold"><MapPin size={16} className="text-blue" /> {a.title}{a.isDefault ? <span className="chip bg-blue/10 text-blue">Varsayılan</span> : null}</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditing(a.id)} className="grid size-9 place-items-center rounded-full hover:bg-black/5" aria-label="Düzenle"><Pencil size={15} /></button>
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="grid size-9 place-items-center rounded-full text-ink/50 hover:bg-bad/10 hover:text-bad" aria-label="Sil"><Trash2 size={15} /></button>
                  </form>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/70">{a.fullName} · {a.phone}<br />{a.line}<br />{a.district} / {a.city}</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
