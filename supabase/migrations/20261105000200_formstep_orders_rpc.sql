-- Sipariş ve ödeme işlemleri. Hepsi tek bir veritabanı işlemi içinde çalışır
-- ve yalnızca sunucu (service_role) tarafından çağrılabilir.

-- Kupon indirimi (kuruş). Kupon geçersizse hata fırlatır.
create or replace function public.coupon_discount(
  p_code text, p_email text, p_subtotal int
) returns table (coupon_id uuid, discount int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  c public.coupons%rowtype;
  used_by_email int;
begin
  select * into c from public.coupons where code = p_code::citext;
  if not found or not c.active then
    raise exception 'coupon_invalid' using errcode = 'P0001';
  end if;
  if c.starts_at is not null and c.starts_at > now() then
    raise exception 'coupon_not_started' using errcode = 'P0001';
  end if;
  if c.ends_at is not null and c.ends_at < now() then
    raise exception 'coupon_expired' using errcode = 'P0001';
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    raise exception 'coupon_used_up' using errcode = 'P0001';
  end if;
  if p_subtotal < c.min_subtotal_kurus then
    raise exception 'coupon_minimum' using errcode = 'P0001';
  end if;
  if c.max_uses_per_email is not null and p_email is not null then
    select count(*) into used_by_email from public.coupon_redemptions r
      where r.coupon_id = c.id and r.email = p_email::citext;
    if used_by_email >= c.max_uses_per_email then
      raise exception 'coupon_email_limit' using errcode = 'P0001';
    end if;
  end if;
  coupon_id := c.id;
  if c.kind = 'percent' then
    discount := (p_subtotal * c.value + 50) / 100;
  else
    discount := c.value;
  end if;
  discount := least(discount, p_subtotal);
  return next;
end $$;

-- Ödeme beklenen sipariş oluşturur. Fiyat, stok, kupon ve kargo veritabanındaki
-- güncel değerlerden hesaplanır; tarayıcıdan gelen tutara asla güvenilmez.
create or replace function public.create_pending_order(
  p_items jsonb,            -- [{"variant_id": "...", "qty": 1}]
  p_coupon text,
  p_contact jsonb,          -- {"email","phone","full_name"}
  p_shipping_address jsonb, -- {"city","district","line","postal_code"}
  p_billing jsonb,          -- {"type":"individual"|"corporate", ...}
  p_legal jsonb,
  p_marketing boolean,
  p_user_id uuid,
  p_merchant_oid text,
  p_client_ip text
) returns table (order_id uuid, public_token uuid, total int, number text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  it jsonb;
  v record;
  v_subtotal int := 0;
  v_discount int := 0;
  v_shipping int := 0;
  v_coupon_id uuid;
  v_order_id uuid;
  v_token uuid;
  v_number text;
  v_ship jsonb;
  v_fee int;
  v_free int;
  v_email text := lower(trim(p_contact ->> 'email'));
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'cart_empty' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 10 then
    raise exception 'cart_too_large' using errcode = 'P0001';
  end if;

  create temp table _lines (
    variant_id uuid, qty int, code text, name text, size_label text, sku text, price int
  ) on commit drop;

  for it in select * from jsonb_array_elements(p_items) loop
    select pv.id, pv.size_label, pv.sku, pv.price_kurus, pv.stock, p.code, p.name
      into v
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where pv.id = (it ->> 'variant_id')::uuid
       and pv.active and p.status = 'published';
    if not found then
      raise exception 'variant_unavailable' using errcode = 'P0001';
    end if;
    if (it ->> 'qty')::int not between 1 and 20 then
      raise exception 'qty_invalid' using errcode = 'P0001';
    end if;
    if v.stock < (it ->> 'qty')::int then
      raise exception 'out_of_stock' using errcode = 'P0001';
    end if;
    insert into _lines values (v.id, (it ->> 'qty')::int, v.code, v.name, v.size_label, v.sku, v.price_kurus);
    v_subtotal := v_subtotal + v.price_kurus * (it ->> 'qty')::int;
  end loop;

  if p_coupon is not null and length(trim(p_coupon)) > 0 then
    select cd.coupon_id, cd.discount into v_coupon_id, v_discount
      from public.coupon_discount(trim(p_coupon), v_email, v_subtotal) cd;
  end if;

  select value into v_ship from public.store_settings where key = 'public.shipping';
  if v_ship is null or (v_ship ->> 'fee_kurus') is null then
    raise exception 'shipping_not_configured' using errcode = 'P0001';
  end if;
  v_fee := coalesce((v_ship ->> 'fee_kurus')::int, 0);
  v_free := (v_ship ->> 'free_threshold_kurus')::int;
  v_shipping := case when v_free is not null and (v_subtotal - v_discount) >= v_free then 0 else v_fee end;

  v_number := 'FS' || nextval('public.order_number_seq')::text;

  insert into public.orders (
    number, merchant_oid, user_id, email, phone, full_name, shipping_address, billing,
    subtotal_kurus, discount_kurus, shipping_kurus, total_kurus, coupon_code,
    legal_snapshot, marketing_consent, client_ip
  ) values (
    v_number, p_merchant_oid, p_user_id, v_email, p_contact ->> 'phone', p_contact ->> 'full_name',
    p_shipping_address, p_billing,
    v_subtotal, v_discount, v_shipping, v_subtotal - v_discount + v_shipping,
    case when v_coupon_id is null then null else trim(p_coupon) end,
    p_legal, coalesce(p_marketing, false), p_client_ip
  ) returning id, orders.public_token into v_order_id, v_token;

  insert into public.order_items (order_id, variant_id, product_code, product_name, size_label, sku, unit_price_kurus, qty)
    select v_order_id, variant_id, code, name, size_label, sku, price, qty from _lines;

  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (v_order_id, null, 'pending_payment', 'customer', 'Sipariş oluşturuldu');

  order_id := v_order_id;
  public_token := v_token;
  total := v_subtotal - v_discount + v_shipping;
  number := v_number;
  return next;
end $$;

-- Doğrulanmış PayTR "success" bildirimi. Tekrarlanan bildirimler etkisizdir.
-- Dönüş: 'paid' | 'already_final' | 'unknown_order' | 'amount_mismatch' | 'stock_issue'
create or replace function public.finalize_paid_order(p_merchant_oid text, p_total_kurus int)
returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  li record;
  v_short boolean := false;
  v_coupon public.coupons%rowtype;
begin
  select * into o from public.orders where merchant_oid = p_merchant_oid for update;
  if not found then return 'unknown_order'; end if;
  if o.status not in ('pending_payment', 'payment_failed', 'expired') then
    return 'already_final';
  end if;
  if p_total_kurus <> o.total_kurus then
    insert into public.order_events (order_id, from_status, to_status, actor, note)
      values (o.id, o.status, o.status, 'paytr', 'Tutar uyuşmazlığı: ' || p_total_kurus || ' ≠ ' || o.total_kurus);
    return 'amount_mismatch';
  end if;

  -- Stokları sabit sırayla kilitle (kilitlenme olmasın).
  for li in
    select oi.variant_id, oi.qty, pv.stock
      from public.order_items oi
      join public.product_variants pv on pv.id = oi.variant_id
     where oi.order_id = o.id
     order by oi.variant_id
     for update of pv
  loop
    if li.stock < li.qty then v_short := true; end if;
  end loop;

  if v_short then
    update public.orders set status = 'stock_issue', paid_kurus = p_total_kurus, paid_at = now()
      where id = o.id;
    insert into public.order_events (order_id, from_status, to_status, actor, note)
      values (o.id, o.status, 'stock_issue', 'paytr', 'Ödeme alındı ama stok yetersiz. İade gerekebilir.');
    return 'stock_issue';
  end if;

  update public.product_variants pv set stock = pv.stock - oi.qty
    from public.order_items oi
   where oi.order_id = o.id and oi.variant_id = pv.id;

  if o.coupon_code is not null then
    select * into v_coupon from public.coupons where code = o.coupon_code;
    if found then
      insert into public.coupon_redemptions (coupon_id, order_id, email, discount_kurus)
        values (v_coupon.id, o.id, o.email, o.discount_kurus)
        on conflict (coupon_id, order_id) do nothing;
      update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
    end if;
  end if;

  update public.orders set status = 'paid', paid_kurus = p_total_kurus, paid_at = now()
    where id = o.id;
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (o.id, o.status, 'paid', 'paytr', 'Ödeme doğrulandı');
  insert into public.email_outbox (order_id, kind, recipient)
    values (o.id, 'order_paid', o.email), (o.id, 'admin_new_order', 'admin')
    on conflict (order_id, kind) do nothing;
  return 'paid';
end $$;

-- Doğrulanmış PayTR "failed" bildirimi. Ödenmiş siparişi asla geri almaz.
create or replace function public.mark_payment_failed(p_merchant_oid text, p_reason text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
begin
  select * into o from public.orders where merchant_oid = p_merchant_oid for update;
  if not found then return 'unknown_order'; end if;
  if o.status <> 'pending_payment' then return 'already_final'; end if;
  update public.orders set status = 'payment_failed', failed_reason = left(coalesce(p_reason, ''), 300)
    where id = o.id;
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (o.id, o.status, 'payment_failed', 'paytr', left(coalesce(p_reason, 'Ödeme başarısız'), 300));
  return 'failed';
end $$;

-- Yönetici durum değişikliği (izin verilen geçişler).
create or replace function public.admin_set_order_status(
  p_order_id uuid, p_to text, p_actor text, p_note text, p_restock boolean
) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  allowed boolean;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0001'; end if;

  allowed := case o.status
    when 'paid' then p_to in ('preparing', 'shipped', 'cancelled', 'refunded')
    when 'preparing' then p_to in ('shipped', 'cancelled', 'refunded')
    when 'shipped' then p_to in ('delivered', 'refunded')
    when 'delivered' then p_to in ('refunded')
    when 'stock_issue' then p_to in ('preparing', 'refunded', 'cancelled')
    when 'pending_payment' then p_to in ('cancelled')
    else false
  end;
  if not allowed then
    raise exception 'transition_not_allowed' using errcode = 'P0001';
  end if;

  if p_restock and p_to in ('cancelled', 'refunded') and o.status in ('paid', 'preparing', 'shipped', 'delivered') then
    update public.product_variants pv set stock = pv.stock + oi.qty
      from public.order_items oi
     where oi.order_id = o.id and oi.variant_id = pv.id;
  end if;

  update public.orders set status = p_to,
    shipped_at = case when p_to = 'shipped' then now() else shipped_at end
    where id = o.id;
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    values (o.id, o.status, p_to, p_actor, coalesce(p_note, '') ||
      case when p_restock and p_to in ('cancelled', 'refunded') then ' (stok iade edildi)' else '' end);
  if p_to = 'shipped' then
    insert into public.email_outbox (order_id, kind, recipient) values (o.id, 'order_shipped', o.email)
      on conflict (order_id, kind) do nothing;
  elsif p_to in ('cancelled', 'refunded') then
    insert into public.email_outbox (order_id, kind, recipient) values (o.id, 'order_' || p_to, o.email)
      on conflict (order_id, kind) do nothing;
  end if;
  return p_to;
end $$;

-- 2 saatten eski ödenmemiş siparişleri kapatır (stok rezerve edilmediği için stok değişmez).
create or replace function public.expire_pending_orders() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with x as (
    update public.orders set status = 'expired'
     where status = 'pending_payment' and created_at < now() - interval '2 hours'
     returning id
  )
  insert into public.order_events (order_id, from_status, to_status, actor, note)
    select id, 'pending_payment', 'expired', 'system', 'Ödeme süresi doldu' from x;
  get diagnostics n = row_count;
  return n;
end $$;

-- Yalnızca sunucu çağırabilir.
revoke all on function public.coupon_discount(text, text, int) from public, anon, authenticated;
revoke all on function public.create_pending_order(jsonb, text, jsonb, jsonb, jsonb, jsonb, boolean, uuid, text, text) from public, anon, authenticated;
revoke all on function public.finalize_paid_order(text, int) from public, anon, authenticated;
revoke all on function public.mark_payment_failed(text, text) from public, anon, authenticated;
revoke all on function public.admin_set_order_status(uuid, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.expire_pending_orders() from public, anon, authenticated;
grant execute on function public.coupon_discount(text, text, int) to service_role;
grant execute on function public.create_pending_order(jsonb, text, jsonb, jsonb, jsonb, jsonb, boolean, uuid, text, text) to service_role;
grant execute on function public.finalize_paid_order(text, int) to service_role;
grant execute on function public.mark_payment_failed(text, text) to service_role;
grant execute on function public.admin_set_order_status(uuid, text, text, text, boolean) to service_role;
grant execute on function public.expire_pending_orders() to service_role;
