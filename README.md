# Yoshlar-Ishi

Yoshlar-Ishi is an independent Uzbek-language platform for youth initiatives, partnerships, and discovering opportunities.

## Stack
- Responsive static HTML/CSS/JavaScript frontend (no build command)
- Separate Supabase Postgres project with Row Level Security
- Vercel static deployment
- Secure owner dashboard in `admin.html`

## Public MVP
- Submit an initiative and receive a high-entropy tracking code
- Check only the safe status summary through `rpc/track_initiative`
- Submit mentor / organization / event / resource / feedback requests
- Browse opportunity links from Supabase with fallback links
- Mobile-friendly design and independent-platform disclaimer

## Owner monitoring dashboard
Open `/admin.html` after deployment. Sign-in is by emailed magic link through Supabase Auth. Only emails active in `public.admin_allowlist` are permitted; row-level security (RLS) also enforces the same authorization in the database.

Dashboard can be added to a phone home screen as a separate “YI Admin” shortcut after the site is deployed; it uses its own manifest and starts directly at `/admin.html`.

Dashboard capabilities:
- KPIs for overall, new, in-progress, completed initiatives and new partnership requests
- Search/filter, review, update status, and add internal notes on initiatives
- Review partnership requests and mark their handling status
- Add or hide opportunity sources from the public catalog
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

## GitHub
Repository: https://github.com/javohirbek12122-svg/yoshlar-ishi
Production branch: `main`

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

Migration SQL is stored in `supabase/migrations/`. These migrations have already been applied to the current database; do not rerun the same migrations against it. The tracking RPC intentionally uses a tightly validated tracking code and returns only limited fields. Internal trigger functions have direct execute grants revoked.

The browser configuration in `config.js` contains only public Supabase client keys. Never put a Supabase service-role or secret key in frontend files.

## Vercel setup — remaining manual connection
A Vercel project named `yoshlar-ishi` exists, but the current tool integration could not complete the initial deployment (Vercel API returned 403 for deployment creation). Connect the Git repository in the Vercel dashboard:

https://vercel.com/javohir-s-projects-04fa6668/yoshlar-ishi/settings/git

Select `javohirbek12122-svg/yoshlar-ishi` and production branch `main`. Use the repository root, framework preset **Other**, and leave the build/install commands blank. The entry point is `index.html`; `admin.html` is the private operations UI.

After the first deployment:
1. Open Supabase Dashboard → Authentication → URL Configuration.
2. Set the Site URL to the deployed public domain.
3. Add the exact admin redirect URL, e.g. `https://YOUR-VERCEL-DOMAIN/admin.html`, to the Redirect URLs list.
4. Test the public initiative submission, tracking code lookup, and admin magic-link sign-in.

## Security, limitations, and launch checklist
- RLS is enabled on public tables. Anonymous initiative and partnership submissions are intentionally allowed for this MVP.
- Tracking lookup uses a high-entropy reference code and only returns title, status, date, district, and reference code.
- Admin email checks are applied by database RLS policies, not only by frontend UI.
- Before a broad public launch, add server-side rate limiting / bot protection, a privacy notice tailored to the operator, and a tested support contact.
- No admin-side user management, automatic email notifications, native certificate issuance, grant guarantee, or official government integration is included.
- Yoshlar-Ishi is not an official government platform. Verify eligibility and deadlines at the source website.