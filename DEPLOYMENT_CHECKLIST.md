# Yoshlar-Ishi — launch checklist

This checklist separates code readiness from account credentials and production validation.

## 1. Resolve the Vercel project and deploy permissions

The Vercel account currently lists two similarly named projects:
- **`yoshlar-ishi`** — empty project with no deployment or assigned domain.
- **`yoshlar-ishi-site`** — has an existing READY production deployment and the domain `https://yoshlar-ishi-site.vercel.app`, but the available Vercel connection could not read the deployment page or create a fresh production deployment (403 permission errors). The older deployment’s source commit is `364c0d7a69df70bbdcab5c9d5922f136d493eb45`, not the current `main` commit.

**Recommended:** keep `yoshlar-ishi-site` as the canonical site so you do not create another empty project/domain by accident.

1. Open [Vercel Git settings for `yoshlar-ishi-site`](https://vercel.com/javohir-s-projects-04fa6668/yoshlar-ishi-site/settings/git) and confirm that the repository is `javohirbek12122-svg/yoshlar-ishi` and the production branch is `main`.
2. Open [Vercel project settings](https://vercel.com/javohir-s-projects-04fa6668/yoshlar-ishi-site/settings). Confirm the project ID is `prj_g1287qBjDT6pQbMWdG1oyWtYjrIA` before using it in automation.
3. Restore Git-based production deployment, or authorize the Vercel connection to access this project and create production deployments. Do not create a third project unless you intentionally want to migrate to a new canonical domain.
4. After a new deployment, check that its Git SHA matches the latest successful GitHub Quality Checks run. A Vercel project with an old READY deployment does **not** prove the current `main` commit is live.

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

The live-site health check defaults to `https://yoshlar-ishi-site.vercel.app`, so it runs without an extra variable. Set repository variable `SITE_URL` only if you later change the canonical domain. The check covers:
- [Site health check](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/site-health.yml) every six hours (homepage, admin route, privacy notice, manifest and icon).
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
