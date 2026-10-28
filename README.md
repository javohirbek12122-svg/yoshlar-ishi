# Yoshlar-Ishi

Yoshlar-Ishi is an independent Uzbek-language platform for youth initiatives, collaboration, and discovering opportunities.

## Stack
- Responsive static HTML/CSS/JavaScript frontend (no build command required)
- Supabase Postgres with Row Level Security (separate project: yoshlar-ishi)
- Vercel static deployment

## Current MVP
- Submit an initiative and receive a tracking code
- Check an initiative by its reference code
- Submit mentor, organization, event, resource, or feedback requests
- Browse opportunity links loaded from Supabase, with fallback links
- Responsive layout and independent-platform disclaimer

## GitHub
Repository: https://github.com/javohirbek12122-svg/yoshlar-ishi
Production branch: `main`

## Supabase
- Project: yoshlar-ishi
- URL: https://nnodsqnqsqrmzcycrmpr.supabase.co
- Browser config: `config.js`
- Tables: `profiles`, `initiatives`, `initiative_updates`, `opportunity_sources`, `connection_requests`
- RLS is enabled on public tables. Migration SQL files are in `supabase/migrations/`; the migrations have already been applied to this database, so don't re-run them against the same project.

The browser configuration uses public API keys only. Never put a Supabase service-role or secret key into frontend code.

## Vercel deployment
A Vercel project named `yoshlar-ishi` has been created. To enable initial deployment and automatic deploys after future pushes, connect this repository in the Vercel Project Settings → Git page:

https://vercel.com/javohir-s-projects-04fa6668/yoshlar-ishi/settings/git

Choose the GitHub repository `javohirbek12122-svg/yoshlar-ishi` and the `main` branch. Use the repository root, framework preset **Other**, and leave the build command blank. `index.html` is the entry point.

## Security and limitations
- Anonymous initiative and partnership submissions are enabled for this MVP; add server-side rate limiting and bot protection before a broad public launch.
- Tracking lookup uses the `x-initiative-code` request header and an RLS policy.
- No admin moderation panel, notifications, grant/job/certificate guarantee, or official-government integration is included yet.
- Yoshlar-Ishi is not an official government platform. Verify eligibility and deadlines at the linked source itself.