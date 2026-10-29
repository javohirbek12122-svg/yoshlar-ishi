-- Harden public community submissions behind an Edge Function with server-side rate limits.
create table if not exists public.community_submission_rate_limits (
  action text not null check (action in ('team_post','team_interest')),
  rate_hash text not null check (rate_hash ~ '^[A-F0-9]{64}$'),
  window_started_at timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (action, rate_hash)
);
alter table public.community_submission_rate_limits enable row level security;
revoke all privileges on table public.community_submission_rate_limits from public, anon, authenticated;
grant all privileges on table public.community_submission_rate_limits to service_role;
drop policy if exists "service role manages community submission limits" on public.community_submission_rate_limits;
create policy "service role manages community submission limits"
on public.community_submission_rate_limits for all to service_role
using (true) with check (true);

create or replace function public.consume_community_submission_quota(
  p_action text,
  p_rate_hash text,
  p_window_seconds integer,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_cutoff timestamptz;
  v_hits integer;
begin
  if p_action not in ('team_post','team_interest')
     or p_rate_hash !~ '^[A-F0-9]{64}$'
     or p_window_seconds not between 60 and 86400
     or p_limit not between 1 and 20 then
    return false;
  end if;
  v_cutoff := v_now - make_interval(secs => p_window_seconds);
  insert into public.community_submission_rate_limits(action,rate_hash,window_started_at,hit_count,updated_at)
  values(p_action,p_rate_hash,v_now,1,v_now)
  on conflict(action,rate_hash) do update
    set window_started_at = case
          when public.community_submission_rate_limits.window_started_at <= v_cutoff then v_now
          else public.community_submission_rate_limits.window_started_at
        end,
        hit_count = case
          when public.community_submission_rate_limits.window_started_at <= v_cutoff then 1
          else public.community_submission_rate_limits.hit_count + 1
        end,
        updated_at = v_now
  returning hit_count into v_hits;

  delete from public.community_submission_rate_limits
  where updated_at < v_now - interval '3 days';

  return v_hits <= p_limit;
end;
$$;
revoke all on function public.consume_community_submission_quota(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_community_submission_quota(text,text,integer,integer) to service_role;

-- Remove public write paths. Server-side community-submit is the only intended public insert route.
drop policy if exists "users can submit team posts" on public.team_posts;
revoke insert on table public.team_posts from public, anon, authenticated;
revoke insert (owner_id,title,description,category,roles,skills,district,commitment,public_contact_url,contact_shared)
  on table public.team_posts from public, anon, authenticated;

drop policy if exists "public can express interest in published posts" on public.team_interest_requests;
revoke insert on table public.team_interest_requests from public, anon, authenticated;
revoke insert (team_post_id,name,contact,role_interest,message)
  on table public.team_interest_requests from public, anon, authenticated;
