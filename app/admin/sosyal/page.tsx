import type { Metadata } from "next";
import { ArrowUpRight, CalendarPlus, LineChart, UserPlus } from "lucide-react";
import { deleteContent, saveContent, saveSocialAccount, saveSocialStat, setContentStatus } from "@/app/actions/ops";
import { ActionForm, F, T } from "@/components/admin/ActionForm";
import { Select } from "@/components/admin/ops/fields";
import { InlineAction } from "@/components/admin/ops/InlineAction";
import { Panel } from "@/components/admin/ops/Panel";
import { Empty, PageHead, n } from "@/components/admin/ops/ui";
import { requireAdmin } from "@/lib/auth";
import { currentMonth, getContent, getSocial, getTeam } from "@/lib/ops/data";
import { CONTENT_STATUS, type ContentStatus, MONTHS_TR, SOCIAL_PLATFORMS, addDays, fmtDate, todayTR } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Sosyal medya" };

const NEXT: Record<ContentStatus, ContentStatus | null> = { fikir: "hazirlaniyor", hazirlaniyor: "planlandi", planlandi: "paylasildi", paylasildi: null };

export default async function SocialPage() {
  await requireAdmin();
  const today = todayTR();
  const from = addDays(today, -14);
  const to = addDays(today, 60);
  const [accounts, content, team] = await Promise.all([getSocial(), getContent(from, to), getTeam()]);
  const who = new Map(team.map((m) => [m.id, m.name]));
  const teamOpts = team.map((m) => [m.id, m.name] as [string, string]);

  const groups = new Map<string, typeof content>();
  for (const c of [...content].sort((a, b) => a.planned_on.localeCompare(b.planned_on))) {
    const k = c.planned_on.slice(0, 7);
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }

  return (
    <div className="fs-enter space-y-8">
      <PageHead title="Sosyal medya">Hesapların takipçi gelişimi ve içerik takvimi.</PageHead>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => {
          const last = a.stats[a.stats.length - 1];
          const prev = a.stats[a.stats.length - 2];
          const diff = last && prev ? last.followers - prev.followers : null;
          const max = Math.max(1, ...a.stats.map((s) => s.followers));
          return (
            <div key={a.id} className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-ink/55">{SOCIAL_PLATFORMS[a.platform]}</p>
                  <a href={a.url || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold hover:underline">@{a.handle} <ArrowUpRight size={14} /></a>
                </div>
                {diff !== null ? <span className={`chip ${diff >= 0 ? "bg-good/10 text-good" : "bg-bad/10 text-bad"}`}>{diff >= 0 ? "+" : ""}{n(diff)} geçen aya göre</span> : null}
              </div>
              <p className="display mt-4 text-4xl tabular-nums">{last ? n(last.followers) : "—"}</p>
              <p className="text-sm text-ink/50">{last ? `takipçi · ${MONTHS_TR[Number(last.month.slice(5, 7)) - 1]}` : "Henüz sayı girilmedi"}</p>
              {a.stats.length > 1 ? (
                <div className="mt-5 flex h-16 items-end gap-1.5" aria-label="Aylara göre takipçi">
                  {a.stats.slice(-12).map((s) => (
                    <div key={s.month} className="flex-1 rounded-t-md bg-blue/70" style={{ height: `${Math.max(6, (s.followers / max) * 100)}%` }} title={`${MONTHS_TR[Number(s.month.slice(5, 7)) - 1]}: ${n(s.followers)}`} />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Aylık takipçi sayısı gir" sub="Ay sonunda bir kez yeterli" icon={<LineChart size={18} />}>
          <ActionForm action={saveSocialStat} submit="Kaydet" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Hesap" name="account_id" options={accounts.map((a) => [a.id, `${SOCIAL_PLATFORMS[a.platform]} @${a.handle}`])} required />
              <F label="Ay" name="month" type="month" defaultValue={currentMonth()} required />
              <F label="Takipçi" name="followers" inputMode="numeric" required />
              <F label="O ayki paylaşım sayısı" name="posts" inputMode="numeric" />
            </div>
          </ActionForm>
        </Panel>
        <Panel title="Hesap ekle" sub="TikTok, YouTube..." icon={<UserPlus size={18} />}>
          <ActionForm action={saveSocialAccount} submit="Ekle" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Platform" name="platform" options={Object.entries(SOCIAL_PLATFORMS)} defaultValue="tiktok" />
              <F label="Kullanıcı adı" name="handle" placeholder="formsteptr" required />
              <div className="sm:col-span-2"><F label="Profil bağlantısı" name="url" placeholder="https://" /></div>
            </div>
          </ActionForm>
        </Panel>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">İçerik takvimi</h2>
        <Panel title="İçerik ekle" sub="Fikir, hazırlanan ya da planlanan paylaşım" icon={<CalendarPlus size={18} />} open={!content.length}>
          <ActionForm action={saveContent} submit="Ekle" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2"><F label="Başlık" name="title" placeholder="Ör. M900 topuk desteği reels" required /></div>
              <Select label="Platform" name="platform" options={Object.entries(SOCIAL_PLATFORMS)} defaultValue="instagram" />
              <F label="Tarih" name="planned_on" type="date" defaultValue={today} required />
              <Select label="Durum" name="status" options={Object.entries(CONTENT_STATUS).map(([k, v]) => [k, v.label])} defaultValue="fikir" />
              <Select label="Kim hazırlıyor" name="assignee" options={teamOpts} empty="—" />
              <div className="sm:col-span-2"><F label="Bağlantı" name="link" placeholder="Paylaşıldıysa gönderi linki" /></div>
              <div className="sm:col-span-2 lg:col-span-4"><T label="Metin / açıklama" name="caption" rows={3} /></div>
            </div>
          </ActionForm>
        </Panel>

        {content.length ? (
          [...groups.entries()].map(([ym, list]) => (
            <div key={ym}>
              <p className="mb-2 text-sm font-semibold text-ink/55">{MONTHS_TR[Number(ym.slice(5, 7)) - 1]} {ym.slice(0, 4)}</p>
              <ul className="card divide-y divide-line">
                {list.map((c) => {
                  const st = CONTENT_STATUS[c.status];
                  const next = NEXT[c.status];
                  const late = c.status !== "paylasildi" && c.planned_on < today;
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                      <span className={`w-20 shrink-0 text-sm tabular-nums ${late ? "font-semibold text-bad" : c.planned_on === today ? "font-semibold text-blue" : "text-ink/55"}`}>{fmtDate(c.planned_on).replace(/ \d{4}$/, "")}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{c.title}</span>
                        <span className="text-xs text-ink/50">{SOCIAL_PLATFORMS[c.platform]}{c.assignee ? ` · ${who.get(c.assignee) ?? ""}` : ""}{c.link ? <> · <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">gönderi</a></> : null}</span>
                      </span>
                      <span className={`chip ${st.tone}`}>{st.label}</span>
                      {next ? <InlineAction action={setContentStatus} fields={{ id: c.id, status: next }} label={`→ ${CONTENT_STATUS[next].label}`} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink/65 hover:border-blue hover:text-blue" /> : null}
                      <InlineAction action={deleteContent} fields={{ id: c.id }} label="Sil" confirm="Bu içerik silinsin mi?" />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        ) : (
          <Empty title="Takvim boş">Önümüzdeki paylaşımları ve fikirleri ekle; kimin hazırladığı ve durumu buradan takip edilir.</Empty>
        )}
      </section>
    </div>
  );
}
