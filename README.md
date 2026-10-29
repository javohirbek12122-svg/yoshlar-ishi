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

## New user-facing modules
See [`INTEGRATIONS_SETUP.md`](./INTEGRATIONS_SETUP.md) for safe setup of Groq AI, Telegram bot secrets, the personal cabinet and user-generated community pages. The AI Edge Function validates inputs and applies a per-IP-hash quota; it returns a local-rule fallback when the provider key is not set. Telegram bot tokens and the Groq API key belong only in Supabase Edge Function Secrets, never in browser configuration.

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

Tables:
- `profiles`
- `initiatives`
- `initiative_updates`
- `opportunity_sources`
- `connection_requests`
- `admin_allowlist`
- `admin_activity_log`
- `official_portal_integrations`

Migration SQL is stored in `supabase/migrations/`. These migrations have already been applied to the current database; do not rerun the same migrations against it. The tracking RPC intentionally uses a tightly validated tracking code and returns only limited fields. Internal trigger functions have direct execute grants revoked.

The browser configuration in `config.js` contains only public Supabase client keys. Never put a Supabase service-role or secret key in frontend files.

## Vercel deployment — final account configuration

The step-by-step owner checklist is in [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md).

A separate Vercel project named `yoshlar-ishi` exists. Direct deployment from the connected agent returned HTTP 403, so the repository includes a protected GitHub Actions CLI fallback at `.github/workflows/deploy-vercel.yml`. This is prepared but it deliberately skips the deployment until you configure your own Vercel credentials in GitHub; no token should be pasted into ChatGPT or committed to the repository.

### One-time setup
1. Create a Vercel token in your Vercel account, with access to the team/project that owns `yoshlar-ishi`.
2. Open [GitHub Actions secrets](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/secrets/actions) and add the repository **secret** `VERCEL_TOKEN`. Paste the token directly in GitHub, not into chat or source files.
3. Open [GitHub Actions variables](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/variables/actions) and add:
   - `VERCEL_ORG_ID` = `team_PiDVgH5WveQEWukqlgkctSEW`
   - `VERCEL_PROJECT_ID` = `prj_HdGyAf9nd9NfkPhP9Q6Vh9il7XU5`
4. In the same Variables page, after the first deploy gives you an HTTPS domain, set `SITE_URL` to the real production domain, e.g. `https://your-real-site.vercel.app`. This enables the six-hour health-check workflow.

Every successful `Yoshlar-Ishi Quality Checks` run on `main` then triggers the deploy workflow. It verifies the tested commit, runs the pinned Vercel CLI, builds production output, deploys, and checks the public page, admin page, privacy notice and manifest. You can also run [Deploy Yoshlar-Ishi to Vercel](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/deploy-vercel.yml) manually after configuration.

Vercel's regular Git integration is an alternative: open the [Vercel Git settings](https://vercel.com/javohir-s-projects-04fa6668/yoshlar-ishi/settings/git), select `javohirbek12122-svg/yoshlar-ishi`, and use production branch `main`. Set the repository root, framework preset **Other**, and leave build/install commands blank. Do not set both paths up to deploy the same commit unless you intentionally want duplicate deployments.

### After the first successful deployment
1. Open [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/auth/url-configuration).
2. Set Site URL to the actual deployed domain.
3. Add the exact admin redirect, e.g. `https://YOUR-VERCEL-DOMAIN/admin.html`, to Redirect URLs.
4. Test initiative submission, tracking code lookup, partner requests and admin magic-link login.

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