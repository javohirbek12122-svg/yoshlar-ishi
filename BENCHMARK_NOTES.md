# Startup ecosystem benchmarking notes

This document records the product patterns researched for Yoshlar-Ishi and how they were adapted. The goal is to borrow useful service design, not copy another organization's branding or imply a partnership.

## Official reference pages reviewed

- IT Park Uzbekistan — Startups: https://www.it-park.uz/en/itpark/startups
  - Separates incubation for early ideas from acceleration for projects that already have a prototype and team.
  - Presents direct application calls to action and a route to more details.
- IT Park Uzbekistan — main site: https://www.it-park.uz/en/itpark
  - Organizes services across startups, residency, education, investment, events and other ecosystem functions.
- IT Park Ventures: https://itparkventures.uz/
  - Separates startup and investor/partner audiences and highlights applications, pitch sessions, mentoring and investment support.
- Startup Uzbekistan: https://www.startupuzbekistan.com/
  - Provides an ecosystem-oriented overview rather than limiting discovery to one program.
- Awards / startup stages: https://awards.gov.uz/en/startup-stages/4
  - Frames support as a startup-stage journey, with tools changing as a project matures.

Program availability, application windows, eligibility, fees and award sizes can change. External sites remain the source of truth for current conditions.

## Patterns adopted in Yoshlar-Ishi

1. **A clear founder journey:** five selectable stages—idea, problem validation, MVP/prototype, market and growth.
2. **Stage-specific action guidance:** each stage provides concrete tasks rather than a generic list of startup advice.
3. **Readiness self-check:** the checklist changes with the selected stage; its score is described as a planning aid, not an acceptance probability.
4. **Weighted source ranking:** recommendations respond to stage, support need, sector, source type and search terms.
5. **Data-backed catalog:** active opportunity records are read from Supabase; curated HTTPS fallback links keep the page usable if the API is temporarily unavailable.
6. **Clear next actions:** the navigator links to initiative submission, AI-assisted idea review, team matching, the official-services directory and personal cabinet.
7. **Trust boundaries:** the page states that Yoshlar-Ishi is independent, external links are not authenticated integrations and its ranking does not guarantee eligibility or acceptance.

## Current implementation files

- `startap-yoli.html` — founder journey, stage-specific checklists, filters and weighted recommendations.
- `index.html` — added startup-journey links in primary navigation, quick services and footer.
- `davlat-xizmatlari.html` and `kabinet.html` — cross-links to the navigator.
- `scripts/check-site.mjs` — source and syntax checks.
- `.github/workflows/site-health.yml` and `.github/workflows/deploy-vercel.yml` — live route / deployment smoke checks.
- `sitemap.xml` and `robots.txt` — public-page discoverability; private/admin pages are not listed in the sitemap.

## Boundaries and next steps

- The navigator links to UzCombinator, IT Park and other programs; it does **not** submit applications on a visitor's behalf.
- Do not label a portal as API-connected merely because a link works. Real OneID, government, or partner API integrations need published technical documentation, permission, server-side secrets, data-handling rules and a successful test.
- Next product iteration: add verified application deadlines and eligibility fields only when their source can be cited and rechecked; add alerts only after consent and a safe notification path exist.
- Production deployment is a separate operational gate. The latest GitHub code must be deployed and smoke-tested before a release is described as live.
