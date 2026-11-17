-- Member profiles, posts, portfolio, reactions, activity and Google-protected admin authentication.
-- CV and community media remain private Storage objects; anonymous roles receive no member data.

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique default lower('yi-' || substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  display_name text not null default 'Yoshlar a’zosi' check (char_length(btrim(display_name)) between 2 and 120),
  headline text not null default '' check (char_length(headline)<=160),
  bio text not null default '' check (char_length(bio)<=2400),
  avatar_url text not null default '' check (char_length(avatar_url)<=700),
  city text not null default '' check (char_length(city)<=100),
  district text not null default '' check (char_length(district)<=100),
  website_url text not null default '' check (website_url='' or website_url ~ '^https://'),
  linkedin_url text not null default '' check (linkedin_url='' or linkedin_url ~ '^https://'),
  github_url text not null default '' check (github_url='' or github_url ~ '^https://'),
  skills text[] not null default '{}'::text[] check (cardinality(skills)<=30),
  interests text[] not null default '{}'::text[] check (cardinality(interests)<=30),
  education jsonb not null default '[]'::jsonb check (jsonb_typeof(education)='array' and octet_length(education::text)<=12000),
  experience jsonb not null default '[]'::jsonb check (jsonb_typeof(experience)='array' and octet_length(experience::text)<=16000),
  achievements jsonb not null default '[]'::jsonb check (jsonb_typeof(achievements)='array' and octet_length(achievements::text)<=12000),
  cv_object_path text not null default '' check (char_length(cv_object_path)<=500),
  cv_is_public boolean not null default false,
  visibility text not null default 'members' check (visibility in ('members','private')),
  show_in_directory boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_profiles_directory_idx on public.member_profiles(visibility,show_in_directory,updated_at desc);
create index if not exists member_profiles_city_idx on public.member_profiles(city,district);
create index if not exists member_profiles_skills_gin on public.member_profiles using gin(skills);
alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from public,anon,authenticated;
grant select on public.member_profiles to authenticated;
grant update(display_name,headline,bio,avatar_url,city,district,website_url,linkedin_url,github_url,skills,interests,education,experience,achievements,cv_object_path,cv_is_public,visibility,show_in_directory,updated_at)
  on public.member_profiles to authenticated;
drop policy if exists "members read discoverable profiles" on public.member_profiles;
create policy "members read discoverable profiles" on public.member_profiles for select to authenticated
  using (user_id=(select auth.uid()) or (visibility='members' and show_in_directory=true));
drop policy if exists "members update own profile" on public.member_profiles;
create policy "members update own profile" on public.member_profiles for update to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create table if not exists public.member_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.member_profiles(user_id) on delete cascade,
  body text not null default '' check (char_length(body)<=3000),
  media_paths text[] not null default '{}'::text[] check (cardinality(media_paths)<=6),
  visibility text not null default 'members' check (visibility in ('members','only_me')),
  status text not null default 'published' check (status in ('draft','published')),
  likes_count integer not null default 0 check (likes_count>=0),
  comments_count integer not null default 0 check (comments_count>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_posts_have_content check (char_length(btrim(body))>0 or cardinality(media_paths)>0)
);
create index if not exists member_posts_feed_idx on public.member_posts(created_at desc) where status='published' and visibility='members';
create index if not exists member_posts_author_idx on public.member_posts(author_id,created_at desc);
alter table public.member_posts enable row level security;
revoke all on public.member_posts from public,anon,authenticated;
grant select,delete on public.member_posts to authenticated;
grant insert(author_id,body,media_paths,visibility,status) on public.member_posts to authenticated;
grant update(body,media_paths,visibility,status,updated_at) on public.member_posts to authenticated;
drop policy if exists "members read published posts and own drafts" on public.member_posts;
create policy "members read published posts and own drafts" on public.member_posts for select to authenticated
  using (author_id=(select auth.uid()) or (status='published' and visibility='members'));
drop policy if exists "members create own posts" on public.member_posts;
create policy "members create own posts" on public.member_posts for insert to authenticated
  with check (author_id=(select auth.uid()) and status in ('draft','published') and visibility in ('members','only_me'));
drop policy if exists "members update own posts" on public.member_posts;
create policy "members update own posts" on public.member_posts for update to authenticated
  using (author_id=(select auth.uid())) with check (author_id=(select auth.uid()));
drop policy if exists "members delete own posts" on public.member_posts;
create policy "members delete own posts" on public.member_posts for delete to authenticated using (author_id=(select auth.uid()));

create table if not exists public.member_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.member_profiles(user_id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 140),
  description text not null default '' check (char_length(description)<=1600),
  category text not null default 'project' check (category in ('project','achievement','certificate','experience','other')),
  media_paths text[] not null default '{}'::text[] check (cardinality(media_paths)<=6),
  project_url text not null default '' check (project_url='' or project_url ~ '^https://'),
  visibility text not null default 'members' check (visibility in ('members','only_me')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_portfolio_user_idx on public.member_portfolio_items(user_id,sort_order,created_at desc);
alter table public.member_portfolio_items enable row level security;
revoke all on public.member_portfolio_items from public,anon,authenticated;
grant select,delete on public.member_portfolio_items to authenticated;
grant insert(user_id,title,description,category,media_paths,project_url,visibility,sort_order) on public.member_portfolio_items to authenticated;
grant update(title,description,category,media_paths,project_url,visibility,sort_order,updated_at) on public.member_portfolio_items to authenticated;
drop policy if exists "members read visible portfolio items" on public.member_portfolio_items;
create policy "members read visible portfolio items" on public.member_portfolio_items for select to authenticated
  using (user_id=(select auth.uid()) or (visibility='members' and exists(
    select 1 from public.member_profiles p where p.user_id=member_portfolio_items.user_id and p.visibility='members' and p.show_in_directory=true
  )));
drop policy if exists "members add own portfolio items" on public.member_portfolio_items;
create policy "members add own portfolio items" on public.member_portfolio_items for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists "members update own portfolio items" on public.member_portfolio_items;
create policy "members update own portfolio items" on public.member_portfolio_items for update to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "members delete own portfolio items" on public.member_portfolio_items;
create policy "members delete own portfolio items" on public.member_portfolio_items for delete to authenticated using (user_id=(select auth.uid()));

create table if not exists public.member_post_likes (
  post_id uuid not null references public.member_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id,user_id)
);
alter table public.member_post_likes enable row level security;
revoke all on public.member_post_likes from public,anon,authenticated;
grant select(post_id,user_id,created_at) on public.member_post_likes to authenticated;
grant insert(post_id,user_id) on public.member_post_likes to authenticated;
grant delete on public.member_post_likes to authenticated;
drop policy if exists "members read own post likes" on public.member_post_likes;
create policy "members read own post likes" on public.member_post_likes for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "members like published posts once" on public.member_post_likes;
create policy "members like published posts once" on public.member_post_likes for insert to authenticated
  with check (user_id=(select auth.uid()) and exists(select 1 from public.member_posts p where p.id=member_post_likes.post_id and p.status='published' and p.visibility='members'));
drop policy if exists "members remove own post likes" on public.member_post_likes;
create policy "members remove own post likes" on public.member_post_likes for delete to authenticated using (user_id=(select auth.uid()));

create table if not exists public.member_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.member_posts(id) on delete cascade,
  author_id uuid not null references public.member_profiles(user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_post_comments_post_idx on public.member_post_comments(post_id,created_at);
alter table public.member_post_comments enable row level security;
revoke all on public.member_post_comments from public,anon,authenticated;
grant select,delete on public.member_post_comments to authenticated;
grant insert(post_id,author_id,body) on public.member_post_comments to authenticated;
grant update(body,updated_at) on public.member_post_comments to authenticated;
drop policy if exists "members read comments on visible posts" on public.member_post_comments;
create policy "members read comments on visible posts" on public.member_post_comments for select to authenticated
  using (author_id=(select auth.uid()) or exists(select 1 from public.member_posts p where p.id=member_post_comments.post_id and p.status='published' and p.visibility='members'));
drop policy if exists "members comment on published posts" on public.member_post_comments;
create policy "members comment on published posts" on public.member_post_comments for insert to authenticated
  with check (author_id=(select auth.uid()) and exists(select 1 from public.member_posts p where p.id=member_post_comments.post_id and p.status='published' and p.visibility='members'));
drop policy if exists "members update own comments" on public.member_post_comments;
create policy "members update own comments" on public.member_post_comments for update to authenticated using (author_id=(select auth.uid())) with check (author_id=(select auth.uid()));
drop policy if exists "members delete own comments" on public.member_post_comments;
create policy "members delete own comments" on public.member_post_comments for delete to authenticated using (author_id=(select auth.uid()));

create table if not exists public.member_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('profile_updated','post_created','post_liked','post_unliked','comment_created','portfolio_added','journey_progress','lab_completed','initiative_submitted')),
  entity_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists member_activity_user_time_idx on public.member_activity_events(user_id,created_at desc);
alter table public.member_activity_events enable row level security;
revoke all on public.member_activity_events from public,anon,authenticated;
grant select(id,user_id,event_type,entity_id,created_at) on public.member_activity_events to authenticated;
drop policy if exists "members read own activity history" on public.member_activity_events;
create policy "members read own activity history" on public.member_activity_events for select to authenticated using (user_id=(select auth.uid()));

create or replace function public.create_member_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_display_name text; v_avatar text;
begin
  v_display_name:=coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name','')),''),nullif(trim(coalesce(new.raw_user_meta_data->>'name','')),''),'Yoshlar a’zosi');
  v_avatar:=coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'avatar_url','')),''),nullif(trim(coalesce(new.raw_user_meta_data->>'picture','')),''),'');
  insert into public.member_profiles(user_id,display_name,avatar_url) values(new.id,left(v_display_name,120),left(v_avatar,700)) on conflict(user_id) do nothing;
  return new;
end; $$;
revoke all on function public.create_member_profile_for_auth_user() from public,anon,authenticated;
drop trigger if exists create_member_profile_after_auth_signup on auth.users;
create trigger create_member_profile_after_auth_signup after insert on auth.users for each row execute function public.create_member_profile_for_auth_user();

insert into public.member_profiles(user_id,display_name,avatar_url)
select u.id,left(coalesce(nullif(trim(coalesce(u.raw_user_meta_data->>'full_name','')),''),nullif(trim(coalesce(u.raw_user_meta_data->>'name','')),''),'Yoshlar a’zosi'),120),
  left(coalesce(nullif(trim(coalesce(u.raw_user_meta_data->>'avatar_url','')),''),nullif(trim(coalesce(u.raw_user_meta_data->>'picture','')),''),''),700)
from auth.users u on conflict(user_id) do nothing;

create or replace function public.sync_member_post_counters()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_post_id uuid;
begin
  v_post_id:=case when tg_op='DELETE' then old.post_id else new.post_id end;
  if tg_table_name='member_post_likes' then
    update public.member_posts set likes_count=greatest(0,likes_count+case when tg_op='DELETE' then -1 else 1 end) where id=v_post_id;
  else
    update public.member_posts set comments_count=greatest(0,comments_count+case when tg_op='DELETE' then -1 else 1 end) where id=v_post_id;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;
revoke all on function public.sync_member_post_counters() from public,anon,authenticated;
drop trigger if exists member_post_likes_counter on public.member_post_likes;
create trigger member_post_likes_counter after insert or delete on public.member_post_likes for each row execute function public.sync_member_post_counters();
drop trigger if exists member_post_comments_counter on public.member_post_comments;
create trigger member_post_comments_counter after insert or delete on public.member_post_comments for each row execute function public.sync_member_post_counters();

create or replace function public.capture_member_activity()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_row jsonb; v_user_id uuid; v_entity_id uuid; v_event_type text;
begin
  v_row:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_user_id:=nullif(coalesce(v_row->>'author_id',v_row->>'user_id',v_row->>'owner_id'),'')::uuid;
  v_entity_id:=nullif(v_row->>'id','')::uuid;
  case tg_table_name
    when 'member_profiles' then v_event_type:='profile_updated'; v_entity_id:=v_user_id;
    when 'member_posts' then v_event_type:='post_created';
    when 'member_post_likes' then v_event_type:=case when tg_op='DELETE' then 'post_unliked' else 'post_liked' end; v_entity_id:=nullif(v_row->>'post_id','')::uuid;
    when 'member_post_comments' then v_event_type:='comment_created'; v_entity_id:=nullif(v_row->>'post_id','')::uuid;
    when 'member_portfolio_items' then v_event_type:='portfolio_added';
    when 'opportunity_journey_events' then v_event_type:='journey_progress'; v_entity_id:=nullif(v_row->>'journey_id','')::uuid;
    when 'lab_runs' then v_event_type:='lab_completed';
    when 'initiatives' then v_event_type:='initiative_submitted';
  end case;
  if v_user_id is not null and v_event_type is not null then
    insert into public.member_activity_events(user_id,event_type,entity_id) values(v_user_id,v_event_type,v_entity_id);
  end if;
  if tg_op='DELETE' then return old; end if; return new;
end; $$;
revoke all on function public.capture_member_activity() from public,anon,authenticated;
drop trigger if exists member_profile_activity on public.member_profiles;
create trigger member_profile_activity after update on public.member_profiles for each row
when (old.display_name is distinct from new.display_name or old.headline is distinct from new.headline or old.bio is distinct from new.bio
 or old.avatar_url is distinct from new.avatar_url or old.city is distinct from new.city or old.district is distinct from new.district
 or old.skills is distinct from new.skills or old.education is distinct from new.education or old.experience is distinct from new.experience or old.achievements is distinct from new.achievements)
execute function public.capture_member_activity();
drop trigger if exists member_post_activity on public.member_posts;
create trigger member_post_activity after insert on public.member_posts for each row execute function public.capture_member_activity();
drop trigger if exists member_post_like_activity on public.member_post_likes;
create trigger member_post_like_activity after insert or delete on public.member_post_likes for each row execute function public.capture_member_activity();
drop trigger if exists member_comment_activity on public.member_post_comments;
create trigger member_comment_activity after insert on public.member_post_comments for each row execute function public.capture_member_activity();
drop trigger if exists member_portfolio_activity on public.member_portfolio_items;
create trigger member_portfolio_activity after insert on public.member_portfolio_items for each row execute function public.capture_member_activity();
drop trigger if exists opportunity_journey_activity on public.opportunity_journey_events;
create trigger opportunity_journey_activity after insert on public.opportunity_journey_events for each row execute function public.capture_member_activity();
drop trigger if exists lab_run_activity on public.lab_runs;
create trigger lab_run_activity after insert on public.lab_runs for each row execute function public.capture_member_activity();
drop trigger if exists initiative_activity on public.initiatives;
create trigger initiative_activity after insert on public.initiatives for each row when (new.owner_id is not null) execute function public.capture_member_activity();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('member-avatars','member-avatars',true,4194304,array['image/jpeg','image/png','image/webp']),
 ('member-post-media','member-post-media',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('member-cv','member-cv',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "members upload own avatar" on storage.objects;
create policy "members upload own avatar" on storage.objects for insert to authenticated with check (bucket_id='member-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "members update own avatar" on storage.objects;
create policy "members update own avatar" on storage.objects for update to authenticated using (bucket_id='member-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='member-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "members delete own avatar" on storage.objects;
create policy "members delete own avatar" on storage.objects for delete to authenticated using (bucket_id='member-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "members upload own post media" on storage.objects;
create policy "members upload own post media" on storage.objects for insert to authenticated with check (bucket_id='member-post-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "members read media on visible posts and portfolios" on storage.objects;
create policy "members read media on visible posts and portfolios" on storage.objects for select to authenticated using (
  bucket_id='member-post-media' and ((storage.foldername(name))[1]=(select auth.uid())::text
  or exists(select 1 from public.member_posts p where p.media_paths @> array[storage.objects.name]::text[] and p.status='published' and p.visibility='members')
  or exists(select 1 from public.member_portfolio_items i join public.member_profiles p on p.user_id=i.user_id
    where i.media_paths @> array[storage.objects.name]::text[] and i.visibility='members' and p.visibility='members' and p.show_in_directory=true))
);
drop policy if exists "members update own post media" on storage.objects;
create policy "members update own post media" on storage.objects for update to authenticated using (bucket_id='member-post-media' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='member-post-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "members delete own post media" on storage.objects;
create policy "members delete own post media" on storage.objects for delete to authenticated using (bucket_id='member-post-media' and (storage.foldername(name))[1]=(select auth.uid())::text);

drop policy if exists "members upload own cv" on storage.objects;
create policy "members upload own cv" on storage.objects for insert to authenticated with check (bucket_id='member-cv' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "members read own cv" on storage.objects;
create policy "members read own cv" on storage.objects for select to authenticated using (bucket_id='member-cv' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "members update own cv" on storage.objects;
create policy "members update own cv" on storage.objects for update to authenticated using (bucket_id='member-cv' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='member-cv' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "members delete own cv" on storage.objects;
create policy "members delete own cv" on storage.objects for delete to authenticated using (bucket_id='member-cv' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.admin_google_console_check()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from auth.users u join auth.identities i on i.user_id=u.id
    where u.id=(select auth.uid()) and u.email_confirmed_at is not null and coalesce(u.is_anonymous,false)=false and i.provider='google')
  and exists(select 1 from public.admin_allowlist a where a.active=true and a.email=lower(trim(coalesce((select auth.jwt()->>'email'),''))));
$$;
revoke all on function public.admin_google_console_check() from public,anon;
grant execute on function public.admin_google_console_check() to authenticated;
