import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createShipment } from "@/app/actions/ops";
import { ActionForm } from "@/components/admin/ActionForm";
import { ShipmentFields } from "@/components/admin/ops/ShipmentForm";
import { PageHead } from "@/components/admin/ops/ui";
import { VariantGrid } from "@/components/admin/ops/VariantGrid";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { getLocations, getStockLevels, getVariants } from "@/lib/ops/data";
import { todayTR } from "@/lib/ops/meta";

export const metadata: Metadata = { title: "Yeni sevkiyat" };

export default async function NewShipmentPage() {
  await requireAdmin();
  const [{ models }, locations, levels] = await Promise.all([getVariants(), getLocations(), getStockLevels()]);
  const depo = locations.find((l) => l.kind === "depo");
  const hint = depo ? Object.fromEntries(models.flatMap((m) => m.variants.map((v) => [v.id, levels.get(v.id)?.get(depo.id) ?? 0]))) : undefined;
  return (
    <div className="fs-enter space-y-6">
      <Link href={adm("/sevkiyatlar")} className="inline-flex items-center gap-1.5 text-sm text-ink/55 hover:text-ink"><ArrowLeft size={15} /> Sevkiyatlar</Link>
      <PageHead title="Yeni sevkiyat">
        Önce koliye giren adetleri yaz. &quot;Hazırlanıyor&quot; olarak kaydedersen stok yerinde kalır; kargoya verdiğinde durumu &quot;Yolda&quot; yap.
      </PageHead>
      <ActionForm action={createShipment} submit="Sevkiyatı kaydet" resetOnSuccess>
        <div className="card space-y-6 p-6">
          <ShipmentFields locations={locations} today={todayTR()} />
          <div>
            <p className="mb-2 text-sm font-semibold">Gönderilen adetler</p>
            <VariantGrid models={models} hint={hint} hintLabel="depoda" />
          </div>
        </div>
      </ActionForm>
    </div>
  );
}
