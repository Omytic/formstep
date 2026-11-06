import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { deleteShipment, updateShipment } from "@/app/actions/ops";
import { ActionForm } from "@/components/admin/ActionForm";
import { InlineAction } from "@/components/admin/ops/InlineAction";
import { ShipmentFields } from "@/components/admin/ops/ShipmentForm";
import { PageHead, n, td, th } from "@/components/admin/ops/ui";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { getLocations, getShipment, getTeam, getVariants } from "@/lib/ops/data";
import { SHIP_STATUS, fmtDate, todayTR } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Sevkiyat" };

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [s, locations, { byId }, team] = await Promise.all([getShipment(id), getLocations(), getVariants(), getTeam()]);
  if (!s) notFound();
  const st = SHIP_STATUS[s.status];
  const sent = s.items.reduce((a, i) => a + i.qty_sent, 0);
  const items = [...s.items].sort((a, b) => (byId.get(a.variant_id)?.label ?? "").localeCompare(byId.get(b.variant_id)?.label ?? "", "tr", { numeric: true }));
  const by = team.find((m) => m.id === s.created_by)?.name;

  return (
    <div className="fs-enter space-y-6">
      <Link href={adm("/sevkiyatlar")} className="inline-flex items-center gap-1.5 text-sm text-ink/55 hover:text-ink"><ArrowLeft size={15} /> Sevkiyatlar</Link>
      <PageHead title={`Sevkiyat #${s.number}`} actions={<span className={`chip ${st.tone}`}>{st.label}</span>}>
        {n(sent)} adet · oluşturan {by ?? "—"} · {fmtDate(s.created_at)}
      </PageHead>

      <ActionForm action={updateShipment} submit="Değişiklikleri kaydet">
        <input type="hidden" name="id" value={s.id} />
        <div className="card space-y-6 p-6">
          <ShipmentFields locations={locations} s={s} today={todayTR()} />
          <div>
            <p className="text-sm font-semibold">Adetler</p>
            <p className="mb-3 text-sm text-ink/55">Pazaryeri teslim alınca saydığı adedi yaz ve durumu &quot;Teslim alındı&quot; ya da &quot;Eksik&quot; yap. Fark otomatik olarak fire / düzeltme kaydı olur.</p>
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper/60">
                    <th className={th}>Ürün</th>
                    <th className={`${th} text-right`}>Gönderilen</th>
                    <th className={`${th} text-right`}>Teslim alınan</th>
                    <th className={`${th} text-right`}>Fark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((i) => {
                    const diff = i.qty_received === null ? null : i.qty_received - i.qty_sent;
                    return (
                      <tr key={i.id}>
                        <td className={`${td} font-medium`}>{byId.get(i.variant_id)?.label ?? "—"}</td>
                        <td className={`${td} text-right font-semibold tabular-nums`}>{n(i.qty_sent)}</td>
                        <td className={`${td} text-right`}>
                          <input name={`r_${i.id}`} defaultValue={i.qty_received ?? ""} inputMode="numeric" placeholder={String(i.qty_sent)} aria-label="Teslim alınan adet" className="w-24 rounded-xl border border-line px-3 py-1.5 text-right tabular-nums outline-none focus:border-blue" />
                        </td>
                        <td className={`${td} text-right tabular-nums ${diff ? "font-semibold text-warn" : "text-ink/40"}`}>{diff === null ? "—" : diff > 0 ? `+${diff}` : diff}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ActionForm>

      <div className="flex justify-end">
        <InlineAction action={deleteShipment} fields={{ id: s.id }} label="Sevkiyatı sil" confirm="Sevkiyat ve stok hareketleri silinsin mi?" className="text-sm font-medium text-bad/70 hover:text-bad" />
      </div>
    </div>
  );
}
