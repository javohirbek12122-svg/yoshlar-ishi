-- Point the public directory to the current open-data portal referenced by government datasets.
update public.official_portal_integrations
set portal_url='https://data.egov.uz/',
    agency='data.egov.uz',
    purpose='Davlat organlarining ochiq ma’lumotlar to‘plamlari va mashina o‘qiy oladigan datasetlar',
    verified_on=date '2026-10-28',
    admin_notes='Vazirlik va hukumat katalogidagi Ochiq ma’lumotlar portali. Hozircha tashqi havola; API/data-feed sinxronizatsiyasi faollashtirilmagan.'
where slug='open-data';

update public.opportunity_sources
set url='https://data.egov.uz/',
    provider='Ochiq ma’lumotlar portali',
    description='Davlat organlarining ochiq ma’lumotlar to‘plamlari. To‘plam pasporti va xizmat/API tafsilotlarini portalning o‘zida tekshiring.',
    verified_on=date '2026-10-28'
where url='https://olddata.gov.uz/';
