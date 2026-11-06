import { formatTry } from "@/lib/money";
import { CHANNELS, SHIP_STATUS } from "./meta";

/** İşlem geçmişindeki kayıtları okunur Türkçe cümleye çevirir. */
const TEXT: Record<string, string> = {
  "stock.in": "stok girişi yaptı",
  "stock.move": "stok hareketi ekledi",
  "stock.count": "sayım yaptı",
  "stock.delete": "stok hareketini sildi",
  "location.add": "stok konumu ekledi",
  "location.update": "stok konumunu düzenledi",
  "settings.ops": "stok ayarlarını değiştirdi",
  "shipment.add": "sevkiyat oluşturdu",
  "shipment.update": "sevkiyatı güncelledi",
  "shipment.delete": "sevkiyatı sildi",
  "sales.import": "satış raporu yükledi",
  "sales.undo_import": "satış yüklemesini geri aldı",
  "sales.add": "satış ekledi",
  "sales.delete": "satışı sildi",
  "sales.map_sku": "pazaryeri ürün kodunu eşledi",
  "ledger.add": "aldı-verdi kaydı ekledi",
  "ledger.update": "aldı-verdi kaydını düzenledi",
  "ledger.paid": "ödemeyi kapattı",
  "ledger.delete": "aldı-verdi kaydını sildi",
  "counterparty.add": "cari ekledi",
  "counterparty.update": "cariyi düzenledi",
  "category.add": "kategori ekledi",
  "unitcost.save": "birim maliyeti güncelledi",
  "ads.save": "reklam harcaması girdi",
  "ads.delete": "reklam kaydını sildi",
  "social.account": "sosyal medya hesabı ekledi",
  "social.stat": "takipçi sayısı girdi",
  "content.add": "içerik ekledi",
  "content.update": "içeriği düzenledi",
  "content.status": "içeriğin durumunu değiştirdi",
  "content.delete": "içeriği sildi",
  "task.add": "görev ekledi",
  "task.update": "görevi düzenledi",
  "task.done": "görevi tamamladı",
  "task.reopen": "görevi yeniden açtı",
  "task.delete": "görevi sildi",
  "account.password": "şifresini değiştirdi",
  "account.name": "adını değiştirdi",
};

const MONEY = new Set(["tutar", "butce", "harcanan", "toplam"]);
const LABEL: Record<string, string> = { adet: "adet", not: "not", tur: "tür", tutar: "tutar", aciklama: "açıklama", kanal: "kanal", dosya: "dosya", eklenen: "eklenen", atlanan: "atlanan", durum: "durum", referans: "referans", gorev: "görev", baslik: "başlık", ad: "ad", ay: "ay", takipci: "takipçi", butce: "bütçe", harcanan: "harcanan", kalem: "kalem", toplam: "toplam", silinen: "silinen", duzeltilen: "düzeltilen", satir: "satır", kritik_stok: "kritik stok" };

export function auditSentence(action: string): string {
  return TEXT[action] ?? action.replace(/[._]/g, " ");
}

export function auditDetails(action: string, entityId: string | null, diff: Record<string, unknown>): string {
  const parts: string[] = [];
  if (action.startsWith("shipment.") && entityId) parts.push(`#${entityId}`);
  for (const [k, v] of Object.entries(diff ?? {})) {
    if (v === null || v === "" || v === undefined || typeof v === "object") continue;
    let val = String(v);
    if (MONEY.has(k) && typeof v === "number") val = formatTry(v);
    if (k === "kanal" && val in CHANNELS) val = CHANNELS[val as keyof typeof CHANNELS];
    if (k === "durum" && val in SHIP_STATUS) val = SHIP_STATUS[val as keyof typeof SHIP_STATUS].label;
    parts.push(`${LABEL[k] ?? k}: ${val}`);
  }
  return parts.join(" · ");
}
