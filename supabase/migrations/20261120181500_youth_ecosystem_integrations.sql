-- Youth ecosystem registry additions. External links do not represent an API/SSO connection.
insert into public.official_portal_integrations
(slug,name,agency,purpose,portal_url,docs_url,connection_mode,connection_status,auth_required,active,verified_on,admin_notes,category,detail_text,sort_order)
values
('startupbase','StartupBase — startap ekotizimi','StartupBase','Startap dasturlari, akseleratsiya, mentorlar va investor resurslari.','https://new.startupbase.uz/uz','https://startupbase.uz/en/digital-startups-program/apply','external_link','link_only',false,true,current_date,'API/SSO kelishuvi yo‘q; faqat rasmiy havola.','business','Raqamli Startaplar dasturi mezonlari: O‘zbekistonda yuridik shaxs, faoliyat muddati 5 yildan oshmagan, yillik tushum 10 mlrd so‘mdan oshmasligi.',10),
('it-park-startups','IT Park — startap inkubatsiyasi va akseleratsiyasi','IT Park Uzbekistan','Inkubatsiya, akseleratsiya va investor resurslari.','https://www.it-park.uz/en/itpark/startups','','external_link','link_only',false,true,current_date,'API/SSO kelishuvi tasdiqlanmagan.','business','G‘oya bosqichidagi loyihalar uchun inkubatsiya; mahsuloti bor loyihalar uchun akseleratsiya.',20),
('youth-agency-contests','Yoshlar ishlari agentligi — tanlovlar','Yoshlar ishlari agentligi','Yoshlar tanlovlari va rasmiy chaqiriqlar.','https://gov.uz/oz/yoshlar/contest','','external_link','link_only',false,true,current_date,'Rasmiy e’lonlar katalogi; Yoshlar-Ishi ariza yubormaydi.','youth','Har bir tanlov talabi va muddati rasmiy manbada tekshiriladi.',30),
('mygov-api-manager','my.gov.uz API Manager — ruxsat so‘rash','Raqamli hukumat','Davlat xizmatlari API uchun tashkilot nomidan ruxsat so‘rash.','https://integration.my.gov.uz/request-access','https://integration.my.gov.uz/request-access','public_api','approval_needed',true,true,current_date,'API ulanishi mavjud emas. Vakolatli tashkilot STIR, xodim PINFL va loyiha tavsifi bilan ruxsat so‘raydi.','public_services','Ruxsat va texnik sinovsiz davlat API ulanishi yo‘q.',40),
('open-data-portal','Ochiq ma’lumotlar portali','Ochiq ma’lumotlar tizimi','Ochiq davlat datasetlari va statistik ma’lumotlar.','https://data.egov.uz/','','external_link','docs_needed',false,true,current_date,'API, litsenziya va yangilanish chastotasi dataset bo‘yicha tekshiriladi.','open_data','Hozircha katalogga yo‘naltirish; avtomatik sinxronlash yo‘q.',50),
('hh-uz','hh.uz — ish va stajirovka','HeadHunter Uzbekistan','Vakansiyalarni tashqi portalda qidirish.','https://hh.uz/','','external_link','link_only',false,true,current_date,'API yoki scraping kelishuvi tasdiqlanmagan.','employment','Vakansiyalar asl ish beruvchi e’lonida ko‘riladi.',60),
('ustoz-ai','Ustoz AI — ta’lim va kasbiy ko‘nikmalar','Ustoz AI','Kasb va ta’lim kurslarini topish.','https://www.ustoz.ai/uz','','external_link','link_only',false,true,current_date,'API integratsiyasi tasdiqlanmagan; narx va mavjudlik portalda tekshiriladi.','education','Tashqi ta’lim resursi.',70),
('yonda-2plus6','Yonda / 2+6 — til kursi subsidiyasi','Yoshlar ishlari agentligi','2+6 dasturi shartlari va Yonda ilovasiga yo‘naltirish.','https://2plus6.uz/','','external_link','link_only',true,true,current_date,'Yonda API/OneID integratsiyasi mavjud emas. Sertifikat talabini yozma aniqlashtiring.','education','Kvota va qabul holati Yonda ilovasida tekshiriladi.',80)
on conflict (slug) do update set
 name=excluded.name,agency=excluded.agency,purpose=excluded.purpose,portal_url=excluded.portal_url,docs_url=excluded.docs_url,
 connection_mode=excluded.connection_mode,connection_status=excluded.connection_status,auth_required=excluded.auth_required,
 active=excluded.active,verified_on=excluded.verified_on,admin_notes=excluded.admin_notes,category=excluded.category,
 detail_text=excluded.detail_text,sort_order=excluded.sort_order,updated_at=now();

insert into public.opportunity_sources(title,description,category,url,provider,verified_on,active)
select v.title,v.description,v.category,v.url,v.provider,current_date,true from (values
 ('StartupBase — startap ekotizimi','Raqamli startaplar va ekotizim resurslari.','startup','https://new.startupbase.uz/uz','StartupBase'),
 ('Raqamli Startaplar dasturi — talablar','Yuridik shaxs, faoliyat muddati, tushum va raqamli mahsulot mezonlari.','startup','https://startupbase.uz/en/digital-startups-program/apply','StartupBase'),
 ('Yoshlar agentligi — tanlovlar','Agentlikning rasmiy tanlov va e’lonlar katalogi.','competition','https://gov.uz/oz/yoshlar/contest','Yoshlar ishlari agentligi'),
 ('IT Park — startap inkubatsiyasi','Inkubatsiya, akseleratsiya va investor resurslari.','startup','https://www.it-park.uz/en/itpark/startups','IT Park'),
 ('my.gov API Manager','Tashkilotlar uchun API ruxsat so‘rash sahifasi.','public_services','https://integration.my.gov.uz/request-access','Raqamli hukumat'),
 ('Ochiq ma’lumotlar portali','Ochiq davlat datasetlari.','open_data','https://data.egov.uz/','Ochiq ma’lumotlar portali'),
 ('hh.uz — vakansiyalar','Ish va stajirovka e’lonlari.','employment','https://hh.uz/','HeadHunter Uzbekistan'),
 ('Ustoz AI — kurslar','Kasbiy ta’lim resursi.','education','https://www.ustoz.ai/uz','Ustoz AI'),
 ('2+6 — til subsidiyasi','Rasmiy shartlar va Yonda ilovasiga yo‘naltirish.','education','https://2plus6.uz/','Yoshlar ishlari agentligi')
) v(title,description,category,url,provider)
where not exists(select 1 from public.opportunity_sources s where s.url=v.url);

insert into public.youth_opportunity_programs
(slug,title,provider,category,summary,benefit,audience_tags,eligibility,steps,documents,application_channel,application_url,source_title,source_url,secondary_source_url,deadline_note,status_note,verified_on,active,featured,sort_order,availability_status)
values ('digital-startups-program','Digital Startups Program — raqamli startaplar dasturi','StartupBase / Raqamli Startaplar dasturi','business',
 'O‘zbekistonda ro‘yxatdan o‘tgan, faoliyati 5 yildan oshmagan, yillik tushumi 10 mlrd so‘mdan ko‘p bo‘lmagan, raqamli texnologiyaga asoslangan va xalqaro bozorga chiqish salohiyatiga ega kompaniyalar uchun.',
 'Rasmiy dasturda moliyaviy qo‘llab-quvvatlash, mentorlik, intellektual mulk va global bozorga chiqish mexanizmlari ko‘rsatilgan. Aniq yordam turi nizom va saralashga bog‘liq.',
 ARRAY['O‘zbekistonda ro‘yxatdan o‘tgan yuridik shaxs','Faoliyat muddati 5 yildan oshmagan','Yillik tushum 10 mlrd so‘mdan oshmasligi','Raqamli mahsulot va eksport salohiyati'],
 jsonb_build_object('legal_entity','O‘zbekistonda ro‘yxatdan o‘tgan yuridik shaxs.','operating_period','Faoliyat muddati 5 yildan oshmasligi.','annual_revenue','Yillik tushum 10 mlrd so‘mdan oshmasligi.','business_model','Raqamli texnologiyaga asoslangan, yuqori o‘sish va xalqaro bozorga chiqish salohiyatiga ega model.','identity','Ariza OneID orqali vakolatli shaxs tomonidan topshiriladi.','age_note','Dastur kompaniya mezonlarini belgilaydi, yosh chegarasini emas.'),
 jsonb_build_array('Kompaniya STIR va ro‘yxatdan o‘tgan sanasini tayyorlang.','Pitch deck va biznes modelni tayyorlang.','Rasmiy nizom va qabul holatini tekshiring.','OneID orqali rasmiy ariza topshiring.','Ariza holatini StartupBase portalida kuzating.'),
 jsonb_build_array('Yuridik shaxs va STIR ma’lumoti','Pitch deck (PDF/PPT/PPTX)','Biznes model (PDF)','Vakolatli shaxs OneID identifikatsiyasi'),
 'StartupBase rasmiy ariza platformasi.','https://startupbase.uz/en/digital-startups-program/apply',
 'StartupBase — Digital Startups Program','https://startupbase.uz/en/digital-startups-program/apply',
 'https://new.startupbase.uz/uz/programs/digital-startups-program/3',
 'Umumiy doimiy muddat ko‘rsatilmagan. Joriy qabul va hujjatlar rasmiy portalda tekshiriladi.',
 '2026-11-20 holatida rasmiy sahifada ariza va mezonlar ko‘rsatilgan. Yoshlar-Ishi ariza yubormaydi, OneID ma’lumotini olmaydi va qabulni kafolatlamaydi.',
 current_date,true,false,65,'unverified')
on conflict (slug) do update set
 title=excluded.title,provider=excluded.provider,category=excluded.category,summary=excluded.summary,benefit=excluded.benefit,
 audience_tags=excluded.audience_tags,eligibility=excluded.eligibility,steps=excluded.steps,documents=excluded.documents,
 application_channel=excluded.application_channel,application_url=excluded.application_url,source_title=excluded.source_title,
 source_url=excluded.source_url,secondary_source_url=excluded.secondary_source_url,deadline_note=excluded.deadline_note,
 status_note=excluded.status_note,verified_on=excluded.verified_on,active=excluded.active,featured=excluded.featured,
 sort_order=excluded.sort_order,availability_status=excluded.availability_status,updated_at=now();

update public.youth_opportunity_programs set availability_status='closed',
 deadline_note='Rasmiy e’londa oxirgi sana 2026-11-15. 2026-11-20 holatida muddat o‘tgan.',
 status_note=concat_ws(' ',nullif(status_note,''),'2026-11-20: 15-noyabr muddati o‘tgan; e’lon ochiq qabul sifatida ko‘rsatilmaydi.'),
 verified_on=current_date,updated_at=now()
where slug='inson-huquqlari-innovatsion-tanlov-2026';
