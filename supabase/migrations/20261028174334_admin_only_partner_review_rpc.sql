
-- Keep partnership request details behind an allowlist-checked server-side interface.
-- Only id/review_status remain readable as columns for the admin dashboard count widget;
-- RLS returns these columns only for an active admin. Contact details and internal notes are RPC-only.
revoke all privileges on table public.connection_requests from public, anon, authenticated;
grant insert (name, email, phone, organization, request_type, message)
  on table public.connection_requests to anon, authenticated;
grant select (id, review_status) on table public.connection_requests to authenticated;

create or replace function public.admin_list_connection_requests()
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  organization text,
  request_type text,
  message text,
  review_status text,
  admin_notes text,
  created_at timestamptz,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
 if (select auth.uid()) is null
    or not exists (
      select 1 from public.admin_allowlist a
      where a.active = true
        and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))
    ) then
   raise exception using errcode = '42501', message = 'Admin access required';
 end if;
 return query
 select c.id,c.name,c.email,c.phone,c.organization,c.request_type,c.message,
        c.review_status,c.admin_notes,c.created_at,c.reviewed_at
 from public.connection_requests c
 order by c.created_at desc
 limit 300;
end;
$$;
revoke all on function public.admin_list_connection_requests() from public, anon;
grant execute on function public.admin_list_connection_requests() to authenticated;

create or replace function public.admin_review_connection_request(
 p_id uuid,
 p_expected_status text,
 p_status text,
 p_admin_notes text
)
returns table (
 id uuid,
 old_status text,
 new_status text,
 admin_notes text,
 reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_old_status text;
 v_notes text;
 v_reviewed_at timestamptz;
begin
 if (select auth.uid()) is null
    or not exists (
      select 1 from public.admin_allowlist a
      where a.active = true
        and a.email = lower(trim(coalesce(auth.jwt()->>'email','')))
    ) then
   raise exception using errcode = '42501', message = 'Admin access required';
 end if;
 if p_status is null or p_status not in ('new','reviewing','handled','archived') then
   raise exception using errcode = '22023', message = 'Invalid connection request status';
 end if;
 select c.review_status into v_old_status
 from public.connection_requests c where c.id = p_id;
 if not found then
   raise exception using errcode = 'P0002', message = 'Connection request not found';
 end if;
 if v_old_status is distinct from p_expected_status then
   raise exception using errcode = '40001', message = 'Review status changed since the last refresh; reload the dashboard';
 end if;
 update public.connection_requests c
 set review_status = p_status,
     admin_notes = left(coalesce(p_admin_notes,''),4000),
     reviewed_at = now()
 where c.id = p_id
 returning c.admin_notes,c.reviewed_at into v_notes,v_reviewed_at;
 return query select p_id,v_old_status,p_status,v_notes,v_reviewed_at;
end;
$$;
revoke all on function public.admin_review_connection_request(uuid,text,text,text) from public, anon;
grant execute on function public.admin_review_connection_request(uuid,text,text,text) to authenticated;
