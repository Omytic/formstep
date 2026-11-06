import type { Metadata } from "next";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { deleteTask, saveTask, toggleTask } from "@/app/actions/ops";
import { ActionForm, F } from "@/components/admin/ActionForm";
import { Select } from "@/components/admin/ops/fields";
import { InlineAction } from "@/components/admin/ops/InlineAction";
import { Panel } from "@/components/admin/ops/Panel";
import { Empty, PageHead } from "@/components/admin/ops/ui";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { getTasks, getTeam } from "@/lib/ops/data";
import { fmtDate, todayTR } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Görevler" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ kisi?: string }> }) {
  const me = await requireAdmin();
  const { kisi } = await searchParams;
  const [tasks, team] = await Promise.all([getTasks(), getTeam()]);
  const who = new Map(team.map((m) => [m.id, m.name]));
  const today = todayTR();
  const filter = kisi === "ben" ? me.id : team.find((m) => m.id === kisi)?.id;
  const list = filter ? tasks.filter((t) => t.assignee === filter) : tasks;
  const open = list.filter((t) => !t.done);
  const done = list.filter((t) => t.done).slice(0, 15);
  const chip = (on: boolean) => `chip border ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/65 hover:border-ink/30"}`;

  return (
    <div className="fs-enter space-y-8">
      <PageHead title="Görevler">Yapılacaklar, kime atandığı ve son tarihi.</PageHead>

      <Panel title="Görev ekle" icon={<Plus size={18} />} open={!tasks.length}>
        <ActionForm action={saveTask} submit="Ekle" resetOnSuccess>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2"><F label="Görev" name="title" placeholder="Ör. Yeni parti için kutu baskısı" required /></div>
            <Select label="Kime" name="assignee" options={team.map((m) => [m.id, m.name])} defaultValue={me.preview ? "" : me.id} empty="Herkes" />
            <F label="Son tarih" name="due_on" type="date" />
            <div className="sm:col-span-2 lg:col-span-4"><F label="Not" name="note" /></div>
          </div>
        </ActionForm>
      </Panel>

      <div className="flex flex-wrap gap-1.5">
        <Link href={adm("/gorevler")} className={chip(!filter)}>Herkes</Link>
        {team.map((m) => <Link key={m.id} href={`${adm("/gorevler")}?kisi=${m.id}`} className={chip(filter === m.id)}>{m.name}</Link>)}
      </div>

      {open.length ? (
        <ul className="card divide-y divide-line">
          {open.map((t) => {
            const late = t.due_on && t.due_on < today;
            return (
              <li key={t.id} className="flex items-start gap-4 px-5 py-4">
                <InlineAction action={toggleTask} fields={{ id: t.id, done: "1" }} label={<span className="sr-only">Tamamla</span>} title="Tamamlandı olarak işaretle" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink/25 transition hover:border-good hover:bg-good/10" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.title}</p>
                  {t.note ? <p className="mt-0.5 text-sm text-ink/55">{t.note}</p> : null}
                  <p className="mt-1 text-xs text-ink/50">
                    {t.assignee ? who.get(t.assignee) : "Herkes"}
                    {t.due_on ? <span className={late ? "font-semibold text-bad" : ""}> · {late ? "gecikti, " : ""}{fmtDate(t.due_on)}</span> : null}
                    {t.created_by ? ` · ekleyen ${who.get(t.created_by) ?? ""}` : ""}
                  </p>
                </div>
                <InlineAction action={deleteTask} fields={{ id: t.id }} label="Sil" confirm="Görev silinsin mi?" />
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty title="Açık görev yok">{filter ? "Bu kişiye atanmış açık görev yok." : "Her şey yolunda. Yeni bir iş çıkınca yukarıdan ekle."}</Empty>
      )}

      {done.length ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink/55">Son tamamlananlar</h2>
          <ul className="card divide-y divide-line">
            {done.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-good text-white"><Check size={14} /></span>
                <span className="min-w-0 flex-1 text-ink/55 line-through">{t.title}</span>
                <span className="text-xs text-ink/45">{t.assignee ? who.get(t.assignee) : ""} · {fmtDate(t.done_at)}</span>
                <InlineAction action={toggleTask} fields={{ id: t.id, done: "0" }} label="Geri aç" className="text-xs font-medium text-ink/45 hover:text-blue" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
