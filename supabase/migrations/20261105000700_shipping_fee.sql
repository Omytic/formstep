-- Kargo ücreti 69,90 TL. 1.000 TL ve üzeri siparişlerde ücretsiz.
update public.store_settings
   set value = value || jsonb_build_object(
     'fee_kurus', 6990,
     'free_threshold_kurus', 100000
   ), updated_at = now()
 where key = 'public.shipping';
