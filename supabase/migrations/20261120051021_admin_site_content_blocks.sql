create table if not exists public.site_content_blocks (
  content_key text primary key,
  content_value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_content_blocks_key_format check (content_key ~ '^[a-z0-9][a-z0-9_-]{2,79}$'),
  constraint site_content_blocks_value_object check (jsonb_typeof(content_value) = 'object' and octet_length(content_value::text) <= 12000)
);
alter table public.site_content_blocks enable row level security;
revoke all on table public.site_content_blocks from anon, authenticated;
grant select on table public.site_content_blocks to anon, authenticated;
grant insert, update on table public.site_content_blocks to authenticated;
drop policy if exists "public can read public site content" on public.site_content_blocks;
create policy "public can read public site content" on public.site_content_blocks for select to anon using (is_public = true);
drop policy if exists "members read public content admins read all" on public.site_content_blocks;
create policy "members read public content admins read all" on public.site_content_blocks for select to authenticated using (is_public = true or exists (select 1 from public.admin_allowlist a where a.active = true and a.email = lower(trim(coalesce((select auth.jwt())->>'email','')))));
drop policy if exists "active admins insert site content" on public.site_content_blocks;
create policy "active admins insert site content" on public.site_content_blocks for insert to authenticated with check ((select auth.uid()) is not null and exists (select 1 from public.admin_allowlist a where a.active = true and a.email = lower(trim(coalesce((select auth.jwt())->>'email','')))));
drop policy if exists "active admins update site content" on public.site_content_blocks;
create policy "active admins update site content" on public.site_content_blocks for update to authenticated using ((select auth.uid()) is not null and exists (select 1 from public.admin_allowlist a where a.active = true and a.email = lower(trim(coalesce((select auth.jwt())->>'email',''))))) with check ((select auth.uid()) is not null and exists (select 1 from public.admin_allowlist a where a.active = true and a.email = lower(trim(coalesce((select auth.jwt())->>'email','')))));
insert into public.site_content_blocks(content_key,content_value,is_public) values('homepage_hero',jsonb_build_object('image_url','https://d2ol7oe51mr4n9.cloudfront.net/user_3JM13LmKQo41EGZkNQHbTC0mG4m/f0a06878-17e7-4fdb-94e6-0437ce7f174c.jpg','image_alt','O‘zbekiston bayrog‘i oldida kostyum kiygan uch nafar yigit. Yoshlar-Ishi banneri.','enabled',true),true) on conflict (content_key) do nothing;
