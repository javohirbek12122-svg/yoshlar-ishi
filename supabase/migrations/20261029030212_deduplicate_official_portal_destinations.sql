-- Remove a redundant listing of the same ministries index and point general legal guidance to its own landing page.
-- The canonical ministries directory remains available as directory-ministries with richer details.
update public.official_portal_integrations
set active = false,
    updated_at = now()
where slug = 'ministries-directory'
  and portal_url = 'https://gov.uz/oz/all_ministry/1';

update public.official_portal_integrations
set portal_url = 'https://advice.adliya.uz/',
    source_url = 'https://advice.adliya.uz/',
    purpose = 'Adliya tizimining huquqiy maslahatlar portalidan mavzuga mos qo‘llanma va rasmiy tushuntirishlarni topish.',
    detail_text = 'Huquqiy maslahatlar portali kundalik huquqiy savollar bo‘yicha tushuntirishlarni topishga yordam beradi. Muayyan masalada amaldagi qonun va xizmat shartlarini tegishli rasmiy manbadan tekshiring. Yoshlar daftari bo‘yicha alohida qo‘llanma katalogda maxsus yozuv sifatida saqlanadi.',
    features = '["Huquqiy savol bo‘yicha maqola va yo‘riqnoma qidirish","Rasmiy huquqiy tushuntirishlarni o‘qish","Alohida Yoshlar daftari yo‘riqnomasiga o‘tish"]'::jsonb,
    steps = '["Masala mavzusini aniqlang","Adliya huquqiy maslahatlar portalida qidiring","Maqola sanasi va tegishli rasmiy manbani tekshiring","Xizmat talab qilinsa, vakolatli portalda davom eting"]'::jsonb,
    verified_on = date '2026-10-29',
    updated_at = now()
where slug = 'advice-legal';
