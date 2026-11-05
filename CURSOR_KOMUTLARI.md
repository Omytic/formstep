# FormStep — Cursor Agent komutları (gözden geçirilmiş sürüm)

**Nasıl kullanılır:** Cursor'da `siteler/formstep` klasörünü aç, Agent modunda komutları **00'dan 12'ye sırayla** yapıştır. Bir aşama bitmeden (lint/typecheck/test/build geçmeden) sonrakine geçme. Takılırsan en alttaki "hata düzeltme" komutunu kullan.

**ChatGPT sürümünden farkları:**
- Global kurallar artık `.cursor/rules/` içinde → her Agent oturumunda otomatik yükleniyor, 00 numaralı metni tekrar tekrar yapıştırmana gerek yok.
- **PayTR:** bildirim (callback) URL'si her mağaza için tek. SERYN'in merchant bilgileri kullanılırsa FormStep ödemeleri seryn.com.tr'ye düşer ve FormStep siparişleri hiç "ödendi" olmaz. → FormStep için **ayrı PayTR mağazası** gerekiyor (aynı şirket altında). Ödeme kodu SERYN'in çalışan `paytr.ts` dosyasını referans alıyor, hash sırası tahmin edilmiyor.
- Sıra düzeltildi: önce veri modeli, sonra ana sayfa (ana sayfa fiyat/stok bilgisini veritabanından okuyor).
- 20 aşama → 13 aşama. 3 ürünlü bir mağaza için gereksiz kurumsal yük çıkarıldı (4 ayrı admin rolü, kargo etiketi adaptörü, pazaryeri stok senkron arayüzü, e-fatura adaptörü, PayTR iade API'si). Bunlar "sonra eklenebilir" listesinde.
- M300 için uydurulmuş turuncu renk kaldırıldı; renkler gerçek ürün fotoğraflarından alındı.
- Logo için koyu zemine uygun beyaz versiyon hazır (`logo-white.png`), görseller doğru adlarla `public/assets/` içinde (m400 → m300).

---

## 00 — Kurulum

```text
Read .cursor/rules/formstep-core.mdc first. The folder already contains public/assets (brand + products) and .cursor/rules — keep them.

Scaffold a Next.js App Router app (current stable Next + React, TypeScript strict, Tailwind, ESLint, Prettier) in this folder without deleting existing files. Add: zod, @supabase/supabase-js, @supabase/ssr, gsap (+ @gsap/react for useGSAP cleanup), lucide-react, vitest, @playwright/test. Scripts: dev, build, start, lint, typecheck (tsc --noEmit), test (vitest run), e2e (playwright test).

Structure under src/: app/(store), app/(account), app/admin, app/api, components/{ui,layout,store,animation,admin}, lib/{supabase,catalog,cart,checkout,paytr,email,security}, plus supabase/migrations, tests/, docs/.

Create src/lib/catalog/assets.ts: a typed manifest mapping M100/M300/M900 to their image files (M300 = m300.png; note it was originally named m400). Add .env.example (names only), .gitignore (.env*, not .env.example), README.md, IMPLEMENTATION_STATUS.md.

Add a config guard lib/config.ts: if Supabase or PayTR env is missing, the storefront still renders products from the asset manifest but every buy button and admin write is disabled with a clear Turkish message.

Verify: install, lint, typecheck, test, build all pass. Report changed files.
```

## 01 — Supabase şeması + RLS

```text
Create versioned SQL migrations in supabase/migrations for a NEW FormStep Supabase project. Keep it small and normalized:

- products (code M100/M300/M900 unique, slug, name, tagline, description, status draft|published, accent_hex, sort_order, seo fields)
- product_images (product_id, path, alt, sort_order)
- product_features (product_id, label, body, verified boolean, sort_order) — only verified rows render publicly
- product_variants (product_id, size_label, sku unique, price_kurus integer >0, compare_at_kurus nullable, stock integer >=0, active)
- profiles (id = auth.users.id, full_name, phone, marketing_consent + consent_at), addresses
- orders (public_token uuid unique for guest access, merchant_oid unique, user_id nullable, email, phone, shipping/billing jsonb snapshot, subtotal/discount/shipping/total _kurus, coupon_code, status: pending_payment|paid|preparing|shipped|delivered|cancelled|refunded|payment_failed|stock_issue, tracking_carrier, tracking_number, invoice_no, legal_snapshot jsonb, timestamps)
- order_items (immutable snapshot: product code, name, size_label, sku, unit_price_kurus, qty)
- order_events (order_id, from_status, to_status, actor, note, created_at)
- payment_callbacks (merchant_oid, status, total_amount, raw jsonb minus card data, hash_valid, received_at) — every callback logged
- coupons (code unique case-insensitive, type percent|fixed, value, min_subtotal_kurus, starts_at, ends_at, max_uses, max_uses_per_email, used_count, active), coupon_redemptions (unique coupon_id+order_id)
- shipping_settings / store_settings (key/value jsonb: flat fee, free-shipping threshold, seller legal details, marketplace URLs, verified claims, launch gates)
- faq_items, legal_pages (slug, title, body, version, published)
- admins (user_id, role owner|staff) — no self-assignment
- audit_log (admin user, action, entity, diff jsonb)

Transactional RPC (security definer, search_path pinned, callable only by service role):
- create_pending_order(payload) → validates variants active + price + stock, applies coupon, writes order+items, returns merchant_oid & token.
- finalize_paid_order(merchant_oid, total_kurus) → idempotent: if already paid return; check amount matches; decrement stock with row locks (if stock insufficient set status stock_issue instead of going negative); insert coupon_redemption + increment used_count; write order_event. All in ONE transaction.
- mark_payment_failed(merchant_oid, reason) → only from pending_payment.

RLS default deny on every table. Public: read published products/images/verified features/active variants/faq/published legal pages. Customers: own profile, addresses, orders (+items/events read-only). Guests: no table access — guest order view goes through a server route using public_token. Admin: via server code checking admins table, never via user metadata. Storage bucket product-images: public read, admin write.

Seed: three products as DRAFT with correct codes, names and images; NO variants, prices or stock (admin enters them). Generate TS types. Write Vitest/SQL tests for: RLS customer A can't read B's orders, anon can't read orders, double finalize_paid_order is a no-op, wrong amount is rejected, last-item race leaves stock >= 0.
```

## 02 — Marka sistemi ve iskelet

```text
Build the FormStep design system. Brand: midnight navy #0E1A36, electric blue #2477EA, off-white #F6F8FC, ink #10131D. Per-model accents sampled from the real photos: M100 cool grey #8A8F98 with ice-blue #DCE8F7; M300 black with royal blue #0873E5; M900 black with sky blue #4EA1E1. Verify these by sampling the PNGs and adjust if needed. No orange, no gratuitous gradients, no stock photos, no emoji icons.

Logo: use public/assets/brand/logo.png on light and logo-white.png on dark. Never redraw it. Typography: one bold grotesk display face that sits well next to the heavy logo wordmark + one clean text face, both free/licensed (next/font), Turkish glyphs (ğ ş ı İ ç ö ü) verified.

Tokens in Tailwind; components: Button, Link, Input, Select, SizePicker, QuantityStepper, Drawer (cart), Dialog, Toast, Badge, Skeleton, Table (admin). Header: logo, "modeller", cart button with count, account. Mobile menu. Footer pulls legal links, company name and marketplace links from store_settings.

Accessibility: visible focus, 44px touch targets, AA contrast, prefers-reduced-motion respected globally. Check 375 / 768 / 1440 widths, no horizontal scroll.
```

## 03 — Ana sayfa

```text
Build the homepage as one strong story page using the real product PNGs. Read product/variant data from Supabase (server component); fall back to the asset manifest with buying disabled when data is missing.

Sections:
1. Hero (dark navy): headline "her adımda daha fazla konfor.", short sub line, M900 hero image with subtle pointer/scroll parallax, CTAs "modelleri keşfet" (scroll) and "hemen al" (scroll to buy section).
2. Three models: horizontal switcher; background tone, image, tagline and accent change per model. Price and "sepete ekle" shown only when a published active variant exists, otherwise "yakında".
3. Placeholder <section id="hikaye"> for the scroll story (stage 04).
4. "hangi FormStep sana uygun?": 2–3 question picker (daily use / long hours standing / sport). Mapping lives in store_settings so the owner can change it; copy is non-medical.
5. Comparison table built from verified product_features only.
6. Trust: marketplace links (Amazon, Trendyol, Hepsiburada) from settings; the bestseller line only if a verified claim exists.
7. Buy section: three models side by side with size + qty + add to cart, shipping info from settings.
8. FAQ from faq_items.

Alternate dark and light scenes. Images via next/image with explicit sizes and priority only on the hero. No layout shift. Semantic headings (one h1).
```

## 04 — Kaydırma hikâyesi (3 sahne)

```text
Implement the #hikaye scroll story with GSAP ScrollTrigger inside useGSAP (proper cleanup), as one continuous scene:

A. The insole floats and separates into 3 neutral, unlabeled translucent planes (conceptual — we do NOT know the real layer structure). Captions describe the product in general terms only.
B. Planes reassemble; the insole slides into a simple line-drawn shoe outline (SVG).
C. A soft pressure "glow" spreads under heel and forefoot as an abstract heatmap, labelled "temsili görselleştirme". Then the three models appear with links to their pages.

Rules: animate transform/opacity only; pin at most one section and only on desktop; on mobile use shorter non-pinned reveals; prefers-reduced-motion shows a static three-step layout with the same content. Load GSAP only in this client component. When admin later fills verified layer data, captions can switch to it — design the component to accept that data.

Test: reduced-motion render test; Lighthouse mobile performance >= 85 on the homepage.
```

## 05 — Ürün sayfaları

```text
Create /urun/[model] (m100, m300, m900) from one data-driven template with the model's accent. Gallery with zoom (keyboard accessible), size picker from product_variants, price, stock state (in stock / az kaldı under a threshold from settings / tükendi), qty, add to cart, shipping & return summary from settings, verified features, FAQ, "diğer modeller". Size guide content is admin-editable; if empty, hide it.

404 for unknown/unpublished models. Metadata + canonical; Product JSON-LD only when a published variant with price exists. No health/orthopaedic claims. Unit tests for missing price/stock states.
```

## 06 — Sepet ve kupon

```text
Cart: client-side (localStorage key formstep_cart, try/catch) holding only {sku, qty}. Cart drawer + /sepet. Every view of totals comes from a server action quoteCart(items, couponCode?) that loads live variants, prices, stock, coupon and shipping settings and returns line totals, discount, shipping, total in kuruş plus per-line problems (price changed, out of stock, inactive). Never trust client prices.

Coupons: percent or fixed, validity window, min subtotal, max uses, max per email, active flag; one coupon per order; discount never exceeds subtotal. Rate-limit coupon checks. Shipping: flat fee + free-shipping threshold from settings.

Tests: tampered prices ignored, expired/maxed coupon rejected, percent rounding in kuruş, free-shipping threshold edge, inactive variant removed.
```

## 07 — Ödeme sayfası + PayTR

```text
Read .cursor/rules/formstep-paytr.mdc. For hashing and request fields, read (do not modify) ../seryn-skin-main/src/lib/paytr.ts and ../seryn-skin-main/src/app/api/paytr/get-token/route.ts and port the logic into src/lib/paytr/ with FormStep's own env vars. FormStep has its own PayTR mağaza credentials.

/odeme (guest or logged in), one page with steps: contact (email, phone) → delivery address (il/ilçe) → billing (bireysel/kurumsal toggle, VKN fields only for kurumsal) → order summary from quoteCart → required checkbox for ön bilgilendirme + mesafeli satış (links open the texts filled with this order's data) → optional unchecked marketing consent → "ödemeye geç".

Server action startPayment: re-quote, call create_pending_order RPC, store legal_snapshot (rendered contract text + version + accepted_at + IP), request PayTR token (merchant_oid FST…, lang tr, timeout_limit 30, merchant_ok_url /siparis/{token}?r=ok, merchant_fail_url /siparis/{token}?r=fail), return only the iframe token. Render iframe with iframeResizer from PayTR docs. Disable double submit.

/api/paytr/notify: POST only, nodejs runtime, parse form data, log to payment_callbacks, verify hash timing-safe, then success → finalize_paid_order RPC, failed → mark_payment_failed. Unknown oid or already-final order → log and return "OK". Always return plain "OK" after a valid-hash callback is processed; return non-OK only on our own transient errors so PayTR retries.

/siparis/[token]: guest-safe status page that polls status; the redirect query param is only for copy, never for status.

If PayTR env is missing or store_settings.launch_gates are not all true, show "ödeme yakında açılacak" instead of the iframe. PAYTR_TEST_MODE=1 in non-production.

Tests (Vitest with fake PayTR): hash matches SERYN's known-good function output for fixed inputs, bad hash rejected, duplicate success callback = single stock decrement + single coupon redemption, success with wrong amount → flagged not paid, failed after success ignored, two buyers of the last item → one paid, other stock_issue.
```

## 08 — Üyelik ve hesabım

```text
Supabase Auth (email + password, email verification, reset password) for FormStep only. /giris with login/register/reset tabs; redirect allowlist. Registration is never required to buy.

/hesabim: orders (list + detail with tracking), addresses (CRUD), profile, marketing consent toggle, "hesabımı silme talebi" (creates a request; order records retained per legal retention, documented as configurable).

After a guest checkout, offer "bu siparişle hesap oluştur" — link the order only after the email is verified and matches. Never auto-merge by email alone.

Playwright: register → verify (mock) → login → see own order; user A cannot open user B's order URL.
```

## 09 — Admin paneli

```text
/admin protected server-side on every page, server action and route (check admins table). Roles: owner (everything) and staff (orders + shipping only). First owner created by scripts/create-admin.mjs using the service key locally — document it.

Pages:
- Özet: today/7d/30d paid revenue, order count, units per model, low-stock list. Only real data.
- Siparişler: filter by status/date/search, detail with items, payment callbacks log, status transitions (allowed transitions only), carrier + tracking number entry (triggers shipment email), invoice number field, internal note, CSV export.
- İade/iptal: mark cancelled or refunded with amount and note; refunds are done manually in the PayTR panel — the UI says so; optional "stoka geri al" checkbox, idempotent.
- Ürünler: texts, images (upload to storage), verified features, variants (size, SKU, price TL input → kuruş, stock), publish toggle (blocked if no active priced variant).
- Kuponlar: CRUD + usage list.
- İçerik: hero texts, model picker mapping, FAQ, marketplace URLs, verified claims (text, evidence URL/file, date).
- Ayarlar: seller legal details, shipping fee & threshold, low-stock threshold, notification email, launch gates checklist (payment approved, prices entered, legal texts reviewed, emails verified). Never display secrets.
Every write goes to audit_log. Usable on mobile.
```

## 10 — E-posta ve yasal sayfalar

```text
Email via Resend (adapter so SMTP can replace it). Turkish templates: order received, payment confirmed (with guest order link), shipped (carrier + tracking), cancelled/refunded, admin new-order alert. Send from the paid finalisation path through an email_outbox row (unique per order+type) so callback retries never double-send; email failure never fails payment. Document SPF/DKIM/DMARC for formstep.tr. Marketing email only with stored consent.

/bilgilendirme/[slug]: iletişim, hakkımızda, ön bilgilendirme formu, mesafeli satış sözleşmesi, iade ve cayma, teslimat ve kargo, KVKK aydınlatma metni, çerez politikası, kullanım koşulları. Content from legal_pages, editable in admin, with templates that clearly mark missing seller data as [EKSİK: ...] — never invent address, MERSİS, VKN, ETBİS. Show a banner in admin until a lawyer/accountant review is ticked in launch gates.

Cookie banner: essential only by default; analytics loads only after "kabul et"; equal-weight "reddet"; changeable later from footer.
```

## 11 — SEO, analitik, kalite

```text
SEO: metadata + canonical per page, sitemap.xml and robots.txt (exclude /admin, /sepet, /odeme, /siparis, /hesabim, /api), Open Graph images from real assets, alt texts. GA4 behind consent; events view_item, add_to_cart, begin_checkout; purchase fired once from /siparis/[token] only when server status is paid (store a fired flag).

Then audit and FIX: widths 320/375/430/768/1280/1440, keyboard nav, focus, contrast, reduced motion, Turkish characters everywhere, no overflow, Core Web Vitals (LCP image priority, font loading, GSAP only on homepage). Run lint, typecheck, unit, Playwright critical flows (browse → cart → coupon → checkout with fake PayTR → paid status; account isolation; admin ships order), build, npm audit. Write docs/QA_REPORT.md with real results and known gaps.
```

## 12 — Yayına hazırlık ve devir

```text
Prepare deployment to a NEW Vercel project and NEW Supabase project. Never link to SERYN's or Macro OS's projects or accounts.

docs/DEPLOYMENT.md with exact env names and where each goes (local / preview / production): NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY (use the current Supabase key names; fall back to anon/service_role names only if the project uses legacy keys), PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT, PAYTR_TEST_MODE, RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, CRON_SECRET, NEXT_PUBLIC_GA_ID. Steps: create Supabase project, run migrations, seed, create first admin, Auth site URL + redirects, Vercel project + env, attach formstep.tr, DNS, PayTR Bildirim URL = https://formstep.tr/api/paytr/notify set in FormStep's own PayTR mağaza panel, one real test payment visible as "Başarılı" in PayTR, then switch test mode off.

A daily cron (Vercel) that marks pending_payment orders older than 2 hours as expired.

Finally act as an independent reviewer: compare the repo to stages 00–11, fix gaps, and write HANDOFF.md with route map, tables, RLS summary, env matrix, manual steps, test results and a verdict READY or NOT READY. NOT READY if PayTR store approval, real prices/stock, seller legal info, legal review or verified email DNS is missing — say "kod hazır, aktivasyon bekliyor" instead of pretending.
```

---

## Hata düzeltme komutu (gerektiğinde)

```text
Do not start a new feature. Reproduce the current failure from the terminal output and tests, find the root cause, apply the smallest correct fix, add a regression test, rerun lint/typecheck/affected tests/build, and summarise what changed. Do not disable tests or replace the feature with a mock.
```

---

## Senin tarafında yapılacaklar

1. **PayTR:** FormStep (formstep.tr) için OMY şirketi altında **ayrı bir mağaza** açılmasını iste. Neden: bildirim URL'si mağaza başına tek; SERYN'in mağazasını paylaşırsak ödemeler seryn.com.tr'ye gider.
2. **Ürün verisi:** her model için satış fiyatı, numara aralıkları (kesilerek ayarlanan tek beden mi, numara grupları mı?), SKU, stok, malzeme/teknik bilgiler (ambalajda yazanlar).
3. **Kargo:** firma, ücret, ücretsiz kargo eşiği, iade adresi.
4. **Şirket:** açık adres, telefon, e-posta, vergi dairesi/no, MERSİS, ETBİS kaydı; yasal metinler için avukat/muhasebeci onayı.
5. **Pazaryeri linkleri** ve "en çok satan" iddiası için tarihli ekran görüntüsü (kategori + tarih).
6. **Alan adı:** formstep.tr kaydı ve e-posta için DNS erişimi.

## Sonra eklenebilecekler (ilk sürümde yok)
PayTR iade API'si, kargo firması API/etiket entegrasyonu, pazaryeri stok senkronizasyonu, e-arşiv fatura entegrasyonu, web siparişlerinin Macro OS'teki FormStep raporlarına otomatik aktarımı.
