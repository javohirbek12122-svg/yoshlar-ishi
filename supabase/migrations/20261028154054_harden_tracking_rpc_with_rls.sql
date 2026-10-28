-- Tracking RPC runs as invoker and is constrained by column grants + an RLS policy matching x-initiative-code.
drop policy if exists "public can track with matching reference header" on public.initiatives;
grant select (reference_code, title, status, created_at, district) on public.initiatives to anon;
create policy "public can track with matching reference header"
on public.initiatives for select to anon
using (
  reference_code = coalesce(
    (nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-initiative-code'),
    ''
  )
);
create or replace function public.track_initiative(p_reference_code text)
returns table (
  reference_code text,
  title text,
  status text,
  created_at timestamptz,
  district text
)
language sql stable security invoker set search_path = ''
as $$
  select i.reference_code, i.title, i.status, i.created_at, i.district
  from public.initiatives as i
  where p_reference_code ~ '^YI-[A-F0-9]{24}$'
    and i.reference_code = p_reference_code
    and i.reference_code = coalesce(
      (nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-initiative-code'),
      ''
    )
  limit 1;
$$;
revoke all on function public.track_initiative(text) from public, authenticated;
grant execute on function public.track_initiative(text) to anon;
