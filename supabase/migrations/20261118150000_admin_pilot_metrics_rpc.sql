-- Aggregate-only pilot metrics for the allowlisted admin dashboard.
-- No user-level records or contact details are returned by this RPC.

create or replace function public.admin_get_pilot_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt() ->> 'email'), '')));
  v_result jsonb;
begin
  if v_uid is null
     or not exists (
       select 1
       from public.admin_allowlist a
       where a.active = true
         and a.email = v_email
     ) then
    raise exception using errcode = '42501', message = 'Admin access required';
  end if;

  select jsonb_build_object(
    'registered_users',
      (select count(*)::integer
       from auth.users u
       where coalesce(u.is_anonymous, false) = false),
    'new_users_7d',
      (select count(*)::integer
       from auth.users u
       where coalesce(u.is_anonymous, false) = false
         and u.created_at >= now() - interval '7 days'),
    'active_users_7d',
      (select count(distinct e.user_id)::integer
       from public.member_activity_events e
       where e.created_at >= now() - interval '7 days'),
    'active_users_30d',
      (select count(distinct e.user_id)::integer
       from public.member_activity_events e
       where e.created_at >= now() - interval '30 days'),
    'journeys_started',
      (select count(*)::integer from public.opportunity_journeys),
    'journeys_submitted',
      (select count(*)::integer
       from public.opportunity_journeys
       where status in ('submitted', 'waiting', 'approved', 'completed')),
    'journeys_completed',
      (select count(*)::integer
       from public.opportunity_journeys
       where status = 'completed'),
    'assessment_attempts',
      (select count(*)::integer from public.assessment_attempts),
    'initiative_submissions',
      (select count(*)::integer from public.initiatives),
    'community_posts_published',
      (select count(*)::integer
       from public.member_posts
       where status = 'published'),
    'team_posts_public',
      (select count(*)::integer
       from public.team_posts
       where status in ('published', 'closed')),
    'last_member_activity_at',
      (select max(e.created_at) from public.member_activity_events e),
    'weekly_activity',
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'week_start', to_char(w.week_start, 'YYYY-MM-DD'),
              'active_users', w.active_users
            )
            order by w.week_start
          ),
          '[]'::jsonb
        )
        from (
          select
            weeks.week_start,
            count(distinct e.user_id)::integer as active_users
          from generate_series(
            date_trunc('week', now()) - interval '7 weeks',
            date_trunc('week', now()),
            interval '1 week'
          ) as weeks(week_start)
          left join public.member_activity_events e
            on e.created_at >= weeks.week_start
           and e.created_at < weeks.week_start + interval '1 week'
          group by weeks.week_start
        ) w
      )
  )
  into v_result;

  return v_result;
end;
$function$;

revoke all on function public.admin_get_pilot_metrics() from public;
revoke all on function public.admin_get_pilot_metrics() from anon;
grant execute on function public.admin_get_pilot_metrics() to authenticated;
