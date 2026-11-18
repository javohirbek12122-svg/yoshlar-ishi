# Yoshlar-Ishi: Supabase Auth production sozlamalari

Ushbu qo‘llanma foydalanuvchilar uchun yagona hisob oqimini production’da to‘liq ishlatishdan oldin Supabase Dashboard’da tekshirilishi kerak bo‘lgan sozlamalarni ko‘rsatadi.

## 1. URL Configuration

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://yoshlar-ishi-site.vercel.app`
- **Additional Redirect URLs:** `https://yoshlar-ishi-site.vercel.app/hamjamiyat.html` va `https://yoshlar-ishi-site.vercel.app/admin.html?admin-google=1`
- Query-parametrli callback va shu production host ichidagi kelajakdagi auth sahifalari kerak bo‘lsa, allowlist’ga `https://yoshlar-ishi-site.vercel.app/**` qo‘shing.

Email tasdig‘i, parol tiklash va Google OAuth callback’i `hamjamiyat.html` ga qaytadi. Boshqa host yoki tasdiqlanmagan domenlarga yo‘naltirish qabul qilinmaydi. Preview deployment ishlatilsa, uning aniq Vercel hostini alohida allowlist’ga kiriting; production wildcard’ni begona domenlarga yoymang.

## 2. Email va parol

Supabase Dashboard → **Authentication → Providers → Email**:

- Email/password provider yoqilgan bo‘lsin.
- Production’da email tasdig‘ini yoqing.
- Confirmation xatini yuborish va qayta yuborish ishlashini o‘zingiz boshqaradigan mailbox bilan tekshiring.
- **Password Security** bo‘limida server tomondagi minimum uzunlikni kamida 10 belgi qilib belgilang; parolda harf va raqam talabini yoqing. Frontend validatsiyasi server siyosatining o‘rnini bosmaydi.
- Agar amaldagi Supabase tarif rejasida **Leaked Password Protection** mavjud bo‘lsa, uni yoqing. Joriy security advisor bu himoya hozir o‘chiq ekanini qayd etgan; bu sozlama ushbu repozitoriydagi frontend kodi orqali o‘zgartirilmaydi.

Parolni tiklash faqat Supabase yuborgan tasdiqlangan recovery sessiyasi bilan ishlaydi. Boshqa foydalanuvchining emailiga kirish havolasini yuborish mumkin emas.

## 3. Google OAuth (ixtiyoriy)

Google orqali kirish uchun Supabase Dashboard → **Authentication → Providers → Google** bo‘limida provider’ni yoqing, Google OAuth Client ID va Client Secret’ni Dashboard’ning o‘ziga kiriting.

Foydalanuvchi Google kirishi va ro‘yxatdan o‘tishi uchun callback: `https://yoshlar-ishi-site.vercel.app/hamjamiyat.html?auth=google`. Admin Google callback’i: `https://yoshlar-ishi-site.vercel.app/admin.html?admin-google=1`.

Google Cloud OAuth client’dagi **Authorized redirect URI**:

`https://nnodsqnqsqrmzcycrmpr.supabase.co/auth/v1/callback`

Client Secret yoki boshqa maxfiy kalitni `config.js`, GitHub repozitoriy, frontend JavaScript yoki chatga joylashtirmang. Google provider o‘chiq bo‘lsa, email/parol oqimi mustaqil ishlashda davom etadi.

## 4. Ishlash modeli va tekshiruv

- `auth-client.js` — yagona Supabase client; PKCE session’ni saqlaydi/yangilaydi va foydalanuvchini `auth.getUser()` bilan serverda tekshiradi.
- `auth-bridge.js` — eski sahifalarga tokenni alohida `sessionStorage` kalitlariga nusxalamasdan, tekshirilgan identifikatsiyani beradi.
- `member_profiles` yozuvi `auth.users` dagi har bir yangi ID uchun DB trigger orqali yaratiladi.
- Profil, CV, portfolio, test, faollik va tashabbus ma’lumotlari egasining `auth.uid()` qiymati orqali RLS bilan chegaralanadi.
- Chiqish Supabase sessiyasini bekor qiladi; boshqa sahifa/tab’lar ham shu holatni oladi.

### Production acceptance checklist

1. Tasdiqlangan alohida test mailbox bilan yangi akkaunt yarating; email tasdiqlash havolasi production saytdagi `hamjamiyat.html` ga qaytishini tekshiring.
2. Shu akkaunt bilan kirib, `hamjamiyat`, `imkoniyatlar`, `bilim sinovlari` va `shaxsiy kabinet` bir xil profilni ko‘rsatishini tekshiring.
3. Parolni unutish havolasini yuboring, recovery callback’dan yangi parol o‘rnating va yangi parol bilan qayta kiring.
4. Ikkinchi, boshqa mailbox’ga tegishli test akkaunt oching. Alohida brauzer profillarida A va B akkauntlariga kiring; profil, test natijalari, portfolio va tashabbuslar bir-biriga ko‘rinmasligini tekshiring.
5. Google provider yoqilgan bo‘lsa, Google orqali kirish va callback’ni tekshiring.
6. Chiqishdan keyin barcha shaxsiy sahifalar mehmon holatiga qaytishini tekshiring.

Haqiqiy email tasdig‘i, Google provider holati, server password policy va ikki foydalanuvchi o‘rtasidagi RLS sinovi faqat egasi boshqaradigan test akkauntlari bilan yakuniy tasdiqlanadi.
