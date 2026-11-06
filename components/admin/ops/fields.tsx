import type { VariantRef } from "@/lib/ops/data";

/** Model ve numara seçimi (gruplu). */
export function VariantSelect({ models, name = "variant_id", label = "Model ve numara", defaultValue = "", required = true }: { models: { code: string; variants: VariantRef[] }[]; name?: string; label?: string; defaultValue?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue} required={required} className="field">
        <option value="">Seç</option>
        {models.map((m) => (
          <optgroup key={m.code} label={m.code}>
            {m.variants.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/** Basit seçim kutusu. */
export function Select({ label, name, options, defaultValue, required, empty }: { label: string; name: string; options: [string, string][]; defaultValue?: string; required?: boolean; empty?: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue ?? ""} required={required} className="field">
        {empty !== undefined ? <option value="">{empty}</option> : null}
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
