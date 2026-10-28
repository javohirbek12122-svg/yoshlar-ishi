-- Registry of external official portals and explicit connection status.
create table if not exists public.official_portal_integrations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name text not null,
  agency text not null default '',
  purpose text not null default '',
  portal_url text not null check (portal_url ~ '^https?://'),
  docs_url text not null default '',
  connection_mode text not null default 'external_link'
    check (connection_mode in ('external_link','public_api','oauth_sso','manual_import')),
  connection_status text not null default 'link_only'
    check (connection_status in ('link_only','docs_needed','approval_needed','connected','disabled')),
  auth_required boolean not null default false,
  active boolean not null default true,
  verified_on date,
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists official_portal_integrations_active_idx on public.official_portal_integrations(active, name);
alter table public.official_portal_integrations enable row level security;
grant select on public.official_portal_integrations to anon, authenticated;
grant insert, update, delete on public.official_portal_integrations to authenticated;
drop policy if exists "public can read active official portal records" on public.official_portal_integrations;
create policy "public can read active official portal records"
on public.official_portal_integrations for select to anon, authenticated using (active = true);
drop policy if exists "admin can insert official portal records" on public.official_portal_integrations;
create policy "admin can insert official portal records"
on public.official_portal_integrations for insert to authenticated
with check (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));
drop policy if exists "admin can update official portal records" on public.official_portal_integrations;
create policy "admin can update official portal records"
on public.official_portal_integrations for update to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))))
with check (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));
drop policy if exists "admin can delete official portal records" on public.official_portal_integrations;
create policy "admin can delete official portal records"
on public.official_portal_integrations for delete to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));

create or replace function public.set_official_portal_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_official_portal_updated_at() from public, anon, authenticated;
drop trigger if exists official_portal_integrations_touch_updated_at on public.official_portal_integrations;
create trigger official_portal_integrations_touch_updated_at
before update on public.official_portal_integrations
for each row execute function public.set_official_portal_updated_at();

insert into public.official_portal_integrations
  (slug,name,agency,purpose,portal_url,docs_url,connection_mode,connection_status,auth_required,active,verified_on,admin_notes)
values
 ('my-gov','Yagona interaktiv davlat xizmatlari portali','my.gov.uz','Davlat xizmatlari va elektron arizalar','https://my.gov.uz/uz','','external_link','link_only',true,true,date '2026-10-28','Hozircha tashqi havola. OneID/SSO va davlat API ulanishi sozlanmagan.'),
 ('government-portal','O‘zbekiston Respublikasi Hukumat portali','gov.uz','Davlat organlari va rasmiy axborot','https://gov.uz/oz','','external_link','link_only',false,true,date '2026-10-28','Hozircha tashqi havola. Rasmiy API integratsiyasi tasdiqlanmagan.'),
 ('lexuz','LEX.UZ qonunchilik bazasi','LEX.UZ','Normativ-huquqiy hujjatlarni tekshirish','https://lex.uz/uz/','','external_link','link_only',false,true,date '2026-10-28','Hozircha tashqi havola. Ommaviy sayt matnlarini avtomatik yig‘maydi.'),
 ('youth-agency','Yoshlar ishlari agentligi','Yoshlar ishlari agentligi','Yoshlar dasturlari va rasmiy axborot','https://yoshlar.gov.uz/','','external_link','link_only',false,true,date '2026-10-28','Hozircha tashqi havola. API/SSO ruxsati mavjud emas.'),
 ('youth-ledger','Yoshlar daftari bo‘yicha yo‘riqnoma','Adliya vazirligi','Yoshlar daftari va yordam tartibi haqida ma’lumot','https://advice.adliya.uz/oz/document/2631','','external_link','link_only',false,true,date '2026-10-28','Ma’lumot sahifasiga havola; yordam arizasi bu platformadan yuborilmaydi.'),
 ('murojaat','Murojaat.gov.uz','Murojaat.gov.uz','Tegishli tashkilotga murojaat yuborish','https://murojaat.gov.uz/','','external_link','link_only',true,true,date '2026-10-28','Hozircha tashqi havola. Murojaat avtomatik uzatilmaydi.'),
 ('president-reception','Prezident virtual qabulxonasi','pm.gov.uz','Virtual qabulxona va murojaat ma’lumotlari','https://pm.gov.uz/oz','','external_link','link_only',true,true,date '2026-10-28','Hozircha tashqi havola; login va forma rasmiy portalda qoladi.'),
 ('open-budget','Ochiq budjet','openbudget.uz','Fuqarolar budjeti va tashabbuslar','https://openbudget.uz/','','external_link','link_only',false,true,date '2026-10-28','Hozircha tashqi havola. Tashabbuslar yoki ovozlar avtomatik uzatilmaydi.'),
 ('open-data','Ochiq ma’lumotlar portali','olddata.gov.uz','Ochiq davlat ma’lumotlari','https://olddata.gov.uz/','','external_link','link_only',false,true,date '2026-10-28','Hozircha portal havolasi; API feed yoki ma’lumotlar sinxronizatsiyasi ulanmagan.')
on conflict (slug) do update set
 name=excluded.name, agency=excluded.agency, purpose=excluded.purpose, portal_url=excluded.portal_url,
 docs_url=excluded.docs_url, connection_mode=excluded.connection_mode, connection_status=excluded.connection_status,
 auth_required=excluded.auth_required, active=excluded.active, verified_on=excluded.verified_on,
 admin_notes=excluded.admin_notes;
