# FormStep — durum

| Parça | Durum |
|---|---|
| Ana sayfa (katmanlı hero, modeller, basınç, seçici, kullanım, satın alma, güven, SSS) | Tamam |
| Ürün sayfaları (galeri, numara, sepete ekle, mobil satın alma çubuğu, JSON-LD) | Tamam |
| Sepet (çekmece + sayfa, kupon, ücretsiz kargo çubuğu, sunucuda fiyat) | Tamam |
| Ödeme (misafir/üye, adres, bireysel/kurumsal fatura, sözleşme onayı, PayTR iFrame) | Tamam — PayTR mağazası bekleniyor |
| PayTR bildirimi (imza, tekrar koruması, tutar kontrolü, stok yarışı) | Tamam, testli |
| Sipariş takip sayfası, e-posta kuyruğu (Resend) | Tamam — Resend anahtarı bekleniyor |
| Üyelik (kayıt, giriş, şifre sıfırlama), Hesabım (siparişler, adresler, ayarlar) | Tamam — kayıtta ad soyad ve e-posta zorunlu, üyesiz alışveriş bağlantısı var |
| Yönetim — gizli adres /secretgate (özet, stok tablosu, siparişler, CSV, ürün/stok/görsel, kupon, içerik, yasal metin, ayarlar, kontrol listesi) | Tamam |
| Supabase şeması, RLS, işlemsel fonksiyonlar | Tamam — formstep projesi (Frankfurt) kuruldu, 7 migration uygulandı |
| Yönetici hesabı | Tamam — sahip yetkisi, giriş adı admin |
| Satıcı iletişim (ünvan, adres, telefon, e-posta) ve @formsteptr Instagram / X | Tamam — vergi dairesi ve MERSİS sitede gösterilmiyor |
| E-posta adresi | info@omytic.com — giden posta ve sipariş bildirimleri |
| Hakkımızda metni | Tamam |
| Kargo ücreti 69,90 TL, 1.000 TL ve üzeri ücretsiz | Tamam — kargo firması ve teslimat süresi henüz yok |

Testler: `npm test` → 29/29. `npm run lint`, `npm run typecheck`, `npm run build` temiz.
