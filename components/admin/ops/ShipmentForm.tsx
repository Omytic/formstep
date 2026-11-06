import { F, T } from "@/components/admin/ActionForm";
import type { Location, Shipment } from "@/lib/ops/data";
import { CHANNELS, SHIP_STATUS } from "@/lib/ops/meta";
import { Select } from "./fields";

/** Sevkiyatın üst bilgileri (yeni ve düzenleme formlarında ortak). */
export function ShipmentFields({ locations, s, today }: { locations: Location[]; s?: Shipment; today: string }) {
  const locs = locations.filter((l) => l.active || l.id === s?.from_location || l.id === s?.to_location).map((l) => [l.id, l.name] as [string, string]);
  const depo = locations.find((l) => l.kind === "depo");
  const fba = locations.find((l) => l.kind === "amazon");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select label="Çıkış konumu" name="from_location" options={locs} defaultValue={s?.from_location ?? depo?.id} required />
      <Select label="Varış konumu" name="to_location" options={locs} defaultValue={s?.to_location ?? fba?.id} required />
      <Select label="Pazaryeri" name="channel" options={Object.entries(CHANNELS)} defaultValue={s?.channel ?? "amazon"} empty="—" />
      <Select label="Durum" name="status" options={Object.entries(SHIP_STATUS).map(([k, v]) => [k, v.label])} defaultValue={s?.status ?? "hazirlaniyor"} />
      <F label="Sevkiyat referansı" name="reference" defaultValue={s?.reference} placeholder="Ör. FBA18X9QK2" />
      <F label="Gönderim tarihi" name="shipped_on" type="date" defaultValue={s?.shipped_on ?? today} />
      <F label="Teslim tarihi" name="received_on" type="date" defaultValue={s?.received_on ?? ""} />
      <F label="Koli sayısı" name="box_count" inputMode="numeric" defaultValue={s?.box_count ?? ""} />
      <F label="Kargo firması" name="carrier" defaultValue={s?.carrier} placeholder="Ör. UPS, Yurtiçi" />
      <F label="Takip numarası" name="tracking" defaultValue={s?.tracking} />
      <F label="Kargo masrafı (TL)" name="cost" inputMode="decimal" defaultValue={s?.cost_kurus ? String(s.cost_kurus / 100).replace(".", ",") : ""} hint="Girersen aldı-verdi'ye gider olarak eklenir." />
      <div className="sm:col-span-2 lg:col-span-1"><T label="Not" name="note" rows={1} defaultValue={s?.note} /></div>
    </div>
  );
}
