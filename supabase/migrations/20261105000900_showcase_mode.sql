-- formstep.tr tanıtım sitesi oldu: satış Amazon, Trendyol ve Hepsiburada'da.
-- Modeller yayına alınır, konumlandırma metinleri güncellenir, kargo SSS'si kaldırılır.

update public.products set status = 'published' where status = 'draft';

update public.products set
  tagline = 'Günlük konfor',
  description = 'M100, FormStep''in gündelik kullanım modeli. Hafif memory foam yapısıyla ayağının şeklini alır; işte, okulda, şehirde gün boyu yumuşak bir zemin sunar.'
where code = 'M100';

update public.products set
  tagline = 'İçe ve dışa basmaya özel',
  description = 'M300, içe ya da dışa basanlar için tasarlandı. Kavisli ark desteği ve derin topuk yuvası ayağını ortada tutar, adımını daha dengeli hâle getirmeye yardımcı olur.'
where code = 'M300';

update public.products set
  tagline = 'Topuk desteği',
  description = 'M900, topuk dikeni olanlar ve topuğunda hassasiyet yaşayanlar için en iyi seçimimiz. Ekstra topuk dolgusu ve FormStep''in en kalın memory foam yapısıyla topuğa binen yükü yumuşatır.'
where code = 'M900';

-- Renk içeren görsel açıklamaları ve özellikler
update public.product_images set alt = replace(replace(replace(replace(alt, ' gri tabanlık', ' tabanlık'), ' siyah tabanlık', ' tabanlık'), ', mavi taban görünüyor', ''), ' siyah yüzeyli', ' yüzeyli');
delete from public.product_features where label ~* '(mavi|gri|siyah|renk)';

-- SSS: kargo sorusu yerine satın alma ve model seçimi
update public.faq_items set published = false where question ilike 'Kargo%';
update public.faq_items
  set answer = 'Evet. İade ve cayma hakkı, ürünü satın aldığın pazaryerinin (Amazon, Trendyol ya da Hepsiburada) iade süreci üzerinden kullanılır. Teslimden itibaren 14 günlük cayma hakkın saklıdır.'
  where question = 'İade edebilir miyim?';
update public.faq_items
  set answer = 'Hayır, FormStep tıbbi cihaz değil, bir konfor tabanlığıdır. Topuk dikeni gibi bir rahatsızlığın varsa tabanlığı bir uzmana danışarak kullanmanı öneririz.'
  where question = 'Tıbbi bir ürün mü?';
update public.faq_items set sort_order = 7 where question = 'Tıbbi bir ürün mü?';
update public.faq_items set sort_order = 6 where question = 'İade edebilir miyim?';

insert into public.faq_items (question, answer, sort_order)
select q, a, n from (values
  ('Hangi model bana uygun?', 'Günlük kullanım için M100, içe ya da dışa basıyorsan M300, topuk dikeni ya da topukta hassasiyet yaşıyorsan M900. Model seçici bölümü de sana yardımcı olur.', 4),
  ('Nereden satın alabilirim?', 'FormStep''i Amazon, Trendyol ve Hepsiburada''daki resmî mağazalarımızdan satın alabilirsin. Tüm modeller tanesi 200 TL.', 5)
) as t(q, a, n)
where not exists (select 1 from public.faq_items f where f.question = t.q);

-- Model seçici eşleşmesi aynı kalır (gunluk → M100, ayakta → M300, tempo → M900);
-- etiketler arayüzde "Günlük kullanım", "İçe / dışa basıyorum", "Topuğum hassas" olarak gösterilir.
