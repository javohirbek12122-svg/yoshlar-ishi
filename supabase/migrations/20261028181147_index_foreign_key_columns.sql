-- Cover foreign-key columns used by joins, ownership checks and cascades.
-- These indexes are additive and improve the expected query paths as data grows.
create index if not exists admin_activity_log_actor_id_idx
  on public.admin_activity_log(actor_id);
create index if not exists admin_activity_log_initiative_id_idx
  on public.admin_activity_log(initiative_id);

create index if not exists initiative_showcase_created_by_idx
  on public.initiative_showcase(created_by);
create index if not exists initiative_showcase_initiative_id_idx
  on public.initiative_showcase(initiative_id);

create index if not exists initiative_showcase_votes_voter_id_idx
  on public.initiative_showcase_votes(voter_id);

create index if not exists initiative_updates_author_id_idx
  on public.initiative_updates(author_id);
create index if not exists initiative_updates_initiative_id_idx
  on public.initiative_updates(initiative_id);

create index if not exists initiatives_owner_id_idx
  on public.initiatives(owner_id);
create index if not exists initiatives_reviewed_by_idx
  on public.initiatives(reviewed_by);

create index if not exists team_interest_requests_team_post_id_idx
  on public.team_interest_requests(team_post_id);
create index if not exists team_posts_owner_id_idx
  on public.team_posts(owner_id);

create index if not exists telegram_subscriptions_reference_code_idx
  on public.telegram_subscriptions(reference_code);
