-- Route anonymous public initiative submissions through the server-side community-submit Edge Function.
-- Authenticated account users retain the owner-scoped INSERT policy for cabinet submissions.
alter table public.community_submission_rate_limits
  drop constraint if exists community_submission_rate_limits_action_check;
alter table public.community_submission_rate_limits
  add constraint community_submission_rate_limits_action_check
  check (action in ('team_post','team_interest','initiative_submit'));

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
  if p_action not in ('team_post','team_interest','initiative_submit')
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

drop policy if exists "public can submit initiatives" on public.initiatives;
revoke insert on table public.initiatives from public, anon;
revoke insert (reference_code,owner_id,submitter_name,age_band,district,category,title,problem,expected_result,support_needed,contact,status)
  on table public.initiatives from public, anon;
