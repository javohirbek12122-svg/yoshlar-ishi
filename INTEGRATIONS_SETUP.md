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

## 4. Shaxsiy kabinet

- Email magic-link orqali kirish; foydalanuvchi paroli saytga saqlanmaydi.
- Kabinet orqali yuborilgan tashabbus owner_id bilan bog‘lanadi.
- get_my_initiatives() va update_my_initiative(...) RPC’lari faqat shu akkauntga tegishli arizalarning xavfsiz maydonlarini o‘qiy/tahrirlaydi; admin ichki izohlari qaytarilmaydi.
- Eski anonim arizalar avtomatik profilga bog‘lanmaydi: kod egasini tasdiqlash uchun alohida tasdiqlash jarayoni kerak.

Deploydan keyin Supabase Auth URL Configuration’da haqiqiy production domenini va /kabinet.html hamda /admin.html redirect manzillarini qo‘shing:
https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/auth/url-configuration

## 5. Jamoa doskasi va Top tashabbuslar

- team_posts: yangi e’lon pending bo‘ladi; admin published qilgach ommaga ko‘rinadi.
- team_interest_requests: qiziqish bildirish formasidagi shaxsiy kontakt faqat admin paneliga ko‘rinadi.
- initiative_showcase: faqat admin kiritgan yoki tasdiqlagan yozuvlar public bo‘ladi; foydalanuvchi bitta loyiha uchun bir marta ovoz beradi.
- ai_review_rate_limits: AI tahlil endpointi uchun server tomonidagi limit.

Moderatsiya spamni hamda foydalanuvchi ruxsatisiz kontakt ommaga chiqish xavfini kamaytiradi.

## 6. Ishga tushirishdan oldingi nazorat

- [ ] Vercel’da haqiqiy production URL oling.
- [ ] Supabase Auth URL’larini sozlang.
- [ ] Groq va Telegram secret’larini Supabase’da qo‘shing.
- [ ] Telegram webhook’ni o‘rnating va test xabarini tekshiring.
- [ ] AI tahlilini ham limit, ham maxfiy ma’lumot filtri bilan sinang.
- [ ] Jamoa e’loni yuborish → admin tasdiqlash → ommaviy doska → qiziqish formasi zanjirini sinang.
- [ ] Showcase e’lon qilish → login bilan ovoz berish oqimini sinang.
- [ ] Operatorning haqiqiy aloqa manzilini, ma’lumotlarni saqlash muddatini va o‘chirish tartibini maxfiylik sahifasida tasdiqlang.

