# Yoshlar-Ishi — launch checklist

This checklist separates code readiness from account credentials and production validation.

## 1. Resolve the Vercel project and deploy permissions

The connected Vercel team (`javohir-s-projects-04fa6668`) currently exposes only the unrelated `svguzbekistan-strategyhu` project. Searching for `yoshlar-ishi` / `yoshlar-ishi-site` returned no matching project, inspecting `yoshlar-ishi-site` returned 404, and creating a Git-linked `yoshlar-ishi-site` project was rejected with **403 Forbidden** (no create permission).

The health-check URL `https://yoshlar-ishi-site.vercel.app` did respond in the last run, but that run still checked for the previous startup-led homepage, so it is not evidence that the current `main` commit is deployed. A responding URL or an old READY deployment does **not** prove the current `main` commit is live.

**Recommended:** connect `javohirbek12122-svg/yoshlar-ishi` to the intended Vercel project from an account with project-creation or project-admin permission. Do not use the unrelated Parkent E‑Market project or reuse an unverified project ID.

1. Open the intended Vercel team and locate or create the canonical `yoshlar-ishi-site` project.
2. Connect its Git repository to `javohirbek12122-svg/yoshlar-ishi` and set production branch to `main`.
3. Verify owner/team, project ID and production domain in Vercel before configuring CI. A project ID recorded in older setup notes is not confirmed by the current Vercel connection.
4. After a new deployment, verify its Git SHA against the latest successful GitHub Quality Checks run.

### Alternative: GitHub Actions CLI deployment

The repository has an optional GitHub Actions deploy workflow, but it currently skips all deploy/build/smoke-test steps until credentials are configured. Its “success” state without those credentials means **deployment skipped**, not deployed.

Open:
- [GitHub Actions secrets](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/secrets/actions)
- [GitHub Actions variables](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/variables/actions)
- [Deploy Yoshlar-Ishi to Vercel](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/deploy-vercel.yml)

Add:
| GitHub entry | Type | Value |
|---|---|---|
| `VERCEL_TOKEN` | Repository **secret** | Create a Vercel access token in your own Vercel account and paste it directly into GitHub, not into ChatGPT or a repository file. |
| `VERCEL_ORG_ID` | Repository variable | `team_PiDVgH5WveQEWukqlgkctSEW` if the selected project belongs to this team; otherwise use the actual owning team ID. |
| `VERCEL_PROJECT_ID` | Repository variable | `prj_g1287qBjDT6pQbMWdG1oyWtYjrIA` if deploying to `yoshlar-ishi-site`; verify it in the project’s Settings → General first. |

Then choose **Run workflow**. The workflow re-checks source, builds production output, deploys, and smoke-tests public pages. If credentials are absent or invalid, inspect the workflow summary; never treat successful static tests alone as production success.

Do not paste the Vercel token into a chat, issue, code file, workflow variable, or commit.

## 2. Set up Supabase Auth redirects

After Vercel shows a real production domain:
1. Open [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/auth/url-configuration).
2. Set Site URL to the production host including `https://`.
3. Add exactly `https://YOUR-REAL-VERCEL-DOMAIN/admin.html` and `https://YOUR-REAL-VERCEL-DOMAIN/kabinet.html` to redirect URLs (replace the placeholder).
4. Try admin and user magic-link sign-in. Do not turn off the database allowlist or row-level security.

## 3. Enable automatic website and portal monitoring

The live-site health check currently uses `https://yoshlar-ishi-site.vercel.app` as a temporary known endpoint, not as a verified deployment of current code. Set repository variable `SITE_URL` to the actual canonical domain after connecting Vercel. It checks the opportunity-first homepage identity, five-stage route, private journey event timeline, server-side initiative submission, community forms, team matching filters, admin moderation, the official directory, privacy notice and account page. A reachable HTTP 200 response with missing markers is reported as a stale deployment, not a healthy current release. The check covers:
- [Site health check](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/site-health.yml) every six hours and automatically after public-page/config changes (homepage, admin route, privacy notice, manifest and icon).
- [Official portal availability monitor](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/official-portal-health.yml) daily. In addition to central government indexes, it reads every active `official_portal_integrations` record from public Supabase and checks distinct portal URLs, source/guide URLs, catalogue card images and the gallery-image URLs. The run summary includes status, response time, reachable count, suspected broken links, server errors, bot/rate-limit responses and timeouts.
- A 403/429, timeout or 5xx response is not proof the site is permanently unavailable. The monitor flags uncertain results for manual review instead of treating them as a confirmed outage.

## 4. Validate the live site

- [ ] Open public site on desktop and mobile.
- [ ] Submit a real low-risk test initiative; save the `YI-...` tracking code.
- [ ] Verify the tracking code only returns the limited status summary.
- [ ] Submit a test partnership request.
- [ ] Test magic-link admin login, initiative status update, internal notes, catalogue toggle and CSV export.
- [ ] Verify only allowlisted admin email can access management actions.
- [ ] Test `davlat-xizmatlari.html` filters, details, official category directory cards, images and source links.
- [ ] Test startap-yoli.html: five stage buttons, stage-specific checklist, category filters, scoring order, Supabase-loaded sources and fallback links; verify scores are ranking hints, not probabilities.
- [ ] Test AI analysis after configuring the Groq key and confirm that missing-key fallback is labelled as rule-based.
- [ ] Test team post → admin approval → public board → private interest request.
- [ ] Test showcase publish → login → one-vote-per-project behavior.
- [ ] Confirm official portal registry entries remain `link_only` unless a real API/SSO integration has authorization, technical documentation and a passing integration test.
- [ ] Agree the operator's support contact, data-retention period and data-deletion procedure before public promotion.

## 5. Real government API / SSO work

Current official portal entries are external links, not authenticated integrations. Before connecting any government system, record:
- Published API/technical documentation URL.
- Responsible institution and written permission / onboarding process.
- Required authentication method, scopes, rate limits, data-handling terms and test environment.
- Exact non-sensitive test evidence.

Do not store OneID passwords, session cookies, service-role keys, or private government-system credentials in frontend code. Keep any needed secret in a server-side secret store and use a server-side integration only after the institution authorizes it.
