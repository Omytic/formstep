import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Empty, PageHead, Stat, n, tl, td, th } from "@/components/admin/ops/ui";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { getLocations, getShipments } from "@/lib/ops/data";
import { CHANNELS, SHIP_STATUS, fmtDate } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Sevkiyatlar" };

export default async function ShipmentsPage() {
  await requireAdmin();
  const [shipments, locations] = await Promise.all([getShipments(), getLocations()]);
  const loc = new Map(locations.map((l) => [l.id, l.name]));
  const sent = (s: (typeof shipments)[number]) => s.items.reduce((a, i) => a + i.qty_sent, 0);
  const open = shipments.filter((s) => s.status === "hazirlaniyor" || s.status === "yolda");
  const issues = shipments.filter((s) => s.status === "eksik");
  const year = new Date().getFullYear().toString();
  const yearUnits = shipments.filter((s) => s.status !== "iptal" && (s.shipped_on ?? s.created_at).startsWith(year)).reduce((a, s) => a + sent(s), 0);
  const yearCost = shipments.filter((s) => s.status !== "iptal" && (s.shipped_on ?? s.created_at).startsWith(year)).reduce((a, s) => a + s.cost_kurus, 0);

  return (
    <div className="fs-enter space-y-8">
      <PageHead
        title="Sevkiyatlar"
        actions={<Link href={adm("/sevkiyatlar/yeni")} className="btn btn-primary btn-sm"><Plus size={16} /> Yeni sevkiyat</Link>}
      >
        Amazon deposuna (FBA) ve diğer pazaryerlerine gönderilen koliler. &quot;Yolda&quot; olarak işaretlenince adetler depodan düşer, varış konumuna geçer.
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Açık sevkiyat" value={open.length} sub="Hazırlanıyor ya da yolda" />
        <Stat label="Fark var" value={issues.length} sub="Eksik sayılan sevkiyat" tone={issues.length ? "text-warn" : ""} />
        <Stat label={`${year} gönderilen`} value={`${n(yearUnits)} adet`} />
        <Stat label={`${year} sevkiyat masrafı`} value={tl(yearCost)} />
      </div>

      {shipments.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>No</th>
                <th className={th}>Durum</th>
                <th className={th}>Nereye</th>
                <th className={th}>Referans</th>
                <th className={th}>Gönderim</th>
                <th className={`${th} text-right`}>Adet</th>
                <th className={`${th} text-right`}>Teslim alınan</th>
                <th className={`${th} text-right`}>Masraf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shipments.map((s) => {
                const received = s.items.every((i) => i.qty_received !== null) ? s.items.reduce((a, i) => a + (i.qty_received ?? 0), 0) : null;
                const st = SHIP_STATUS[s.status];
                return (
                  <tr key={s.id} className="group hover:bg-paper/60">
                    <td className={td}><Link href={adm(`/sevkiyatlar/${s.id}`)} className="font-semibold text-blue group-hover:underline">#{s.number}</Link></td>
                    <td className={td}><span className={`chip ${st.tone}`}>{st.label}</span></td>
                    <td className={td}>{loc.get(s.to_location)}{s.channel ? <span className="block text-xs text-ink/45">{CHANNELS[s.channel]}</span> : null}</td>
                    <td className={`${td} font-mono text-xs`}>{s.reference || "—"}</td>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(s.shipped_on)}</td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{n(sent(s))}</td>
                    <td className={`${td} text-right tabular-nums ${received !== null && received < sent(s) ? "font-semibold text-warn" : "text-ink/60"}`}>{received === null ? "—" : n(received)}</td>
                    <td className={`${td} text-right tabular-nums`}>{s.cost_kurus ? tl(s.cost_kurus) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="Henüz sevkiyat yok">
          Amazon&apos;a koli gönderdiğinde <Link href={adm("/sevkiyatlar/yeni")} className="text-blue hover:underline">yeni sevkiyat</Link> oluştur; hangi numaradan kaç adet gittiğini yaz.
        </Empty>
      )}
    </div>
  );
}
