-- Yoshlar-Ishi competency assessment engine.
-- Question prompts/options are public; answer keys stay in the private schema.
create schema if not exists private;

create table if not exists private.assessment_answer_keys (
 bank_version text not null,
 track_id text not null check (track_id in ('humanities','natural','vocational')),
 question_id text not null,
 subject text not null,
 domain text not null,
 competency text not null,
 correct_option text not null check (correct_option in ('A','B','C','D')),
 explanation text not null,
 primary key (bank_version,track_id,question_id)
);
alter table private.assessment_answer_keys enable row level security;
revoke all on table private.assessment_answer_keys from public, anon, authenticated;

create table if not exists public.assessment_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 track_id text not null check (track_id in ('humanities','natural','vocational')),
 bank_version text not null,
 total_questions smallint not null check (total_questions = 25),
 correct_count smallint not null check (correct_count between 0 and 25),
 score_percent smallint not null check (score_percent between 0 and 100),
 points_earned smallint not null default 0 check (points_earned between 0 and 30),
 is_best boolean not null default false,
 subject_results jsonb not null default '[]'::jsonb,
 submitted_at timestamptz not null default now()
);
create table if not exists public.assessment_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 track_id text not null check (track_id in ('humanities','natural','vocational')),
 first_correct_count smallint not null default 0 check (first_correct_count between 0 and 25),
 first_score_percent smallint not null default 0 check (first_score_percent between 0 and 100),
 best_correct_count smallint not null default 0 check (best_correct_count between 0 and 25),
 best_score_percent smallint not null default 0 check (best_score_percent between 0 and 100),
 points_total smallint not null default 0 check (points_total between 0 and 30),
 attempts_count integer not null default 0 check (attempts_count >= 0),
 first_attempt_at timestamptz,
 last_attempt_at timestamptz,
 best_attempt_id uuid
);
do $$
begin
 if not exists(select 1 from pg_constraint where conname='assessment_progress_pkey' and conrelid='public.assessment_progress'::regclass) then
  alter table public.assessment_progress add constraint assessment_progress_pkey primary key(user_id,track_id);
 end if;
 if not exists(select 1 from pg_constraint where conname='assessment_progress_best_attempt_id_fkey' and conrelid='public.assessment_progress'::regclass) then
  alter table public.assessment_progress add constraint assessment_progress_best_attempt_id_fkey foreign key(best_attempt_id) references public.assessment_attempts(id) on delete set null;
 end if;
end $$;

create index if not exists assessment_attempts_user_track_time_idx on public.assessment_attempts(user_id,track_id,submitted_at desc);
create index if not exists assessment_attempts_user_time_idx on public.assessment_attempts(user_id,submitted_at desc);
create index if not exists assessment_progress_best_attempt_id_idx on public.assessment_progress(best_attempt_id);
alter table public.assessment_attempts enable row level security;
alter table public.assessment_progress enable row level security;
grant select on public.assessment_attempts,public.assessment_progress to authenticated;
drop policy if exists "members read own assessment attempts" on public.assessment_attempts;
create policy "members read own assessment attempts" on public.assessment_attempts for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "members read own assessment progress" on public.assessment_progress;
create policy "members read own assessment progress" on public.assessment_progress for select to authenticated using (user_id=(select auth.uid()));

insert into private.assessment_answer_keys(bank_version,track_id,question_id,subject,domain,competency,correct_option,explanation)
values
('2026.11.17-v1','humanities','H01','O‘zbekiston tarixi','Tushunish','O‘zbekiston tarixi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Mustaqillik 1991-yil 31-avgustda e’lon qilingan.'),
('2026.11.17-v1','humanities','H02','O‘zbekiston tarixi','Tushunish','O‘zbekiston tarixi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','Registon Samarqand shahridagi tarixiy me’moriy ansambldir.'),
('2026.11.17-v1','humanities','H03','O‘zbekiston tarixi','Tushunish','O‘zbekiston tarixi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Jadidlar ma’rifat, yangi usul maktablari, ilm-fan va matbuot orqali yangilanishni maqsad qilgan.'),
('2026.11.17-v1','humanities','H04','O‘zbekiston tarixi','Tushunish','O‘zbekiston tarixi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Dastlabki Konstitutsiya 1992-yil 8-dekabrda qabul qilingan.'),
('2026.11.17-v1','humanities','H05','O‘zbekiston tarixi','Tahlil','O‘zbekiston tarixi bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','C','Ipak yo‘li savdo bilan birga bilim va madaniyat almashinuvini ham rivojlantirgan.'),
('2026.11.17-v1','humanities','H06','Ona tili','Tushunish','Ona tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Gapning egasi harakat bajaruvchisini bildiradi: tadqiqotchilar.'),
('2026.11.17-v1','humanities','H07','Ona tili','Tushunish','Ona tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','Adabiy imloda so‘z mas’uliyat shaklida yoziladi.'),
('2026.11.17-v1','humanities','H08','Ona tili','Tushunish','Ona tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','-dan qo‘shimchasi chiqish kelishigini bildiradi.'),
('2026.11.17-v1','humanities','H09','Ona tili','Tushunish','Ona tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Gapda harakatni bajarayotgan ega — Quyosh.'),
('2026.11.17-v1','humanities','H10','Ona tili','Qo‘llash','Ona tili bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','A','Tez so‘zi harakatning qanday bajarilishini bildirib, ravish vazifasida kelgan.'),
('2026.11.17-v1','humanities','H11','Ingliz tili','Tushunish','Ingliz tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','First conditional: if qismida Present Simple, natijada will + infinitive ishlatiladi.'),
('2026.11.17-v1','humanities','H12','Ingliz tili','Tushunish','Ingliz tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Since boshlanish nuqtasini bildiradi; Present Perfect bilan ishlatiladi.'),
('2026.11.17-v1','humanities','H13','Ingliz tili','Tushunish','Ingliz tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Yesterday o‘tgan vaqtni bildiradi; passive Past Simple shakli was written.'),
('2026.11.17-v1','humanities','H14','Ingliz tili','Tushunish','Ingliz tili bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Interested so‘zi in predlogi bilan ishlatiladi.'),
('2026.11.17-v1','humanities','H15','Ingliz tili','Tahlil','Ingliz tili bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','C','Matnda daraxtlarning soya berishi, haroratni pasaytirishi va qushlarga yashash joyi yaratishi aytilgan.'),
('2026.11.17-v1','humanities','H16','Huquq va fuqarolik savodxonligi','Tushunish','Huquq va fuqarolik savodxonligi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','Huquq ustuvorligi davlat organlari va fuqarolarning qonun oldida mas’ul bo‘lishini anglatadi.'),
('2026.11.17-v1','humanities','H17','Huquq va fuqarolik savodxonligi','Qo‘llash','Huquq va fuqarolik savodxonligi bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','C','Talab va muddatlarni rasmiy manbadan tekshirish, ma’lumotni xavfsiz yuborish kerak.'),
('2026.11.17-v1','humanities','H18','Huquq va fuqarolik savodxonligi','Tahlil','Huquq va fuqarolik savodxonligi bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','B','Huquqlardan foydalanish boshqalarning huquqlarini buzmasligi kerak.'),
('2026.11.17-v1','humanities','H19','Huquq va fuqarolik savodxonligi','Tushunish','Huquq va fuqarolik savodxonligi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Manba, sana va mustaqil tasdiqlarni tekshirish dezinformatsiya xavfini kamaytiradi.'),
('2026.11.17-v1','humanities','H20','Huquq va fuqarolik savodxonligi','Qo‘llash','Huquq va fuqarolik savodxonligi bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','A','Rasmiy murojaat va jamoatchilik muhokamasi qonuniy fuqarolik ishtiroki shakllaridir.'),
('2026.11.17-v1','humanities','H21','Moliyaviy savodxonlik','Tushunish','Moliyaviy savodxonlik bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','1 000 000 × 20 / 100 = 200 000 so‘m.'),
('2026.11.17-v1','humanities','H22','Moliyaviy savodxonlik','Tushunish','Moliyaviy savodxonlik bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Xarajat daromaddan oshsa, budjet taqchilligi yuzaga keladi.'),
('2026.11.17-v1','humanities','H23','Moliyaviy savodxonlik','Qo‘llash','Moliyaviy savodxonlik bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','A','200 000 so‘mning 3 foizi 6 000; yakuniy narx 194 000 so‘m.'),
('2026.11.17-v1','humanities','H24','Moliyaviy savodxonlik','Tushunish','Moliyaviy savodxonlik bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Favqulodda jamg‘arma kutilmagan xarajat va daromad uzilishida yordam beradi.'),
('2026.11.17-v1','humanities','H25','Moliyaviy savodxonlik','Tahlil','Moliyaviy savodxonlik bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','D','Kreditning umumiy xarajatiga foiz bilan birga komissiya, muddat va jarimalar ham ta’sir qiladi.'),
('2026.11.17-v1','natural','N01','Matematika','Qo‘llash','Matematika bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','B','150 × 20 / 100 = 30.'),
('2026.11.17-v1','natural','N02','Matematika','Qo‘llash','Matematika bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','C','3+5=8 qism; bir qism 40/8=5, kichik son 3×5=15.'),
('2026.11.17-v1','natural','N03','Matematika','Tahlil','Matematika bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','A','Perimetrdan a+b=15; eni 5 sm, yuza 10×5=50 sm².'),
('2026.11.17-v1','natural','N04','Matematika','Qo‘llash','Matematika bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','D','(4+6+8+10)/4=7.'),
('2026.11.17-v1','natural','N05','Matematika','Qo‘llash','Matematika bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','C','Har ikki tomondan 7 ayiriladi: x=19−7=12.'),
('2026.11.17-v1','natural','N06','Fizika','Qo‘llash','Fizika bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','A','O‘rtacha tezlik v=s/t=100/2=50 km/soat.'),
('2026.11.17-v1','natural','N07','Fizika','Tushunish','Fizika bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Ketma-ket zanjirning barcha elementlaridan bir xil tok o‘tadi.'),
('2026.11.17-v1','natural','N08','Fizika','Qo‘llash','Fizika bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','C','F=mg=2×10=20 N.'),
('2026.11.17-v1','natural','N09','Fizika','Tushunish','Fizika bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Normal atmosfera bosimida sof suv taxminan 100°C da qaynaydi.'),
('2026.11.17-v1','natural','N10','Fizika','Tahlil','Fizika bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','B','Kinetik energiya tezlik kvadratiga bog‘liq; tezlik ikki baravar bo‘lsa, energiya to‘rt baravar.'),
('2026.11.17-v1','natural','N11','Kimyo','Tushunish','Kimyo bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','H₂O tarkibida ikki vodorod va bitta kislorod atomi bor.'),
('2026.11.17-v1','natural','N12','Kimyo','Tushunish','Kimyo bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','25°C da pH 7 neytral muhitni bildiradi.'),
('2026.11.17-v1','natural','N13','Kimyo','Tushunish','Kimyo bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Davriy jadval elementlarni atom raqami ortib borishi bo‘yicha joylashtiradi.'),
('2026.11.17-v1','natural','N14','Kimyo','Tushunish','Kimyo bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Neytrallanishning umumiy ko‘rinishi: kislota + asos → tuz + suv.'),
('2026.11.17-v1','natural','N15','Kimyo','Tushunish','Kimyo bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','CO₂ bitta uglerod va ikkita kislorod atomidan tashkil topgan.'),
('2026.11.17-v1','natural','N16','Biologiya','Tushunish','Biologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','Fotosintezda yorug‘lik energiyasi bilan suv va CO₂ dan organik modda hosil bo‘ladi, kislorod ajraladi.'),
('2026.11.17-v1','natural','N17','Biologiya','Tushunish','Biologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Eukariot hujayrada DNKning asosiy qismi yadroda; mitoxondriyada ham oz miqdorda bo‘ladi.'),
('2026.11.17-v1','natural','N18','Biologiya','Tushunish','Biologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Alveolalarda kislorod qonga, karbonat angidrid esa alveola havosiga o‘tadi.'),
('2026.11.17-v1','natural','N19','Biologiya','Tahlil','Biologiya bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','C','Tabiiy tanlanish irsiy o‘zgaruvchanlik va ko‘payish muvaffaqiyatidagi farqlar bilan bog‘liq.'),
('2026.11.17-v1','natural','N20','Biologiya','Tushunish','Biologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','Antibiotiklar bakteriyalarga qarshi; virusli infeksiyalarni davolamaydi.'),
('2026.11.17-v1','natural','N21','Geografiya va ekologiya','Tushunish','Geografiya va ekologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Ekvator 0° kenglikda bo‘lib, shimoliy va janubiy yarimsharlarni ajratadi.'),
('2026.11.17-v1','natural','N22','Geografiya va ekologiya','Tushunish','Geografiya va ekologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Bug‘lanish suyuqlik yuzasida qaynash haroratidan pastda ham sodir bo‘ladi.'),
('2026.11.17-v1','natural','N23','Geografiya va ekologiya','Tushunish','Geografiya va ekologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Yerning o‘z o‘qi atrofida aylanishi kun va tun almashinuvini yuzaga keltiradi.'),
('2026.11.17-v1','natural','N24','Geografiya va ekologiya','Tushunish','Geografiya va ekologiya bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','Quyosh va shamol tabiiy yangilanadigan energiya manbalaridir.'),
('2026.11.17-v1','natural','N25','Geografiya va ekologiya','Qo‘llash','Geografiya va ekologiya bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','B','1:100 000 masshtabda 1 sm xaritada 100 000 sm yoki 1 km joy masofasiga teng.'),
('2026.11.17-v1','vocational','V01','Raqamli savodxonlik','Tushunish','Raqamli savodxonlik bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Shubhali havolani ochmasdan, tashkilotning rasmiy kanali orqali xatni tekshirish lozim.'),
('2026.11.17-v1','vocational','V02','Raqamli savodxonlik','Tushunish','Raqamli savodxonlik bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Noyob uzun parollar va ko‘p bosqichli tasdiqlash akkaunt himoyasini kuchaytiradi.'),
('2026.11.17-v1','vocational','V03','Raqamli savodxonlik','Qo‘llash','Raqamli savodxonlik bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','A','Noma’lum USB qurilmani antivirus bilan tekshirib, noma’lum fayllarni ishga tushirmaslik kerak.'),
('2026.11.17-v1','vocational','V04','Raqamli savodxonlik','Tushunish','Raqamli savodxonlik bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','SUM funksiyasi B2:B10 oralig‘idagi qiymatlarni qo‘shadi.'),
('2026.11.17-v1','vocational','V05','Raqamli savodxonlik','Tushunish','Raqamli savodxonlik bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','3-2-1 tamoyili: uch nusxa, ikki xil vosita, bittasi boshqa joyda.'),
('2026.11.17-v1','vocational','V06','Dasturlash asoslari','Tushunish','Dasturlash asoslari bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','range(3) 0, 1, 2 qiymatlarini beradi.'),
('2026.11.17-v1','vocational','V07','Dasturlash asoslari','Tushunish','Dasturlash asoslari bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','O‘zgaruvchi ma’lumotni nomlangan joyda saqlash va qayta ishlatish uchun xizmat qiladi.'),
('2026.11.17-v1','vocational','V08','Dasturlash asoslari','Tushunish','Dasturlash asoslari bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','== operatori qiymatlar tengligini solishtiradi.'),
('2026.11.17-v1','vocational','V09','Dasturlash asoslari','Tahlil','Dasturlash asoslari bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','D','Avval xatoni qayta yuzaga keltirib, xabar va tegishli kod qatorini tekshirish kerak.'),
('2026.11.17-v1','vocational','V10','Dasturlash asoslari','Tushunish','Dasturlash asoslari bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Algoritm — muammoni yechish uchun chekli va tartiblangan amallar ketma-ketligi.'),
('2026.11.17-v1','vocational','V11','Ofis va ma’lumotlar bilan ishlash','Tushunish','Ofis va ma’lumotlar bilan ishlash bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Filter jadval yozuvlarini tanlangan mezon bo‘yicha ko‘rsatadi.'),
('2026.11.17-v1','vocational','V12','Ofis va ma’lumotlar bilan ishlash','Tushunish','Ofis va ma’lumotlar bilan ishlash bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','$A$1 mutlaq katak manzilidir.'),
('2026.11.17-v1','vocational','V13','Ofis va ma’lumotlar bilan ishlash','Tushunish','Ofis va ma’lumotlar bilan ishlash bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Eng eski sanani birinchi ko‘rsatish uchun o‘sish tartibida saralanadi.'),
('2026.11.17-v1','vocational','V14','Ofis va ma’lumotlar bilan ishlash','Tushunish','Ofis va ma’lumotlar bilan ishlash bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','CSV ajratkichlar bilan bo‘lingan jadval ko‘rinishidagi matn ma’lumotlarini saqlaydi.'),
('2026.11.17-v1','vocational','V15','Ofis va ma’lumotlar bilan ishlash','Tushunish','Ofis va ma’lumotlar bilan ishlash bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Versiya nazorati o‘zgarishlar tarixini saqlash va hamkorlikni yengillashtiradi.'),
('2026.11.17-v1','vocational','V16','Tadbirkorlik va loyiha boshqaruvi','Qo‘llash','Tadbirkorlik va loyiha boshqaruvi bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','A','Mahsulot yaratishdan avval foydalanuvchi va uning muammosini aniqlash kerak.'),
('2026.11.17-v1','vocational','V17','Tadbirkorlik va loyiha boshqaruvi','Tushunish','Tadbirkorlik va loyiha boshqaruvi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Pul oqimi ma’lum davrdagi pul tushumlari va chiqimlarini ko‘rsatadi.'),
('2026.11.17-v1','vocational','V18','Tadbirkorlik va loyiha boshqaruvi','Tushunish','Tadbirkorlik va loyiha boshqaruvi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','MVP asosiy taxminni kam resurs bilan real foydalanuvchida sinashga yordam beradi.'),
('2026.11.17-v1','vocational','V19','Tadbirkorlik va loyiha boshqaruvi','Tushunish','Tadbirkorlik va loyiha boshqaruvi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','C','Xavf matritsasida ehtimol va ta’sir baholanadi.'),
('2026.11.17-v1','vocational','V20','Tadbirkorlik va loyiha boshqaruvi','Tahlil','Tadbirkorlik va loyiha boshqaruvi bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.','D','Aniq vazifada mas’ul, muddat va o‘lchanadigan natija ko‘rsatiladi.'),
('2026.11.17-v1','vocational','V21','Mehnat xavfsizligi va kasbiy etika','Tushunish','Mehnat xavfsizligi va kasbiy etika bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Elektr jihozini ta’mirlashdan avval manbani uzish, qayta yoqilishdan himoyalash va kuchlanish yo‘qligini tekshirish lozim.'),
('2026.11.17-v1','vocational','V22','Mehnat xavfsizligi va kasbiy etika','Tushunish','Mehnat xavfsizligi va kasbiy etika bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','D','Yong‘inda belgilangan evakuatsiya yo‘lidan, lift ishlatmasdan chiqish kerak.'),
('2026.11.17-v1','vocational','V23','Mehnat xavfsizligi va kasbiy etika','Qo‘llash','Mehnat xavfsizligi va kasbiy etika bo‘yicha bilimni amaliy vaziyatda qo‘llash ko‘nikmasi.','C','Noma’lum kimyoviy moddaga tegmasdan mas’ul shaxsga xabar berish lozim.'),
('2026.11.17-v1','vocational','V24','Mehnat xavfsizligi va kasbiy etika','Tushunish','Mehnat xavfsizligi va kasbiy etika bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','A','Monitor ko‘z balandligida, gavda to‘g‘ri holatda va muntazam tanaffus bilan ishlash ma’qul.'),
('2026.11.17-v1','vocational','V25','Mehnat xavfsizligi va kasbiy etika','Tushunish','Mehnat xavfsizligi va kasbiy etika bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.','B','Shaxsiy ma’lumotlar faqat zarur darajada, qonuniy asos va ruxsat bilan ishlatiladi.')
on conflict(bank_version,track_id,question_id) do nothing;

-- Keep cognitive-level labels aligned with the final item specifications.
update private.assessment_answer_keys set domain='Tushunish',
 competency='Huquq va fuqarolik savodxonligi bo‘yicha asosiy tushuncha va qoidalarni tushuntirish ko‘nikmasi.'
where bank_version='2026.11.17-v1' and question_id='H18';
update private.assessment_answer_keys set domain='Tahlil',
 competency='Huquq va fuqarolik savodxonligi bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.'
where bank_version='2026.11.17-v1' and question_id='H19';
update private.assessment_answer_keys set domain='Tahlil',
 competency='Raqamli savodxonlik bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.'
where bank_version='2026.11.17-v1' and question_id='V03';
update private.assessment_answer_keys set domain='Tahlil',
 competency='Dasturlash asoslari bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.'
where bank_version='2026.11.17-v1' and question_id='V10';
update private.assessment_answer_keys set domain='Tahlil',
 competency='Tadbirkorlik va loyiha boshqaruvi bo‘yicha ma’lumotni tahlil qilish va asoslangan xulosa chiqarish ko‘nikmasi.'
where bank_version='2026.11.17-v1' and question_id in ('V16','V20');

drop function if exists public.submit_assessment_attempt(uuid,text,text,jsonb);
create or replace function public.submit_assessment_attempt(
 p_track_id text,
 p_bank_version text,
 p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
 v_auth_uid uuid := (select auth.uid());
 v_expected integer; v_answer_count integer; v_distinct_count integer; v_invalid_count integer;
 v_correct integer; v_percent integer; v_subject_results jsonb; v_review jsonb;
 v_progress public.assessment_progress%rowtype;
 v_created integer:=0; v_is_first boolean:=false; v_is_best boolean:=false;
 v_points integer:=0; v_attempt_count integer:=0; v_attempt_id uuid;
begin
 if v_auth_uid is null then
  raise exception 'assessment_authentication_required' using errcode='42501';
 end if;
 if p_track_id is null or p_track_id not in ('humanities','natural','vocational') then
  raise exception 'invalid_assessment_track' using errcode='22023';
 end if;
 if p_bank_version is distinct from '2026.11.17-v1' then
  raise exception 'assessment_bank_version_mismatch' using errcode='22023';
 end if;
 if pg_catalog.jsonb_typeof(p_answers) is distinct from 'array' then
  raise exception 'assessment_answers_must_be_array' using errcode='22023';
 end if;

 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_auth_uid::text||':'||p_track_id,0));
 select count(*) into v_expected from private.assessment_answer_keys
 where bank_version=p_bank_version and track_id=p_track_id;
 if v_expected<>25 then raise exception 'assessment_bank_not_ready' using errcode='55000'; end if;
 select count(*) into v_answer_count from pg_catalog.jsonb_array_elements(p_answers) a(answer);
 if v_answer_count<>v_expected then raise exception 'assessment_requires_all_25_questions' using errcode='22023'; end if;
 select count(*) into v_distinct_count from (
  select a.answer->>'questionId' from pg_catalog.jsonb_array_elements(p_answers) a(answer)
  group by a.answer->>'questionId'
 ) d;
 if v_distinct_count<>v_expected then raise exception 'assessment_contains_duplicate_question_ids' using errcode='22023'; end if;
 select count(*) into v_invalid_count
 from pg_catalog.jsonb_array_elements(p_answers) a(answer)
 left join private.assessment_answer_keys k
  on k.bank_version=p_bank_version and k.track_id=p_track_id and k.question_id=a.answer->>'questionId'
 where k.question_id is null or coalesce(a.answer->>'selectedOption','') not in ('','A','B','C','D');
 if v_invalid_count<>0 then raise exception 'assessment_contains_invalid_answers' using errcode='22023'; end if;

 select count(*) filter(where a.answer->>'selectedOption'=k.correct_option) into v_correct
 from pg_catalog.jsonb_array_elements(p_answers) a(answer)
 join private.assessment_answer_keys k
  on k.bank_version=p_bank_version and k.track_id=p_track_id and k.question_id=a.answer->>'questionId';
 v_percent:=round((v_correct::numeric/v_expected::numeric)*100)::integer;
 select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'subject',s.subject,'correct',s.correct_count,'total',s.question_count,
   'percent',round((s.correct_count::numeric/s.question_count::numeric)*100)
 ) order by s.subject),'[]'::jsonb) into v_subject_results
 from (
  select k.subject,count(*)::integer as question_count,
   count(*) filter(where a.answer->>'selectedOption'=k.correct_option)::integer as correct_count
  from pg_catalog.jsonb_array_elements(p_answers) a(answer)
  join private.assessment_answer_keys k
   on k.bank_version=p_bank_version and k.track_id=p_track_id and k.question_id=a.answer->>'questionId'
  group by k.subject
 ) s;

 select count(*) into v_attempt_count from public.assessment_attempts a
 where a.user_id=v_auth_uid and a.track_id=p_track_id and a.submitted_at>=now()-interval '24 hours';
 if v_attempt_count>=5 then raise exception 'assessment_daily_attempt_limit_reached' using errcode='22023'; end if;
 insert into public.assessment_progress(user_id,track_id) values(v_auth_uid,p_track_id)
 on conflict(user_id,track_id) do nothing;
 get diagnostics v_created=row_count;
 v_is_first:=v_created=1;
 select * into v_progress from public.assessment_progress p
 where p.user_id=v_auth_uid and p.track_id=p_track_id for update;
 v_is_best:=v_is_first or v_correct>v_progress.best_correct_count;
 v_points:=case when v_is_first then 5+v_correct else 0 end;

 select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
  'questionId',k.question_id,'subject',k.subject,'domain',k.domain,'competency',k.competency,
  'selectedOption',a.answer->>'selectedOption','correctOption',k.correct_option,
  'isCorrect',(a.answer->>'selectedOption'=k.correct_option),'explanation',k.explanation
 ) order by a.ord),'[]'::jsonb) into v_review
 from pg_catalog.jsonb_array_elements(p_answers) with ordinality a(answer,ord)
 join private.assessment_answer_keys k
  on k.bank_version=p_bank_version and k.track_id=p_track_id and k.question_id=a.answer->>'questionId';

 insert into public.assessment_attempts(user_id,track_id,bank_version,total_questions,correct_count,score_percent,points_earned,is_best,subject_results)
 values(v_auth_uid,p_track_id,p_bank_version,v_expected,v_correct,v_percent,v_points,v_is_best,v_subject_results)
 returning id into v_attempt_id;
 update public.assessment_progress
 set first_correct_count=case when v_is_first then v_correct else first_correct_count end,
  first_score_percent=case when v_is_first then v_percent else first_score_percent end,
  best_correct_count=greatest(best_correct_count,v_correct),
  best_score_percent=greatest(best_score_percent,v_percent),
  points_total=points_total+v_points,attempts_count=attempts_count+1,
  first_attempt_at=coalesce(first_attempt_at,now()),last_attempt_at=now(),
  best_attempt_id=case when v_is_best then v_attempt_id else best_attempt_id end
 where user_id=v_auth_uid and track_id=p_track_id;
 insert into public.member_activity_events(user_id,event_type,entity_id)
 values(v_auth_uid,'assessment_completed',v_attempt_id);
 select * into v_progress from public.assessment_progress p
 where p.user_id=v_auth_uid and p.track_id=p_track_id;
 return pg_catalog.jsonb_build_object('saved',true,'attemptId',v_attempt_id,'correctCount',v_correct,
  'totalQuestions',v_expected,'scorePercent',v_percent,'pointsEarned',v_points,
  'pointsTotal',v_progress.points_total,'bestCorrectCount',v_progress.best_correct_count,
  'attemptsCount',v_progress.attempts_count,'isFirstAttempt',v_is_first,
  'isBestAttempt',v_is_best,'subjectResults',v_subject_results,'review',v_review);
end;
$function$;
revoke all on function public.submit_assessment_attempt(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.submit_assessment_attempt(text,text,jsonb) to authenticated;
