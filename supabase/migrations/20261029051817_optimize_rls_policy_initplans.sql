-- Optimize RLS initplans by evaluating auth.jwt() once per statement,
-- not once per row. Authorization predicates and their scope are preserved.
do $$
declare
  p record;
  v_using text;
  v_check text;
  v_roles text;
  v_ddl text;
begin
  for p in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ilike '%auth.jwt()%'
        or coalesce(with_check, '') ilike '%auth.jwt()%'
      )
  loop
    v_using := case
      when p.qual is null then null
      else replace(p.qual, 'auth.jwt()', '(select auth.jwt())')
    end;
    v_check := case
      when p.with_check is null then null
      else replace(p.with_check, 'auth.jwt()', '(select auth.jwt())')
    end;
    v_roles := array_to_string(p.roles, ', ');

    execute format('drop policy if exists %I on %I.%I',
                   p.policyname, p.schemaname, p.tablename);

    v_ddl := format(
      'create policy %I on %I.%I as %s for %s to %s',
      p.policyname, p.schemaname, p.tablename, p.permissive, p.cmd, v_roles
    );
    if v_using is not null then
      v_ddl := v_ddl || format(' using (%s)', v_using);
    end if;
    if v_check is not null then
      v_ddl := v_ddl || format(' with check (%s)', v_check);
    end if;
    execute v_ddl;
  end loop;
end
$$;

-- Evaluate the tracking request header once per query while preserving the
-- strict reference-code match that gates anonymous tracking.
drop policy if exists "public can track with matching reference header" on public.initiatives;
create policy "public can track with matching reference header"
  on public.initiatives
  for select
  to anon
  using (
    reference_code = coalesce(
      ((nullif((select current_setting('request.headers'::text, true)), ''::text))::jsonb
        ->> 'x-initiative-code'::text),
      ''::text
    )
  );
