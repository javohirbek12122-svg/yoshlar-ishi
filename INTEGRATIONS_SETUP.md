# Yoshlar-Ishi: AI, Telegram, shaxsiy kabinet va xizmatlar katalogi

Ushbu qo‘llanma yangi mexanizmlarni xavfsiz ishga tushirish tartibini beradi. Tokenlar va maxfiy kalitlarni GitHub kodiga, brauzerga yoki chatga joylamang.

## 1. Davlat xizmatlari qo‘llanmasi

Public sahifa: /davlat-xizmatlari.html  
Shaxsiy kabinet: /kabinet.html  
Bosh sahifa: /index.html  
Maxfiylik: /privacy.html

Katalog Supabase’dagi official_portal_integrations jadvalidan foydalanadi. Har bir yozuvda kategoriya, tushuntirish, foydalanuvchi auditoriyasi, xususiyatlar, bosqichlar, mumkin bo‘lgan hujjatlar, to‘lov/muddat eslatmasi, kontakt, teglar, manba havolasi va rasm manbasi saqlanadi.

Yoshlar-Ishi mustaqil tushuntiruvchi platforma: rasmiy ariza, OneID, to‘lov va qaror tegishli davlat portalida bajariladi. Tashqi havola API yoki SSO ulanishini anglatmaydi.

## 2. AI g‘oya tahlili

Edge Function:
https://nnodsqnqsqrmzcycrmpr.supabase.co/functions/v1/idea-review

1. Groq API kalitini https://console.groq.com/keys sahifasida o‘zingiz yarating.
2. https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/functions/secrets sahifasida GROQ_API_KEY nomli secret kiriting.
3. Ixtiyoriy: GROQ_MODEL qiymatini openai/gpt-oss-20b, AI_RATE_LIMIT_SALT qiymatini esa o‘zingiz yaratgan tasodifiy sirli satr qiling.
4. GitHub Actions tekshiruvi muvaffaqiyatli bo‘lgach, bosh sahifadagi AI yordamchini sinang.

AI funksiyasi shaxsiy identifikator yoki aloqa ma’lumotiga o‘xshash matnni rad etadi va IP manzili o‘rniga SHA-256 xeshdan foydalanuvchi vaqtinchalik limitni qo‘llaydi. Default limit — bir daqiqada 4 ta tahlil. G‘oya matni ma’lumotlar bazasiga saqlanmaydi. AI javobi rasmiy qaror emas.

Server funksiyasi joylangan; Groq kaliti bo‘lmasa sayt lokal qoidaviy tahlilni ko‘rsatadi. Kalitni faqat Supabase Secrets orqali kiriting.

## 3. Telegram kuzatuv boti

Edge Functions:
- telegram-webhook — bot buyruqlarini oladi.
- telegram-notify — admin ariza holatini yangilagach Telegram xabarnoma yuboradi.

1. Telegram’dagi rasmiy @BotFather orqali bot yarating.
2. Supabase Edge Function Secrets’da quyidagilarni saqlang:
   - TELEGRAM_BOT_TOKEN — BotFather tokeni.
   - TELEGRAM_WEBHOOK_SECRET — o‘zingiz yaratgan kamida 32 belgili maxfiy satr.
3. config.js ichida telegramBotUsername qiymatiga bot username’ini ( @ belgisiz ) yozing. Username public bo‘lishi mumkin; bot tokeni esa hech qachon emas.
4. O‘zingizning xavfsiz terminalingizda muhit o‘zgaruvchilarini o‘rnatib, webhook’ni ro‘yxatdan o‘tkazing:

   curl --request POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     --header "Content-Type: application/json" \
     --data "{\"url\":\"https://nnodsqnqsqrmzcycrmpr.supabase.co/functions/v1/telegram-webhook\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\",\"drop_pending_updates\":true}"

   Tokenni source code yoki issue’ga joylamang; terminal tarixida saqlanib qolish xavfini ham hisobga oling.

5. Botning shaxsiy chatida /start yuboring.

Buyruqlar:
- /link YI-... — kuzatuv kodiga obuna bo‘lish.
- /status YI-... — ulangan ariza holatini ko‘rish.
- /unlink YI-... — xabarnomani to‘xtatish.

Kuzatuv kodi maxfiy. Bot faqat ariza sarlavhasi va holatini yuboradi; foydalanuvchi telefoni va emaili Telegram orqali tarqatilmaydi. Admin xabarnoma funksiyasi Supabase session va admin allowlist tekshiruvidan o‘tadi.

Bot tokeni va webhook siri kiritilmaguncha Telegram xabarlari amalda yuborilmaydi.

## 3A. Database permissions and admin review

The REST API now uses explicit per-table/column grants in migration `20261028174007_harden_public_access_and_admin_review.sql`. Public forms can insert only user-submitted fields; status and admin-only columns are not writable from the browser. Internal initiative notes and review metadata are returned by `admin_list_initiatives()` only after the database checks the active `admin_allowlist`. Status/notes changes go through `admin_review_initiative(...)`, which checks the admin allowlist and expected previous status.

The personal-account `get_my_initiatives()` and `update_my_initiative(...)` functions use invoker permissions and the owner's RLS policies. This keeps the account RPC limited to the signed-in user's own initiatives. The AI rate-limit and Telegram-subscription tables remain inaccessible to anon/authenticated roles; their Edge Functions use server-side credentials.

## 3B. Hamkorlik murojaatlarining maxfiy maydonlari

Hamkorlik murojaatlarining emaili, telefoni, xabari va ichki admin izohi `admin_list_connection_requests()` orqali faqat faol admin ro‘yxatidagi hisobga qaytariladi. Holat/izoh o‘zgartirish `admin_review_connection_request(...)` orqali bajariladi; funksiya admin ruxsatini va avvalgi holatni tekshiradi. Oddiy brauzer sessiyasi bu maydonlarni REST jadvalidan to‘g‘ridan-to‘g‘ri o‘qiy yoki yangilay olmaydi.

## 4. Shaxsiy kabinet

- Email magic-link orqali kirish; foydalanuvchi paroli saytga saqlanmaydi.
- Kabinet orqali yuborilgan tashabbus owner_id bilan bog‘lanadi.
- get_my_initiatives() va update_my_initiative(...) RPC’lari faqat shu akkauntga tegishli arizalarning xavfsiz maydonlarini o‘qiy/tahrirlaydi; admin ichki izohlari qaytarilmaydi.
- Eski anonim arizalar avtomatik profilga bog‘lanmaydi: kod egasini tasdiqlash uchun alohida tasdiqlash jarayoni kerak.

Deploydan keyin Supabase Auth URL Configuration’da haqiqiy production domenini va /kabinet.html hamda /admin.html redirect manzillarini qo‘shing:
https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/auth/url-configuration

## 5. Jamoa doskasi, moderatsiya va yuborish himoyasi

Ommaviy formalar `/functions/v1/community-submit` Edge Function orqali yoziladi; brauzer endi `team_posts` yoki `team_interest_requests` jadvaliga to‘g‘ridan-to‘g‘ri INSERT qilmaydi.

- `team_posts`: e’lonlar serverda `pending` statusi bilan saqlanadi; ommaviy doskada faqat admin tasdiqlagan `published` yozuvlar chiqadi.
- `team_interest_requests`: faqat hali ochiq/published e’longa qiziqish qabul qilinadi; kontakt va xabar ommaviy katalogga qo‘shilmaydi.
- Rozilik belgilanmasa Edge Function arizani qabul qilmaydi. Formada spamga qarshi ko‘rinmas honeypot maydonlari ham bor.
- `community_submission_rate_limits` jadvali IP manzilining o‘zini emas, SHA-256 xeshini saqlaydi. Har bir xesh uchun jamoa e’loni 24 soatda 2 tagacha, qiziqish so‘rovi 10 daqiqada 5 tagacha cheklanadi. Bu qat’iy identifikatsiya emas; proksi tarmoqlari va dinamik IP sababli chegaralar umumiy himoya sifatida ishlaydi.
- `community_submission_rate_limits` va quota RPC uchun `anon`/ `authenticated` ruxsatlari yopiq; yozuv faqat server-side Edge Function xizmat roli orqali bajariladi.
- `initiative_showcase`: faqat admin tasdiqlagan yozuvlar public bo‘ladi; foydalanuvchi bitta loyiha uchun bir marta ovoz beradi.
- `ai_review_rate_limits`: AI tahlil endpointi uchun server tomonidagi alohida limit.

Moderatsiya spam, ruxsatsiz e’lonlar va foydalanuvchi roziligisiz kontakt ommaga chiqish xavfini kamaytiradi. Lekin bu barcha zararli xabarlarni to‘liq yo‘qotishga kafolat bermaydi — admin tasdiqlashi zarur.

## 6. Ishga tushirishdan oldingi nazorat

- [ ] Vercel’da haqiqiy production URL oling.
- [ ] Supabase Auth URL’larini sozlang.
- [ ] Groq va Telegram secret’larini Supabase’da qo‘shing.
- [ ] Telegram webhook’ni o‘rnating va test xabarini tekshiring.
- [ ] AI tahlilini ham limit, ham maxfiy ma’lumot filtri bilan sinang.
- [ ] Jamoa e’loni yuborish → admin tasdiqlash → ommaviy doska → qiziqish formasi zanjirini sinang.
- [ ] Showcase e’lon qilish → login bilan ovoz berish oqimini sinang.
- [ ] Operatorning haqiqiy aloqa manzilini, ma’lumotlarni saqlash muddatini va o‘chirish tartibini maxfiylik sahifasida tasdiqlang.


## 7. Backend-only tables and security advisor notes

- `ai_review_rate_limits` and `telegram_subscriptions` intentionally have no public-table grants. They are accessed by server-side Edge Functions using the Supabase service role; the corresponding RLS policies now document that boundary.
- Admin review RPCs are `SECURITY DEFINER` because they read/write private review fields. Each function checks the signed-in user's active email against `admin_allowlist`; anonymous execution is revoked. Supabase's generic security advisor may still report that authenticated users can execute these functions. Treat the report as a reminder to keep those internal allowlist checks and function grants covered by tests—not as proof that the functions are publicly accessible.
- Enable leaked-password protection in Supabase Auth if password-based sign-in is enabled. The current user/admin entry points primarily use email magic links; this setting is still a worthwhile defense-in-depth measure.
