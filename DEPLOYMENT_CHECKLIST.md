# Yoshlar-Ishi — launch checklist

This checklist separates code readiness from account credentials and production validation.

## 1. Create or link the Vercel project

The repository is ready for a static Vercel deployment, but the current Vercel team does not expose an existing `yoshlar-ishi` project. Create/import the real project before configuring CLI deployment IDs.

1. Open [Vercel New Project](https://vercel.com/new) and choose the Vercel team that should own Yoshlar-Ishi.
2. Import the GitHub repository `javohirbek12122-svg/yoshlar-ishi`.
3. Set project name to `yoshlar-ishi`, root directory to the repository root (`./`), and framework preset to **Other**.
4. Leave Build Command, Install Command, and Output Directory blank; this project serves static HTML/CSS/JavaScript and has no build output folder.
5. Deploy and copy the actual production domain. Confirm that a push to `main` triggers a new deployment.

**Recommended:** use Vercel's built-in Git integration for automatic deployments on pushes to `main`. If you use that method, do not also activate the GitHub Actions CLI deploy route for every commit, or you may create duplicate production deploys.

### Alternative: GitHub Actions CLI deployment

Only use this route after the Vercel project has been created and its settings page shows the current project ID.

Open:
- [GitHub Actions secrets](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/secrets/actions)
- [GitHub Actions variables](https://github.com/javohirbek12122-svg/yoshlar-ishi/settings/variables/actions)
- [Deploy Yoshlar-Ishi to Vercel](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/deploy-vercel.yml)

Add:

| GitHub entry | Type | Value |
|---|---|---|
| `VERCEL_TOKEN` | Repository **secret** | Create a Vercel access token in your own Vercel account; paste it directly into GitHub, not into ChatGPT or a repository file. |
| `VERCEL_ORG_ID` | Repository variable | `team_PiDVgH5WveQEWukqlgkctSEW` if the new project belongs to that team; otherwise use the actual owning team ID. |
| `VERCEL_PROJECT_ID` | Repository variable | Copy the project ID from the newly created project's **Settings → General**. Do not reuse a project ID from a different or deleted project. |

Then choose **Run workflow**. The workflow re-checks source, builds production output, deploys, and smoke-tests the public pages. If credentials are absent, the Actions summary explicitly says deployment was skipped; a successful quality check alone does not mean the site is live.

Do not paste the Vercel token in a chat, issue, code file, workflow variable, or commit.

## 2. Set up Supabase Auth redirects

After Vercel shows a real production domain:
1. Open [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/nnodsqnqsqrmzcycrmpr/auth/url-configuration).
2. Set Site URL to the production host including `https://`.
3. Add exactly `https://YOUR-REAL-VERCEL-DOMAIN/admin.html` and `https://YOUR-REAL-VERCEL-DOMAIN/kabinet.html` to redirect URLs (replace the placeholder).
4. Try admin and user magic-link sign-in. Do not turn off the database allowlist or row-level security.

## 3. Enable automatic website and portal monitoring

Set repository variable `SITE_URL` to the exact deployed public URL, e.g. `https://your-real-site.vercel.app`. This enables:
- [Site health check](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/site-health.yml) every six hours (homepage, admin route, privacy notice, manifest and icon).
- [Official portal availability monitor](https://github.com/javohirbek12122-svg/yoshlar-ishi/actions/workflows/official-portal-health.yml) daily, including official ministry/agency/committee/inspection/hokimlik indexes. Automated probes can be blocked; a timeout needs manual verification and is not definitive proof the government site is down.

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
