-- FormStep — yalnızca FormStep'e ait, bağımsız Supabase projesi için şema.
-- Para her yerde kuruş cinsinden tam sayıdır (TRY).

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ───────────────────────── yardımcılar ─────────────────────────

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────── katalog ─────────────────────────

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('M100', 'M300', 'M900')),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  tagline text not null default '',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  accent_hex text not null default '#2477EA' check (accent_hex ~ '^#[0-9A-Fa-f]{6}$'),
  size_guide text not null default '',
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path text not null,
  alt text not null default '',
  sort_order int not null default 0
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  body text not null default '',
  verified boolean not null default false,
  sort_order int not null default 0
);
create index product_features_product_idx on public.product_features (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size_label text not null,
  sku text not null unique,
  price_kurus int not null check (price_kurus > 0),
  compare_at_kurus int check (compare_at_kurus is null or compare_at_kurus > price_kurus),
  stock int not null default 0 check (stock >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants (product_id, sort_order);
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- ───────────────────────── içerik ve ayarlar ─────────────────────────

create table public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  published boolean not null default true
);

create table public.legal_pages (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  body text not null,
  version int not null default 1,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger legal_pages_touch before update on public.legal_pages
  for each row execute function public.touch_updated_at();

-- ───────────────────────── müşteriler ─────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Ev',
  full_name text not null,
  phone text not null,
  city text not null,
  district text not null,
  line text not null,
  postal_code text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(required_role text default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
      and (required_role is null or a.role = required_role or a.role = 'owner')
  );
$$;

-- ───────────────────────── kuponlar ─────────────────────────

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique check (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  kind text not null check (kind in ('percent', 'fixed')),
  -- percent: 1–90 arası yüzde. fixed: kuruş.
  value int not null check (value > 0),
  min_subtotal_kurus int not null default 0 check (min_subtotal_kurus >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  max_uses_per_email int check (max_uses_per_email is null or max_uses_per_email > 0),
  used_count int not null default 0,
  active boolean not null default true,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint coupons_percent_range check (kind <> 'percent' or value between 1 and 90)
);

-- ───────────────────────── siparişler ─────────────────────────

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  merchant_oid text not null unique check (merchant_oid ~ '^[A-Za-z0-9]{1,64}$'),
  public_token uuid not null unique default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email citext not null,
  phone text not null,
  full_name text not null,
  shipping_address jsonb not null,
  billing jsonb not null,
  subtotal_kurus int not null check (subtotal_kurus >= 0),
  discount_kurus int not null default 0 check (discount_kurus >= 0),
  shipping_kurus int not null default 0 check (shipping_kurus >= 0),
  total_kurus int not null check (total_kurus >= 0),
  coupon_code citext,
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'preparing', 'shipped', 'delivered',
    'cancelled', 'refunded', 'payment_failed', 'expired', 'stock_issue'
  )),
  paid_kurus int,
  failed_reason text,
  tracking_carrier text,
  tracking_number text,
  invoice_no text,
  internal_note text not null default '',
  legal_snapshot jsonb not null,
  marketing_consent boolean not null default false,
  client_ip text,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_math check (total_kurus = subtotal_kurus - discount_kurus + shipping_kurus)
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_email_idx on public.orders (email);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create sequence public.order_number_seq start 1001;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_code text not null,
  product_name text not null,
  size_label text not null,
  sku text not null,
  unit_price_kurus int not null check (unit_price_kurus > 0),
  qty int not null check (qty between 1 and 20)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

create table public.payment_callbacks (
  id bigint generated always as identity primary key,
  merchant_oid text not null,
  status text not null,
  total_amount text not null,
  hash_valid boolean not null,
  outcome text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
create index payment_callbacks_oid_idx on public.payment_callbacks (merchant_oid, received_at desc);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  email citext not null,
  discount_kurus int not null,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  kind text not null,
  recipient citext not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (order_id, kind)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- ───────────────────────── RLS ─────────────────────────
-- Varsayılan: her tablo kilitli. Yazma işleri sunucu tarafında servis anahtarıyla
-- ve aşağıdaki işlemsel fonksiyonlarla yapılır.

alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_features enable row level security;
alter table public.product_variants enable row level security;
alter table public.store_settings enable row level security;
alter table public.faq_items enable row level security;
alter table public.legal_pages enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.admins enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.payment_callbacks enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.email_outbox enable row level security;
alter table public.audit_log enable row level security;

-- Herkese açık katalog: yalnızca yayımlanmış ürünler.
create policy products_public_read on public.products
  for select using (status = 'published' or public.is_admin());
create policy product_images_public_read on public.product_images
  for select using (exists (
    select 1 from public.products p where p.id = product_id and (p.status = 'published' or public.is_admin())
  ));
create policy product_features_public_read on public.product_features
  for select using (verified and exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'
  ) or public.is_admin());
create policy product_variants_public_read on public.product_variants
  for select using (active and exists (
    select 1 from public.products p where p.id = product_id and p.status = 'published'
  ) or public.is_admin());

-- Ayarlar: yalnızca 'public.' önekli anahtarlar herkese açık.
create policy store_settings_public_read on public.store_settings
  for select using (key like 'public.%' or public.is_admin());
create policy faq_public_read on public.faq_items
  for select using (published or public.is_admin());
create policy legal_public_read on public.legal_pages
  for select using (published or public.is_admin());

-- Müşteri: yalnızca kendi kayıtları.
create policy profiles_own_read on public.profiles
  for select using (id = auth.uid());
create policy profiles_own_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy addresses_own_all on public.addresses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy orders_own_read on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy order_items_own_read on public.order_items
  for select using (exists (
    select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  ));
create policy order_events_own_read on public.order_events
  for select using (exists (
    select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  ));

-- Yönetici okumaları (yazmalar sunucu kodunda yönetici kontrolüyle yapılır).
create policy admins_self_read on public.admins for select using (user_id = auth.uid());
create policy coupons_admin_read on public.coupons for select using (public.is_admin());
create policy payment_callbacks_admin_read on public.payment_callbacks for select using (public.is_admin());
create policy coupon_redemptions_admin_read on public.coupon_redemptions for select using (public.is_admin());
create policy email_outbox_admin_read on public.email_outbox for select using (public.is_admin());
create policy audit_log_admin_read on public.audit_log for select using (public.is_admin('owner'));

-- Müşterinin kendi profilinde değiştiremeyeceği alanlar.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, marketing_consent, marketing_consent_at, deletion_requested_at)
  on public.profiles to authenticated;
