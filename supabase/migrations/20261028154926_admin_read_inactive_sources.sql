-- Authorized admins must see inactive source and integration rows so they can restore them.
drop policy if exists "admin can read all opportunity sources" on public.opportunity_sources;
create policy "admin can read all opportunity sources"
on public.opportunity_sources for select to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));

drop policy if exists "admin can read all official portal records" on public.official_portal_integrations;
create policy "admin can read all official portal records"
on public.official_portal_integrations for select to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));
