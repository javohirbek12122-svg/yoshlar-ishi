-- Private event history for each authenticated user's youth opportunity journey.
create table if not exists public.opportunity_journey_events (
 id uuid primary key default gen_random_uuid(),
 journey_id uuid not null references public.opportunity_journeys(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null check (event_type in ('journey_started','progress_updated','status_changed')),
 from_status text check (from_status is null or from_status in ('interested','preparing','ready','submitted','waiting','approved','declined','completed','paused')),
 to_status text check (to_status is null or to_status in ('interested','preparing','ready','submitted','waiting','approved','declined','completed','paused')),
 title text not null check (char_length(trim(title)) between 3 and 180),
 details text not null default '' check (char_length(details) <= 1200),
 created_at timestamptz not null default now()
);
alter table public.opportunity_journey_events enable row level security;
revoke all privileges on public.opportunity_journey_events from public, anon, authenticated;
grant select, insert on public.opportunity_journey_events to authenticated;
drop policy if exists "users read own opportunity journey events" on public.opportunity_journey_events;
create policy "users read own opportunity journey events" on public.opportunity_journey_events for select to authenticated using (
 (select auth.uid()) is not null and (select auth.uid()) = user_id and exists (
  select 1 from public.opportunity_journeys j where j.id = opportunity_journey_events.journey_id and j.user_id = (select auth.uid())
 )
);
drop policy if exists "users create own opportunity journey events" on public.opportunity_journey_events;
create policy "users create own opportunity journey events" on public.opportunity_journey_events for insert to authenticated with check (
 (select auth.uid()) is not null and (select auth.uid()) = user_id and exists (
  select 1 from public.opportunity_journeys j where j.id = opportunity_journey_events.journey_id and j.user_id = (select auth.uid())
 )
);
create index if not exists opportunity_journey_events_user_created_idx on public.opportunity_journey_events (user_id, created_at desc);
create index if not exists opportunity_journey_events_journey_created_idx on public.opportunity_journey_events (journey_id, created_at desc);
