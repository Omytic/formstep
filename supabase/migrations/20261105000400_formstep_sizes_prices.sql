-- Gerçek numaralar ve fiyat: her model 10 numara, tanesi 200,00 TL (KDV dahil).
-- Stok 0 başlar; yönetim panelindeki "Stok" ekranından girilir. Ürünler stok girilip
-- "Yayında" yapılana kadar sitede satılmaz.
insert into public.product_variants (product_id, size_label, sku, price_kurus, stock, active, sort_order)
select p.id, s.size, p.code || '-' || replace(s.size, '-', ''), 20000, 0, true, s.ord
from public.products p
cross join (values
  ('36-37', 1), ('37-38', 2), ('38-39', 3), ('39-40', 4), ('40-41', 5),
  ('41-42', 6), ('42-43', 7), ('43-44', 8), ('44-45', 9), ('45-48', 10)
) as s(size, ord)
on conflict (sku) do nothing;
