-- Yoshlar-Ishi × Turnir Ballari integration
-- Extends the existing Bilet 023 tables without replacing youth profiles,
-- opportunities, assessments, initiatives, or existing member sessions.
-- The site continues to use the shared Yoshlar-Ishi Supabase Auth project.

alter table public.bilet023_tournaments
  add column if not exists region text not null default '',
  add column if not exists event_date date,
  add column if not exists description text not null default '',
  add column if not exists status text not null default 'draft',
  add column if not exists published_at timestamptz,
  add column if not exists revision bigint not null default 1;

alter table public.bilet023_teams
  add column if not exists revision bigint not null default 1;

alter table public.bilet023_tournaments
  drop constraint if exists bilet023_tournaments_status_check;
alter table public.bilet023_tournaments
  add constraint bilet023_tournaments_status_check
  check (status in ('draft','published','archived'));

alter table public.bilet023_tournaments
  drop constraint if exists bilet023_tournaments_revision_check;
alter table public.bilet023_tournaments
  add constraint bilet023_tournaments_revision_check check (revision > 0);

alter table public.bilet023_teams
  drop constraint if exists bilet023_teams_revision_check;
alter table public.bilet023_teams
  add constraint bilet023_teams_revision_check check (revision > 0);

create table if not exists public.bilet023_members (
  tournament_id uuid not null references public.bilet023_tournaments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','operator','auditor','viewer')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tournament_id,user_id)
);

create table if not exists public.bilet023_audit_log (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.bilet023_tournaments(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bilet023_tournaments_owner_updated_idx
  on public.bilet023_tournaments(owner_id,updated_at desc);
create index if not exists bilet023_teams_tournament_order_idx
  on public.bilet023_teams(tournament_id,sort_order);
create index if not exists bilet023_members_user_tournament_idx
  on public.bilet023_members(user_id,tournament_id);
create index if not exists bilet023_audit_tournament_created_idx
  on public.bilet023_audit_log(tournament_id,created_at desc);

-- Internal policy helpers live outside the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.bilet023_can_read(p_tournament_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, auth, private
as $bilet_read$
  select exists (
    select 1
    from public.bilet023_tournaments t
    where t.id = p_tournament_id
      and (t.owner_id = auth.uid() or t.status = 'published')
  )
  or exists (
    select 1
    from public.bilet023_members m
    where m.tournament_id = p_tournament_id
      and m.user_id = auth.uid()
  );
$bilet_read$;

create or replace function private.bilet023_can_edit(p_tournament_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, auth, private
as $bilet_edit$
  select exists (
    select 1
    from public.bilet023_tournaments t
    where t.id = p_tournament_id
      and t.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.bilet023_members m
    join public.bilet023_tournaments t on t.id = m.tournament_id
    where m.tournament_id = p_tournament_id
      and m.user_id = auth.uid()
      and (
        m.role = 'admin'
        or (m.role = 'operator' and t.status <> 'published')
      )
  );
$bilet_edit$;

create or replace function private.bilet023_can_manage(p_tournament_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, auth, private
as $bilet_manage$
  select exists (
    select 1
    from public.bilet023_tournaments t
    where t.id = p_tournament_id
      and t.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.bilet023_members m
    where m.tournament_id = p_tournament_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
  );
$bilet_manage$;

create or replace function private.bilet023_can_audit(p_tournament_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, auth, private
as $bilet_audit$
  select exists (
    select 1
    from public.bilet023_tournaments t
    where t.id = p_tournament_id
      and t.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.bilet023_members m
    where m.tournament_id = p_tournament_id
      and m.user_id = auth.uid()
      and m.role in ('admin','auditor')
  );
$bilet_audit$;

revoke all on function private.bilet023_can_read(uuid) from public;
revoke all on function private.bilet023_can_edit(uuid) from public;
revoke all on function private.bilet023_can_manage(uuid) from public;
revoke all on function private.bilet023_can_audit(uuid) from public;
grant execute on function private.bilet023_can_read(uuid) to anon, authenticated;
grant execute on function private.bilet023_can_edit(uuid) to authenticated;
grant execute on function private.bilet023_can_manage(uuid) to authenticated;
grant execute on function private.bilet023_can_audit(uuid) to authenticated;

create or replace function private.bilet023_bump_revision()
returns trigger
language plpgsql
set search_path = pg_catalog, public, private
as $bilet_revision$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$bilet_revision$;

drop trigger if exists bilet023_tournaments_revision on public.bilet023_tournaments;
create trigger bilet023_tournaments_revision
before update on public.bilet023_tournaments
for each row execute function private.bilet023_bump_revision();

drop trigger if exists bilet023_teams_revision on public.bilet023_teams;
create trigger bilet023_teams_revision
before update on public.bilet023_teams
for each row execute function private.bilet023_bump_revision();

create or replace function private.bilet023_write_audit()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public, auth, private
as $bilet_write_audit$
declare
  v_tournament_id uuid;
  v_entity_id uuid;
  v_before jsonb;
  v_after jsonb;
begin
  if tg_table_name = 'bilet023_tournaments' then
    v_tournament_id := coalesce((to_jsonb(new)->>'id')::uuid,(to_jsonb(old)->>'id')::uuid);
  else
    v_tournament_id := coalesce((to_jsonb(new)->>'tournament_id')::uuid,(to_jsonb(old)->>'tournament_id')::uuid);
  end if;

  v_entity_id := coalesce(
    (to_jsonb(new)->>'id')::uuid,
    (to_jsonb(old)->>'id')::uuid,
    (to_jsonb(new)->>'user_id')::uuid,
    (to_jsonb(old)->>'user_id')::uuid
  );
  v_before := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  v_after := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;

  if v_tournament_id is not null then
    insert into public.bilet023_audit_log(
      tournament_id, actor_id, action, entity_type, entity_id, before_data, after_data
    ) values (
      v_tournament_id, auth.uid(), lower(tg_op), tg_table_name, v_entity_id, v_before, v_after
    );
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$bilet_write_audit$;

revoke all on function private.bilet023_write_audit() from public, anon, authenticated;

drop trigger if exists bilet023_tournaments_audit on public.bilet023_tournaments;
create trigger bilet023_tournaments_audit
after insert or update on public.bilet023_tournaments
for each row execute function private.bilet023_write_audit();

drop trigger if exists bilet023_teams_audit on public.bilet023_teams;
create trigger bilet023_teams_audit
after insert or update or delete on public.bilet023_teams
for each row execute function private.bilet023_write_audit();

drop trigger if exists bilet023_members_audit on public.bilet023_members;
create trigger bilet023_members_audit
after insert or update or delete on public.bilet023_members
for each row execute function private.bilet023_write_audit();

alter table public.bilet023_tournaments enable row level security;
alter table public.bilet023_teams enable row level security;
alter table public.bilet023_members enable row level security;
alter table public.bilet023_audit_log enable row level security;

drop policy if exists "Bilet023 owners can read tournaments" on public.bilet023_tournaments;
drop policy if exists "Bilet023 owners can create tournaments" on public.bilet023_tournaments;
drop policy if exists "Bilet023 owners can update tournaments" on public.bilet023_tournaments;
drop policy if exists "Bilet023 owners can delete tournaments" on public.bilet023_tournaments;
drop policy if exists "Bilet023 read permitted tournaments" on public.bilet023_tournaments;
drop policy if exists "Bilet023 owners create tournaments" on public.bilet023_tournaments;
drop policy if exists "Bilet023 managers update tournaments" on public.bilet023_tournaments;
drop policy if exists "Bilet023 owners delete draft tournaments" on public.bilet023_tournaments;

create policy "Bilet023 read permitted tournaments"
on public.bilet023_tournaments for select to anon, authenticated
using (private.bilet023_can_read(id));

create policy "Bilet023 owners create tournaments"
on public.bilet023_tournaments for insert to authenticated
with check (owner_id = auth.uid());

create policy "Bilet023 managers update tournaments"
on public.bilet023_tournaments for update to authenticated
using (private.bilet023_can_manage(id))
with check (private.bilet023_can_manage(id));

create policy "Bilet023 owners delete draft tournaments"
on public.bilet023_tournaments for delete to authenticated
using (owner_id = auth.uid() and status <> 'published');

drop policy if exists "Bilet023 owners can read teams" on public.bilet023_teams;
drop policy if exists "Bilet023 owners can create teams" on public.bilet023_teams;
drop policy if exists "Bilet023 owners can update teams" on public.bilet023_teams;
drop policy if exists "Bilet023 owners can delete teams" on public.bilet023_teams;
drop policy if exists "Bilet023 read permitted teams" on public.bilet023_teams;
drop policy if exists "Bilet023 operators create teams" on public.bilet023_teams;
drop policy if exists "Bilet023 operators update teams" on public.bilet023_teams;
drop policy if exists "Bilet023 operators delete teams" on public.bilet023_teams;

create policy "Bilet023 read permitted teams"
on public.bilet023_teams for select to anon, authenticated
using (private.bilet023_can_read(tournament_id));

create policy "Bilet023 operators create teams"
on public.bilet023_teams for insert to authenticated
with check (private.bilet023_can_edit(tournament_id));

create policy "Bilet023 operators update teams"
on public.bilet023_teams for update to authenticated
using (private.bilet023_can_edit(tournament_id))
with check (private.bilet023_can_edit(tournament_id));

create policy "Bilet023 operators delete teams"
on public.bilet023_teams for delete to authenticated
using (private.bilet023_can_edit(tournament_id));

drop policy if exists "Bilet023 members read permitted memberships" on public.bilet023_members;
drop policy if exists "Bilet023 managers add memberships" on public.bilet023_members;
drop policy if exists "Bilet023 managers update memberships" on public.bilet023_members;
drop policy if exists "Bilet023 managers remove memberships" on public.bilet023_members;

create policy "Bilet023 members read permitted memberships"
on public.bilet023_members for select to authenticated
using (
  user_id = auth.uid()
  or private.bilet023_can_manage(tournament_id)
  or private.bilet023_can_audit(tournament_id)
);

create policy "Bilet023 managers add memberships"
on public.bilet023_members for insert to authenticated
with check (private.bilet023_can_manage(tournament_id));

create policy "Bilet023 managers update memberships"
on public.bilet023_members for update to authenticated
using (private.bilet023_can_manage(tournament_id))
with check (private.bilet023_can_manage(tournament_id));

create policy "Bilet023 managers remove memberships"
on public.bilet023_members for delete to authenticated
using (private.bilet023_can_manage(tournament_id));

drop policy if exists "Bilet023 audit readers" on public.bilet023_audit_log;
create policy "Bilet023 audit readers"
on public.bilet023_audit_log for select to authenticated
using (private.bilet023_can_audit(tournament_id));

grant select, insert, update, delete on public.bilet023_tournaments, public.bilet023_teams to authenticated;
grant select, insert, update, delete on public.bilet023_members to authenticated;
grant select on public.bilet023_audit_log to authenticated;

-- Public access is limited to the explicitly public tournament columns.
revoke all on public.bilet023_tournaments from anon;
grant select (id,title,region,event_date,description,status,published_at,revision,created_at,updated_at)
  on public.bilet023_tournaments to anon;
grant select on public.bilet023_teams to anon;

create or replace view public.bilet023_public_tournaments
with (security_invoker = true)
as
select id,title,region,event_date,description,status,published_at,revision,created_at,updated_at
from public.bilet023_tournaments
where status = 'published';

grant select on public.bilet023_public_tournaments to anon, authenticated;

create or replace function public.bilet023_save_tournament(
  p_tournament_id uuid,
  p_expected_revision bigint,
  p_title text,
  p_region text,
  p_event_date date,
  p_description text,
  p_teams jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, auth, private
as $bilet_save$
declare
  v_tournament public.bilet023_tournaments%rowtype;
  v_item jsonb;
  v_team_id uuid;
  v_expected_team_revision bigint;
  v_saved_id uuid;
  v_saved_revision bigint;
  v_name text;
  v_wins integer;
  v_draws integer;
  v_losses integer;
  v_sort_order integer;
  v_result jsonb := '[]'::jsonb;
  v_distinct_names integer;
  v_revision bigint;
begin
  if auth.uid() is null or not private.bilet023_can_edit(p_tournament_id) then
    raise exception 'Bu turnirni tahrirlash huquqi yo‘q.'
      using errcode = '42501';
  end if;

  if p_title is null or char_length(btrim(p_title)) < 2 or char_length(btrim(p_title)) > 120 then
    raise exception 'Musobaqa nomi 2–120 belgi oralig‘ida bo‘lishi kerak.'
      using errcode = '22023';
  end if;

  if p_teams is null or jsonb_typeof(p_teams) <> 'array' or jsonb_array_length(p_teams) <> 4 then
    raise exception 'Turnirda aynan 4 ta jamoa bo‘lishi kerak.'
      using errcode = '22023';
  end if;

  select count(distinct lower(btrim(x.value->>'team_name')))
  into v_distinct_names
  from jsonb_array_elements(p_teams) as x(value);

  if v_distinct_names <> 4 then
    raise exception 'Jamoa nomlari bo‘sh bo‘lmasligi va takrorlanmasligi kerak.'
      using errcode = '22023';
  end if;

  select * into v_tournament
  from public.bilet023_tournaments
  where id = p_tournament_id
  for update;

  if not found then
    raise exception 'Musobaqa topilmadi.'
      using errcode = 'P0002';
  end if;

  if v_tournament.revision <> p_expected_revision then
    raise exception 'Musobaqa boshqa foydalanuvchi tomonidan yangilangan. Sahifani qayta yuklang.'
      using errcode = '40001';
  end if;

  if (select count(*) from public.bilet023_teams where tournament_id = p_tournament_id) <> 4 then
    raise exception 'Turnir tarkibida aynan 4 ta jamoa bo‘lishi kerak.'
      using errcode = '22023';
  end if;

  update public.bilet023_tournaments
  set title = btrim(p_title),
      region = coalesce(btrim(p_region),''),
      event_date = p_event_date,
      description = coalesce(btrim(p_description),'')
  where id = p_tournament_id and revision = p_expected_revision
  returning revision into v_revision;

  if v_revision is null then
    raise exception 'Musobaqa versiyasi o‘zgargan. Qayta yuklang.'
      using errcode = '40001';
  end if;

  for v_item in select value from jsonb_array_elements(p_teams)
  loop
    v_name := btrim(coalesce(v_item->>'team_name',''));
    v_wins := (v_item->>'wins')::integer;
    v_draws := (v_item->>'draws')::integer;
    v_losses := (v_item->>'losses')::integer;
    v_sort_order := (v_item->>'sort_order')::integer;

    if char_length(v_name) < 1 or char_length(v_name) > 80
      or v_wins < 0 or v_wins > 999
      or v_draws < 0 or v_draws > 999
      or v_losses < 0 or v_losses > 999
      or v_sort_order < 1 or v_sort_order > 4 then
      raise exception 'Jamoa maydonlaridan biri noto‘g‘ri.'
        using errcode = '22023';
    end if;

    if nullif(v_item->>'id','') is null then
      raise exception 'Har bir jamoa uchun server identifikatori talab qilinadi.'
        using errcode = '22023';
    end if;

    v_team_id := (v_item->>'id')::uuid;
    v_expected_team_revision := coalesce((v_item->>'revision')::bigint,1);

    update public.bilet023_teams
    set team_name = v_name,
        wins = v_wins,
        draws = v_draws,
        losses = v_losses,
        sort_order = v_sort_order
    where id = v_team_id
      and tournament_id = p_tournament_id
      and revision = v_expected_team_revision
    returning id,revision into v_saved_id,v_saved_revision;

    if v_saved_id is null then
      raise exception 'Jamoa natijasi boshqa operator tomonidan yangilangan. Sahifani qayta yuklang.'
        using errcode = '40001';
    end if;

    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'id',v_saved_id,
      'revision',v_saved_revision,
      'sort_order',v_sort_order
    ));
  end loop;

  return jsonb_build_object('revision',v_revision,'teams',v_result);
end;
$bilet_save$;

revoke all on function public.bilet023_save_tournament(uuid,bigint,text,text,date,text,jsonb) from public, anon;
grant execute on function public.bilet023_save_tournament(uuid,bigint,text,text,date,text,jsonb) to authenticated;

comment on table public.bilet023_members is 'Yoshlar-Ishi turnirlari uchun admin/operator/auditor/viewer rollari.';
comment on table public.bilet023_audit_log is 'Serverda qayd qilinadigan turnir amallari; oddiy foydalanuvchi tahrirlay olmaydi.';
comment on view public.bilet023_public_tournaments is 'Faqat e’lon qilingan turnirlar uchun owner_id maydonisiz ommaviy ko‘rinish.';
