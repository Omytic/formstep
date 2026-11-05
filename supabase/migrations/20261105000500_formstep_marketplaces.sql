-- Gerçek pazaryeri mağazaları ve "en çok satan" iddiası (yönetim panelinden kapatılabilir/değiştirilebilir).
update public.store_settings
   set value = jsonb_build_object(
     'amazon', 'https://www.amazon.com.tr/s?me=A1D8844Z4S0BOA&marketplaceID=A33AVAJ2PDY3EV',
     'trendyol', 'https://www.trendyol.com/sr?mid=1288801&os=1',
     'hepsiburada', 'https://www.hepsiburada.com/magaza/omy',
     'instagram', coalesce(value ->> 'instagram', '')
   ), updated_at = now()
 where key = 'public.marketplaces';

update public.store_settings
   set value = jsonb_build_array(jsonb_build_object(
     'text', 'Amazon Türkiye''nin en çok satan tabanlığı',
     'evidence_url', 'https://www.amazon.com.tr/dp/B0CB71PGHV',
     'date', 'Amazon Türkiye',
     'active', true
   )), updated_at = now()
 where key = 'public.claims' and value = '[]'::jsonb;
