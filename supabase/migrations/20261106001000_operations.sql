-- FormStep operasyon paneli: ekip, stok konumları ve hareketleri, sevkiyatlar, pazaryeri satışları,
-- aldı-verdi muhasebe, birim maliyet, reklam, sosyal medya, görevler.
-- Tüm tablolar kilitli (RLS); yazma işleri sunucuda servis anahtarıyla yapılır, yöneticiler okuyabilir.

-- ───────── ekip ─────────
alter table public.admins add column if not exists display_name text not null default '';

-- ───────── stok konumları ─────────
create table public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,30}$'),
  name text not null,
  kind text not null check (kind in ('depo', 'amazon', 'trendyol', 'hepsiburada', 'diger')),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
insert into public.stock_locations (code, name, kind, sort, active) values
  ('depo', 'Ana depo', 'depo', 1, true),
  ('amazon-fba', 'Amazon deposu (FBA)', 'amazon', 2, true),
  ('trendyol', 'Trendyol deposu', 'trendyol', 3, false),
  ('hepsiburada', 'Hepsiburada deposu', 'hepsiburada', 4, false);

-- ───────── satış kanalları ─────────
create table public.sales_channels (
  code text primary key check (code in ('amazon', 'trendyol', 'hepsiburada', 'diger')),
  name text not null,
  -- Bu kanaldan yapılan satış hangi konumdaki stoktan düşer
  stock_location_id uuid references public.stock_locations (id) on delete set null,
  -- Excel içe aktarmada hatırlanan sütun eşlemesi
  import_mapping jsonb not null default '{}'::jsonb,
  sort int not null default 0
);
insert into public.sales_channels (code, name, stock_location_id, sort)
select c.code, c.name, l.id, c.sort
from (values ('amazon', 'Amazon', 'amazon-fba', 1), ('trendyol', 'Trendyol', 'depo', 2), ('hepsiburada', 'Hepsiburada', 'depo', 3), ('diger', 'Diğer / elden', 'depo', 4)) as c(code, name, loc, sort)
join public.stock_locations l on l.code = c.loc;

-- ───────── stok hareketleri ─────────
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  from_location uuid references public.stock_locations (id) on delete restrict,
  to_location uuid references public.stock_locations (id) on delete restrict,
  qty int not null check (qty > 0),
  kind text not null check (kind in ('giris', 'transfer', 'iade', 'fire', 'sayim', 'duzeltme')),
  occurred_on date not null default current_date,
  note text not null default '',
  -- Sevkiyat gibi başka bir kayıttan otomatik üretilen hareketler
  ref_type text,
  ref_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_location is not null or to_location is not null),
  check (from_location is distinct from to_location)
);
create index stock_movements_variant_idx on public.stock_movements (variant_id);
create index stock_movements_ref_idx on public.stock_movements (ref_type, ref_id);
create index stock_movements_date_idx on public.stock_movements (occurred_on desc, created_at desc);

-- ───────── sevkiyatlar (Amazon FBA ve diğer pazaryerleri) ─────────
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  number int generated always as identity,
  channel text references public.sales_channels (code),
  from_location uuid not null references public.stock_locations (id),
  to_location uuid not null references public.stock_locations (id),
  reference text not null default '',
  status text not null default 'hazirlaniyor' check (status in ('hazirlaniyor', 'yolda', 'teslim', 'eksik', 'iptal')),
  shipped_on date,
  received_on date,
  carrier text not null default '',
  tracking text not null default '',
  box_count int check (box_count is null or box_count >= 0),
  cost_kurus int not null default 0 check (cost_kurus >= 0),
  note text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_location <> to_location)
);
create trigger shipments_touch before update on public.shipments for each row execute function public.touch_updated_at();

create table public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  qty_sent int not null check (qty_sent > 0),
  qty_received int check (qty_received is null or qty_received >= 0),
  unique (shipment_id, variant_id)
);

/**
 * Sevkiyatın stok hareketlerini durumuna göre yeniden üretir (tekrar çağrılabilir):
 *  hazırlanıyor / iptal → hareket yok
 *  yolda / teslim / eksik → gönderilen adet çıkış konumundan varış konumuna geçer
 *  teslim / eksik → teslim alınan adet farklıysa fark varış konumunda fire ya da düzeltme olur
 */
create or replace function public.sync_shipment_movements(p_shipment uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s public.shipments;
begin
  select * into s from public.shipments where id = p_shipment;
  delete from public.stock_movements where ref_type = 'shipment' and ref_id = p_shipment;
  if s.id is null or s.status in ('hazirlaniyor', 'iptal') then return; end if;

  insert into public.stock_movements (variant_id, from_location, to_location, qty, kind, occurred_on, note, ref_type, ref_id, created_by)
  select i.variant_id, s.from_location, s.to_location, i.qty_sent, 'transfer', coalesce(s.shipped_on, current_date),
         'Sevkiyat #' || s.number, 'shipment', s.id, s.created_by
  from public.shipment_items i where i.shipment_id = s.id;

  if s.status in ('teslim', 'eksik') then
    insert into public.stock_movements (variant_id, from_location, to_location, qty, kind, occurred_on, note, ref_type, ref_id, created_by)
    select i.variant_id,
           case when i.qty_received < i.qty_sent then s.to_location end,
           case when i.qty_received > i.qty_sent then s.to_location end,
           abs(i.qty_sent - i.qty_received),
           case when i.qty_received < i.qty_sent then 'fire' else 'duzeltme' end,
           coalesce(s.received_on, s.shipped_on, current_date),
           'Sevkiyat #' || s.number || ' teslim farkı', 'shipment', s.id, s.created_by
    from public.shipment_items i
    where i.shipment_id = s.id and i.qty_received is not null and i.qty_received <> i.qty_sent;
  end if;
end $$;

-- ───────── pazaryeri satışları ─────────
create table public.sale_imports (
  id uuid primary key default gen_random_uuid(),
  channel text not null references public.sales_channels (code),
  file_name text not null default '',
  row_count int not null default 0,
  inserted int not null default 0,
  skipped int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  channel text not null references public.sales_channels (code),
  order_no text not null,
  -- Aynı siparişteki farklı ürün satırlarını ayırır (genellikle SKU)
  line_key text not null default '',
  type text not null default 'satis' check (type in ('satis', 'iade')),
  sold_on date not null,
  variant_id uuid references public.product_variants (id) on delete set null,
  external_sku text not null default '',
  product_title text not null default '',
  qty int not null check (qty > 0),
  gross_kurus int not null default 0,
  commission_kurus int not null default 0,
  shipping_kurus int not null default 0,
  other_fee_kurus int not null default 0,
  net_kurus int generated always as (gross_kurus - commission_kurus - shipping_kurus - other_fee_kurus) stored,
  import_id uuid references public.sale_imports (id) on delete set null,
  note text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (channel, order_no, line_key, type)
);
create index sales_date_idx on public.sales (sold_on desc);
create index sales_variant_idx on public.sales (variant_id);
create index sales_unmatched_idx on public.sales (channel, external_sku) where variant_id is null;

-- Pazaryerindeki SKU / barkod → bizim model-numara eşlemesi
create table public.sku_aliases (
  channel text not null references public.sales_channels (code),
  external_sku text not null,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  primary key (channel, external_sku)
);

-- ───────── anlık stok ─────────
-- Hareketler + kanal satışları (satış kanalın stok konumundan düşer, iade geri ekler)
create or replace view public.stock_levels with (security_invoker = true) as
with m as (
  select variant_id, to_location as location_id, qty from public.stock_movements where to_location is not null
  union all
  select variant_id, from_location, -qty from public.stock_movements where from_location is not null
  union all
  select s.variant_id, c.stock_location_id, case when s.type = 'satis' then -s.qty else s.qty end
  from public.sales s join public.sales_channels c on c.code = s.channel
  where s.variant_id is not null and c.stock_location_id is not null
)
select variant_id, location_id, sum(qty)::int as qty from m group by variant_id, location_id;

-- ───────── aldı-verdi muhasebe ─────────
create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('gelir', 'gider')),
  -- false: kâr hesabında ayrıca sayılan kalemler (ürün maliyeti, komisyon, reklam) iki kez düşülmesin
  in_pnl boolean not null default true,
  sort int not null default 0,
  active boolean not null default true,
  unique (kind, name)
);
insert into public.finance_categories (name, kind, in_pnl, sort) values
  ('Pazaryeri hakedişi', 'gelir', false, 1),
  ('Diğer gelir', 'gelir', true, 2),
  ('Ürün alımı / üretim', 'gider', false, 1),
  ('Ambalaj', 'gider', true, 2),
  ('Kargo ve lojistik', 'gider', true, 3),
  ('Pazaryeri komisyonu', 'gider', false, 4),
  ('Reklam', 'gider', false, 5),
  ('Vergi ve harç', 'gider', true, 6),
  ('Muhasebe ve hukuk', 'gider', true, 7),
  ('Yazılım ve abonelik', 'gider', true, 8),
  ('Fotoğraf ve tasarım', 'gider', true, 9),
  ('Diğer gider', 'gider', true, 10);

create table public.counterparties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('tedarikci', 'pazaryeri', 'ortak', 'hizmet', 'diger')),
  phone text not null default '',
  email text not null default '',
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (kind, name)
);
insert into public.counterparties (name, kind) values
  ('Yunus', 'ortak'), ('Yusuf', 'ortak'), ('Ömer', 'ortak'),
  ('Amazon', 'pazaryeri'), ('Trendyol', 'pazaryeri'), ('Hepsiburada', 'pazaryeri');

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  -- gelir/gider: işletmenin; ortak_giris: ortağın koyduğu para; ortak_cikis: ortağın çektiği para
  kind text not null check (kind in ('gelir', 'gider', 'ortak_giris', 'ortak_cikis')),
  category_id uuid references public.finance_categories (id) on delete set null,
  counterparty_id uuid references public.counterparties (id) on delete set null,
  amount_kurus int not null check (amount_kurus > 0),
  occurred_on date not null default current_date,
  status text not null default 'odendi' check (status in ('odendi', 'bekliyor')),
  due_on date,
  method text not null default 'banka' check (method in ('banka', 'nakit', 'kart', 'pazaryeri', 'diger')),
  description text not null default '',
  file_path text,
  ref_type text,
  ref_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ledger_entries_touch before update on public.ledger_entries for each row execute function public.touch_updated_at();
create index ledger_date_idx on public.ledger_entries (occurred_on desc);
create index ledger_due_idx on public.ledger_entries (due_on) where status = 'bekliyor';
create unique index ledger_ref_idx on public.ledger_entries (ref_type, ref_id) where ref_type is not null;

-- Fatura / dekont dosyaları (gizli)
insert into storage.buckets (id, name, public) values ('finance-docs', 'finance-docs', false) on conflict (id) do nothing;

-- ───────── birim maliyet ─────────
create table public.unit_costs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  amount_kurus int not null check (amount_kurus >= 0),
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- ───────── reklam ─────────
create table public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('amazon', 'trendyol', 'hepsiburada', 'meta', 'google', 'tiktok', 'diger')),
  month date not null check (extract(day from month) = 1),
  budget_kurus int not null default 0 check (budget_kurus >= 0),
  spent_kurus int not null default 0 check (spent_kurus >= 0),
  -- Reklam panelinin bildirdiği reklamdan gelen satış (varsa)
  ad_sales_kurus int check (ad_sales_kurus is null or ad_sales_kurus >= 0),
  note text not null default '',
  updated_at timestamptz not null default now(),
  unique (platform, month)
);
create trigger ad_spend_touch before update on public.ad_spend for each row execute function public.touch_updated_at();

-- ───────── sosyal medya ─────────
create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'x', 'tiktok', 'youtube', 'facebook', 'diger')),
  handle text not null,
  url text not null default '',
  sort int not null default 0,
  unique (platform, handle)
);
insert into public.social_accounts (platform, handle, url, sort) values
  ('instagram', 'formsteptr', 'https://www.instagram.com/formsteptr', 1),
  ('x', 'formsteptr', 'https://x.com/formsteptr', 2);

create table public.social_stats (
  account_id uuid not null references public.social_accounts (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  followers int not null check (followers >= 0),
  posts int check (posts is null or posts >= 0),
  primary key (account_id, month)
);

create table public.content_plan (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'x', 'tiktok', 'youtube', 'facebook', 'diger')),
  planned_on date not null,
  title text not null,
  caption text not null default '',
  status text not null default 'fikir' check (status in ('fikir', 'hazirlaniyor', 'planlandi', 'paylasildi')),
  assignee uuid references auth.users (id) on delete set null,
  link text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index content_plan_date_idx on public.content_plan (planned_on);

-- ───────── görevler ─────────
create table public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text not null default '',
  assignee uuid references auth.users (id) on delete set null,
  due_on date,
  done boolean not null default false,
  done_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ───────── ayarlar ─────────
insert into public.store_settings (key, value) values ('private.ops', '{"low_stock": 10}'::jsonb) on conflict (key) do nothing;

-- ───────── RLS: hepsi kilitli, yöneticiler okur ─────────
do $$
declare t text;
begin
  foreach t in array array['stock_locations', 'sales_channels', 'stock_movements', 'shipments', 'shipment_items', 'sale_imports', 'sales',
    'sku_aliases', 'finance_categories', 'counterparties', 'ledger_entries', 'unit_costs', 'ad_spend', 'social_accounts', 'social_stats',
    'content_plan', 'team_tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.is_admin())', t || '_admin_read', t);
  end loop;
end $$;

-- Yöneticiler birbirinin adını görebilsin (işlem geçmişi ve görev ataması için)
create policy admins_team_read on public.admins for select using (public.is_admin());
