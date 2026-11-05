# FormStep

formstep.tr — M100, M300 ve M900 memory foam tabanlıkların resmî mağazası.
Next.js (App Router) · Supabase · PayTR iFrame · Vercel. SERYN'den tamamen bağımsızdır.

## Komutlar

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm test           # sepet, PayTR imzası ve veritabanı testleri (gömülü Postgres)
npm run build
```

## Önizleme modu

`.env.local` içinde Supabase anahtarları yokken `npm run dev` siteyi **önizleme modunda** açar:
örnek numara ve fiyatlarla sepet, kupon (`ONIZLEME10`), ödeme formu, hesap ve yönetim paneli gezilebilir.
Hiçbir şey kaydedilmez, ödeme alınmaz. Canlı ortamda (production) önizleme asla açılmaz.

## Yapı

| Klasör | İçerik |
|---|---|
| `app/(store)` | Ana sayfa, `/urun/[model]`, `/sepet`, `/odeme`, `/siparis/[belirteç]`, `/hesabim`, `/bilgilendirme/[sayfa]` |
| `app/(auth)` | `/giris` (giriş + kayıt), `/sifremi-unuttum`, `/sifre-sifirla` |
| `app/admin` | Yönetim paneli — tarayıcıda **/secretgate** adresinden açılır (`NEXT_PUBLIC_ADMIN_PATH` ile değişir), /admin 404 verir. Özet, siparişler (+CSV), stok tablosu, ürünler, kuponlar, içerik, ayarlar |
| `app/api/paytr/notify` | PayTR bildirim adresi — sipariş yalnızca burada "ödendi" olur |
| `app/actions` | Sepet, ödeme, hesap ve yönetim sunucu eylemleri |
| `lib/store` | Katalog, ayarlar, sepet hesabı |
| `supabase/migrations` | Şema, RLS, sipariş/ödeme fonksiyonları, başlangıç verisi |

Kurulum ve yayın adımları: `docs/DEPLOYMENT.md`.
