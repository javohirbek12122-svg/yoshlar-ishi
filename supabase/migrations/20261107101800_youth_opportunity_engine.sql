-- Youth opportunity engine: public programme guidance + account-owned application journeys.
-- Public users may read active programmes. Only the account owner can read or change their own progress.

create table if not exists public.youth_opportunity_programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,100}$'),
  title text not null check (char_length(trim(title)) between 5 and 180),
  provider text not null default '',
  category text not null check (category in ('social_support','language','business','career','education','community')),
  summary text not null default '',
  benefit text not null default '',
  age_min integer,
  age_max integer,
  audience_tags text[] not null default '{}',
  eligibility jsonb not null default '{}'::jsonb check (jsonb_typeof(eligibility) = 'object' and octet_length(eligibility::text) <= 12000),
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array' and octet_length(steps::text) <= 16000),
  documents jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array' and octet_length(documents::text) <= 12000),
  application_channel text not null default '',
  application_url text not null default '',
  source_title text not null default '',
  source_url text not null check (source_url ~ '^https?://'),
  secondary_source_url text not null default '',
  deadline_note text not null default '',
  status_note text not null default '',
  verified_on date not null default current_date,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (age_min is null or age_min >= 0),
  check (age_max is null or age_max >= 0),
  check (age_min is null or age_max is null or age_min <= age_max)
);

alter table public.youth_opportunity_programs enable row level security;
revoke all privileges on public.youth_opportunity_programs from public, anon, authenticated;
grant select on public.youth_opportunity_programs to anon, authenticated;
grant insert, update, delete on public.youth_opportunity_programs to authenticated;

drop policy if exists "public can read active youth programmes" on public.youth_opportunity_programs;
create policy "public can read active youth programmes"
  on public.youth_opportunity_programs for select
  to anon, authenticated
  using (active = true);

drop policy if exists "admins manage youth programmes" on public.youth_opportunity_programs;
create policy "admins manage youth programmes"
  on public.youth_opportunity_programs for all
  to authenticated
  using (exists (
    select 1 from public.admin_allowlist a
    where a.active = true
      and a.email = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  ))
  with check (exists (
    select 1 from public.admin_allowlist a
    where a.active = true
      and a.email = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  ));

create index if not exists youth_opportunity_programs_active_sort_idx
  on public.youth_opportunity_programs (active, featured desc, sort_order, title);

create table if not exists public.opportunity_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_slug text not null check (program_slug ~ '^[a-z0-9-]{3,100}$'),
  program_title text not null check (char_length(trim(program_title)) between 3 and 180),
  status text not null default 'preparing'
    check (status in ('interested','preparing','ready','submitted','waiting','approved','declined','completed','paused')),
  completed_steps text[] not null default '{}',
  document_checks jsonb not null default '{}'::jsonb
    check (jsonb_typeof(document_checks) = 'object' and octet_length(document_checks::text) <= 12000),
  eligibility_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(eligibility_answers) = 'object' and octet_length(eligibility_answers::text) <= 12000),
  application_draft jsonb not null default '{}'::jsonb
    check (jsonb_typeof(application_draft) = 'object' and octet_length(application_draft::text) <= 24000),
  next_action text not null default '' check (char_length(next_action) <= 500),
  external_reference text not null default '' check (char_length(external_reference) <= 160),
  target_date date,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.opportunity_journeys enable row level security;
revoke all privileges on public.opportunity_journeys from public, anon, authenticated;
grant select, insert, update, delete on public.opportunity_journeys to authenticated;

drop policy if exists "users read own opportunity journeys" on public.opportunity_journeys;
create policy "users read own opportunity journeys"
  on public.opportunity_journeys for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "users create own opportunity journeys" on public.opportunity_journeys;
create policy "users create own opportunity journeys"
  on public.opportunity_journeys for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "users update own opportunity journeys" on public.opportunity_journeys;
create policy "users update own opportunity journeys"
  on public.opportunity_journeys for update
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "users delete own opportunity journeys" on public.opportunity_journeys;
create policy "users delete own opportunity journeys"
  on public.opportunity_journeys for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create index if not exists opportunity_journeys_user_updated_idx
  on public.opportunity_journeys (user_id, updated_at desc);
create index if not exists opportunity_journeys_program_status_idx
  on public.opportunity_journeys (program_slug, status);

insert into public.youth_opportunity_programs
(slug,title,provider,category,summary,benefit,age_min,age_max,audience_tags,eligibility,steps,documents,application_channel,application_url,source_title,source_url,secondary_source_url,deadline_note,status_note,verified_on,active,featured,sort_order)
values
('yoshlar-daftari','“Yoshlar daftari” — maqsadli ijtimoiy yordam','Yoshlar ishlari agentligi · mahalla yettiligi','social_support',
'Ijtimoiy va iqtisodiy ko‘makka muhtoj 14–30 yoshdagi yoshlar uchun belgilangan mezonlarga mos yordam turlari.',
'Holatga qarab ta’lim kontrakti, kasb/IT/til kurslari, haydovchilik kursi, ijara kompensatsiyasi, davolanish, sport anjomi yoki ijtimoiy loyiha granti kabi yordamlar mavjud.',14,30,
array['Ijtimoiy reestrga kiritilgan oilalarning 14–30 yoshdagi a’zolari','Ayrim tibbiy yordam turlari uchun daromad mezoniga mos oilalardagi 14–30 yoshdagilar'],
'{"min_age":14,"max_age":30,"social_register_primary":true,"special_medical_path":"Ayrim tibbiy yordamlar bo‘yicha oilaning har bir a’zosiga to‘g‘ri keladigan daromad minimal iste’mol xarajatlarining 2 baravaridan oshmasligi talabi qo‘llanishi mumkin.","important":"Daftarga kiritilishning o‘zi pul ajratilishini anglatmaydi. Har bir yordam turi uchun alohida talab va hujjatlar mavjud."}'::jsonb,
'["Yoshingiz va ijtimoiy mezon bo‘yicha mosligingizni tekshiring; mahalladagi yoshlar yetakchisidan aynan qaysi yordam turiga mos kelishingizni aniqlang.","Bitta aniq yordam turini tanlang va so‘ralayotgan yordam miqdorini hisoblang.","Tegishli tasdiqlovchi hujjatlarni yig‘ing: masalan, ta’lim kontrakti, kurs shartnomasi yoki xarajatni tasdiqlovchi hujjat. Aniq ro‘yxatni xizmat talabidan tekshiring.","Davlat xizmatlari markazi, my.gov.uz yoki Yoshlar yagona elektron platformasi orqali murojaat yuborish tartibini tanlang; mahalladagi yoshlar yetakchisi bilan bog‘laning.","Mahalla yettiligi murojaatni, qoida tariqasida, 5 ish kuni ichida ko‘rib chiqadi. Natijani shaxsiy kabinet/SMS orqali kuzating.","Rad javobi yoki hujjat yetishmasa, sababini o‘qing; tuzatish va shikoyat qilish tartibini rasmiy manbadan tekshiring."]'::jsonb,
'["Shaxsni tasdiqlovchi hujjat ma’lumotlari (portal avtomatik olishi mumkin).","Tanlangan yordamga mos tasdiq: o‘qish kontrakti, o‘quv kursi shartnomasi, tibbiy hujjat yoki xarajat hisob-kitobi.","Ijtimoiy reestr yoki daromad mezoniga oid ma’lumot — tegishli yordam turi talab qilsa.","Mahalla/yoshlar yetakchisi so‘ragan qo‘shimcha hujjatlar."]'::jsonb,
'Avval mahalladagi yoshlar yetakchisi bilan yordam turini aniqlang. Ariza yo‘li: Davlat xizmatlari markazi, my.gov.uz yoki Yoshlar yagona elektron platformasi.','https://my.gov.uz/uz',
'Adliya vazirligi — “Yoshlar daftari”ga kiritish va ijtimoiy yordam tartibi','https://advice.adliya.uz/oz/document/2394','https://advice.adliya.uz/oz/document/2631',
'Umumiy yagona ariza muddati ko‘rsatilmagan. Jamg‘arma mablag‘i, yordam turi va hududiy qaror bo‘yicha holatni ariza berishdan oldin tekshiring.',
'Rasmiy tartibga oid sahifalar 2026-yil 7-noyabrda qayta tekshirildi. Yoshlar-Ishi arizani davlat organiga yubormaydi va yordam ajratilishini kafolatlamaydi.','2026-11-07',true,true,10),
('2-plus-6','“2+6” — xorijiy til kursi uchun subsidiya','Yoshlar ishlari agentligi','language',
'Belgilangan sertifikat va tasdiqlangan o‘quv markazi shartlariga javob bergan yoshlar uchun dastlabki 2 oydan keyin 6 oygacha subsidiya mexanizmi.',
'Dastlabki 2 oylik to‘lovni yoshning o‘zi amalga oshiradi. Keyingi 6 oygacha o‘qish xarajatining bir qismi hudud bo‘yicha BHM chegarasida qoplanishi mumkin.',14,30,
array['Ingliz, nemis, fransuz, koreys yoki xitoy tilini o‘rganayotgan yoshlar','Belgilangan minimal til sertifikatiga ega bo‘lgan va tegishli markazda o‘qiyotganlar'],
'{"min_age":14,"max_age":30,"required_certificate":"Tanlangan til bo‘yicha nizomda belgilangan minimal ball/darajadagi sertifikat talab qilinadi.","required_payment":"Dastlabki 2 oy o‘qish xarajati ariza beruvchining o‘zi tomonidan to‘langan bo‘lishi kerak.","provider_condition":"O‘quv markazi belgilangan elektron platformada ro‘yxatdan o‘tgan va davomat nazoratiga integratsiya qilingan bo‘lishi kerak.","monthly_caps":"Toshkent shahri — 2 BHMgacha; viloyat markazlari — 1,5 BHMgacha; tuman/shaharlar — 1 BHMgacha.","important":"Subsidiya ajratilishi mablag‘ limiti, ariza holati va barcha nizom talablariga bog‘liq."}'::jsonb,
'["Avval rasmiy nizomdagi minimal til sertifikati talabiga mosligingizni tekshiring.","2+6 dasturi doirasida qabul qilinadigan, elektron davomatga ulangan o‘quv markazini tanlang.","O‘quv markazi va ariza berish kanali faol ekanini rasmiy manba yoki Yonda yordam xizmati orqali tasdiqlang.","Birinchi 2 oy uchun to‘lovni amalga oshiring va kvitansiya/shartnomani saqlang.","Rasmiy ko‘rsatmaga muvofiq Yonda ilovasida ariza yuboring; ariza topshirish oynasi va mavjud limitni tekshiring.","Har oy davomatni saqlang va ilovadagi ariza/subsidiya holatini kuzatib boring."]'::jsonb,
'["Minimal til sertifikati (nizomda tan olingan tur va daraja).","O‘quv markazi bilan shartnoma yoki o‘qishga qabul tasdig‘i.","Dastlabki 2 oy to‘lovi bo‘yicha kvitansiya.","Yonda ilovasi talab qiladigan shaxsiy ma’lumotlar va tasdiqlar.","Davomat elektron qayd etilishini markaz bilan tekshirish."]'::jsonb,
'Yoshlar ishlari agentligining 2026-yilgi ko‘rsatmasida ariza kanali sifatida Yonda ilovasi ko‘rsatilgan. O‘quv markazi ro‘yxatini va qabul holatini ilova/yordam xizmatida tasdiqlang.','https://yoshlar.gov.uz/uz',
'Hukumat portali — “2+6” subsidiya tartibi','https://gov.uz/oz/advice/784/document/4349','https://gov.uz/oz/yoshlar/news/view/130427',
'Arizalar kvotasi va mablag‘ limiti mavjud bo‘lishi mumkin; hozirgi qabul oynasini va ro‘yxatdagi markazlarni yuborishdan oldin tekshiring.',
'Hududiy to‘lov chegaralari va markaz talablari rasmiy nizomdan olingan. Yonda ilovasining amaldagi jarayoni o‘zgarishi mumkin.','2026-11-07',true,true,20),
('kelajak-tadbirkori','“Kelajak tadbirkori” — imtiyozli kredit','Yoshlar tadbirkorligini qo‘llab-quvvatlash tizimi · banklar','business',
'Yoshlar biznesini boshlash yoki kengaytirish uchun e’lon qilingan, 7 yilgacha va 15 foiz stavkali kredit yo‘nalishi.',
'E’lon qilingan yuqori limitlar: o‘zini o‘zi band qilganlarga 20 mln so‘mgacha garovsiz; yangi biznes boshlovchilarga 300 mln so‘mgacha; biznesni kengaytirishga 2 mlrd so‘mgacha; kamida 5 nafar bitiruvchini ishga olganlarga 10 mlrd so‘mgacha.',18,30,
array['Biznes g‘oyasi yoki amaldagi faoliyati bor yoshlar','O‘zini o‘zi band qilganlar yoki biznesni rivojlantirayotgan tadbirkorlar'],
'{"min_age":18,"max_age":30,"funding_type":"Kredit — grant emas; qaytarish majburiyati va bank shartlari bor.","terms":"2026-yil 24-fevraldagi rasmiy xabarda 7 yilgacha muddat va 15 foiz stavka e’lon qilingan.","important":"Yuqori limitlar avtomatik tasdiq emas. Yakuniy qaror bank, kreditga layoqat, biznes modeli va amaldagi nizomga bog‘liq; qabul yoshini bankdan tasdiqlang."}'::jsonb,
'["Biznesingiz qaysi bosqichda ekanini aniqlang: o‘zini o‘zi band qilish, yangi biznes yoki faoliyatni kengaytirish.","Mijoz, muammo, mahsulot/xizmat va daromad modelini yozib, sodda biznes-reja tuzing.","Kerakli mablag‘ni xarajatlar smetasi bilan asoslang; kreditni qaytarish manbasini hisoblang.","Tadbirkorlik subyekti va soliq/ro‘yxatdan o‘tish holatini tayyorlang; bank talablarini oldindan so‘rang.","Dastur amalda qaysi banklarda va qaysi hujjatlar bilan qabul qilinayotganini tasdiqlang.","Bankka ariza yuboring, shartnoma shartlarini tekshirib chiqing; faqat shundan keyin imzolang."]'::jsonb,
'["Shaxsni tasdiqlovchi hujjat va bank talab qilgan ma’lumotlar.","Biznes-reja va daromad/xarajat hisob-kitobi.","O‘zini o‘zi band qilish yoki tadbirkorlik ro‘yxatidan o‘tganlik ma’lumoti — tanlangan yo‘nalishga qarab.","Kredit maqsadi bo‘yicha narx takliflari yoki smeta.","Bank talab qiladigan qo‘shimcha hujjatlar."]'::jsonb,
'Rasmiy e’lon va hududiy yoshlar tadbirkorligi mas’ullari orqali dastur qaysi banklarda amalda ekanini aniqlang; bankning o‘z kredit arizasidan foydalaning.','https://gov.uz/oz/navoi/news/view/136293',
'Hukumat portali — “Kelajak tadbirkori” dasturi','https://gov.uz/oz/navoi/news/view/136293','https://gov.uz/oz/imv/news/view/154190',
'E’lon sanasi 2026-yil 24-fevral. Qabul muddati, banklar ro‘yxati va amaldagi mahsulot shartlarini tegishli bankdan qayta tasdiqlang.',
'Kredit mablag‘i qaytariladi. Yoshlar-Ishi kredit ajratmaydi, bank bilan integratsiyaga ega emas va kredit olishni kafolatlamaydi.','2026-11-07',true,true,30),
('mening-birinchi-kasbim','“Mening birinchi kasbim” — bitiruvchilar stajirovkasi','Oliy ta’lim, fan va innovatsiyalar vazirligi bilan hamkorlikdagi dastur','career',
'Oliy ta’lim muassasasi bitiruvchilari uchun tanlov asosidagi stajirovka va amaliy tajriba yo‘nalishi.',
'Rasmiy e’londa tanlov asosida olingan bitiruvchilarga oyiga 2 mln so‘mgacha stipendiya ko‘zda tutilgani bildirilgan.',null,null,
array['Oliy ta’lim muassasasini tamomlagan bitiruvchilar','Tanlov talablariga mos nomzodlar'],
'{"audience":"Oliy ta’lim bitiruvchilari; texnikum yoki maktab o‘quvchilari avtomatik ravishda mos hisoblanmaydi.","selection":"Tanlov asosida; amaldagi vakansiya, tashkilot va muddatni rasmiy e’londan tekshirish zarur.","stipend":"Rasmiy e’londa oyiga 2 mln so‘mgacha deb ko‘rsatilgan."}'::jsonb,
'["Oliy ta’lim bitiruvchisi sifatida tanlov shartlariga mosligingizni tekshiring.","Yoshlar ishlari agentligi va Oliy ta’lim vazirligining rasmiy e’lonlarida ochiq stajirovka tanlovini qidiring.","CV, diplom ma’lumoti va amaliy ish/portfolio namunalaringizni tayyorlang.","Tanlov e’lonida ko‘rsatilgan rasmiy kanal orqali ariza yuboring.","Suhbat yoki saralash bosqichlariga tayyorlaning; stipendiya va stajirovka shartlarini yozma ravishda tekshiring."]'::jsonb,
'["CV/rezyume.","Oliy ta’lim diplomi yoki bitiruvchi ekanlikni tasdiqlovchi ma’lumot.","Portfolio, loyiha yoki amaliy ish namunalari — tanlov talab qilsa.","Tanlov e’lonida so‘ralgan boshqa hujjatlar."]'::jsonb,
'Hozir ochiq tanlov borligini Yoshlar ishlari agentligi va Oliy ta’lim vazirligining rasmiy e’lonlaridan tekshiring.','https://yoshlar.gov.uz/uz',
'Hukumat portali — “Mening birinchi kasbim” dasturi haqida rasmiy xabar','https://gov.uz/oz/navoi/news/view/136293','',
'Umumiy qabul muddati ko‘rsatilmagan; faqat e’lon qilingan vaqtda ochiq tanlovga hujjat topshiring.',
'Rasmiy xabarda dastur yo‘lga qo‘yilishi e’lon qilingan; amaldagi tanlov va qabul holati qayta tekshirilishi kerak.','2026-11-07',true,false,40)
on conflict (slug) do update set
 title=excluded.title, provider=excluded.provider, category=excluded.category,
 summary=excluded.summary, benefit=excluded.benefit,
 age_min=excluded.age_min, age_max=excluded.age_max,
 audience_tags=excluded.audience_tags, eligibility=excluded.eligibility,
 steps=excluded.steps, documents=excluded.documents,
 application_channel=excluded.application_channel, application_url=excluded.application_url,
 source_title=excluded.source_title, source_url=excluded.source_url,
 secondary_source_url=excluded.secondary_source_url, deadline_note=excluded.deadline_note,
 status_note=excluded.status_note, verified_on=excluded.verified_on,
 active=excluded.active, featured=excluded.featured, sort_order=excluded.sort_order,
 updated_at=now();
