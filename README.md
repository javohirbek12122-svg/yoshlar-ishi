# Yoshlar-Ishi

Yoshlar-Ishi is an independent Uzbek-language platform for youth initiatives, partnerships, and discovering opportunities.

## Stack
- Responsive static HTML/CSS/JavaScript frontend (no build command)
- Separate Supabase Postgres project with Row Level Security
- Vercel static deployment
- Secure owner dashboard in `admin.html`
- Illustrated searchable service portal at `davlat-xizmatlari.html`
- Email magic-link personal cabinet at `kabinet.html`
- Server-side AI review and Telegram webhook/notification Edge Functions
- Moderated team matching and admin-curated initiative showcase

## Compact interactive experience

The homepage keeps the complete workflow while collapsing long supporting information into accessible accordions. Its dark hero uses a custom particle network animation instead of an external background video. A live checklist estimates form completeness and identifies missing fields; a reading-progress line, return-to-top control, and subtle card reveals make navigation feel more responsive. The animation pauses when the hero is off-screen or the tab is hidden and respects reduced-motion preferences. AI review, team matching, voting, initiative tracking, the personal cabinet and the illustrated official-services guide remain available.

## Public MVP
- Submit an initiative and receive a high-entropy tracking code
- Check only the safe status summary through `rpc/track_initiative`
- Submit mentor / organization / event / resource / feedback requests
- Browse official and independent opportunities from Supabase with search and category filters
- Guided portal recommender for government services, youth programs, legal resources, appeals, entrepreneurship, volunteering, and open data
- Category-scored ranking that returns the three highest-matching catalogue links for the selected need, with an explicit notice that this is guidance—not an official eligibility decision
- Readiness-scoring checklist that calculates a planning score and suggests next steps (not an eligibility or grant decision)
- Accessible font-size and high-contrast controls, installable web app manifests, and a privacy notice
- Mobile-friendly formal public-service layout with an explicit independent-platform disclaimer

## Design direction

The public experience now uses a founder-first product structure: one clear hero and primary action, feature-level proof points, short benefit cards, a five-step journey, a moderated project showcase, community matching, and resource discovery. Its information architecture takes inspiration from the public presentation pattern used by [UzCombinator](https://uzcombinator.uz/)—especially how it explains outcomes, programme value, process, portfolio and people—but the Yoshlar-Ishi wording, UI, branding and user flows are independently authored. No partnership or endorsement is implied.

A current [UzCombinator application link](https://uzcombinator.uz/apply) is listed as an external startup resource when active in the opportunities registry. Selection, eligibility, deadline and programme terms are determined only by UzCombinator's official site.

## New user-facing modules
See [`INTEGRATIONS_SETUP.md`](./INTEGRATIONS_SETUP.md) for safe setup of Groq AI, Telegram bot secrets, the personal cabinet and user-generated community pages. The AI Edge Function validates inputs and applies a per-IP-hash quota; it returns a local-rule fallback when the provider key is not set. Anonymous initiative, team-board and interest-form writes go through the `community-submit` Edge Function. It generates initiative tracking codes server-side, validates consent and fields, keeps new team posts pending for admin moderation, validates public HTTPS contact links, and applies limits (4 public initiatives/hour, 2 team posts/day, 5 interests/10 minutes per hashed network identity) using a server-secret-salted SHA-256 hash rather than storing raw IP addresses. Authenticated personal-cabinet inserts remain owner-scoped. Telegram bot tokens and the Groq API key belong only in Supabase Edge Function Secrets, never in browser configuration.

## Official public portal directory

The separate [illustrated service guide](./davlat-xizmatlari.html) provides a searchable catalogue, per-service detail panels, source links, possible documents, fee/deadline caveats, media, and a guided service-selection flow. It also links directly to the official Government Portal's current catalogues for [ministries](https://gov.uz/oz/all_ministry/1), [agencies](https://gov.uz/oz/all_ministry/4), [committees](https://gov.uz/oz/all_ministry/5), [inspections](https://gov.uz/oz/all_ministry/15), and [regional authorities](https://gov.uz/oz/all_ministry/14). These official indexes are the best source for the full, changing list of government entities; the local catalogue adds a curated subset of youth-relevant services and official landing pages. The catalogue content was last reviewed on 28 October 2026; the URL availability audit also runs automatically. Some official sites block automated probes, so eligibility, contact details, fees, and deadlines must always be rechecked at the source portal.

The portal catalogue links to official destinations such as my.gov.uz, gov.uz, LEX.UZ, Murojaat.gov.uz, the presidential virtual reception, Open Budget, and the open-data portal, alongside youth, grant, startup, and volunteering resources. A daily GitHub Actions monitor also checks every active catalogue portal/source URL and image URL from Supabase, deduplicates targets, and reports HTTP status and latency. Bot blocks and timeouts are flagged for manual review, not treated automatically as a confirmed outage. The searchable catalogue pulls government portal records from `official_portal_integrations` and other opportunities from `opportunity_sources`, merging duplicate URLs. Users can use a guided service finder and a six-criterion readiness calculator.

## Owner monitoring dashboard
Open `/admin.html` after deployment. Sign-in is by emailed magic link through Supabase Auth. The `/kabinet.html` user dashboard uses a separate session key and only calls owner-scoped RPCs for listing/editing its own unreviewed initiatives. Only emails active in `public.admin_allowlist` are permitted; row-level security (RLS) also enforces the same authorization in the database.

Dashboard can be added to a phone home screen as a separate “YI Admin” shortcut after the site is deployed; it uses its own manifest and starts directly at `/admin.html`.

Dashboard capabilities:
- KPIs for overall, new, in-progress, completed initiatives and new partnership requests
- Search/filter, review, update status, and add internal notes on initiatives
- Review partnership requests and mark their handling status
- Add or hide opportunity links from the public catalog
- Maintain a separate official-portal integration registry (link-only / docs-needed / approval-needed / connected / disabled), including technical-doc URLs and internal notes
- Prevent an external link alone from being marked as a connected API/SSO integration
- Automatic audit log when initiative status changes
- CSV export of the latest 300 initiatives
- Automatic dashboard refresh every 60 seconds while the panel remains open
- Links to GitHub, Supabase Auth settings, and Vercel project management

Admin email allowlist is stored in the Supabase database rather than committed to this public repository. To authorize another admin, run this in the Supabase SQL Editor:

```sql
insert into public.admin_allowlist (email, active)
values (lower(trim('ADMIN_EMAIL_HERE')), true)
on conflict (email) do update set active = true;
```

Remove access by setting `active = false`. Do not add self-service admin claiming or expose a service-role key.

## Backend-only internal tables

AI quota rows and Telegram subscription records are server-only. Public REST access is revoked, and server-side Edge Functions use the service role. Admin review functions contain explicit `admin_allowlist` checks; see `INTEGRATIONS_SETUP.md` for security-advisor context and the remaining Auth password-hardening setting.

## GitHub
Repository: https://github.com/javohirbek12122-svg/yoshlar-ishi
Production branch: `main`

Automated quality checks run on pushes to `main`, pull requests, and manual workflow dispatch. The no-dependency check command is `npm run check`; workflow runs are visible in [GitHub Actions](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions).

A separate [live-site check](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/site-health.yml) is scheduled every six hours and can also be started manually. After Vercel deployment, set repository Actions **variable** `SITE_URL` to the actual HTTPS site root; it verifies the homepage, admin page, manifest, and icon. A separate [official-portal monitor](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/official-portal-health.yml) checks eight public government portal endpoints daily and writes HTTP-status results to the GitHub Actions summary. A failed probe can mean a portal is blocking automated requests, so it flags manual verification rather than asserting the portal is definitively down.

## Supabase
Project: `yoshlar-ishi`
URL: https://nnodsqnqsqrmzcycrmpr.supabase.co

Tables (all with Row Level Security enabled):
- `profiles`, `initiatives`, `initiative_updates`
- `opportunity_sources`, `official_portal_integrations`, `official_portal_admin_notes`
- `connection_requests`, `admin_allowlist`, `admin_activity_log`
- `team_posts`, `team_interest_requests`
- `initiative_showcase`, `initiative_showcase_votes`
- `telegram_subscriptions`
- `ai_review_rate_limits`, `community_submission_rate_limits`

Migration SQL is stored in `supabase/migrations/`. These migrations have already been applied to the current database; do not rerun the same migrations against it. The tracking RPC intentionally uses a tightly validated tracking code and returns only limited fields. Internal trigger functions have direct execute grants revoked.

The browser configuration in `config.js` contains only public Supabase client keys. Never put a Supabase service-role or secret key in frontend files.

## Vercel deployment — final account configuration

The step-by-step owner checklist is in [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md).

Two similarly named Vercel projects were identified. `yoshlar-ishi` is an empty project; `yoshlar-ishi-site` is the intended canonical site, with the known domain [`yoshlar-ishi-site.vercel.app`](https://yoshlar-ishi-site.vercel.app). The connected deployment tool returned 403 when asked to create a new deployment, so this repository's GitHub Actions fallback deliberately skips deployment until a valid Vercel token and the correct canonical project ID are configured.

The canonical Vercel project has a verified production alias, but the last recorded Production Deployment is behind GitHub `main`. GitHub's live-site check detected this accurately. The Vercel integration denied a new production deployment from the current connected tool, and the Actions fallback had its build/deploy steps skipped when credentials were absent. The deployment workflow now fails visibly instead of reporting a misleading green success when no deployment occurred.

### One-time setup

1. Open [Vercel Git settings for `yoshlar-ishi-site`](https://vercel.com/javohir-s-projects-04fa6668/yoshlar-ishi-site/settings/git) and verify that it points to `javohirbek12122-svg/yoshlar-ishi` on the `main` branch.
2. In [Vercel project settings](https://vercel.com/javohir-s-projects-04fa6668/yoshlar-ishi-site/settings), verify the project ID before enabling automation. Current value: `prj_g1287qBjDT6pQbMWdG1oyWtYjrIA`; current team/org ID: `team_PiDVgH5WveQEWukqlgkctSEW`. Re-check both in the dashboard.
3. Create a Vercel token in the account that owns the canonical project.
4. Open [GitHub Actions secrets](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/secrets/actions) and add the repository **secret** `VERCEL_TOKEN`. Paste it directly into GitHub, never into ChatGPT or source files.
5. Open [GitHub Actions variables](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/variables/actions) and add `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` using the verified values above.
6. Open [GitHub Actions](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/deploy-vercel.yml) and select **Run workflow**. The run must show the Build, Deploy, and Smoke-test steps as completed — not skipped.
7. Set Actions variable `SITE_URL` to `https://yoshlar-ishi-site.vercel.app` if that remains the intended production URL. The scheduled live-site check must then pass for the current full-bleed hero and service guide.
8. Verify the deployed commit SHA in Vercel's deployment details matches the GitHub `main` commit that passed quality checks.


## Privacy and launch checklist
- The public privacy notice is `privacy.html`; it explains which fields are stored, why they are needed, and the current MVP limitations.
- Before broad public use, fill in the platform operator's real contact channel and confirm a data-retention / deletion procedure.

## Security, limitations, and launch checklist
- RLS is enabled on public tables. Anonymous initiative and partnership submissions are intentionally allowed for this MVP.
- Tracking lookup uses a high-entropy reference code and only returns title, status, date, district, and reference code.
- Admin email checks are applied by database RLS policies, not only by frontend UI.
- Before a broad public launch, add server-side rate limiting / bot protection, a privacy notice tailored to the operator, and a tested support contact.
- No admin-side user management, automatic email notifications, native certificate issuance, grant guarantee, or authenticated official government API/SSO integration is included. The public portal catalogue provides outbound links only.
- Yoshlar-Ishi is not an official government platform. Verify eligibility and deadlines at the source website.