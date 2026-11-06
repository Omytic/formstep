/**
 * Supabase şemasını gömülü bir Postgres (PGlite) üzerinde çalıştırır:
 * fiyat hesabı, stok yarışı, tekrar eden ödeme bildirimi, kupon limiti ve RLS.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { beforeAll, describe, expect, it } from "vitest";

const dir = path.resolve(__dirname, "../supabase/migrations");
let db: PGlite;
const q = async <T = Record<string, unknown>>(sql: string, params?: unknown[]) => (await db.query<T>(sql, params)).rows;
const one = async <T = Record<string, unknown>>(sql: string, params?: unknown[]) => (await q<T>(sql, params))[0];

let m100 = "";
let m900 = "";
const contact = JSON.stringify({ email: "Test@Ornek.com", phone: "05550000000", full_name: "Test Kişi" });
const addr = JSON.stringify({ city: "İstanbul", district: "Beyoğlu", line: "x", postal_code: "" });
const create = (items: { variant_id: string; qty: number }[], coupon: string | null, oid: string) =>
  one<{ total: number; number: string }>(
    `select * from create_pending_order($1::jsonb, $2, $3::jsonb, $4::jsonb, '{"type":"individual"}'::jsonb, '{}'::jsonb, false, null, $5, '1.1.1.1')`,
    [JSON.stringify(items), coupon, contact, addr, oid],
  );

beforeAll(async () => {
  db = new PGlite({ extensions: { citext } });
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}'::jsonb);
    create table storage.buckets (id text primary key, name text, public boolean);
    create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.uid', true), '')::uuid $$;
  `);
  for (const f of readdirSync(dir).sort()) {
    await db.exec(readFileSync(path.join(dir, f), "utf8").replace("create extension if not exists pgcrypto;", ""));
  }
  await db.exec(`
    update products set status = 'published';
    update product_variants set price_kurus = 49900, stock = 2 where size_label = '40-41';
    update store_settings set value = '{"fee_kurus": 4990, "free_threshold_kurus": 75000}' where key = 'public.shipping';
    insert into coupons (code, kind, value, max_uses_per_email) values ('HOSGELDIN', 'percent', 10, 1);
  `);
  m100 = (await one<{ id: string }>(`select pv.id from product_variants pv join products p on p.id = pv.product_id where p.code = 'M100' and pv.size_label = '40-41'`)).id;
  m900 = (await one<{ id: string }>(`select pv.id from product_variants pv join products p on p.id = pv.product_id where p.code = 'M900' and pv.size_label = '40-41'`)).id;
}, 60_000);

describe("sipariş oluşturma", () => {
  it("her modele 10 numara, tanesi 200 TL olarak eklenir", async () => {
    const r = await one<{ n: number; p: number }>(`select count(*)::int n, min(price_kurus) p from product_variants where size_label <> '40-41'`);
    expect(r.n).toBe(27);
    expect(r.p).toBe(20000);
  });
  it("tutarı veritabanındaki fiyattan, kupon ve kargoyla hesaplar", async () => {
    const o = await create([{ variant_id: m100, qty: 1 }], "hosgeldin", "FST1");
    expect(o.total).toBe(49900 - 4990 + 4990);
    const o2 = await create([{ variant_id: m100, qty: 1 }, { variant_id: m900, qty: 1 }], null, "FST2");
    expect(o2.total).toBe(99800);
  });
  it("stoktan fazlasına, geçersiz kupona ve boş sepete izin vermez", async () => {
    await expect(create([{ variant_id: m100, qty: 3 }], null, "FST3")).rejects.toThrow(/out_of_stock/);
    await expect(create([{ variant_id: m100, qty: 1 }], "YOK", "FST4")).rejects.toThrow(/coupon_invalid/);
    await expect(create([], null, "FST5")).rejects.toThrow(/cart_empty/);
  });
});

describe("ödeme bildirimi", () => {
  it("yanlış tutarı reddeder, doğruyu bir kez işler, tekrarı yok sayar", async () => {
    expect((await one<{ r: string }>(`select finalize_paid_order('FST1', 1) r`)).r).toBe("amount_mismatch");
    expect((await one<{ r: string }>(`select finalize_paid_order('FST1', 49900) r`)).r).toBe("paid");
    expect((await one<{ r: string }>(`select finalize_paid_order('FST1', 49900) r`)).r).toBe("already_final");
    expect((await one<{ r: string }>(`select mark_payment_failed('FST1', 'x') r`)).r).toBe("already_final");
    expect((await one<{ stock: number }>(`select stock from product_variants where id = $1`, [m100])).stock).toBe(1);
    expect((await one<{ used_count: number }>(`select used_count from coupons`)).used_count).toBe(1);
  });
  it("aynı e-postayla kupon ikinci kez kullanılamaz", async () => {
    await expect(create([{ variant_id: m100, qty: 1 }], "HOSGELDIN", "FST6")).rejects.toThrow(/coupon_email_limit/);
  });
  it("son ürünü iki kişi alırsa stok eksiye düşmez, ikinci sipariş işaretlenir", async () => {
    const a = await create([{ variant_id: m100, qty: 1 }], null, "FSTA");
    const b = await create([{ variant_id: m100, qty: 1 }], null, "FSTB");
    expect((await one<{ r: string }>(`select finalize_paid_order('FSTA', $1) r`, [a.total])).r).toBe("paid");
    expect((await one<{ r: string }>(`select finalize_paid_order('FSTB', $1) r`, [b.total])).r).toBe("stock_issue");
    expect((await one<{ stock: number }>(`select stock from product_variants where id = $1`, [m100])).stock).toBe(0);
  });
});

describe("yönetim", () => {
  it("izinli geçişleri uygular, iadede stoğu geri ekler, e-postayı bir kez kuyruğa alır", async () => {
    const { id } = await one<{ id: string }>(`select id from orders where merchant_oid = 'FST1'`);
    await q(`select admin_set_order_status($1, 'shipped', 'admin', '', false)`, [id]);
    await expect(q(`select admin_set_order_status($1, 'preparing', 'admin', '', false)`, [id])).rejects.toThrow(/transition_not_allowed/);
    await q(`select admin_set_order_status($1, 'refunded', 'admin', '', true)`, [id]);
    expect((await one<{ stock: number }>(`select stock from product_variants where id = $1`, [m100])).stock).toBe(1);
    const kinds = (await q<{ kind: string }>(`select kind from email_outbox where order_id = $1 order by kind`, [id])).map((r) => r.kind);
    expect(kinds).toEqual(["admin_new_order", "order_paid", "order_refunded", "order_shipped"]);
  });
});

describe("satır düzeyi güvenlik (RLS)", () => {
  it("ziyaretçi sipariş ve gizli ayar göremez; müşteri yalnızca kendi siparişini görür", async () => {
    await db.exec(`
      insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');
      update orders set user_id = '00000000-0000-0000-0000-00000000000a' where merchant_oid = 'FST1';
      grant usage on schema public to anon, authenticated;
      grant select on all tables in schema public to anon, authenticated;
      set role anon;
    `);
    expect((await one<{ n: number }>(`select count(*)::int n from orders`)).n).toBe(0);
    expect((await one<{ n: number }>(`select count(*)::int n from products`)).n).toBe(3);
    expect((await one<{ n: number }>(`select count(*)::int n from store_settings where key like 'private.%'`)).n).toBe(0);
    expect((await one<{ n: number }>(`select count(*)::int n from coupons`)).n).toBe(0);
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.uid', '00000000-0000-0000-0000-00000000000b', false);`);
    expect((await one<{ n: number }>(`select count(*)::int n from orders`)).n).toBe(0);
    await db.exec(`select set_config('request.jwt.uid', '00000000-0000-0000-0000-00000000000a', false);`);
    expect((await one<{ n: number }>(`select count(*)::int n from orders`)).n).toBe(1);
    await db.exec(`reset role;`);
  });
});

describe("operasyon: stok, sevkiyat, satış", () => {
  const loc = async (code: string) => (await one<{ id: string }>(`select id from stock_locations where code = $1`, [code])).id;
  const level = async (variant: string, code: string) =>
    (await one<{ qty: number }>(`select coalesce(sum(qty), 0)::int qty from stock_levels where variant_id = $1 and location_id = $2`, [variant, await loc(code)])).qty;

  it("girişler depoya ekler, sevkiyat depodan Amazon'a taşır, teslim farkı fire olur", async () => {
    const depo = await loc("depo");
    const fba = await loc("amazon-fba");
    await q(`insert into stock_movements (variant_id, to_location, qty, kind) values ($1, $2, 100, 'giris')`, [m900, depo]);
    expect(await level(m900, "depo")).toBe(100);

    const { id } = await one<{ id: string }>(
      `insert into shipments (channel, from_location, to_location, status) values ('amazon', $1, $2, 'hazirlaniyor') returning id`,
      [depo, fba],
    );
    await q(`insert into shipment_items (shipment_id, variant_id, qty_sent) values ($1, $2, 40)`, [id, m900]);
    await q(`select sync_shipment_movements($1)`, [id]);
    expect(await level(m900, "depo")).toBe(100); // hazırlanıyor: stok yerinde

    await q(`update shipments set status = 'yolda' where id = $1`, [id]);
    await q(`select sync_shipment_movements($1)`, [id]);
    await q(`select sync_shipment_movements($1)`, [id]); // tekrar çağırmak çift saymaz
    expect(await level(m900, "depo")).toBe(60);
    expect(await level(m900, "amazon-fba")).toBe(40);

    await q(`update shipments set status = 'eksik' where id = $1`, [id]);
    await q(`update shipment_items set qty_received = 37 where shipment_id = $1`, [id]);
    await q(`select sync_shipment_movements($1)`, [id]);
    expect(await level(m900, "amazon-fba")).toBe(37);

    await q(`update shipments set status = 'iptal' where id = $1`, [id]);
    await q(`select sync_shipment_movements($1)`, [id]);
    expect(await level(m900, "depo")).toBe(100);
    expect(await level(m900, "amazon-fba")).toBe(0);
    await q(`update shipments set status = 'teslim' where id = $1`, [id]);
    await q(`update shipment_items set qty_received = 40 where shipment_id = $1`, [id]);
    await q(`select sync_shipment_movements($1)`, [id]);
  });

  it("satış kanalın stok konumundan düşer, iade geri ekler, aynı satır iki kez yüklenmez", async () => {
    await q(`insert into sales (channel, order_no, line_key, sold_on, variant_id, qty, gross_kurus, commission_kurus) values ('amazon', '111-1', 'X', '2026-11-01', $1, 3, 60000, 9000)`, [m900]);
    await expect(q(`insert into sales (channel, order_no, line_key, sold_on, variant_id, qty) values ('amazon', '111-1', 'X', '2026-11-01', $1, 3)`, [m900])).rejects.toThrow(/duplicate/);
    await q(`insert into sales (channel, order_no, line_key, sold_on, variant_id, qty) values ('trendyol', 'T-9', 'Y', '2026-11-02', $1, 2)`, [m900]);
    await q(`insert into sales (channel, order_no, line_key, type, sold_on, variant_id, qty) values ('amazon', '111-1', 'X', 'iade', '2026-11-05', $1, 1)`, [m900]);
    expect(await level(m900, "amazon-fba")).toBe(40 - 3 + 1);
    expect(await level(m900, "depo")).toBe(60 - 2);
    expect((await one<{ n: number }>(`select net_kurus n from sales where order_no = '111-1' and type = 'satis'`)).n).toBe(51000);
  });

  it("operasyon tabloları ziyaretçiye kapalı", async () => {
    await db.exec(`grant select on all tables in schema public to anon, authenticated; set role anon;`);
    for (const t of ["sales", "ledger_entries", "stock_movements", "shipments", "team_tasks", "ad_spend"]) {
      expect((await one<{ n: number }>(`select count(*)::int n from ${t}`)).n, t).toBe(0);
    }
    expect((await one<{ n: number }>(`select count(*)::int n from stock_levels`)).n).toBe(0);
    await db.exec(`reset role;`);
  });
});
