create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  age_band text not null default '16-18' check (age_band in ('under_16','16-18','19-24','25-30','30_plus')),
  district text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles read own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table if not exists public.initiatives (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique check (reference_code ~ '^YI-[A-F0-9]{8,24}$'),
  owner_id uuid references auth.users(id) on delete set null,
  submitter_name text not null check (char_length(trim(submitter_name)) between 2 and 120),
  age_band text not null check (age_band in ('under_16','16-18','19-24','25-30','30_plus')),
  district text not null default '',
  category text not null check (category in ('startup','education','community','volunteer','culture','technology','other')),
  title text not null check (char_length(trim(title)) between 5 and 160),
  problem text not null check (char_length(trim(problem)) between 15 and 3000),
  expected_result text not null check (char_length(trim(expected_result)) between 10 and 2000),
  support_needed text[] not null default '{}',
  contact text not null default '',
  status text not null default 'submitted' check (status in ('submitted','reviewing','needs_details','approved','in_progress','completed','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists initiatives_created_at_idx on public.initiatives (created_at desc);
create index if not exists initiatives_status_idx on public.initiatives (status);
alter table public.initiatives enable row level security;
create policy "public can submit initiatives" on public.initiatives for insert to anon, authenticated with check (status = 'submitted' and (owner_id is null or owner_id = (select auth.uid())));
create policy "users can read own initiatives" on public.initiatives for select to authenticated using ((select auth.uid()) = owner_id);
create policy "users can update own submitted initiatives" on public.initiatives for update to authenticated using ((select auth.uid()) = owner_id and status = 'submitted') with check ((select auth.uid()) = owner_id and status in ('submitted','needs_details'));

create table if not exists public.initiative_updates (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null references public.initiatives(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  update_type text not null default 'progress' check (update_type in ('progress','milestone','feedback','status_change')),
  body text not null check (char_length(trim(body)) between 2 and 3000),
  created_at timestamptz not null default now()
);
alter table public.initiative_updates enable row level security;
create policy "initiative owners can read updates" on public.initiative_updates for select to authenticated using (exists (select 1 from public.initiatives i where i.id = initiative_id and i.owner_id = (select auth.uid())));
create policy "initiative owners can add updates" on public.initiative_updates for insert to authenticated with check (author_id = (select auth.uid()) and exists (select 1 from public.initiatives i where i.id = initiative_id and i.owner_id = (select auth.uid())));

create table if not exists public.opportunity_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'opportunity',
  url text not null check (url ~ '^https?://'),
  provider text not null default '',
  verified_on date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.opportunity_sources enable row level security;
create policy "public can read active opportunities" on public.opportunity_sources for select to anon, authenticated using (active = true);

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null default '',
  phone text not null default '',
  organization text not null default '',
  request_type text not null check (request_type in ('mentor','organization','event','resource','feedback')),
  message text not null check (char_length(trim(message)) between 5 and 3000),
  created_at timestamptz not null default now()
);
alter table public.connection_requests enable row level security;
create policy "public can submit connection requests" on public.connection_requests for insert to anon, authenticated with check (true);

grant select on public.opportunity_sources to anon, authenticated;
grant insert on public.initiatives, public.connection_requests to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.initiatives to authenticated;
grant select, insert on public.initiative_updates to authenticated;
