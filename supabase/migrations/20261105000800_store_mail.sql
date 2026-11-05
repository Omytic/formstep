-- Sipariş bildirimleri info@omytic.com adresine gelir.
update public.store_settings
   set value = value || jsonb_build_object('admin_email', 'info@omytic.com'),
       updated_at = now()
 where key = 'private.notify';
