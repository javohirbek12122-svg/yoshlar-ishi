-- Make backend-only access intent explicit to the Supabase RLS advisor.
-- API roles anon/authenticated have no table grants; service_role is used only by server-side Edge Functions.
drop policy if exists "service role manages AI review quotas" on public.ai_review_rate_limits;
create policy "service role manages AI review quotas"
on public.ai_review_rate_limits
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role manages Telegram subscriptions" on public.telegram_subscriptions;
create policy "service role manages Telegram subscriptions"
on public.telegram_subscriptions
for all
to service_role
using (true)
with check (true);
