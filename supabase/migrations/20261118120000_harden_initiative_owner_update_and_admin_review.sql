-- Restrict initiative edits to the owner while the request is pending.
-- Active admins may review/update initiatives through the explicit allowlist.
drop policy if exists "authenticated can update own submitted or admin initiatives" on public.initiatives;

create policy "owners update own pending initiatives or admins review"
on public.initiatives
for update
to authenticated
using (
  (
    owner_id = (select auth.uid())
    and status in ('submitted', 'needs_details')
  )
  or exists (
    select 1
    from public.admin_allowlist aa
    where aa.active = true
      and aa.email = lower(trim(coalesce((select auth.jwt()) ->> 'email', '')))
  )
)
with check (
  (
    owner_id = (select auth.uid())
    and status in ('submitted', 'needs_details')
  )
  or exists (
    select 1
    from public.admin_allowlist aa
    where aa.active = true
      and aa.email = lower(trim(coalesce((select auth.jwt()) ->> 'email', '')))
  )
);
