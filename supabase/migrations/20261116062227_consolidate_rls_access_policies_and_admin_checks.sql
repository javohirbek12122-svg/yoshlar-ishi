-- Consolidate overlapping permissive RLS policies without changing access boundaries.
-- Public roles retain only published/active rows. Authenticated roles get one SELECT
-- policy combining public visibility with the existing active-admin allowlist.

drop policy if exists "admin can read all initiatives" on public.initiatives;
drop policy if exists "users can read own initiatives" on public.initiatives;
create policy "authenticated can read own or admin initiatives"
on public.initiatives for select to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);

drop policy if exists "admin can update initiatives" on public.initiatives;
drop policy if exists "users can update own submitted initiatives" on public.initiatives;
create policy "authenticated can update own submitted or admin initiatives"
on public.initiatives for update to authenticated
using (
  (owner_id = (select auth.uid()) and status = 'submitted')
  or exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
)
with check (
  (owner_id = (select auth.uid()) and status = any (array['submitted','needs_details']::text[]))
  or status = any (array[
    'submitted','reviewing','needs_details','approved','in_progress','completed','declined'
  ]::text[])
);

drop policy if exists "admins can read all showcase entries" on public.initiative_showcase;
drop policy if exists "public can read published showcase" on public.initiative_showcase;
create policy "anonymous can read published showcase"
on public.initiative_showcase for select to anon using (published = true);
create policy "authenticated can read published or admin showcase"
on public.initiative_showcase for select to authenticated
using (
  published = true
  or exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);

drop policy if exists "admin can read all official portal records" on public.official_portal_integrations;
drop policy if exists "public can read active official portal records" on public.official_portal_integrations;
create policy "anonymous can read active official portal records"
on public.official_portal_integrations for select to anon using (active = true);
create policy "authenticated can read active or admin portal records"
on public.official_portal_integrations for select to authenticated
using (
  active = true
  or exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);

drop policy if exists "admin can read all opportunity sources" on public.opportunity_sources;
drop policy if exists "public can read active opportunities" on public.opportunity_sources;
create policy "anonymous can read active opportunities"
on public.opportunity_sources for select to anon using (active = true);
create policy "authenticated can read active or admin opportunities"
on public.opportunity_sources for select to authenticated
using (
  active = true
  or exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);

drop policy if exists "admins can read all team posts" on public.team_posts;
drop policy if exists "public can see published team posts" on public.team_posts;
create policy "anonymous can see published team posts"
on public.team_posts for select to anon
using (status = any (array['published','closed']::text[]));
create policy "authenticated can see public or admin team posts"
on public.team_posts for select to authenticated
using (
  status = any (array['published','closed']::text[])
  or exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);

drop policy if exists "admins manage youth programmes" on public.youth_opportunity_programs;
drop policy if exists "public can read active youth programmes" on public.youth_opportunity_programs;
create policy "anonymous can read active youth programmes"
on public.youth_opportunity_programs for select to anon using (active = true);
create policy "authenticated can read active or admin youth programmes"
on public.youth_opportunity_programs for select to authenticated
using (
  active = true
  or exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);
create policy "admins can insert youth programmes"
on public.youth_opportunity_programs for insert to authenticated
with check (
  exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);
create policy "admins can update youth programmes"
on public.youth_opportunity_programs for update to authenticated
using (
  exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
)
with check (
  exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);
create policy "admins can delete youth programmes"
on public.youth_opportunity_programs for delete to authenticated
using (
  exists (
    select 1 from public.admin_allowlist as a
    where a.active = true
      and a.email = lower(trim(coalesce(((select auth.jwt()) ->> 'email'), '')))
  )
);
