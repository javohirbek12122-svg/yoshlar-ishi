# Google OAuth — Yoshlar-Ishi

## Muhim farq

Yoshlar-Ishi Google orqali autentifikatsiya oqimini qo‘llaydi. Frontend faqat Supabase URL va publishable key’dan foydalanadi; Google Client Secret hamda Supabase service-role key frontendga yoki GitHub repozitoriyga yozilmaydi.

Parkent E-Market’da ishlatilayotgan Google OAuth web-client’ini qayta ishlatish mumkin, lekin Google Cloud Console va Yoshlar-Ishi Supabase loyihasida alohida redirect/origin sozlamalari qo‘shilishi kerak. Bu sozlamalarni Supabase Auth boshqaruv huquqiga ega hisob egasi bajaradi.

## 1. Google Cloud Console

Mavjud Google OAuth 2.0 Web client’ini oching.

**Authorized JavaScript origins** ichiga qo‘shing:

- `https://yoshlar-ishi-site.vercel.app`

Custom production domeni bo‘lsa, uni ham alohida qo‘shing. Local development uchun faqat ishlatiladigan localhost origin’ini kiriting.

**Authorized redirect URIs** ichiga Yoshlar-Ishi Supabase callback manzilini qo‘shing:

- `https://nnodsqnqsqrmzcycrmpr.supabase.co/auth/v1/callback`

Bu Google’dan qaytish manzili. Saytning `hamjamiyat.html` yoki `admin.html` manzili Google Console callback manzili emas.

## 2. Supabase Auth

Yoshlar-Ishi loyihasini oching: `nnodsqnqsqrmzcycrmpr`.

Authentication → Providers → Google:

1. Google provider’ni yoqing.
2. Parkent E-Market’da ishlatilayotgan **Web Client ID** va **Client Secret**ni egasining o‘zi xavfsiz tarzda kiritsin.
3. Save qiling.

Client Secret’ni chatga, GitHub’ga, `config.js`ga yoki boshqa frontend faylga joylamang.

Authentication → URL Configuration:

- Site URL: `https://yoshlar-ishi-site.vercel.app`
- Redirect allow list:
  - `https://yoshlar-ishi-site.vercel.app/hamjamiyat.html*` (kirish, ro‘yxatdan o‘tish va parol tiklash callback parametrlari uchun)
  - `https://yoshlar-ishi-site.vercel.app/admin.html*` (Google admin callback parametrlari uchun)

Agar Vercel production domeni o‘zgarsa, Google origin, Supabase Site URL va redirect allow list ham mos ravishda yangilanadi.

## 3. Admin himoyasi

Admin Google OAuth muvaffaqiyatli yakunlangani o‘zi admin huquqini bermaydi.

Bazadagi `public.admin_google_console_check()` funksiyasi quyidagilarni tekshiradi:

- joriy Supabase foydalanuvchisi autentifikatsiyadan o‘tgan;
- email tasdiqlangan va hisob anonim emas;
- `auth.identities` ichida aynan `google` provider identifikatori mavjud;
- email `public.admin_allowlist` jadvalida faol.

Oddiy Google hisoblari admin paneliga kira olmaydi. Yangi admin qo‘shish faqat Supabase SQL Editor orqali vakolatli loyiha egasi tomonidan amalga oshirilishi kerak. O‘z-o‘zini admin qilish funksiyasi mavjud emas.

## 4. Sinov ro‘yxati

- [ ] Google provider Supabase’da Enabled holatida.
- [ ] Google Console’da yuqoridagi callback URI aynan kiritilgan.
- [ ] Supabase URL Configuration’da ikkala sahifa redirect allow list’da.
- [ ] Google bilan ro‘yxatdan o‘tish `hamjamiyat.html`da ishlaydi.
- [ ] Ruxsatli Google hisobi admin paneliga kira oladi.
- [ ] Allowlist’da bo‘lmagan Google hisob admin panelidan rad etiladi.
- [ ] Chiqishdan keyin sessiya tugaydi; boshqa foydalanuvchi avvalgi hisobga kira olmaydi.

Google provider Supabase boshqaruv panelida yoqilmaguncha, UI’dagi Google tugmasi ishlamaydi va “provider is not enabled” xatosi qaytishi mumkin. Bu kod xatosi emas, Auth provider konfiguratsiyasidir.
