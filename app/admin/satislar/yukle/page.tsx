import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SalesImporter } from "@/components/admin/ops/SalesImporter";
import { PageHead } from "@/components/admin/ops/ui";
import { adm } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { getChannels } from "@/lib/ops/data";

export const metadata: Metadata = { title: "Satış raporu yükle" };

export default async function UploadSalesPage() {
  await requireAdmin();
  const channels = await getChannels();
  return (
    <div className="fs-enter space-y-6">
      <Link href={adm("/satislar")} className="inline-flex items-center gap-1.5 text-sm text-ink/55 hover:text-ink"><ArrowLeft size={15} /> Satışlar</Link>
      <PageHead title="Satış raporu yükle">
        Amazon Seller Central, Trendyol ya da Hepsiburada satıcı panelinden indirdiğin sipariş raporunu yükle. Satırlar kanalın stoğundan düşer; aynı sipariş ikinci kez eklenmez.
      </PageHead>
      <SalesImporter savedMappings={Object.fromEntries(channels.map((c) => [c.code, c.import_mapping ?? {}]))} />
      <div className="card p-6 text-sm leading-6 text-ink/65">
        <p className="font-semibold text-ink">Raporu nereden indiririm?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Amazon:</strong> Seller Central → Raporlar → Sipariş raporları (ya da Ödemeler → Tarih aralığı raporu). Komisyon ve FBA ücretleri ödeme raporunda yer alır.</li>
          <li><strong>Trendyol:</strong> Satıcı paneli → Siparişler → Excel&apos;e aktar. Komisyon için Finans → Cari hesap ekstresi.</li>
          <li><strong>Hepsiburada:</strong> Satıcı paneli → Siparişler → Raporlar → Excel indir.</li>
        </ul>
        <p className="mt-3">Pazaryerinin ürün kodu bizdeki model-numarayla eşleşmezse satış yine kaydedilir; Satışlar sayfasındaki &quot;Eşlenmemiş ürünler&quot; bölümünden bir kez eşlemen yeterli.</p>
      </div>
    </div>
  );
}
