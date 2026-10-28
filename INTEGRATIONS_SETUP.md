# Yoshlar-Ishi — AI, Telegram va servis katalogi sozlamalari

Bu hujjat loyiha kodida tayyor bo‘lgan funksiyalarni xavfsiz ishga tushirish tartibini tushuntiradi. Hech bir token yoki maxfiy kalit GitHub kodiga, brauzerga yoki ChatGPT suhbatiga joylanmasin.

## 1. Kengaytirilgan davlat xizmatlari katalogi

- Public qo‘llanma: `/davlat-xizmatlari.html`
- Public bosh sahifa: `/index.html`
- Shaxsiy kabinet: `/kabinet.html`
- Maxfiylik: `/privacy.html`

Katalog `public.official_portal_integrations` jadvalidagi xizmat yozuvlaridan foydalanadi. Har bir yozuvda kategoriya, tushuntirish, foydalanuvchi auditoriyasi, xususiyatlar, bosqichlar, mumkin bo‘lgan hujjatlar, to‘lov va muddat eslatmasi, kontakt, teglar, manba havolasi va rasm uchun alt/credit maydonlari bor.

Rasmiy xizmatlar katalogi — mustaqil tushuntiruvchi qatlam. Ariza, OneID, to‘lov va rasmiy qaror tegishli davlat portalida bajariladi. Rasmiy API/SSO ulanishi tasdiqlanmagan yozuvni ulangan deb belgilamang.

### Rasmiy manbani tahrirlash
Admin → **Tashqi integratsiyalar** bo‘limida katalog holati, texnik hujjat havolasi va ichki izohni boshqaring. Ichki izohlar alohida `official_portal_admin_notes` jadvalida saqlanadi va public foydalanuvchilarga berilmaydi.

## 2. AI g‘oya tahlili

Edge Function URL:
`https://nnodsqnqsqrmzcycrmpr.supabase.co/functions/v1/idea-review`

### Sozlash
1. [Groq API Keys](https://console.groq.com/keys) orqali o‘zingiz API kalit yarating.
2. [Supabase Edge Function Secrets](https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/functions/secrets) sahifasiga kiring.
3. `GROQ_API_KEY` nomi bilan kalitni Secret sifatida saqlang.
4. Ixtiyoriy ravishda `GROQ_MODEL` ni `openai/gpt-oss-20b` ga qo‘ying va `AI_RATE_LIMIT_SALT` uchun o‘zingiz yaratgan tasodifiy maxfiy satr ishlating.
5. GitHub Actions muvaffaqiyatli tugagach, bosh sahifadagi AI yordamchini sinab ko‘ring.

Funksiya shaxsiy identifikator/aloqa naqshlarini aniqlasa so‘rovni to‘xtatadi va Supabase’dagi hash asosidagi vaqtinchalik limitdan foydalanadi. Limit default holatda har IP hash uchun bir daqiqada 4 ta tahlil. G‘oya matni bazaga saqlanmaydi. Bu AI javobi maslahat hisoblanadi, grant yoki davlat yordami kafolati emas.

**Hozirgi holat:** server funksiyasi joylangan; Groq kaliti sozlanmasa sayt aniq ogohlantirish beradi va lokal qoidaviy tahlilni ko‘rsatadi. Kalitni faqat Supabase Secrets’ga kiriting.

## 3. Telegram kuzatuv boti

Funksiyalar:
- `telegram-webhook`: bot buyruqlarini qabul qiladi.
- `telegram-notify`: admin ariza holatini o‘zgartirgandan keyin obunachilarga xabar yuboradi.

### Botni yaratish va sozlash
1. Telegram’da rasmiy [@BotFather](https://t.me/BotFather) bilan bot yarating va token oling.
2. Supabase Edge Function Secrets’ga quyidagilarni qo‘shing:
   - `TELEGRAM_BOT_TOKEN` — BotFather bergan token.
   - `TELEGRAM_WEBHOOK_SECRET` — o‘zingiz yaratgan 32+ belgili tasodifiy sir.
3. Botning username’ini `config.js` dagi `telegramBotUsername` qiymatiga kiriting. Bu username public bo‘lishi mumkin; token esa hech qachon emas.
4. Webhook’ni o‘zingizning xavfsiz terminalingizdan ro‘yxatdan o‘tkazing. Terminalda env qiymatlarini to‘ldiring, keyin:
   ```bash
   curl --request POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     --header "Content-Type: application/json" \
     --data "{\"url\":\"https://nnodsqnqsqrmzcycrmpr.supabase.co/functions/v1/telegram-webhook\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\",\"drop_pending_updates\":true}"
   ```
   Tokenni source code yoki issue’ga joylamang. Shell tarixida tokenning saqlanish xavfini hisobga oling; kerak bo‘lsa tokenni keyin almashtiring.
5. Botga shaxsiy chatda `/start` yuboring.

### Buyruqlar
- `/link YI-XXXXXXXXXXXXXXXXXXXXXXXX` — kuzatuv kodiga obuna bo‘lish.
- `/status YI-XXXXXXXXXXXXXXXXXXXXXXXX` — o‘sha chat uchun ulangan ariza holatini ko‘rish.
- `/unlink YI-XXXXXXXXXXXXXXXXXXXXXXXX` — ushbu ariza xabarnomasini to‘xtatish.

Bot faqat ariza sarlavhasi va holatini ko‘rsatadi. Kuzatuv kodi maxfiy: uni boshqa odamga yubormang. Foydalanuvchi telefon/emaili Telegram orqali tarqatilmaydi. Xabarnoma funksiyasi admin tokeni va allowlist tekshiruvidan o‘tadi.

**Hozirgi holat:** Edge Functions joylangan, lekin `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` va bot username egasi tomonidan kiritilmaguncha bildirishnomalar amalda yuborilmaydi.

## 4. Shaxsiy kabinet

- Email magic-link orqali kirish (parol saqlanmaydi).
- Kabinet orqali yuborilgan tashabbuslar `owner_id` bilan bog‘lanadi.
- `get_my_initiatives()` va `update_my_initiative(...)` RPC’lari faqat o‘z akkauntining xavfsiz maydonlarini qaytaradi/tahrirlaydi; admin ichki izohlarini bermaydi.
- Anonim yuborilgan eski arizalar avtomatik bog‘lanmaydi: kod egasini tasdiqlash alohida jarayon talab qiladi.

Deploydan so‘ng [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/auth/url-configuration) sahifasida haqiqiy production domen va `/kabinet.html` hamda `/admin.html` redirect manzillarini qo‘shing.

## 5. Jamoa doskasi va Top tashabbuslar

- `team_posts`: foydalanuvchi e’loni avval `pending`; admin tasdiqlagach public ko‘rinadi.
- `team_interest_requests`: qiziqish bildirish formasi orqali yuborilgan shaxsiy aloqa adminlarga ko‘rinadi, public API undan o‘qiy olmaydi.
- `initiative_showcase`: faqat admin kiritgan/tasdiqlagan yozuvlar public; ovozlar autentifikatsiyalangan hisob uchun bir loyiha — bir ovoz.
- `ai_review_rate_limits` va `consume_idea_review_quota`: AI endpointni suiiste’mol qilishni cheklash uchun server tomonidagi limit.

Public foydalanuvchi jo‘natgan e’lonlar moderatsiya qilinmaguncha ko‘rinmaydi. Moderatsiya — spam va shaxsiy ma’lumotni ommaga chiqarib yuborish xavfini kamaytirish uchun ataylab qo‘yilgan.

## 6. Ishga tushirishdan oldingi tekshiruv

- [ ] Vercel’da haqiqiy production deployment URL oling.
- [ ] Supabase Auth URL’larini sozlang.
- [ ] Groq va Telegram secrets’larini Supabase’da qo‘shing.
- [ ] Telegram webhook’ni o‘rnating va test xabarini tekshiring.
- [ ] AI tahlilining limit va no-PII tekshiruvini sinang.
- [ ] Jamoa e’loni yuborish → admin tasdiqlash → public ko‘rinish → qiziqish formasi zanjirini sinang.
- [ ] Showcase loyiha qo‘shish → public e’lon → akkaunt bilan ovoz berish oqimini sinang.
- [ ] Operatorning haqiqiy kontaktini, ma’lumot saqlash muddatini va o‘chirish jarayonini maxfiylik sahifasida tasdiqlang.
