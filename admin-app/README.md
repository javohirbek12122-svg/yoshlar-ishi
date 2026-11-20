# Yoshlar-Ishi Admin — independent deployment

- Vercel project root: `admin-app`.
- Static entry: `index.html`; internally available at `/admin.html` and `/admin/`.
- Reuses the existing Supabase project `nnodsqnqsqrmzcycrmpr`.
- Admin authorization remains enforced by Supabase RPC allowlist checks and RLS.
- This app does not import the public site's styles, scripts, PWA worker, or page components.
- The parent project's `/admin.html` and `/admin/*` rewrites proxy to this application without changing the browser origin, preserving Supabase auth redirects.
- Never add a service-role or secret key to this directory. `config.js` contains browser-safe public configuration only.
