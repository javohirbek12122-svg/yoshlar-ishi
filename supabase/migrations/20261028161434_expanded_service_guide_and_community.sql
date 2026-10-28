
-- Extended service-guide data, privacy-preserving community board, showcase voting and backend-only integration secrets.
alter table public.official_portal_integrations
 add column if not exists category text not null default 'public_services',
 add column if not exists detail_text text not null default '',
 add column if not exists features jsonb not null default '[]'::jsonb,
 add column if not exists steps jsonb not null default '[]'::jsonb,
 add column if not exists required_items jsonb not null default '[]'::jsonb,
 add column if not exists audience text not null default '',
 add column if not exists icon_key text not null default 'landmark',
 add column if not exists hero_image_url text not null default '',
 add column if not exists image_alt text not null default '',
 add column if not exists image_credit text not null default '',
 add column if not exists source_url text not null default '',
 add column if not exists fees_note text not null default 'Xizmat shartlarini rasmiy portaldan tekshiring.',
 add column if not exists time_note text not null default 'Muddat xizmat turiga qarab farq qiladi.',
 add column if not exists contact_info text not null default '',
 add column if not exists tags text[] not null default '{}',
 add column if not exists sort_order integer not null default 100;

create table if not exists public.official_portal_admin_notes(
 integration_id uuid primary key references public.official_portal_integrations(id) on delete cascade,
 admin_notes text not null default '', updated_at timestamptz not null default now()
);
alter table public.official_portal_admin_notes enable row level security;
revoke all on public.official_portal_admin_notes from anon,authenticated;
grant select,insert,update,delete on public.official_portal_admin_notes to authenticated;
drop policy if exists "authorized admins can read portal notes" on public.official_portal_admin_notes;
create policy "authorized admins can read portal notes" on public.official_portal_admin_notes for select to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
drop policy if exists "authorized admins can insert portal notes" on public.official_portal_admin_notes;
create policy "authorized admins can insert portal notes" on public.official_portal_admin_notes for insert to authenticated
with check(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
drop policy if exists "authorized admins can update portal notes" on public.official_portal_admin_notes;
create policy "authorized admins can update portal notes" on public.official_portal_admin_notes for update to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))))
with check(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
insert into public.official_portal_admin_notes(integration_id,admin_notes)
select id,admin_notes from public.official_portal_integrations where coalesce(admin_notes,'')<>''
on conflict(integration_id) do update set admin_notes=excluded.admin_notes;

revoke select on public.official_portal_integrations from anon,authenticated;
grant select(id,slug,name,agency,purpose,portal_url,docs_url,connection_mode,connection_status,auth_required,active,verified_on,created_at,updated_at,category,detail_text,features,steps,required_items,audience,icon_key,hero_image_url,image_alt,image_credit,source_url,fees_note,time_note,contact_info,tags,sort_order) on public.official_portal_integrations to anon,authenticated;
drop policy if exists "public can read active official portal records" on public.official_portal_integrations;
create policy "public can read active official portal records" on public.official_portal_integrations for select to anon,authenticated using(active=true);
drop policy if exists "admin can read all official portal records" on public.official_portal_integrations;
create policy "admin can read all official portal records" on public.official_portal_integrations for select to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
revoke update on public.official_portal_integrations from anon,authenticated;
grant update(active,connection_mode,connection_status,docs_url,verified_on,category,detail_text,features,steps,required_items,audience,icon_key,hero_image_url,image_alt,image_credit,source_url,fees_note,time_note,contact_info,tags,sort_order,purpose) on public.official_portal_integrations to authenticated;

create table if not exists public.team_posts(
 id uuid primary key default gen_random_uuid(),owner_id uuid references auth.users(id) on delete set null,
 title text not null check(char_length(trim(title)) between 5 and 120),
 description text not null check(char_length(trim(description)) between 20 and 1600),
 category text not null check(category in('technology','design','marketing','content','business','research','volunteer','other')),
 roles text[] not null default '{}',skills text[] not null default '{}',district text not null default '',
 commitment text not null default 'Flexible' check(char_length(commitment)<=80),
 public_contact_url text not null default '' check(char_length(public_contact_url)<=300),
 contact_shared boolean not null default false,status text not null default 'pending' check(status in('pending','published','closed','rejected')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(contact_shared or public_contact_url='')
);
create index if not exists team_posts_status_created_idx on public.team_posts(status,created_at desc);
alter table public.team_posts enable row level security;
revoke all on public.team_posts from anon,authenticated;
grant insert on public.team_posts to anon,authenticated;
grant select(id,title,description,category,roles,skills,district,commitment,public_contact_url,contact_shared,status,created_at,updated_at) on public.team_posts to anon,authenticated;
grant update,delete on public.team_posts to authenticated;
drop policy if exists "public can see published team posts" on public.team_posts;
create policy "public can see published team posts" on public.team_posts for select to anon,authenticated using(status in('published','closed'));
drop policy if exists "users can submit team posts" on public.team_posts;
create policy "users can submit team posts" on public.team_posts for insert to anon,authenticated with check(status='pending' and (owner_id is null or owner_id=(select auth.uid())));
drop policy if exists "admins can read all team posts" on public.team_posts;
create policy "admins can read all team posts" on public.team_posts for select to authenticated using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
drop policy if exists "admins can moderate team posts" on public.team_posts;
create policy "admins can moderate team posts" on public.team_posts for update to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))))
with check(status in('pending','published','closed','rejected'));
drop policy if exists "admins can delete team posts" on public.team_posts;
create policy "admins can delete team posts" on public.team_posts for delete to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));

create table if not exists public.team_interest_requests(
 id uuid primary key default gen_random_uuid(),team_post_id uuid not null references public.team_posts(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 2 and 120),
 contact text not null check(char_length(trim(contact)) between 4 and 300),
 role_interest text not null default '',message text not null check(char_length(trim(message)) between 5 and 1200),
 status text not null default 'new' check(status in('new','reviewing','forwarded','closed')),
 created_at timestamptz not null default now()
);
alter table public.team_interest_requests enable row level security;
revoke all on public.team_interest_requests from anon,authenticated;
grant insert on public.team_interest_requests to anon,authenticated;
grant select,update,delete on public.team_interest_requests to authenticated;
create policy "public can express interest in published posts" on public.team_interest_requests for insert to anon,authenticated
with check(exists(select 1 from public.team_posts p where p.id=team_post_id and p.status='published'));
create policy "admins can read team interest requests" on public.team_interest_requests for select to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
create policy "admins can update team interest requests" on public.team_interest_requests for update to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))))
with check(status in('new','reviewing','forwarded','closed'));
create policy "admins can delete team interest requests" on public.team_interest_requests for delete to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));

create table if not exists public.initiative_showcase(
 id uuid primary key default gen_random_uuid(),initiative_id uuid references public.initiatives(id) on delete set null,
 slug text not null unique check(slug ~ '^[a-z0-9-]{3,100}$'),
 title text not null check(char_length(trim(title)) between 5 and 140),
 summary text not null check(char_length(trim(summary)) between 20 and 1800),
 category text not null default 'other',district text not null default '',
 display_name text not null default 'Yoshlar-Ishi tashabbuskori',
 stage text not null default 'G‘oya' check(char_length(stage)<=80),
 image_url text not null default '',public_url text not null default '',
 featured boolean not null default false,published boolean not null default false,
 votes_count integer not null default 0 check(votes_count>=0),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.initiative_showcase enable row level security;
create index if not exists initiative_showcase_public_idx on public.initiative_showcase(published,featured,votes_count desc,created_at desc);
revoke all on public.initiative_showcase from anon,authenticated;
grant select(id,slug,title,summary,category,district,display_name,stage,image_url,public_url,featured,published,votes_count,created_at,updated_at) on public.initiative_showcase to anon,authenticated;
grant insert,update,delete on public.initiative_showcase to authenticated;
create policy "public can read published showcase" on public.initiative_showcase for select to anon,authenticated using(published=true);
create policy "admins can read all showcase entries" on public.initiative_showcase for select to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
create policy "admins can insert showcase entries" on public.initiative_showcase for insert to authenticated
with check(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));
create policy "admins can update showcase entries" on public.initiative_showcase for update to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))))
with check(votes_count>=0);
create policy "admins can delete showcase entries" on public.initiative_showcase for delete to authenticated
using(exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce(auth.jwt()->>'email','')))));

create table if not exists public.initiative_showcase_votes(
 id uuid primary key default gen_random_uuid(),showcase_id uuid not null references public.initiative_showcase(id) on delete cascade,
 voter_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now(),
 unique(showcase_id,voter_id)
);
alter table public.initiative_showcase_votes enable row level security;
revoke all on public.initiative_showcase_votes from anon,authenticated;
grant select,insert,delete on public.initiative_showcase_votes to authenticated;
create policy "users can see own showcase votes" on public.initiative_showcase_votes for select to authenticated using(voter_id=(select auth.uid()));
create policy "users can vote once per showcase entry" on public.initiative_showcase_votes for insert to authenticated
with check(voter_id=(select auth.uid()) and exists(select 1 from public.initiative_showcase s where s.id=showcase_id and s.published=true));
create policy "users can remove own vote" on public.initiative_showcase_votes for delete to authenticated using(voter_id=(select auth.uid()));
create or replace function public.apply_showcase_vote_count() returns trigger language plpgsql security definer set search_path=''
as $$ begin
 if tg_op='INSERT' then update public.initiative_showcase set votes_count=votes_count+1 where id=new.showcase_id; return new;
 elsif tg_op='DELETE' then update public.initiative_showcase set votes_count=greatest(0,votes_count-1) where id=old.showcase_id; return old; end if;
 return null;
end; $$;
revoke all on function public.apply_showcase_vote_count() from public,anon,authenticated;
drop trigger if exists showcase_vote_count_trigger on public.initiative_showcase_votes;
create trigger showcase_vote_count_trigger after insert or delete on public.initiative_showcase_votes for each row execute function public.apply_showcase_vote_count();

create table if not exists public.telegram_subscriptions(
 id uuid primary key default gen_random_uuid(),telegram_user_id text not null,telegram_chat_id text not null,
 reference_code text not null references public.initiatives(reference_code) on delete cascade,
 active boolean not null default true,linked_at timestamptz not null default now(),
 unique(telegram_chat_id,reference_code)
);
alter table public.telegram_subscriptions enable row level security;
revoke all on public.telegram_subscriptions from public,anon,authenticated;
grant all on public.telegram_subscriptions to service_role;

create table if not exists public.ai_review_rate_limits(
 rate_hash text primary key check(rate_hash ~ '^[A-F0-9]{64}$'),window_start timestamptz not null,
 hit_count integer not null default 0,updated_at timestamptz not null default now()
);
alter table public.ai_review_rate_limits enable row level security;
revoke all on public.ai_review_rate_limits from public,anon,authenticated;
grant all on public.ai_review_rate_limits to service_role;
create or replace function public.consume_idea_review_quota(p_rate_hash text,p_limit integer default 4)
returns boolean language plpgsql security definer set search_path=''
as $$ declare v_hits integer; v_bucket timestamptz:=date_trunc('minute',clock_timestamp());
begin
 if p_rate_hash !~ '^[A-F0-9]{64}$' then return false; end if;
 insert into public.ai_review_rate_limits(rate_hash,window_start,hit_count,updated_at) values(p_rate_hash,v_bucket,1,clock_timestamp())
 on conflict(rate_hash) do update set hit_count=case when public.ai_review_rate_limits.window_start=v_bucket then public.ai_review_rate_limits.hit_count+1 else 1 end,window_start=v_bucket,updated_at=clock_timestamp()
 returning hit_count into v_hits;
 delete from public.ai_review_rate_limits where updated_at<clock_timestamp()-interval '24 hours';
 return v_hits<=greatest(1,least(coalesce(p_limit,4),5));
end; $$;
revoke all on function public.consume_idea_review_quota(text,integer) from public,anon,authenticated;
grant execute on function public.consume_idea_review_quota(text,integer) to service_role;

drop trigger if exists team_posts_touch_updated_at on public.team_posts;
create trigger team_posts_touch_updated_at before update on public.team_posts for each row execute function public.set_yi_updated_at();
drop trigger if exists initiative_showcase_touch_updated_at on public.initiative_showcase;
create trigger initiative_showcase_touch_updated_at before update on public.initiative_showcase for each row execute function public.set_yi_updated_at();
