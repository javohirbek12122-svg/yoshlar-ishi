-- Keep profile visibility in member_profiles and private CV data in member_private_assets.
-- The Storage SELECT policy reads the latter; synchronizing both in one RPC makes
-- the privacy setting and the signed-URL permission change atomic.
create or replace function public.save_my_member_privacy(
  p_visibility text,
  p_show_in_directory boolean,
  p_cv_object_path text,
  p_cv_is_public boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_path text := coalesce(p_cv_object_path, '');
  v_visibility text := coalesce(p_visibility, 'private');
  v_discoverable boolean := coalesce(p_show_in_directory, false);
  v_cv_public boolean := coalesce(p_cv_is_public, false);
  v_updated integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if v_visibility not in ('members', 'private') then
    raise exception 'invalid_profile_visibility' using errcode = '22023';
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
  if v_cv_public and (v_path = '' or v_visibility <> 'members' or not v_discoverable) then
    raise exception 'public_cv_requires_discoverable_profile_and_uploaded_file'
      using errcode = '22023';
  end if;

  update public.member_profiles
  set visibility = v_visibility,
      show_in_directory = case when v_visibility = 'private' then false else v_discoverable end,
      updated_at = now()
  where user_id = v_user_id;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'member_profile_not_found' using errcode = 'P0002';
  end if;

  insert into public.member_private_assets (user_id, cv_object_path, cv_is_public, updated_at)
  values (v_user_id, v_path, v_cv_public, now())
  on conflict (user_id) do update
    set cv_object_path = excluded.cv_object_path,
        cv_is_public = excluded.cv_is_public,
        updated_at = now();

  return true;
end;
$$;

revoke all on function public.save_my_member_privacy(text, boolean, text, boolean)
  from public, anon;
grant execute on function public.save_my_member_privacy(text, boolean, text, boolean)
  to authenticated;
