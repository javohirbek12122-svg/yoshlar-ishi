-- Yoshlar-Ishi owner dashboard, secure tracking RPC, and audit trail.
create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(trim(email))),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.admin_allowlist enable row level security;
grant select on public.admin_allowlist to authenticated;
create policy "admins can read own allowlist entry"
on public.admin_allowlist for select to authenticated
using (active = true and email = lower(trim(coalesce(auth.jwt()->>'email', ''))));

drop policy if exists "public can track with matching reference header" on public.initiatives;
revoke select on public.initiatives from anon;
create or replace function public.track_initiative(p_reference_code text)
returns table (
  reference_code text,
  title text,
  status text,
  created_at timestamptz,
  district text
)
language sql stable security definer set search_path = ''
as $$
  select i.reference_code, i.title, i.status, i.created_at, i.district
  from public.initiatives as i
  where p_reference_code ~ '^YI-[A-F0-9]{24}$'
    and i.reference_code = p_reference_code
  limit 1;
$$;
revoke all on function public.track_initiative(text) from public;
grant execute on function public.track_initiative(text) to anon, authenticated;

alter table public.initiatives
  add column if not exists admin_notes text not null default '',
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.connection_requests
  add column if not exists review_status text not null default 'new'
    check (review_status in ('new','reviewing','handled','archived')),
  add column if not exists admin_notes text not null default '',
  add column if not exists reviewed_at timestamptz;

grant select, update on public.initiatives to authenticated;
grant select, update, delete on public.connection_requests to authenticated;
grant insert, update, delete on public.opportunity_sources to authenticated;

create policy "admin can read all initiatives"
on public.initiatives for select to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));
create policy "admin can update initiatives"
on public.initiatives for update to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))))
with check (status in ('submitted','reviewing','needs_details','approved','in_progress','completed','declined'));

create policy "admin can read all connection requests"
on public.connection_requests for select to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));
create policy "admin can update connection requests"
on public.connection_requests for update to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))))
with check (review_status in ('new','reviewing','handled','archived'));
create policy "admin can delete connection requests"
on public.connection_requests for delete to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));

create policy "admin can insert opportunity sources"
on public.opportunity_sources for insert to authenticated
with check (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));
create policy "admin can update opportunity sources"
on public.opportunity_sources for update to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))))
with check (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));
create policy "admin can delete opportunity sources"
on public.opportunity_sources for delete to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  initiative_id uuid references public.initiatives(id) on delete set null,
  reference_code text not null default '',
  action text not null,
  old_status text,
  new_status text,
  created_at timestamptz not null default now()
);
create index if not exists admin_activity_log_created_at_idx on public.admin_activity_log(created_at desc);
alter table public.admin_activity_log enable row level security;
grant select on public.admin_activity_log to authenticated;
create policy "admin can read activity log"
on public.admin_activity_log for select to authenticated
using (exists (select 1 from public.admin_allowlist a
 where a.active = true and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))));

create or replace function public.log_initiative_status_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.admin_activity_log
      (actor_id, initiative_id, reference_code, action, old_status, new_status)
    values
      (auth.uid(), new.id, new.reference_code, 'initiative_status_changed', old.status, new.status);
  end if;
  return new;
end;
$$;
revoke all on function public.log_initiative_status_change() from public;
drop trigger if exists initiative_status_audit on public.initiatives;
create trigger initiative_status_audit after update of status on public.initiatives
for each row execute function public.log_initiative_status_change();

create or replace function public.set_yi_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_yi_updated_at() from public;
drop trigger if exists initiatives_touch_updated_at on public.initiatives;
create trigger initiatives_touch_updated_at before update on public.initiatives
for each row execute function public.set_yi_updated_at();

-- To authorize an owner, insert their lower-case verified Supabase Auth email into
-- public.admin_allowlist using the Supabase SQL editor. Do not enable self-service admin claiming.
