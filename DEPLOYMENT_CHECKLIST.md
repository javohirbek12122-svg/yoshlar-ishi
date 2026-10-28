# Yoshlar-Ishi — launch checklist

This checklist separates code readiness from account credentials and production validation.

## 1. Configure the Vercel deployment workflow

Open:
- [GitHub Actions secrets](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/secrets/actions)
- [GitHub Actions variables](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/variables/actions)

Add the following values:

| GitHub entry | Type | Value |
|---|---|---|
| `VERCEL_TOKEN` | Repository **secret** | Create a Vercel access token in your own Vercel account; paste it directly into GitHub, not into ChatGPT or a repository file. |
| `VERCEL_ORG_ID` | Repository variable | `team_PiDVgH5WveQEWukqlgkctSEW` |
| `VERCEL_PROJECT_ID` | Repository variable | `prj_HdGyAf9nd9NfkPhP9Q6Vh9il7XU5` |

Then open [GitHub Actions → Deploy Yoshlar-Ishi to Vercel](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/deploy-vercel.yml) and choose **Run workflow**. The workflow re-checks source, builds, deploys, then smoke-tests homepage, admin page, privacy page and manifest.

Do not paste the Vercel token in a chat, issue, code file, workflow variable, or commit. If the project is also linked via Vercel's built-in Git integration, disable one of the duplicate deployment routes or keep only one route responsible for production deploys.

## 2. Set up Supabase Auth redirect

After Vercel shows a real production domain:
1. Open [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/auth/url-configuration).
2. Set Site URL to the production host including `https://`.
3. Add exactly `https://YOUR-REAL-VERCEL-DOMAIN/admin.html` to redirect URLs (replace the placeholder).
4. Try admin sign-in from `/admin.html` using the allowlisted email. Do not turn off the database allowlist or row-level security.

## 3. Enable automatic website and portal monitoring

Set the repository variable `SITE_URL` to the exact deployed public URL, e.g. `https://your-real-site.vercel.app`. This enables:
- [Site health check](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/site-health.yml) every six hours (homepage, admin route, privacy notice, manifest and icon).
- [Official portal availability monitor](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/official-portal-health.yml) daily. It writes HTTP status to the Actions summary. A blocked or timed-out probe needs manual verification; it is not definitive proof that an official portal is down.

## 4. Validate the live site

- [ ] Open public site on desktop and mobile.
- [ ] Submit a real low-risk test initiative; save the `YI-...` tracking code.
- [ ] Verify the tracking code only returns the limited status summary.
- [ ] Submit a test partnership request.
- [ ] Test magic-link admin login, initiative status update, internal notes, catalogue toggle and CSV export.
- [ ] Verify only allowlisted admin email can access management actions.
- [ ] Confirm official portal registry entries remain `link_only` unless a real API/SSO integration has authorization, technical documentation and a passing integration test.
- [ ] Agree the operator's support contact, data-retention period and data-deletion procedure before public promotion.

## 5. Real government API / SSO work

Current official portal entries are external links, not authenticated integrations. Before connecting any government system, record:
- Published API/technical documentation URL.
- Responsible institution and written permission / onboarding process.
- Required authentication method, scopes, rate limits, data-handling terms and test environment.
- Exact non-sensitive test evidence.

Do not store OneID passwords, session cookies, service-role keys, or private government-system credentials in frontend code. Keep any needed secret in a server-side secret store and use a server-side integration only after the institution authorizes it.
