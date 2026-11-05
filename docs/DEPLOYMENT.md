# Yayına alma

Hepsi **FormStep'e özel ve yeni**: Supabase projesi, Vercel projesi, PayTR mağazası. SERYN'e dokunulmaz.

## 1. Supabase
1. supabase.com → New project (`formstep`, bölge: Frankfurt).
2. `supabase/README.md`'deki gibi migration'ları uygula.
3. Authentication → URL Configuration:
   - Site URL: `https://formstep.tr`
   - Redirect URLs: `https://formstep.tr/auth/callback`, `http://localhost:3000/auth/callback`
4. Authentication → Email templates: Türkçe metinler (isteğe bağlı) · SMTP için Resend bağlanabilir.
5. İlk yöneticiyi oluştur (`scripts/create-admin.mjs`).

## 2. Vercel
1. Yeni proje → bu klasörün GitHub deposu. Framework: Next.js.
2. Environment Variables (`.env.example`'daki adlarla):

| Değişken | Nerede | Not |
|---|---|---|
| NEXT_PUBLIC_SITE_URL | Production | `https://formstep.tr` |
| NEXT_PUBLIC_SUPABASE_URL / ANON_KEY | Hepsi | Supabase → Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Hepsi (gizli) | Asla tarayıcıya gitmez |
| PAYTR_MERCHANT_ID / KEY / SALT | Hepsi (gizli) | FormStep'in kendi PayTR mağazası |
| PAYTR_TEST_MODE | Hepsi | Önce `1`, test ödemesi başarılı olunca `0` |
| RESEND_API_KEY, EMAIL_FROM | Production | `FormStep <info@omytic.com>`. Resend'de doğrulanacak alan adı omytic.com. Sipariş bildirimleri de bu adrese gelir. |
| CRON_SECRET | Production | Uzun rastgele değer |
| NEXT_PUBLIC_GA_ID | İsteğe bağlı | Yalnızca çerez onayından sonra yüklenir |
| NEXT_PUBLIC_ADMIN_PATH | İsteğe bağlı | Yönetim panelinin gizli adresi; varsayılan `/secretgate` |

3. Domains → `formstep.tr` ekle, DNS kayıtlarını alan adı sağlayıcısında gir.
4. `vercel.json` günlük bir zamanlanmış görev tanımlar (ödenmemiş siparişleri kapatır, bekleyen e-postaları yollar).

## 3. PayTR
1. OMY şirketi altında **formstep.tr için ayrı bir PayTR mağazası** iste. (Bildirim URL'si mağaza başına tektir;
   SERYN'in mağazası kullanılırsa ödeme bildirimleri seryn.com.tr'ye gider ve FormStep siparişleri asla "ödendi" olmaz.)
2. Mağaza Paneli → Destek & Kurulum → Ayarlar → Bildirim URL: `https://formstep.tr/api/paytr/notify` (HTTPS).
3. `PAYTR_TEST_MODE=1` ile bir test siparişi ver; PayTR panelinde **Başarılı** görünmeli ve sipariş yönetim panelinde "Ödendi" olmalı.
4. Sonra `PAYTR_TEST_MODE=0` yap, yönetim paneli → Ayarlar'dan "PayTR onayladı" kutusunu işaretle.

## 4. Yönetim panelinden doldurulacaklar
- Numaralar (36-37 … 45-48) ve 200 TL fiyat migration ile hazır gelir. **Stok** ekranından adetleri gir, sonra Ürünler → her model → **Yayında**.
- Ayarlar → kargo ücreti + ücretsiz kargo sınırı, satıcı bilgileri (adres, telefon, e-posta, vergi, MERSİS, ETBİS), bildirim e-postası.
- İçerik → pazaryeri bağlantıları, duyuru şeridi, (kanıtıyla) "en çok satan" iddiası.
- Yasal metinleri avukat/muhasebeci ile kontrol et; onaylanan metni İçerik → Yasal metinler'e yapıştırabilirsin.

Özet sayfasındaki **Canlı satış kontrol listesi** 8/8 olmadan canlı ödeme açılmaz.
