# Maqsadli arxitektura va ma’lumotlar boshqaruvi

## 1. Hozirgi muhitning xaritasi

Hozirgi oqim:
- Fuqarolar brauzeri → Vercel statik frontend.
- Frontend → Supabase Auth/PostgreSQL.
- Ommaviy tashabbus va jamoa so‘rovlari → Supabase Edge Functions → PostgreSQL.
- AI kaliti sozlangan bo‘lsa: Edge Function → Groq API.
- Telegram bot yoqilgan bo‘lsa: Edge Function → Telegram Bot API.
- Davlat katalogi havolalari → tegishli rasmiy saytlar.

Supabase project regioni ap-south-1 (Hindiston), PostgreSQL 17. Brauzerda publishable/anon key ishlatiladi; service-role kalit frontendga joylanmagan. Tashqi havola API, SSO yoki idoralararo ma’lumot almashinuvi emas.

## 2. Pilot bosqichlari

**1-bosqich — ochiq ma’lumotli navigator.** Ochiq xizmatlar, rasmiy havolalar, manba egasi, tekshirilgan sana va tushunarli qadamlar. Anonim foydalanish ustuvor; real davlat murojaati saqlanmaydi.

**2-bosqich — idora tasdiqlagan kontent.** Har bir xizmat kartasi uchun kontent egasi, mas’ul xodim, tekshiruv sanasi, o‘zgarish tarixi va foydalanuvchi xatosini yuborish kanali.

**3-bosqich — ruxsatli integratsiya.** Faqat tizim egasi, operator va texnologik yo‘riqnoma mavjud bo‘lsa. OneID yoki idoralararo ma’lumotlar to‘g‘ridan-to‘g‘ri brauzerdan emas, vakolatli gateway orqali server-to-server almashiladi.

## 3. Tavsiya etiladigan target arxitektura

Fuqarolar/yoshlar → operator tasdiqlagan frontend → API Gateway/BFF → navigator va kontent katalogi. Identifikatsiya kerak bo‘lsa, OneID vakolatli usulda. Tashqi davlat ma’lumoti kerak bo‘lsa, idoralararo integratsiya qatlami va tizim egasi tasdiqlagan API. Ma’lumotlar bazasi tasdiqlangan hostingda; audit log, monitoring, zaxira va tiklash muhiti alohida.

Target muhitni buyurtmachi va operator tanlaydi. UZINFOCOM bilan texnik muhokamasiz VMQ 54 dagi Yagona platforma arxitekturasi yoki idoralararo tarmoqni chetlab o‘tadigan integratsiya qurilmaydi.

## 4. Har bir API yoki ma’lumot oqimi uchun majburiy qayd

- tizim egasi va texnik operator;
- API hujjati, versiyasi va test muhiti;
- ruxsat etilgan ma’lumot maydonlari va ishlov maqsadi;
- autentifikatsiya, vakolat, token muddati va kalit aylantirish;
- rate limit, timeout, retry, idempotency va xato kodlari;
- audit, monitoring va hodisaga javob;
- saqlash, qaytarish va o‘chirish qoidalari;
- integratsiyani favqulodda uzish usuli.

OneID paroli, foydalanuvchi sessiyasi yoki davlat tizimi tokeni Yoshlar-Ishi frontendida saqlanmaydi.

## 5. Joriy ma’lumotlar oqimi va pilot siyosati

| Ma’lumot | Hozirgi oqim | Pilot siyosati |
|---|---|---|
| Ochiq xizmat nomi, URL, talablar | Katalog → frontend | Rasmiy manba va tekshiruv sanasi bilan foydalanish |
| Ism, yosh toifasi, tuman | Tashabbus formasi → Edge Function → Supabase | Sinovda real yozuv o‘rniga sintetik data |
| Tashabbus matni, kutilayotgan natija | Edge Function → Supabase | Maxfiy/rasmiy ish materiallari yuborilmaydi |
| Email/telefon va hamkorlik xabari | Forma → Supabase | Pilotda o‘chirish yoki alohida ruxsat va asos bilan cheklash |
| Akkaunt emaili/sessiyasi | Supabase Auth | Davlat identifikatori emas; tasdiqlangan auth modeli kerak |
| AI g‘oya matni | Edge Function → Groq (kalit bo‘lsa) | Pilotda davlat yoki shaxsiy data uchun o‘chiriladi |
| Telegram chat/user ID | Edge Function → Supabase/Telegram | Rasmiy davlat xabarnomasi sifatida ishlatilmaydi |
| Yo‘l xaritasi statusi | Foydalanuvchi o‘zi kiritadi | Shaxsiy eslatma; davlat arizasi holati emas |

## 6. Ma’lumotlarni boshqarish qoidalari

Har bir maydon uchun data dictionary bo‘lsin: nomi, ma’nosi, maqsadi, maxfiylik toifasi, qonuniy asos, kim ko‘rishi, retention, o‘chirish usuli, uchinchi tomon va loglarda ko‘rinish holati.

Majburiy tamoyillar:
1. Maqsadga mos minimal ma’lumot; kerak bo‘lmasa maydon yig‘ilmaydi.
2. Rozilik aniq va alohida; boshqa qonuniy asos bo‘lsa, hujjatlashtiriladi.
3. Har bir ma’lumot turi uchun retention tasdiqlanadi; cheksiz saqlash default emas.
4. Tuzatish/o‘chirish so‘rovlari uchun mas’ul va muddat.
5. Admin, operator va kontent muharriri rollari ajratiladi.
6. Agregat tahlildan shaxsni qayta aniqlash xavfi kamaytiriladi.
7. Test, demo va production alohida; production ma’lumoti testga ko‘chirilmaydi.

## 7. Voyaga yetmagan foydalanuvchilar

Auditoriyada 18 yoshga to‘lmagan yoshlar bo‘lishi mumkin. Yosh toifasini yig‘ish zarurati, ota-ona/qonuniy vakil roziligi yoki boshqa qonuniy asos, ochiq kontaktlar xavfi, aniq joylashuvni yig‘maslik va yoshlar matnlarining AI provayderiga uzatilishi yuridik hamda privacy review’da alohida tekshiriladi.

## 8. Hosting va transchegaraviy ishlov

Joriy Supabase regioni ap-south-1 (Hindiston). O‘RQ-547 27¹-moddasining 2026-yilgi tahririga ko‘ra ayrim toifalar O‘zbekistonda saqlanishi shart; boshqa shaxsga doir ma’lumotlarni chet elda ishlash faqat qonunda sanalgan shartlardan biri bajarilganda mumkin. Hindistondagi muhit bo‘yicha bunday shart bajarilganini tasdiqlovchi yuridik xulosa yoki shartnoma dalili hozir mavjud emas.

**Shu sababli:** davlat pilotining real foydalanuvchi ma’lumotlari ushbu muhitga ko‘chirilmaydi. Hosting joyi, bazani davlat reyestrida ro‘yxatdan o‘tkazish zarurati va provayder shartlari vakolatli idora/yurist tomonidan tasdiqlanadi.
