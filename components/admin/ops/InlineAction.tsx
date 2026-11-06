"use client";

import { useActionState } from "react";
import type { OpsState } from "@/app/actions/ops";

/**
 * Tek düğmelik küçük form (sil, ödendi, tamamla). Gizli alanları `fields` ile verir,
 * isteğe bağlı onay sorar, sonucu yanında kısaca gösterir.
 */
export function InlineAction({
  action,
  fields,
  label,
  confirm,
  className = "text-sm font-medium text-ink/50 hover:text-bad",
  title,
}: {
  action: (s: OpsState, f: FormData) => Promise<OpsState>;
  fields: Record<string, string>;
  label: React.ReactNode;
  confirm?: string;
  className?: string;
  title?: string;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form
      action={run}
      className="inline-flex items-center gap-2"
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={pending} className={`${className} disabled:opacity-40`} title={title}>
        {label}
      </button>
      {state && !state.ok ? <span className="text-xs text-bad">{state.message}</span> : null}
    </form>
  );
}
