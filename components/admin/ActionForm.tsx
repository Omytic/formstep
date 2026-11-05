"use client";

import { Check } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import type { AdminState } from "@/app/actions/admin";

export function ActionForm({
  action,
  children,
  submit = "Kaydet",
  className = "",
  resetOnSuccess = false,
  confirm,
}: {
  action: (s: AdminState, f: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  submit?: string | null;
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [state, run, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={ref}
      action={run}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {submit !== null || state ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {submit !== null ? (
            <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
              {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : submit}
            </button>
          ) : null}
          {state ? (
            <span role="status" className={`fs-pop inline-flex items-center gap-1.5 text-sm ${state.ok ? "text-good" : "text-bad"}`}>
              {state.ok ? <Check size={15} /> : null}
              {state.message}
            </span>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

export function F({ label, name, hint, ...props }: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="label">{label}</label>
      <input id={`f-${name}`} name={name} className="field" {...props} />
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

export function T({ label, name, hint, ...props }: { label: string; name: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={`t-${name}`} className="label">{label}</label>
      <textarea id={`t-${name}`} name={name} className="field" {...props} />
      {hint ? <p className="mt-1 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full bg-ink/15 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-blue peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-blue" />
      {label}
    </label>
  );
}
