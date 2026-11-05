-- Ürün görselleri için herkese açık okunur, yalnızca sunucunun yazdığı depo.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Üç ürün TASLAK olarak gelir: fiyat, numara ve stok yönetim panelinden girilir.
insert into public.products (code, slug, name, tagline, description, status, accent_hex, sort_order) values
  ('M100', 'm100', 'M100', 'Günlük konfor',
   'Gri dokulu yüzeyi ve memory foam gövdesiyle ayağının şeklini alır. İşte, okulda, şehirde gün boyu yumuşak bir zemin.',
   'draft', '#2477EA', 1),
  ('M300', 'm300', 'M300', 'Destek ve denge',
   'Kavisli formu ve belirgin topuk yuvasıyla ayağını yerinde tutmak için tasarlandı. Uzun saatler ayakta kalanların modeli.',
   'draft', '#0873E5', 2),
  ('M900', 'm900', 'M900', 'Premium konfor',
   'Delikli, dokulu siyah yüzeyi ve kalın gök mavisi tabanıyla FormStep''in en yumuşak modeli.',
   'draft', '#4EA1E1', 3)
on conflict (code) do nothing;

insert into public.product_images (product_id, path, alt, sort_order)
select p.id, x.path, x.alt, x.sort_order
from public.products p
join (values
  ('M100', '/assets/products/m100-2.png', 'FormStep M100 gri tabanlık, üstten görünüm', 0),
  ('M100', '/assets/products/m100.png', 'FormStep M100 gri tabanlık, yandan görünüm', 1),
  ('M300', '/assets/products/m300.png', 'FormStep M300 siyah tabanlık, mavi taban ve topuk yuvası', 0),
  ('M900', '/assets/products/m900-2.png', 'FormStep M900 delikli siyah yüzeyli tabanlık', 0),
  ('M900', '/assets/products/m900.png', 'FormStep M900 esnetilmiş, mavi taban görünüyor', 1)
) as x(code, path, alt, sort_order) on x.code = p.code
where not exists (select 1 from public.product_images i where i.product_id = p.id);

insert into public.store_settings (key, value) values
  ('public.shipping', '{"fee_kurus": null, "free_threshold_kurus": null, "carrier": "", "lead_time_text": ""}'::jsonb),
  ('public.seller', '{"address": "", "phone": "", "email": "", "tax_office": "", "tax_number": "", "mersis": "", "etbis": ""}'::jsonb),
  ('public.marketplaces', '{"amazon": "", "trendyol": "", "hepsiburada": "", "instagram": ""}'::jsonb),
  ('public.claims', '[]'::jsonb),
  ('public.finder', '{"gunluk": "m100", "ayakta": "m300", "tempo": "m900"}'::jsonb),
  ('public.announcement', '{"text": "", "active": false}'::jsonb),
  ('private.notify', '{"admin_email": "", "low_stock": 5}'::jsonb),
  ('private.launch', '{"paytr_approved": false, "legal_reviewed": false, "email_dns_verified": false}'::jsonb)
on conflict (key) do nothing;

insert into public.faq_items (question, answer, sort_order)
select q, a, n from (values
  ('Memory foam ne demek?', 'Vücut ısısı ve basınçla yumuşayıp ayağının şeklini alan, ardından yavaşça eski hâline dönen bir köpük türü.', 1),
  ('Hangi ayakkabılarla kullanabilirim?', 'Çıkarılabilir tabanlığı olan ayakkabılarda, eski tabanlığı çıkarıp yerine FormStep''i yerleştirerek kullanabilirsin.', 2),
  ('Numaramı nasıl seçerim?', 'Ayakkabı numarana göre seçersin. Her modelin numara seçenekleri ürün sayfasında yer alır.', 3),
  ('Kargo ve teslimat nasıl işliyor?', 'Kargo ücreti, ücretsiz kargo sınırı ve teslimat süresi ödeme adımında açıkça gösterilir.', 4),
  ('İade edebilir miyim?', 'Mesafeli satış mevzuatı kapsamındaki cayma hakkın saklıdır. Ayrıntılar İade ve cayma sayfasında.', 5),
  ('Tıbbi bir ürün mü?', 'Hayır, FormStep bir konfor tabanlığıdır. Ayağınla ilgili bir rahatsızlığın varsa bir uzmana danışmanı öneririz.', 6)
) as t(q, a, n)
where not exists (select 1 from public.faq_items);
