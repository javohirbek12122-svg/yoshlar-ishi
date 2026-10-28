-- Deactivate legacy education ministry entries after the official 2026 reorganization announcement.
-- The consolidated Ta'lim va ilm-fan vazirligi record remains active.
update public.official_portal_integrations
set active = false,
    admin_notes = '2026-10-07 rasmiy xabari bo‘yicha Ta’lim va ilm-fan vazirligi yagona tuzilma sifatida tashkil etilgan. Eskirgan yozuv ommaviy katalogdan chiqarildi; faol o‘rinbosar yozuv: ministry-education-science. Qayta faollashtirishdan oldin amaldagi rasmiy vakolat va sahifani tekshiring.'
where slug = 'education-ministry';

update public.official_portal_integrations
set active = false,
    admin_notes = 'Tarixiy/meros yozuv. 2026-10-07 rasmiy xabarida maktabgacha va maktab ta’limi hamda oliy ta’lim, fan va innovatsiyalar vazirliklari yagona Ta’lim va ilm-fan vazirligiga qayta tashkil etilgani aytilgan. Faqat amaldagi rasmiy manba tasdiqlansa qayta faollashtiring.'
where slug = 'ministry-preschool-school-legacy';

insert into public.official_portal_admin_notes(integration_id,admin_notes)
select id, admin_notes from public.official_portal_integrations
where slug in ('education-ministry','ministry-preschool-school-legacy')
on conflict (integration_id) do update
set admin_notes = excluded.admin_notes, updated_at = now();
