
drop policy if exists "account owners can create linked initiatives" on public.initiatives;
create policy "account owners can create linked initiatives"
on public.initiatives for insert to authenticated
with check (owner_id = (select auth.uid()) and status = 'submitted');

create or replace function public.get_my_initiatives()
returns table (
  id uuid,
  reference_code text,
  submitter_name text,
  age_band text,
  district text,
  category text,
  title text,
  problem text,
  expected_result text,
  support_needed text[],
  contact text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.reference_code, i.submitter_name, i.age_band, i.district, i.category,
         i.title, i.problem, i.expected_result, i.support_needed, i.contact, i.status,
         i.created_at, i.updated_at
  from public.initiatives as i
  where (select auth.uid()) is not null
    and i.owner_id = (select auth.uid())
  order by i.created_at desc
  limit 100;
$$;
revoke all on function public.get_my_initiatives() from public, anon;
grant execute on function public.get_my_initiatives() to authenticated;

create or replace function public.update_my_initiative(
 p_id uuid,
 p_submitter_name text,
 p_age_band text,
 p_district text,
 p_category text,
 p_title text,
 p_problem text,
 p_expected_result text,
 p_support_needed text[],
 p_contact text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare affected integer;
begin
 if (select auth.uid()) is null then return false; end if;
 if coalesce(char_length(trim(p_title)),0) < 5
    or coalesce(char_length(trim(p_problem)),0) < 15
    or coalesce(char_length(trim(p_expected_result)),0) < 10 then
   raise exception 'Tashabbus sarlavhasi, muammo va natijani tekshiring.';
 end if;
 update public.initiatives as i
 set submitter_name = left(trim(coalesce(p_submitter_name,'')),120),
     age_band = p_age_band,
     district = left(trim(coalesce(p_district,'')),100),
     category = p_category,
     title = left(trim(p_title),160),
     problem = left(trim(p_problem),3000),
     expected_result = left(trim(p_expected_result),2000),
     support_needed = coalesce(p_support_needed,'{}'::text[]),
     contact = left(trim(coalesce(p_contact,'')),300),
     updated_at = now()
 where i.id = p_id
   and i.owner_id = (select auth.uid())
   and i.status = 'submitted';
 get diagnostics affected = row_count;
 return affected = 1;
end;
$$;
revoke all on function public.update_my_initiative(uuid,text,text,text,text,text,text,text,text[],text) from public, anon;
grant execute on function public.update_my_initiative(uuid,text,text,text,text,text,text,text,text[],text) to authenticated;
