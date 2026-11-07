-- Add a distinct professional-education tuition-support path and refresh the official 2+6 route.

update public.youth_opportunity_programs
set summary='14–30 yoshdagi, belgilangan til sertifikatiga ega va tasdiqlangan markazda o‘qishga tayyor yoshlar uchun dastlabki 2 oydan keyin 6 oygacha subsidiya mexanizmi.',
 benefit='Birinchi 2 oylik to‘lovni yoshning o‘zi amalga oshiradi. Keyingi 6 oygacha davlat hudud bo‘yicha BHM chegarasida subsidiya ajratishi mumkin; kamida 70% davomat talab qilinadi.',
 audience_tags=array['14–30 yoshdagi O‘zbekiston fuqarosi yoki rezidenti','Ingliz, nemis, fransuz, koreys, xitoy yoki yapon tilini o‘rganmoqchi bo‘lgan yoshlar','B1 darajadagi sertifikat yoki unga teng hujjati bor talabgorlar'],
 eligibility='{"min_age":14,"max_age":30,"residency":"O‘zbekiston fuqarosi yoki rezidenti bo‘lishi kerak.","required_certificate":"B1 darajadagi sertifikat yoki unga teng hujjat; qabul qilinadigan sertifikat va til bo‘yicha mezonni 2plus6.uz sahifasida tekshiring.","required_payment":"Dastlabki 2 oy o‘qish xarajati ariza beruvchi tomonidan to‘lanadi.","attendance":"Subsidiya uchun o‘quv davomatining kamida 70 foizi talab qilinadi.","provider_condition":"Faqat dasturda tasdiqlangan o‘quv markazi va kursni tanlang.","monthly_caps":"Toshkent shahri — 2 BHMgacha; viloyat markazlari va Qoraqalpog‘iston — 1,5 BHMgacha; tuman/shaharlar — 1 BHMgacha.","application":"Yonda ilovasida OneID orqali ro‘yxatdan o‘ting, til va sertifikatni kiriting, motivatsion xat yozing, markaz/kursni tanlang va raqamli shartnomani tasdiqlang.","important":"Subsidiya mablag‘ limiti, sertifikat tekshiruvi, markaz tasdig‘i va davomatga bog‘liq; avtomatik kafolat emas."}'::jsonb,
 steps='["14–30 yosh va fuqarolik/rezidentlik shartlariga mosligingizni tekshiring.","2plus6.uz rasmiy sahifasida B1 yoki unga teng sertifikat bo‘yicha talabni tekshiring.","Faqat tasdiqlangan markaz, filial va kursni tanlang; markazning hozirgi ro‘yxatda borligini saytdan tekshiring.","Yonda ilovasini oching va OneID orqali tizimga kiring.","Til va sertifikat ma’lumotlarini kiriting, motivatsion xat yozing, markaz/til/kursni tanlang va raqamli shartnomani ko‘rib chiqing.","Dastlabki 2 oy uchun to‘lovni amalga oshiring va kvitansiyani saqlang.","Davomatni kamida 70 foizda ushlang; ilovada subsidiya va ariza holatini kuzating."]'::jsonb,
 documents='["B1 darajadagi til sertifikati yoki teng hujjat (Yonda / rasmiy portal qabul qiladigan shaklda).","OneID orqali aniqlanadigan shaxsiy ma’lumotlar.","Tanlangan o‘quv markazi va kurs ma’lumotlari.","2 oylik dastlabki to‘lov kvitansiyasi.","Yonda tizimi so‘raydigan motivatsion xat va raqamli shartnoma."]'::jsonb,
 application_channel='Yonda ilovasida OneID orqali ariza topshiriladi. 2plus6.uz rasmiy sahifasida talablar, tasdiqlangan markazlar va dastur tafsilotlarini tekshiring.',
 application_url='https://2plus6.uz/opportunity',
 source_title='2+6 — Yoshlar ishlari agentligining rasmiy dastur platformasi',
 source_url='https://2plus6.uz/opportunity',
 secondary_source_url='https://gov.uz/oz/yoshlar/news/view/130427',
 status_note='Rasmiy sahifa: 14–30 yosh, B1 yoki teng sertifikat va kamida 70% davomat. Markaz tasdig‘i, kvota va ariza holatini Yonda ichida qayta tekshiring.',
 verified_on='2026-11-07',updated_at=now()
where slug='2-plus-6';

insert into public.youth_opportunity_programs
(slug,title,provider,category,summary,benefit,age_min,age_max,audience_tags,eligibility,steps,documents,application_channel,application_url,source_title,source_url,secondary_source_url,deadline_note,status_note,verified_on,active,featured,sort_order)
values (
 'yoshlar-daftari-kontrakt','“Yoshlar daftari” — kunduzgi kontraktni qisman qoplash',
 'Yoshlar daftari jamg‘armasi · my.gov.uz · mahalla yettiligi','education',
 'Ijtimoiy reyestrga kiritilgan oilalarning 14–30 yoshdagi a’zolari uchun kunduzgi ta’lim shaklida kontrakt asosida o‘qiyotgan professional ta’lim va oliy ta’lim o‘quvchi-talabalariga mo‘ljallangan yordam.',
 'To‘lov-kontrakt summasining 50 foizigacha, biroq BHMning 50 baravaridan ko‘p bo‘lmagan miqdori qoplanishi mumkin. Arizalar 8 ish kuni ichida ko‘rib chiqiladi.',14,30,
 array['Ijtimoiy reyestrga kiritilgan oilaning 14–30 yoshdagi a’zolari','Texnikum, kollej yoki boshqa professional ta’lim tashkilotida kunduzgi kontrakt asosida o‘qiyotganlar','Kunduzgi ta’limda kontrakt asosida o‘qiyotgan davlat yoki nodavlat OTM talabalari'],
 '{"min_age":14,"max_age":30,"social_register":"Oila Ijtimoiy reyestrga kiritilgan bo‘lishi kerak.","study_mode":"Faqat kunduzgi ta’lim shakli.","eligible_education":"Professional ta’lim tashkilotlari o‘quvchilari; davlat/nodavlat OTM talabalari; O‘zbekistondagi xorijiy OTM va filiallarining bakalavriat yoki magistratura talabalari.","benefit_cap":"Kontrakt summasining 50 foizigacha, lekin BHMning 50 baravaridan oshmaydi.","review_time":"Ariza 8 ish kuni ichida ko‘rib chiqiladi.","not_eligible":"Ikkinchi va keyingi mutaxassislik; sirtqi, kechki yoki masofaviy ta’lim; qo‘shma ta’lim dasturlari; super-kontrakt.","payment_condition":"Ijobiy qarordan keyin mablag‘ ta’lim tashkilotining hisobiga ijtimoiy shartnoma bajarilishi darajasiga qarab o‘tkaziladi.","important":"Ijtimoiy reyestr sharti, ta’lim shakli va kontrakt turi mos kelmasa, ushbu yordam berilmaydi. Ariza yuborish yordamni kafolatlamaydi."}'::jsonb,
 '["Yoshingiz 14–30 oralig‘ida ekanini va oilangiz Ijtimoiy reyestrga kiritilganini tekshiring.","Professional ta’lim tashkiloti yoki OTMda aynan kunduzgi ta’lim shaklida kontrakt asosida o‘qiyotganingizni aniqlang.","Ikkinchi mutaxassislik, sirtqi/kechki/masofaviy ta’lim, qo‘shma dastur yoki super-kontrakt holati yo‘qligini tekshiring.","my.gov.uz portaliga kiring va “Yoshlar daftari” jamg‘armasi hisobidan kontrakt xarajatining bir qismini qoplash xizmatini qidiring.","Portal so‘ragan ma’lumotlarni to‘ldiring; kontrakt va o‘qish haqidagi ma’lumotlarni portal ko‘rsatmasiga muvofiq kiriting.","Arizani yuboring va 8 ish kunigacha bo‘lgan ko‘rib chiqish muddatini hisobga oling.","Natijani my.gov.uz va xabarnomalar orqali kuzating; ma’qullansa ijtimoiy shartnoma shartlarini bajaring."]'::jsonb,
 '["Shaxsiy ma’lumotlar — my.gov.uz OneID orqali olinishi mumkin.","Kunduzgi ta’limda o‘qiyotganlik va professional ta’lim/OTM ma’lumotlari.","Amaldagi to‘lov-kontrakt ma’lumotlari yoki shartnoma raqami.","Portal ariza formasida alohida so‘ragan qo‘shimcha ma’lumotlar; ortiqcha shaxsiy hujjat yuklamang."]'::jsonb,
 'Ariza my.gov.uz orqali yuboriladi. Ariza mahalla yettiligi tomonidan ko‘rib chiqiladi; natija portalda kuzatiladi.','https://my.gov.uz/uz',
 'Adliya vazirligi — Talabalar uchun to‘lov-kontrakt xarajatlarini qoplashda davlat yordami','https://advice.adliya.uz/oz/news/3230','https://my.gov.uz/uz/news/94e4304a-acf0-4d2f-8bde-6e300978739e',
 'Rasmiy xizmat oynasi va ariza qabulini my.gov.uz ichida tekshiring.',
 'Faqat Ijtimoiy reyestr, yosh, kunduzgi ta’lim va kontrakt turi bo‘yicha mezonlarga javob beradiganlar uchun. Ma’qullash kafolatlanmaydi.',
 '2026-11-07',true,true,15
)
on conflict (slug) do update set
 title=excluded.title,provider=excluded.provider,category=excluded.category,summary=excluded.summary,benefit=excluded.benefit,
 age_min=excluded.age_min,age_max=excluded.age_max,audience_tags=excluded.audience_tags,eligibility=excluded.eligibility,
 steps=excluded.steps,documents=excluded.documents,application_channel=excluded.application_channel,
 application_url=excluded.application_url,source_title=excluded.source_title,source_url=excluded.source_url,
 secondary_source_url=excluded.secondary_source_url,deadline_note=excluded.deadline_note,status_note=excluded.status_note,
 verified_on=excluded.verified_on,active=excluded.active,featured=excluded.featured,sort_order=excluded.sort_order,updated_at=now();
