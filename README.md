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
- Browse verified-source links loaded from Supabase, with fallback links
- Responsive layout and independent-platform disclaimer

## Supabase
- Project: yoshlar-ishi
- URL: https://nnodsqnqsqrmzcycrmpr.supabase.co
- Public client configuration: config.js
- Tables: profiles, initiatives, initiative_updates, opportunity_sources, connection_requests
- RLS is enabled on public tables. Migrations are in supabase/migrations/ and have already been applied to this database; do not rerun them against the same project.

The client configuration contains only public API keys. Never put a Supabase service-role or secret key into frontend code.

## Deploy to Vercel
Import this repository as a new project named `yoshlar-ishi`. Use repository root, framework preset **Other**, and leave the build command blank. `index.html` is the entry point. Connect the `main` branch for automatic deployments on future pushes.

## Security and limitations
- Anonymous initiative and partnership submissions are enabled for this MVP; use server-side rate limiting and bot protection before a broad public launch.
- Tracking lookup checks the `x-initiative-code` request header via an RLS policy.
- No admin moderation panel, notifications, grant/job/certificate guarantee, or official government integration is included yet.
- Yoshlar-Ishi is not an official government platform. Always verify eligibility and deadlines at the relevant source.