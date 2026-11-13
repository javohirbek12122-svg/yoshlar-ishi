-- Refresh official portal destinations from primary-source checks on 2026-11-13.
update public.official_portal_integrations
set portal_url = 'https://gov.uz/oz/uzbmb/contacts',
    purpose = 'Bilim va malakalarni baholash agentligining rasmiy Gov.uz sahifasi: e’lonlar, aloqa va umumiy ma’lumot. Test topshiruvchining interaktiv xizmatlari alohida my.uzbmb.uz portalida.',
    verified_on = date '2026-11-13',
    updated_at = now()
where slug = 'uzbmb-services';

update public.official_portal_integrations
set portal_url = 'https://my.uzbmb.uz/',
    purpose = 'Test topshiruvchining shaxsiy kabineti, ro‘yxatdan o‘tish, ruxsatnomalar, natijalar va boshqa interaktiv xizmatlar.',
    verified_on = date '2026-11-13',
    updated_at = now()
where slug = 'uzbmb-personal';

update public.official_portal_integrations
set verified_on = date '2026-11-13',
    updated_at = now()
where slug = 'scholarship-apply';

update public.official_portal_integrations
set active = false,
    verified_on = date '2026-11-13',
    updated_at = now()
where slug = 'tax-committee';

update public.official_portal_integrations
set verified_on = date '2026-11-13',
    updated_at = now()
where slug in ('open-data','open-budget');

update public.opportunity_sources
set verified_on = date '2026-11-13'
where url in ('https://data.egov.uz/','https://openbudget.uz/');

update public.opportunity_sources
set url = 'https://my.uzbmb.uz/',
    description = 'Bilim va malakalarni baholash agentligining interaktiv xizmati. Rasmiy e’lonlar va kontaktlar Gov.uz sahifasida; test topshiruvchining shaxsiy xizmatlari MyUZBMB portalida.',
    provider = 'Bilim va malakalarni baholash agentligi',
    verified_on = date '2026-11-13',
    active = true
where title = 'Bilim va malakalarni baholash interaktiv xizmatlari';

update public.opportunity_sources
set url = 'https://gov.uz/oz/uzbmb/contacts',
    description = 'Agentlikning rasmiy Gov.uz sahifasi: e’lonlar va aloqa. Interaktiv xizmatlar alohida MyUZBMB portalida.',
    provider = 'Bilim va malakalarni baholash agentligi',
    verified_on = date '2026-11-13',
    active = true
where title = 'Bilim va malakalarni baholash agentligi';

update public.opportunity_sources
set active = false,
    verified_on = date '2026-11-13'
where url = 'https://uzbmb.uz/';

update public.opportunity_sources
set verified_on = date '2026-11-13'
where url in ('https://openbudget.uz/','https://data.egov.uz/');
