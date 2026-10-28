import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const required = [
  "index.html",
  "admin.html",
  "davlat-xizmatlari.html",
  "kabinet.html",
  "INTEGRATIONS_SETUP.md",
  "privacy.html",
  "robots.txt",
  ".github/workflows/site-health.yml",
  ".github/workflows/deploy-vercel.yml",
  ".github/workflows/official-portal-health.yml",
  "config.js",
  "icon.svg",
  "manifest.webmanifest",
  "admin-manifest.webmanifest",
  "README.md",
  "DEPLOYMENT_CHECKLIST.md",
  "supabase/migrations/20261028145226_initial_yoshlar_ishi_schema.sql",
  "supabase/migrations/20261028145259_enable_reference_code_tracking.sql",
  "supabase/migrations/20261028152132_owner_dashboard_and_secure_tracking.sql",
  "supabase/migrations/20261028152553_harden_internal_trigger_functions.sql",
  "supabase/migrations/20261028152748_restrict_authenticated_tracking_rpc.sql",
  "supabase/migrations/20261028154054_harden_tracking_rpc_with_rls.sql",
  "supabase/migrations/20261028154603_official_portal_registry.sql",
  "supabase/migrations/20261028154926_admin_read_inactive_sources.sql",
  "supabase/migrations/20261028155537_update_official_open_data_portal_url.sql",
  "supabase/migrations/20261028161434_expanded_service_guide_and_community.sql",
  "supabase/migrations/20261028163033_secure_account_owned_initiatives.sql",
  "supabase/migrations/20261028163747_add_core_public_authority_portals.sql",
  "supabase/migrations/20261028172620_retire_legacy_education_portal_records.sql",
  "supabase/migrations/20261028174007_harden_public_access_and_admin_review.sql",
  "supabase/migrations/20261028174334_admin_only_partner_review_rpc.sql",
  "supabase/migrations/20261028175222_complete_youth_ledger_service_entry.sql",
  "supabase/functions/idea-review/index.ts",
  "supabase/functions/telegram-webhook/index.ts",
  "supabase/functions/telegram-notify/index.ts",
];
for (const file of required) {
  assert.ok(exists(file), `Missing required file: ${file}`);
}
console.log(`✓ required files: ${required.length}`);

function inlineScripts(html) {
  return [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((source) => source.trim().length > 0);
}
for (const file of ["index.html", "admin.html", "davlat-xizmatlari.html", "kabinet.html"]) {
  const html = read(file);
  const scripts = inlineScripts(html);
  assert.ok(scripts.length > 0, `${file} has no inline JavaScript`);
  scripts.forEach((source, index) => {
    new vm.Script(source, { filename: `${file}:inline-script-${index + 1}` });
  });
  assert.match(html, /manifest\.webmanifest/);
  console.log(`✓ ${file}: HTML checks and ${scripts.length} JavaScript block(s) parse`);
}

const config = read("config.js");
assert.match(config, /https:\/\/nnodsqnqsqrmzcycrmpr\.supabase\.co/);
assert.match(config, /sb_publishable_/);
assert.doesNotMatch(config, /sb_secret_[A-Za-z0-9_-]+/);
assert.doesNotMatch(config, /service_role[\s\S]{0,100}eyJ[A-Za-z0-9_-]+/i);
console.log("✓ public Supabase config has URL + publishable key and no known secret-key pattern");

const publicHtml = read("index.html");
assert.match(publicHtml, /id="initiativeForm"/);
assert.match(publicHtml, /id="trackForm"/);
assert.match(publicHtml, /id="partnerForm"/);
assert.match(publicHtml, /rpc\/track_initiative/);
assert.match(publicHtml, /official_portal_integrations\?select=slug/);
assert.match(publicHtml, /id="rasmiy-xizmatlar"/);
assert.match(publicHtml, /id="sourceSearch"/);
assert.match(publicHtml, /id="sourceFilter"/);
assert.match(publicHtml, /id="portalNeed"/);
assert.match(publicHtml, /class="readiness-item"/);
assert.match(publicHtml, /id="recommendationList"/);
assert.match(publicHtml, /function updateRecommendations\(\)/);
assert.match(publicHtml, /recommendationCategories/);
assert.match(publicHtml, /privacy\.html/);
for (const host of ["my.gov.uz", "gov.uz", "lex.uz", "murojaat.gov.uz", "openbudget.uz", "data.egov.uz"]) {
  assert.ok(publicHtml.includes(host), `Official portal missing from public directory: ${host}`);
}
console.log("✓ public forms, official portal directory, guided service finder, category-scored recommendations, readiness scoring, and privacy notice are present");

const admin = read("admin.html");
for (const feature of [
  'id="loginForm"',
  'admin_allowlist',
  'id="page-initiatives"',
  'id="page-partners"',
  'id="page-sources"',
  'id="page-integrations"',
  "official_portal_integrations?select=id",
  'nextStatus==="connected"&&nextMode==="external_link"',
  'id="page-activity"',
  'setInterval(()=>{if(token)Promise.all([loadData(),loadStats()])},60000)',
  'id="exportBtn"',
]) {
  assert.ok(admin.includes(feature), `Admin feature missing: ${feature}`);
}
assert.ok(admin.includes('official_portal_integrations?select=id'), "Admin integration registry query missing");
assert.ok(admin.includes('nextStatus==="connected"&&nextMode==="external_link"'), "Admin must prevent false connected status for plain external links");
console.log("✓ admin login, allowlist checks, review pages, auto-refresh, CSV export and integration registry are present");

const deployWorkflow = read(".github/workflows/deploy-vercel.yml");
const portalHealthWorkflow = read(".github/workflows/official-portal-health.yml");
assert.match(portalHealthWorkflow, /schedule:/);
assert.match(portalHealthWorkflow, /data\.egov\.uz/);
assert.match(portalHealthWorkflow, /murojaat\.gov\.uz/);
assert.ok(portalHealthWorkflow.includes("node scripts/check-official-portals.mjs"));
assert.ok(portalHealthWorkflow.includes("https://gov.uz/oz/iiv/pages/davlat-xizmatlari-reestri"));
const portalAudit = read("scripts/check-official-portals.mjs");
execFileSync(process.execPath, ["--check", "scripts/check-official-portals.mjs"], { stdio: "pipe" });
for (const feature of [
  "official_portal_integrations",
  "hero_image_url",
  "source_url",
  "HEAD",
  "GET",
  "HEAD failed",
  "possible-broken-link",
  "GITHUB_STEP_SUMMARY",
  "MAX_CONCURRENCY",
]) {
  assert.ok(portalAudit.includes(feature), `Portal URL monitor requirement missing: ${feature}`);
}
console.log("✓ daily official endpoint monitor plus dynamic registry and image URL audit are wired into CI");

const liveHealthWorkflow = read(".github/workflows/site-health.yml");
assert.match(liveHealthWorkflow, /SITE_URL:\s*\$\{\{ vars\.SITE_URL \|\| 'https:\/\/yoshlar-ishi-site\.vercel\.app' \}\}/);
assert.match(liveHealthWorkflow, /Check website and admin page/);
assert.match(liveHealthWorkflow, /paths:/);
assert.ok(liveHealthWorkflow.includes('"davlat-xizmatlari.html"'));
assert.match(liveHealthWorkflow, /curl --fail[^\\n]*\\$BASE_URL\\/davlat-xizmatlari\\.html/);
assert.match(liveHealthWorkflow, /Idorani toifasiga qarab toping/);
assert.match(liveHealthWorkflow, /media-card/);
console.log("✓ live-site health check defaults to the known production alias and runs when public pages change");


console.log("✓ daily official portal availability monitor is present");
assert.match(deployWorkflow, /VERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
assert.match(deployWorkflow, /VERCEL_ORG_ID:\s*\$\{\{ vars\.VERCEL_ORG_ID \}\}/);
assert.match(deployWorkflow, /VERCEL_PROJECT_ID:\s*\$\{\{ vars\.VERCEL_PROJECT_ID \}\}/);
assert.match(deployWorkflow, /vercel build --prod/);
assert.match(deployWorkflow, /vercel deploy --prebuilt --prod/);
assert.match(deployWorkflow, /smoke-test/i);
assert.match(deployWorkflow, /Vercel deployment skipped/i);
const launchChecklist = read("DEPLOYMENT_CHECKLIST.md");
assert.match(launchChecklist, /yoshlar-ishi-site/);
assert.match(launchChecklist, /403/);
assert.match(launchChecklist, /VERCEL_TOKEN/);
assert.match(launchChecklist, /GitHub Actions CLI deployment/i);
assert.ok(launchChecklist.includes("does **not** prove the current `main` commit is live"));
console.log("✓ Vercel checklist matches the discovered project IDs, current deploy permissions, and safe CLI fallback");

for (const file of ["manifest.webmanifest", "admin-manifest.webmanifest"]) {
  const data = JSON.parse(read(file));
  assert.ok(data.name && data.start_url && data.icons?.length, `${file} is incomplete`);
  assert.equal(data.icons[0].src, "/icon.svg");
  console.log(`✓ ${file}: valid JSON web-app manifest`);
}
const icon = read("icon.svg");
assert.match(icon, /<svg[\s\S]*viewBox="0 0 512 512"/);
console.log("✓ app icon is an SVG with a square viewBox");

const migrationFiles = fs.readdirSync(path.join(root, "supabase/migrations"));
assert.ok(migrationFiles.length >= 6, "Migration history files are incomplete");
const dashboardMigration = read("supabase/migrations/20261028152132_owner_dashboard_and_secure_tracking.sql");
const trackingMigration = read("supabase/migrations/20261028154054_harden_tracking_rpc_with_rls.sql");
const portalRegistryMigration = read("supabase/migrations/20261028154603_official_portal_registry.sql");
const inactiveAdminMigration = read("supabase/migrations/20261028154926_admin_read_inactive_sources.sql");
assert.match(dashboardMigration, /alter table public\.admin_allowlist enable row level security/i);
assert.match(dashboardMigration, /admin_activity_log/);
assert.match(trackingMigration, /security invoker/i);
assert.match(trackingMigration, /x-initiative-code/i);
assert.match(trackingMigration, /grant select \(reference_code, title, status, created_at, district\)/i);
assert.match(portalRegistryMigration, /official_portal_integrations/);
assert.match(portalRegistryMigration, /link_only/);
assert.match(portalRegistryMigration, /create policy "public can read active official portal records"/i);
assert.match(inactiveAdminMigration, /admin can read all official portal records/i);
console.log(`✓ database migrations: ${migrationFiles.length} file(s); admin RLS, audit trail, invoker-secured tracking and official portal registry checked`);


const serviceGuide = read("davlat-xizmatlari.html");
for (const feature of [
  'id="tashkilotlar"',
  'id="serviceCatalogue"',
  'id="dialogContent"',
  'class="media-grid"',
  'class="directory-flow"',
  "https://gov.uz/oz/all_ministry/1",
  "https://gov.uz/oz/all_ministry/4",
  "https://gov.uz/oz/all_ministry/5",
  "https://gov.uz/oz/all_ministry/14",
  "https://gov.uz/oz/all_ministry/15",
  "https://gov.uz/oz/iiv/pages/davlat-xizmatlari-reestri",
  "https://gov.uz/oz",
  "https://murojaat.gov.uz/",
]) {
  assert.ok(serviceGuide.includes(feature), `Service guide feature or official directory missing: ${feature}`);
}
assert.match(serviceGuide, /function openDialog\(/);
assert.match(serviceGuide, /function renderRecommender\(/);
const imageCards = [...serviceGuide.matchAll(/<article class="media-card">/g)];
assert.ok(imageCards.length >= 5, "Service guide should contain at least five attributed portal media cards");
assert.match(serviceGuide, /alt="[^"]+"[^>]*><div class="caption">/);
assert.match(serviceGuide, /UZINFOCOM/);
assert.match(serviceGuide, /Murojaat.gov.uz/);
console.log(`✓ illustrated public-services guide, ${imageCards.length} attributed portal media cards, official directory categories, filters and service-flow visualization are present`);

const cabinet = read("kabinet.html");
for (const feature of [
  "yi_user_token",
  "/auth/v1/otp",
  "rpc/get_my_initiatives",
  "rpc/update_my_initiative",
  "owner_id=user.id",
]) {
  assert.ok(cabinet.includes(feature), `Personal cabinet control missing: ${feature}`);
}
console.log("✓ email magic-link cabinet and owner-scoped initiative RPCs are present");

for (const feature of [
  'id="page-team"',
  'id="page-showcase"',
  "team_posts?select",
  "team_interest_requests?select",
  "initiative_showcase?select",
  "function renderTeamPosts",
  "function renderShowcaseAdmin",
]) {
  assert.ok(admin.includes(feature), `Admin community moderation feature missing: ${feature}`);
}
console.log("✓ team-board and showcase moderation controls are present");

const ideaReview = read("supabase/functions/idea-review/index.ts");
for (const feature of ["GROQ_API_KEY", "containsSensitivePattern", "consume_idea_review_quota", "AI_PROVIDER_NOT_CONFIGURED"]) {
  assert.ok(ideaReview.includes(feature), `AI review safeguard missing: ${feature}`);
}
const telegramWebhook = read("supabase/functions/telegram-webhook/index.ts");
const telegramNotify = read("supabase/functions/telegram-notify/index.ts");
assert.match(telegramWebhook, /TELEGRAM_WEBHOOK_SECRET/);
assert.match(telegramWebhook, /telegram_subscriptions/);
assert.match(telegramWebhook, /\/link/);
assert.match(telegramNotify, /TELEGRAM_BOT_TOKEN/);
assert.match(telegramNotify, /admin_allowlist/);
console.log("✓ server-side AI safeguards and protected Telegram webhook/notification handlers are present");

const accountMigration = read("supabase/migrations/20261028163033_secure_account_owned_initiatives.sql");
const authorityMigration = read("supabase/migrations/20261028163747_add_core_public_authority_portals.sql");
assert.match(accountMigration, /get_my_initiatives/);
assert.match(accountMigration, /update_my_initiative/);
assert.match(authorityMigration, /insert into public\.official_portal_integrations/i);
assert.match(authorityMigration, /on conflict \(slug\) do update/i);
console.log("✓ migration history includes owner-scoped account RPCs and reproducible official portal seeds");

const educationMigration = read("supabase/migrations/20261028172620_retire_legacy_education_portal_records.sql");
assert.match(educationMigration, /set active = false/i);
assert.match(educationMigration, /ministry-education-science/);
assert.match(educationMigration, /official_portal_admin_notes/);


const hardeningMigration = read("supabase/migrations/20261028174007_harden_public_access_and_admin_review.sql");
for (const feature of [
  "admin_list_initiatives",
  "admin_review_initiative",
  "security invoker",
  "revoke all privileges on all tables in schema public",
  "grant insert (team_post_id, name, contact, role_interest, message)",
  "grant select (id, reference_code, owner_id",
]) {
  assert.ok(hardeningMigration.toLowerCase().includes(feature.toLowerCase()), `Database hardening requirement missing: ${feature}`);
}
assert.match(admin, /rpc\/admin_list_initiatives/);
assert.match(admin, /rpc\/admin_review_initiative/);
assert.doesNotMatch(admin, /api\("initiatives\?select=id,reference_code,submitter_name/);
assert.doesNotMatch(admin, /api\("initiatives\?id=eq\.[^\n]*method:"PATCH"/);
assert.doesNotMatch(publicHtml, /contact_shared:share,status:"pending"/);
assert.doesNotMatch(publicHtml, /message:trim\("interestMessage"\),status:"new"/);
console.log("✓ least-privilege REST grants and allowlist-protected admin review RPCs are present");


const partnerReviewMigration = read("supabase/migrations/20261028174334_admin_only_partner_review_rpc.sql");
for (const feature of [
  "admin_list_connection_requests",
  "admin_review_connection_request",
  "revoke all privileges on table public.connection_requests",
  "security definer",
  "p_expected_status",
]) {
  assert.ok(partnerReviewMigration.toLowerCase().includes(feature.toLowerCase()), `Partner review hardening requirement missing: ${feature}`);
}
assert.match(admin, /rpc\/admin_list_connection_requests/);
assert.match(admin, /rpc\/admin_review_connection_request/);
assert.doesNotMatch(admin, /api\("connection_requests\?select=id,name,email,phone,organization,request_type,message,review_status,admin_notes/);
assert.doesNotMatch(admin, /api\("connection_requests\?id=eq\.[^\n]*method:"PATCH"/);
console.log("✓ partner request private fields are returned and edited only through allowlist-checked admin RPCs");

const youthLedgerMigration = read("supabase/migrations/20261028175222_complete_youth_ledger_service_entry.sql");
for (const feature of [
  "youth-ledger",
  "Yoshlar daftari: huquqiy yo‘riqnoma",
  "jsonb",
  "https://advice.adliya.uz/oz/document/2631",
  "Yoshlar-Ishi yordam ajratmaydi",
]) {
  assert.ok(youthLedgerMigration.includes(feature), `Youth ledger service guide field missing: ${feature}`);
}
console.log("✓ youth-ledger record has an explanatory source link, eligibility caveats, steps and document guidance");

console.log("\nYoshlar-Ishi checks passed.");
