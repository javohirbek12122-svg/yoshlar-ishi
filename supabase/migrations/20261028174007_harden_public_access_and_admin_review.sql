
-- Harden REST grants separately from row-level security.
-- RLS filters rows, but does not protect TRUNCATE/REFERENCES/TRIGGER privileges
-- and does not limit which columns an authenticated user can update or select.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;

-- Anonymous users can submit initiatives, but must use the constrained tracking RPC to read status.
revoke select (reference_code, title, status, created_at, district)
  on table public.initiatives from anon;
grant insert (reference_code, owner_id, submitter_name, age_band, district, category,
              title, problem, expected_result, support_needed, contact, status)
  on table public.initiatives to anon, authenticated;
grant select (id, reference_code, owner_id, submitter_name, age_band, district,
              category, title, problem, expected_result, support_needed, contact,
              status, created_at, updated_at)
  on table public.initiatives to authenticated;
grant update (submitter_name, age_band, district, category, title, problem,
              expected_result, support_needed, contact)
  on table public.initiatives to authenticated;

-- The user-facing account functions run as INVOKER; their grants and RLS policies constrain them.
create or replace function public.get_my_initiatives()
returns table (
  id uuid,
  reference_code text,
  submitter_name text,
  age_band text,
  district text,
  category text,
  title text,
  problem text,
  expected_result text,
  support_needed text[],
  contact text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id, i.reference_code, i.submitter_name, i.age_band, i.district, i.category,
         i.title, i.problem, i.expected_result, i.support_needed, i.contact, i.status,
         i.created_at, i.updated_at
  from public.initiatives as i
  where (select auth.uid()) is not null
    and i.owner_id = (select auth.uid())
  order by i.created_at desc
  limit 100;
$$;
revoke all on function public.get_my_initiatives() from public, anon;
grant execute on function public.get_my_initiatives() to authenticated;

create or replace function public.update_my_initiative(
 p_id uuid,
 p_submitter_name text,
 p_age_band text,
 p_district text,
 p_category text,
 p_title text,
 p_problem text,
 p_expected_result text,
 p_support_needed text[],
 p_contact text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare affected integer;
begin
 if (select auth.uid()) is null then return false; end if;
 if coalesce(char_length(trim(p_title)),0) < 5
    or coalesce(char_length(trim(p_problem)),0) < 15
    or coalesce(char_length(trim(p_expected_result)),0) < 10 then
   raise exception 'Tashabbus sarlavhasi, muammo va natijani tekshiring.';
 end if;
 update public.initiatives as i
 set submitter_name = left(trim(coalesce(p_submitter_name,'')),120),
     age_band = p_age_band,
     district = left(trim(coalesce(p_district,'')),100),
     category = p_category,
     title = left(trim(p_title),160),
     problem = left(trim(p_problem),3000),
     expected_result = left(trim(p_expected_result),2000),
     support_needed = coalesce(p_support_needed,'{}'::text[]),
     contact = left(trim(coalesce(p_contact,'')),300)
 where i.id = p_id
   and i.owner_id = (select auth.uid())
   and i.status = 'submitted';
 get diagnostics affected = row_count;
 return affected = 1;
end;
$$;
revoke all on function public.update_my_initiative(uuid,text,text,text,text,text,text,text,text[],text) from public, anon;
grant execute on function public.update_my_initiative(uuid,text,text,text,text,text,text,text,text[],text) to authenticated;

-- Admin-only read RPC: internal notes and review metadata are never granted as table columns.
create or replace function public.admin_list_initiatives()
returns table (
  id uuid,
  reference_code text,
  submitter_name text,
  age_band text,
  district text,
  category text,
  title text,
  problem text,
  expected_result text,
  support_needed text[],
  contact text,
  status text,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
 if (select auth.uid()) is null
    or not exists (
      select 1 from public.admin_allowlist a
      where a.active = true
        and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))
    ) then
   raise exception using errcode = '42501', message = 'Admin access required';
 end if;
 return query
 select i.id,i.reference_code,i.submitter_name,i.age_band,i.district,i.category,
        i.title,i.problem,i.expected_result,i.support_needed,i.contact,i.status,
        i.admin_notes,i.created_at,i.updated_at,i.reviewed_at,i.reviewed_by
 from public.initiatives i
 order by i.created_at desc
 limit 300;
end;
$$;
revoke all on function public.admin_list_initiatives() from public, anon;
grant execute on function public.admin_list_initiatives() to authenticated;

-- Admin-only write RPC: the allowlist and expected previous status are checked in the database.
create or replace function public.admin_review_initiative(
 p_id uuid,
 p_expected_status text,
 p_status text,
 p_admin_notes text
)
returns table (
 id uuid,
 reference_code text,
 title text,
 old_status text,
 new_status text,
 admin_notes text,
 reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_old_status text;
 v_reference_code text;
 v_title text;
 v_admin_notes text;
 v_reviewed_at timestamptz;
begin
 if (select auth.uid()) is null
    or not exists (
      select 1 from public.admin_allowlist a
      where a.active = true
        and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))
    ) then
   raise exception using errcode = '42501', message = 'Admin access required';
 end if;
 if p_status is null or p_status not in
    ('submitted','reviewing','needs_details','approved','in_progress','completed','declined') then
   raise exception using errcode = '22023', message = 'Invalid initiative status';
 end if;
 select i.status,i.reference_code,i.title
 into v_old_status,v_reference_code,v_title
 from public.initiatives i where i.id = p_id;
 if not found then
   raise exception using errcode = 'P0002', message = 'Initiative not found';
 end if;
 if v_old_status is distinct from p_expected_status then
   raise exception using errcode = '40001', message = 'Status changed since the last refresh; reload the dashboard';
 end if;
 update public.initiatives i
 set status = p_status,
     admin_notes = left(coalesce(p_admin_notes,''),4000),
     reviewed_by = (select auth.uid()),
     reviewed_at = now(),
     updated_at = now()
 where i.id = p_id
 returning i.admin_notes,i.reviewed_at into v_admin_notes,v_reviewed_at;
 return query select p_id,v_reference_code,v_title,v_old_status,p_status,v_admin_notes,v_reviewed_at;
end;
$$;
revoke all on function public.admin_review_initiative(uuid,text,text,text) from public, anon;
grant execute on function public.admin_review_initiative(uuid,text,text,text) to authenticated;

-- Read-only admin queues and public write forms have deliberately different column grants.
grant select (email, active) on table public.admin_allowlist to authenticated;
grant select (id, actor_id, initiative_id, reference_code, action, old_status, new_status, created_at)
  on table public.admin_activity_log to authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant insert (id, display_name, age_band, district)
  on table public.profiles to authenticated;
grant update (display_name, age_band, district)
  on table public.profiles to authenticated;

grant insert (name, email, phone, organization, request_type, message)
  on table public.connection_requests to anon, authenticated;
grant select on table public.connection_requests to authenticated;
grant update (review_status, admin_notes, reviewed_at)
  on table public.connection_requests to authenticated;
grant delete on table public.connection_requests to authenticated;

grant select (id, title, description, category, url, provider, active, verified_on, created_at)
  on table public.opportunity_sources to anon, authenticated;
grant insert (title, description, category, url, provider, active, verified_on)
  on table public.opportunity_sources to authenticated;
grant update (active) on table public.opportunity_sources to authenticated;
grant delete on table public.opportunity_sources to authenticated;

-- Retain only the public fields for the official catalogue; private admin notes live in a separate table.
grant select (id, slug, name, agency, purpose, portal_url, docs_url, connection_mode,
              connection_status, auth_required, active, verified_on, created_at, updated_at,
              category, detail_text, features, steps, required_items, audience, icon_key,
              hero_image_url, image_alt, image_credit, source_url, fees_note, time_note,
              contact_info, tags, sort_order)
  on table public.official_portal_integrations to anon, authenticated;
grant update (active, connection_mode, connection_status, docs_url, verified_on, category,
              detail_text, features, steps, required_items, audience, icon_key, hero_image_url,
              image_alt, image_credit, source_url, fees_note, time_note, contact_info, tags,
              sort_order, purpose)
  on table public.official_portal_integrations to authenticated;
grant select, insert, update on table public.official_portal_admin_notes to authenticated;

-- Public team posts may only be submitted as pending; status is controlled by admin moderation.
grant insert (owner_id, title, description, category, roles, skills, district, commitment,
              public_contact_url, contact_shared)
  on table public.team_posts to anon, authenticated;
grant select (id, title, description, category, roles, skills, district, commitment,
              public_contact_url, contact_shared, status, created_at, updated_at)
  on table public.team_posts to anon, authenticated;
grant update (status) on table public.team_posts to authenticated;
grant delete on table public.team_posts to authenticated;

drop policy if exists "public can express interest in published posts" on public.team_interest_requests;
create policy "public can express interest in published posts"
on public.team_interest_requests for insert to anon, authenticated
with check (
  status = 'new'
  and exists (
    select 1 from public.team_posts p
    where p.id = team_interest_requests.team_post_id and p.status = 'published'
  )
);
grant insert (team_post_id, name, contact, role_interest, message)
  on table public.team_interest_requests to anon, authenticated;
grant select on table public.team_interest_requests to authenticated;
grant update (status) on table public.team_interest_requests to authenticated;
grant delete on table public.team_interest_requests to authenticated;

grant select (id, slug, title, summary, category, district, display_name, stage, image_url,
              public_url, featured, published, votes_count, created_at, updated_at)
  on table public.initiative_showcase to anon, authenticated;
grant insert (initiative_id, slug, title, summary, category, district, display_name, stage,
              image_url, public_url, featured, published, created_by)
  on table public.initiative_showcase to authenticated;
grant update (featured, published) on table public.initiative_showcase to authenticated;
grant delete on table public.initiative_showcase to authenticated;

grant select (showcase_id, voter_id, created_at) on table public.initiative_showcase_votes to authenticated;
grant insert (showcase_id, voter_id) on table public.initiative_showcase_votes to authenticated;
grant delete on table public.initiative_showcase_votes to authenticated;

-- Telegram subscriptions and AI throttling remain server-side only.
revoke all privileges on table public.telegram_subscriptions from public, anon, authenticated;
revoke all privileges on table public.ai_review_rate_limits from public, anon, authenticated;
grant all privileges on table public.telegram_subscriptions to service_role;
grant all privileges on table public.ai_review_rate_limits to service_role;
