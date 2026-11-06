import { ChevronDown } from "lucide-react";

/** Açılır-kapanır form paneli. */
export function Panel({ title, sub, icon, open = false, children }: { title: string; sub?: string; icon?: React.ReactNode; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-paper/60 [&::-webkit-details-marker]:hidden">
        {icon ? <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue/10 text-blue">{icon}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          {sub ? <span className="block text-sm text-ink/50">{sub}</span> : null}
        </span>
        <ChevronDown size={18} className="shrink-0 text-ink/40 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}
