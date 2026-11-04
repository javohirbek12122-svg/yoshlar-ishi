-- Private, owner-scoped storage for virtual physics lab experiment snapshots.
create table public.lab_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experiment_key text not null check (
    experiment_key in ('projectile','pendulum','gas','wave','refraction','nuclear-concept')
  ),
  params jsonb not null default '{}'::jsonb
    check (jsonb_typeof(params) = 'object' and octet_length(params::text) <= 4096),
  result_summary text not null
    check (char_length(result_summary) <= 500),
  created_at timestamptz not null default now()
);

create index lab_runs_user_created_idx
  on public.lab_runs (user_id, created_at desc);

alter table public.lab_runs enable row level security;

revoke all on public.lab_runs from anon;
revoke all on public.lab_runs from public;
grant select, insert, delete on public.lab_runs to authenticated;

create policy lab_runs_select_own
  on public.lab_runs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy lab_runs_insert_own
  on public.lab_runs for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy lab_runs_delete_own
  on public.lab_runs for delete to authenticated
  using ((select auth.uid()) = user_id);
