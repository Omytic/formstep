# Supabase

Bu klasör yalnızca **yeni FormStep projesine** uygulanır. SERYN projesine bağlanmayın.

```bash
supabase link --project-ref <FORMSTEP_REF>
supabase db push          # 4 migration: şema + RLS, sipariş fonksiyonları, depo + başlangıç verisi, 10 numara × 200 TL
```

Alternatif: Supabase panelinde SQL Editor'a dosyaları sırayla yapıştırıp çalıştırın.

İlk yönetici (kendi bilgisayarında, bir kez):

```bash
node --env-file=.env.local scripts/create-admin.mjs eposta@ornek.com 'GüçlüŞifre' owner
```

Yönetici yetkisi yalnızca `admins` tablosundan okunur; kullanıcının değiştirebileceği bir alandan asla alınmaz.
