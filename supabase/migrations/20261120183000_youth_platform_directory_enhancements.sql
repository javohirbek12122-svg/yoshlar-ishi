-- YIA digital platform and Besh Tashabbus official records.
-- These are verified external links, not API/SSO connections or live application openings.
insert into public.official_portal_integrations
(slug,name,agency,purpose,portal_url,connection_mode,connection_status,auth_required,active,verified_on,admin_notes,category,detail_text,features,steps,required_items,audience,icon_key,source_url,tags,sort_order)
values
('yia-platform','YIA — Yoshlar uchun imkoniyatlar platformasi','Yoshlar ishlari agentligi','Yoshlar yangiliklari, tadbirlar, kutubxonalar, ijtimoiy yordam, tadbirkorlik arizalari va takliflar platformasi.','https://yoshlar.gov.uz/uz','external_link','link_only',false,true,current_date,'Yoshlar-Ishi YIA tizimiga API/SSO orqali ulanmagan; faqat rasmiy havola.','youth','Yoshlar uchun Agentlikning alohida raqamli platformasi.','["Yoshlar yangiliklari","Tadbirlar va marafonlar","Ijtimoiy yordam va tadbirkorlik","Takliflar va qo‘llanmalar"]'::jsonb,'["Rasmiy platformani oching","Ro‘yxatdan o‘tish shartlarini tekshiring","Kerakli xizmatni rasmiy saytda davom ettiring"]'::jsonb,'["Rasmiy platforma so‘ragan ma’lumotlar"]'::jsonb,'Yoshlar va yoshlar tashkilotlari','users','https://yoshlar.gov.uz/uz',ARRAY['youth','events','opportunities','official'],5),
('besh-tashabbus-olimpiadasi','Besh tashabbus olimpiadasi','Yoshlar ishlari agentligi','Sport, IT, kitobxonlik, intellektual o‘yinlar va kasb-hunar musobaqalari haqida rasmiy ma’lumot.','https://gov.uz/oz/yoshlar/sections/view/31891','external_link','link_only',false,true,current_date,'Ro‘yxatdan o‘tish mavsumiy e’lon va yo‘nalishga bog‘liq; doimiy qabul oynasi tasdiqlanmagan.','youth','Maktab, professional ta’lim, OTM va tashkilotlar kesimidagi musobaqalar.','["Sport","Kibersport va IT","Yosh kitobxon va intellektual o‘yinlar","Kasb-hunar"]'::jsonb,'["O‘zingizga mos toifa va yo‘nalishni aniqlang","Joriy mavsum e’lonini tekshiring","Ro‘yxatdan o‘tish kanalini rasmiy sahifadan oling"]'::jsonb,'["Yo‘nalishga xos hujjatlar"]'::jsonb,'Maktab, professional ta’lim va OTM o‘quvchilari hamda yosh xodimlar','trophy','https://gov.uz/oz/yoshlar/sections/view/31891',ARRAY['youth','olympiad','sport','it','education'],25)
on conflict (slug) do update set name=excluded.name,agency=excluded.agency,purpose=excluded.purpose,portal_url=excluded.portal_url,connection_mode=excluded.connection_mode,connection_status=excluded.connection_status,auth_required=excluded.auth_required,active=excluded.active,verified_on=excluded.verified_on,admin_notes=excluded.admin_notes,category=excluded.category,detail_text=excluded.detail_text,features=excluded.features,steps=excluded.steps,required_items=excluded.required_items,audience=excluded.audience,icon_key=excluded.icon_key,source_url=excluded.source_url,tags=excluded.tags,sort_order=excluded.sort_order,updated_at=now();

insert into public.opportunity_sources(title,description,category,url,provider,verified_on,active)
select v.title,v.description,v.category,v.url,v.provider,current_date,true from (values
 ('YIA — Yoshlar uchun imkoniyatlar platformasi','Yoshlar yangiliklari, tadbirlar, ijtimoiy yordam va tadbirkorlik xizmatlari.','official','https://yoshlar.gov.uz/uz','Yoshlar ishlari agentligi'),
 ('Besh tashabbus olimpiadasi','Sport, kibersport, kitobxonlik, intellektual va kasb-hunar yo‘nalishlari.','competition','https://gov.uz/oz/yoshlar/sections/view/31891','Yoshlar ishlari agentligi')
) v(title,description,category,url,provider)
where not exists(select 1 from public.opportunity_sources s where s.url=v.url);

insert into public.youth_opportunity_programs
(slug,title,provider,category,summary,benefit,audience_tags,eligibility,steps,documents,application_channel,application_url,source_title,source_url,secondary_source_url,deadline_note,status_note,verified_on,active,featured,sort_order,availability_status)
values
('besh-tashabbus-olimpiadasi','Besh tashabbus olimpiadasi','Yoshlar ishlari agentligi','community',
 'Sport, axborot texnologiyalari, kitobxonlik va intellektual musobaqalar hamda kasb-hunar yo‘nalishlarida bosqichma-bosqich o‘tkaziladigan musobaqalar.',
 'Yo‘nalish va bosqichga qarab qatnashish, ko‘nikmalarni namoyish etish va hududiy/respublika bosqichlariga chiqish imkoniyati.',
 ARRAY['Maktab o‘quvchilari','Professional ta’lim o‘quvchilari','OTM talabalari','Yosh xodimlar'],
 jsonb_build_object('audience','Maktab, professional ta’lim, OTM va tashkilot yosh xodimlari uchun turli toifalar mavjud.','categories','Sport, kibersport/IT, kitobxonlik va intellektual o‘yinlar, kasb-hunar yo‘nalishlari.','registration','Ro‘yxatdan o‘tish mavsum va yo‘nalish bo‘yicha rasmiy e’londa ko‘rsatiladi.'),
 jsonb_build_array('O‘zingizga mos yo‘nalish va yosh/ta’lim toifasini aniqlang.','Joriy mavsum e’lonini rasmiy sahifadan tekshiring.','Ta’lim muassasasi yoki tashkilotdagi mas’ul koordinatordan aniqlik oling.','Faqat rasmiy ro‘yxatdan o‘tish kanali orqali qatnashing.'),
 jsonb_build_array('Yo‘nalishga xos hujjatlar va ro‘yxatdan o‘tish ma’lumotlari'),
 'Rasmiy tanlov e’loni va mavsumiy ro‘yxatdan o‘tish kanali.',
 'https://gov.uz/oz/yoshlar/sections/view/31891','Besh tashabbus olimpiadasi — rasmiy yo‘nalishlar',
 'https://gov.uz/oz/yoshlar/sections/view/31891','https://yoshlar.gov.uz/uz',
 'Yagona doimiy muddat yo‘q. Har bir mavsum va bosqich uchun rasmiy e’londagi sanani tekshiring.',
 '2026-11-20 holatida rasmiy yo‘nalishlar sahifasi mavjud; joriy qabul oynasi alohida tasdiqlanmagan.',
 current_date,true,false,70,'unverified')
on conflict (slug) do update set title=excluded.title,provider=excluded.provider,category=excluded.category,summary=excluded.summary,benefit=excluded.benefit,audience_tags=excluded.audience_tags,eligibility=excluded.eligibility,steps=excluded.steps,documents=excluded.documents,application_channel=excluded.application_channel,application_url=excluded.application_url,source_title=excluded.source_title,source_url=excluded.source_url,secondary_source_url=excluded.secondary_source_url,deadline_note=excluded.deadline_note,status_note=excluded.status_note,verified_on=excluded.verified_on,active=excluded.active,featured=excluded.featured,sort_order=excluded.sort_order,availability_status=excluded.availability_status,updated_at=now();
