-- Keep CV object paths in owner-scoped metadata; never write them to member_profiles.
create or replace function public.save_member_cv_path(p_cv_object_path text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_path text := coalesce(p_cv_object_path, '');
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if char_length(v_path) > 500 then
    raise exception 'cv_path_too_long' using errcode = '22023';
  end if;
  if v_path <> '' and split_part(v_path, '/', 1) <> v_user_id::text then
    raise exception 'cv_path_must_belong_to_user' using errcode = '42501';
  end if;
  if v_path <> '' and not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'member-cv' and o.name = v_path
  ) then
    raise exception 'cv_file_not_found' using errcode = 'P0002';
  end if;
  insert into public.member_private_assets (user_id, cv_object_path, cv_is_public, updated_at)
  values (v_user_id, v_path, false, now())
  on conflict (user_id) do update
    set cv_object_path = excluded.cv_object_path,
        cv_is_public = false,
        updated_at = now();
  return true;
end;
$$;
revoke all on function public.save_member_cv_path(text) from public, anon;
grant execute on function public.save_member_cv_path(text) to authenticated;

-- The old function writes CV columns that no longer exist on member_profiles.
revoke all on function public.save_my_member_privacy(text, boolean, text, boolean)
  from public, anon, authenticated;
