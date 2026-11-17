-- Daily activity is once per Uzbekistan calendar day. CVs may be signed only after an explicit profile consent.
alter table public.member_activity_events drop constraint if exists member_activity_events_event_type_check;
alter table public.member_activity_events add constraint member_activity_events_event_type_check
  check (event_type in ('daily_visit','profile_updated','post_created','post_liked','post_unliked','comment_created','portfolio_added','journey_progress','lab_completed','initiative_submitted'));
create unique index if not exists member_activity_daily_visit_unique_idx
  on public.member_activity_events(user_id,((created_at at time zone 'Asia/Tashkent')::date))
  where event_type='daily_visit';

create or replace function public.record_member_daily_visit()
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_uid uuid := (select auth.uid()); v_inserted integer;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  insert into public.member_activity_events(user_id,event_type) values(v_uid,'daily_visit') on conflict do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted=1;
end;
$$;
revoke all on function public.record_member_daily_visit() from public,anon;
grant execute on function public.record_member_daily_visit() to authenticated;

drop policy if exists "members read own or public cv" on storage.objects;
create policy "members read own or public cv" on storage.objects for select to authenticated
using (bucket_id='member-cv' and (
  (storage.foldername(name))[1]=(select auth.uid())::text
  or exists(select 1 from public.member_profiles p where p.user_id::text=(storage.foldername(objects.name))[1]
    and p.cv_object_path=objects.name and p.cv_is_public=true and p.visibility='members' and p.show_in_directory=true)
));
