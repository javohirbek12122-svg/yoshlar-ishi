-- Existing accounts do not become discoverable without consent.
alter table public.member_profiles alter column visibility set default 'private',
  alter column show_in_directory set default false, alter column cv_is_public set default false;
update public.member_profiles set visibility='private',show_in_directory=false,cv_is_public=false
where visibility<>'private' or show_in_directory=true or cv_is_public=true;
alter table public.member_portfolio_items alter column visibility set default 'only_me';
create unique index if not exists member_activity_daily_visit_unique_idx
  on public.member_activity_events(user_id,((created_at at time zone 'Asia/Tashkent')::date))
  where event_type='daily_visit';
