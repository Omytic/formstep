-- Satıcı iletişim bilgisi ve FormStep sosyal hesapları.
update public.store_settings
   set value = value || jsonb_build_object(
     'address', 'Ataköy 7-8-9-10. Kısım Mah. Çobançeşme E-5 Yan Yol Cad. Ataköy Towers A Blok No: 20/1, Bakırköy/İSTANBUL',
     'phone', '+90 553 588 69 36',
     'email', 'info@omytic.com'
   ), updated_at = now()
 where key = 'public.seller';

update public.store_settings
   set value = value || jsonb_build_object(
     'instagram', 'https://www.instagram.com/formsteptr',
     'x', 'https://x.com/formsteptr'
   ), updated_at = now()
 where key = 'public.marketplaces';
