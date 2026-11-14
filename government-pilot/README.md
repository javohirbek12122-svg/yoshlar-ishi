# Yoshlar-Ishi — davlat tashkiloti bilan pilot uchun tayyorgarlik paketi

**Versiya:** 0.1 · **Sana:** 14-noyabr 2026  
**Holat:** dastlabki ko‘rib chiqish va hamkorlik muhokamasi uchun. Davlat tasdig‘i yoki production ruxsati emas.

## Qisqa xulosa

Yoshlar-Ishi — yoshlar uchun davlat xizmatlari va rasmiy imkoniyatlarni topish, shartlarni tushunish, hujjatlarga tayyorlanish va keyingi qadamni aniqlashga yordam beruvchi mustaqil raqamli navigator. U my.gov.uz, OneID, PM.gov.uz yoki boshqa vakolatli davlat tizimining o‘rnini bosmaydi.

**Tavsiya etiladigan birinchi pilot:** Toshkent viloyati, Parkent tumanida 90 kunlik no-production sinov. Dastlab faqat ochiq rasmiy ma’lumotlar, sun’iy test yozuvlari va anonim foydalanish statistikasi. Davlat reyestrlari, real murojaatlar, JSHSHIR, ID-karta, OneID va maxfiy ish materiallari bilan integratsiya yo‘q.

## Hozirgi muhit — tekshirilgan faktlar

| Qism | Hozirgi holat | Davlat pilotiga ta’siri |
|---|---|---|
| Frontend | Statik HTML/CSS/JS; Vercel hosting | Namoyish/MVP uchun; tasdiqlangan davlat production hostingi emas |
| Ma’lumotlar bazasi | Supabase PostgreSQL 17; region ap-south-1 (Hindiston) | Cross-border ishlov bo‘yicha qonuniy shartlar isbotlanmaguncha fuqarolar ma’lumotlari bilan pilot qilinmaydi |
| Yig‘iladigan ma’lumotlar | Ism, yosh toifasi, hudud, tashabbus matni; ayrim formalar email/telefon oladi | Operator, qonuniy asos, saqlash muddati va processor shartlari tasdiqlanishi kerak |
| AI | Kalit sozlansa, g‘oya matni Groq API’ga uzatiladi | Davlat yoki shaxsiy ma’lumotli matnlar uchun hozircha ishlatilmaydi |
| Telegram | Ixtiyoriy bot obunasi va xabarlar | Rasmiy davlat bildirishnomasi emas |
| Davlat tizimlari | Katalogda rasmiy tashqi havolalar; tasdiqlangan API/SSO yo‘q | Integratsiya faqat ruxsat, operator va texnologik yo‘riqnoma bilan |
| Xavfsizlik | RLS, Edge Functions, admin allowlist, rate-limit va CI testlari mavjud | Mustaqil pentest, rasmiy ekspertiza, DR sinovi va SLA hali yo‘q |

## Pilot oldidagi to‘xtatuvchi shartlar

1. Davlat tomonidan biznes-egasi, ma’lumotlar egasi va texnik mas’ul belgilanmaguncha davlat ma’lumotlari qabul qilinmaydi.
2. Ma’lumotlar operatori/mulkdori, qonuniy asos, maqsad, retention, foydalanuvchi huquqlari va uchinchi tomonlar bo‘yicha shartlar yuridik tasdiqlanadi.
3. Supabase ap-south-1 uchun O‘RQ-547 27¹-moddasining amaldagi transchegaraviy shartlari yuridik xulosa bilan tekshiriladi. Region o‘z-o‘zidan noqonuniy deb e’lon qilinmaydi; muvofiqlik dalili hozir mavjud emas.
4. Davlat ma’lumotlari uchun vakolatli operator tasdiqlagan hosting, identifikatsiya va integratsiya arxitekturasi belgilanadi.
5. Mustaqil VAPT/pentest, kritik va yuqori topilmalarni yopish, backup restore va incident-response sinovlari o‘tkaziladi.
6. Pilot ko‘lami, ishtirokchilar, natija ko‘rsatkichlari, mas’ul idoralar va xarajat tartibi kelishiladi.

## Hujjatlar

- [01 — Konsepsiya va rasmiy taqdim etish xati](./01_CONCEPT_NOTE_UZ.md)
- [02 — Qonunchilik va muvofiqlik matritsasi](./02_COMPLIANCE_MATRIX_UZ.md)
- [03 — Ma’lumotlar boshqaruvi va maqsadli arxitektura](./03_ARCHITECTURE_AND_DATA_UZ.md)
- [04 — Xavfsizlik auditi va bo‘shliqlar reyestri](./04_SECURITY_GAP_REGISTER_UZ.md)
- [05 — 90 kunlik pilot va qabul mezonlari](./05_PILOT_PLAN_UZ.md)
- [06 — Boshqaruv, operatsiya va javobgarlik](./06_GOVERNANCE_AND_OPERATIONS_UZ.md)

## Tayyorlik darajasi

- **Tayyor:** konsepsiya muhokamasi, texnik demonstratsiya, foydalanuvchi ehtiyojini o‘rganish, ochiq ma’lumotli no-production pilot taklifi.
- **Shartli:** login, foydalanuvchi ma’lumoti yoki tashqi AI — ruxsat, qonuniy asos, transfer va xavfsizlik ko‘rib chiqishidan keyin.
- **Hozir tayyor emas:** rasmiy davlat xizmati, davlat murojaatini qabul qilish/ro‘yxatga olish, OneID/idoralararo tarmoq, shaxsiy yoki maxfiy davlat ma’lumotlarini production’da qayta ishlash.

Bu paket yuridik xulosa, kiberxavfsizlik sertifikati, UZINFOCOM kelishuvi yoki davlat xaridi shartnomasi o‘rnini bosmaydi.
