import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageHead } from "@/components/admin/ops/ui";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { getAudit, getTeam } from "@/lib/ops/data";
import { auditDetails, auditSentence } from "@/lib/ops/audit-text";

export const metadata: Metadata = { title: "İşlem geçmişi" };

const fmt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const dayKey = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric", weekday: "long" });

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ kisi?: string }> }) {
  await requireAdmin();
  const { kisi } = await searchParams;
  const team = await getTeam();
  const person = team.find((m) => m.id === kisi);
  const rows = await getAudit(300, person?.id);
  const who = new Map(team.map((m) => [m.id, m.name]));
  const days = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = dayKey.format(new Date(r.created_at));
    days.set(k, [...(days.get(k) ?? []), r]);
  }
  const chip = (on: boolean) => `chip border ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink/65 hover:border-ink/30"}`;
  const color = (id: string | null) => ["bg-blue", "bg-good", "bg-warn", "bg-bad"][Math.max(0, team.findIndex((m) => m.id === id)) % 4];

  return (
    <div className="fs-enter space-y-8">
      <PageHead title="İşlem geçmişi">Panelde kim, ne zaman, neyi değiştirdi. Kayıtlar silinemez.</PageHead>
      <div className="flex flex-wrap gap-1.5">
        <Link href={adm("/gecmis")} className={chip(!person)}>Herkes</Link>
        {team.map((m) => <Link key={m.id} href={`${adm("/gecmis")}?kisi=${m.id}`} className={chip(person?.id === m.id)}>{m.name}</Link>)}
      </div>
      {rows.length ? (
        [...days.entries()].map(([day, list]) => (
          <section key={day}>
            <h2 className="mb-2 text-sm font-semibold text-ink/55">{day}</h2>
            <ol className="card divide-y divide-line">
              {list.map((r) => {
                const name = r.admin_id ? who.get(r.admin_id) ?? "Eski hesap" : "Sistem";
                const details = auditDetails(r.action, r.entity_id, r.diff);
                return (
                  <li key={r.id} className="flex items-start gap-4 px-5 py-3.5">
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${color(r.admin_id)}`}>{name.slice(0, 1)}</span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p><strong>{name}</strong> {auditSentence(r.action)}</p>
                      {details ? <p className="mt-0.5 break-words text-ink/55">{details}</p> : null}
                    </div>
                    <time className="shrink-0 text-xs text-ink/45" dateTime={r.created_at}>{fmt.format(new Date(r.created_at)).split(" ").slice(-1)[0]}</time>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      ) : (
        <Empty title="Henüz kayıt yok">Panelde yapılan her değişiklik burada kimin yaptığıyla birlikte görünür.</Empty>
      )}
    </div>
  );
}
