# Yayına alma (formstep.tr)

formstep.tr şu an **tanıtım sitesi**: satışlar Amazon, Trendyol ve Hepsiburada'da. Sepet, ödeme (PayTR), kargo ve
müşteri üyeliği kapalı; kodları duruyor ve `lib/features.ts` içindeki iki bayrakla açılabilir. Yalnızca yönetim paneli açık.

## 1. Supabase
1. Yeni migration'ları uygula (proje zaten bağlı): `npx supabase db push`
   - `…0900_showcase_mode.sql`: modelleri yayına alır, M100/M300/M900 açıklamalarını günceller, kargo SSS'sini kaldırır.
2. Authentication → URL Configuration → Site URL: `https://formstep.tr`
3. Yönetici hesabı. Giriş ekranında kullanıcı adı **admin** yazılır; arka planda `admin@formstep.tr` hesabına girer.
   Hesap henüz yoksa Cursor terminalinde bir kez çalıştır (şifreyi kendin yaz, hiçbir dosyaya kaydetme):

   ```bash
   node --env-file=.env.local scripts/create-admin.mjs admin@formstep.tr 'ŞİFREN' owner
   ```

   Hesap zaten varsa ve şifreyi değiştirmek istersen: Supabase → Authentication → Users → admin@formstep.tr → Reset password.

## 2. Vercel
1. Yeni proje → bu klasörün GitHub deposu. Framework: Next.js.
2. Environment Variables:

| Değişken | Not |
|---|---|
| NEXT_PUBLIC_SITE_URL | `https://formstep.tr` |
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase → Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Gizli; asla tarayıcıya gitmez |
| NEXT_PUBLIC_ADMIN_PATH | `/secretgate` (varsayılan) |
| NEXT_PUBLIC_GA_ID | İsteğe bağlı; yalnızca çerez onayından sonra yüklenir |

   PayTR, Resend ve CRON değişkenleri satış kapalıyken gerekmez.

## 3. Alan adı: formstep.tr
1. Vercel → proje → Settings → Domains → `formstep.tr` ve `www.formstep.tr` ekle. `formstep.tr`'yi ana (primary) yap.
2. Alan adını aldığın firmanın DNS panelinde:

| Tür | Ad (host) | Değer |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

   Eski A / AAAA / CNAME kayıtları varsa (park sayfası vb.) sil. Vercel bazen projeye özel bir değer gösterir; ekranda ne yazıyorsa onu kullan.
3. Yayılması birkaç dakika ile birkaç saat sürer. Vercel SSL sertifikasını kendisi kurar. Birincil alan adı Vercel'de hangisiyse diğeri ona gider. Uygulama içinde ayrıca `www` yönlendirmesi yok; iki taraf da birbirine yönlendirirse tarayıcı döngüye girer.

## 4. Adresler
- Site: `https://formstep.tr`
- Yönetim girişi: `https://formstep.tr/secretgate/giris` (panel: `/secretgate`). `/admin`, `/giris`, `/sepet`, `/odeme`, `/hesabim` 404 döner.

## 5. Yönetim panelinden
- **Stok**: numara numara adet.
- **Ürünler**: açıklama, özellik, görsel, fiyat. Onaylı özellik girersen ürün sayfasındaki varsayılan kartların yerini alır.
- **İçerik**: pazaryeri bağlantıları, Instagram/X, duyuru şeridi, SSS, model seçici, yasal metinler (istersen avukat onaylı metni buraya yapıştır).
- **Ayarlar**: satıcı ve iletişim bilgileri (yasal metinlerde görünür).

## İleride sitede satış açmak
Vercel'de `NEXT_PUBLIC_SALES_ENABLED=1` (sepet, ödeme, sipariş) ve gerekiyorsa `NEXT_PUBLIC_ACCOUNTS_ENABLED=1` (müşteri üyeliği).
Ardından FormStep'e ait ayrı bir PayTR mağazası, bildirim URL'si `https://formstep.tr/api/paytr/notify`, `PAYTR_*`, `RESEND_API_KEY`,
`EMAIL_FROM`, `CRON_SECRET` değişkenleri ve `vercel.json`'a günlük `/api/cron/expire` görevi gerekir. Yasal metinler satış moduna kendiliğinden geçer.
