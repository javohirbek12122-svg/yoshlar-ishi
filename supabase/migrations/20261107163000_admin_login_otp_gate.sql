-- Parkent-style admin gate: authenticated identities must pass an authoritative allowlist check.
create or replace function public.admin_console_check()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_allowlist a
    where a.active = true
      and a.email = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );
$$;

revoke all on function public.admin_console_check() from public;
revoke all on function public.admin_console_check() from anon;
grant execute on function public.admin_console_check() to authenticated;
