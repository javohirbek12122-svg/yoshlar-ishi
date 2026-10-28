grant select on public.initiatives to anon;
create policy "public can track with matching reference header"
on public.initiatives for select to anon
using (
  reference_code = coalesce(
    (nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-initiative-code'),
    ''
  )
);
