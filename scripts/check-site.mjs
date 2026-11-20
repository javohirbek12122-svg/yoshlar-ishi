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
  "platform-polish.css",
  "reference-home.css",
  "biletlar.html",
  "biletlar.css",
  "biletlar-app.js",
  "biletlar-data.js",
  "assessment.html",
  "assessment.css",
  "assessment.js",
  "assessment-bank.js",
  "scripts/check-assessment.mjs",
  "supabase/migrations/20261117190000_competency_assessment_engine.sql",
  "scripts/check-biletlar.mjs",
  "site.css",
  "site-background.css",
  "assets/uzbekistan-flag.svg",
  "shared-theme.css",
  "sitemap.xml",
  "BENCHMARK_NOTES.md",
  "DESIGN_BENCHMARK_100.md",
  "DESIGN_SYSTEM.md",
  "design-system.css",
  "scripts/check-contrast.mjs",
  "scripts/check-pwa.mjs",
  "scripts/check-government-pilot.mjs",
  "vercel.json",
  "service-worker.js",
  "pwa.js",
  "offline.html",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "government-pilot/README.md",
  "government-pilot/01_CONCEPT_NOTE_UZ.md",
  "government-pilot/02_COMPLIANCE_MATRIX_UZ.md",
  "government-pilot/03_ARCHITECTURE_AND_DATA_UZ.md",
  "government-pilot/04_SECURITY_GAP_REGISTER_UZ.md",
  "government-pilot/05_PILOT_PLAN_UZ.md",
  "government-pilot/06_GOVERNANCE_AND_OPERATIONS_UZ.md",
  "startap-yoli.html",
  "laboratoriya.html",
  "admin.html",
  "admin-operations.js",
  "admin-operations.css",
  "supabase/migrations/20261120051021_admin_site_content_blocks.sql",
  "supabase/migrations/20261120051312_admin_site_content_updated_by_index.sql",
  "davlat-xizmatlari.html",
  "imkoniyatlar.html",
  "kabinet.html",
  "hamjamiyat.html",
  "hamjamiyat.css",
  "hamjamiyat.js",
  "INTEGRATIONS_SETUP.md",
  "GOOGLE_OAUTH_SETUP.md",
  "supabase/migrations/20261117154708_member_cv_metadata_atomic_privacy_sync.sql",
  "supabase/migrations/20261117154956_grant_member_privacy_rpc_to_authenticated.sql",
  "supabase/migrations/20261117155404_member_privacy_rpc_uses_private_assets_only.sql",
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
  "supabase/migrations/20261028181147_index_foreign_key_columns.sql",
  "supabase/migrations/20261029030212_deduplicate_official_portal_destinations.sql",
  "supabase/migrations/20261029030418_document_server_only_table_policies.sql",
  "supabase/migrations/20261029030615_server_side_community_submission_limits.sql",
  "supabase/migrations/20261029031323_server_side_public_initiative_submissions.sql",
  "supabase/migrations/20261029051817_optimize_rls_policy_initplans.sql",
  "supabase/migrations/20261104155500_add_virtual_lab_runs.sql",
  "supabase/migrations/20261113180000_add_opportunity_journey_event_history.sql",
  "supabase/migrations/20261113193000_verified_opportunity_status_and_2026_contest.sql",
  "supabase/migrations/20261113210000_refresh_verified_official_portal_destinations.sql",
  "supabase/functions/idea-review/index.ts",
  "supabase/functions/community-submit/index.ts",
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
for (const file of ["index.html", "startap-yoli.html", "admin.html", "davlat-xizmatlari.html", "imkoniyatlar.html", "kabinet.html"]) {
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
assert.ok(publicHtml.includes('./site.css'), "Homepage must load its single consolidated design system");
assert.ok(publicHtml.includes('Loyiha va hamjamiyat vositalari'), "Secondary project/community tools must be separated from the primary public-opportunity journey");
assert.ok(publicHtml.includes('Bu forma davlat idorasiga ariza yubormaydi.'), "Internal initiative submission must not be confused with an official government application");
for (const page of ["imkoniyatlar.html","davlat-xizmatlari.html","kabinet.html","admin.html"]) {
  assert.ok(read(page).includes('./shared-theme.css'), `${page} must share the platform design tokens and navigation language`);
}
console.log("✓ one consolidated homepage design system, shared cross-page theme and clearly separated internal-vs-government actions");
assert.match(publicHtml, /id="initiativeForm"/);
assert.match(publicHtml, /id="trackForm"/);
assert.match(publicHtml, /action:"initiative_submit"/);
assert.match(publicHtml, /functions\/v1\/community-submit/);
assert.doesNotMatch(publicHtml, /api\("initiatives"/);
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

for (const feature of [
  'id="teamBoardSearch"',
  'id="teamBoardCategory"',
  'id="teamBoardCount"',
  "function renderTeamBoard(rows)",
  "const rowsToShow=teamBoardRows.filter",
]) {
  assert.ok(publicHtml.includes(feature), `Team matching UX missing: ${feature}`);
}
assert.match(publicHtml, /teamBoardRows\.filter/);
assert.match(publicHtml, /title\.includes\(word\)\?6:0/);
const privacy = read("privacy.html");
assert.match(privacy, /xom IP manzili saqlanmaydi/);
assert.match(privacy, /24 soatda 2 ta/);
assert.match(privacy, /10 daqiqada 5 ta/);
console.log("✓ matching board has keyword relevance ranking, filters and visible rate-limit privacy disclosure");


assert.match(publicHtml, /\/functions\/v1\/community-submit/);
assert.match(publicHtml, /function submitCommunity\(payload\)/);
assert.match(publicHtml, /id="teamConsent"/);
assert.match(publicHtml, /id="teamWebsite"/);
assert.match(publicHtml, /id="interestConsent"/);
assert.match(publicHtml, /id="interestWebsite"/);
assert.doesNotMatch(publicHtml, /api\("team_posts"/);
assert.doesNotMatch(publicHtml, /api\("team_interest_requests"/);
console.log("✓ public community forms use the consent-checked server-side submission endpoint, not direct table inserts");


const admin = read("admin.html");
assert.ok(admin.includes('id="programAvailabilityStatus"'), "Admin must expose an explicit application-status selector");
assert.ok(admin.includes('availability_status:$("programAvailabilityStatus").value'), "Admin must save the separate application-status field");
for (const feature of [
  'id="loginForm"',
  'id="otpPanel"',
  'id="passwordForm"',
  'rpc/admin_console_check',
  'id="page-initiatives"',
  'id="page-partners"',
  'id="page-sources"',
  'id="page-youth-programs"',
  'id="youthProgramForm"',
  'id="youthProgramsBody"',
  "function renderYouthPrograms()",
  "function saveYouthProgram(ev)",
  "function editYouthProgram(id)",
  "async function toggleYouthProgram(btn)",
  "youth_opportunity_programs?select=*",

  'id="page-integrations"',
  "official_portal_integrations?select=id",
  'nextStatus==="connected"&&nextMode==="external_link"',
  'id="page-activity"',
  'id="page-control-center"',
  'id="page-members"',
  'id="page-community"',
  'id="page-content"',
  'id="page-reports"',
  'admin-operations.js',
  'YIAdminBridge',
  'setInterval(()=>{if(token)refreshDashboard()},60000)',
  'async function refreshSession()',
  'if(refreshPromise)return refreshPromise',
  'Promise.allSettled(jobs.map(job=>job.run()))',
  'rpc/admin_list_console_events',
  'rpc/admin_record_console_event',
  'function safeHttpsUrl(value)',
  'if(published&&!row.published&&!tr.querySelector(".js-showconsent").checked)',
  'id="showConsent"',
  'auditSuffix(audited)',
  'updated_at=eq.',
  'yoshlar-ishi-site',
  'id="exportBtn"',
]) {
  assert.ok(admin.includes(feature), `Admin feature missing: ${feature}`);
}
assert.ok(admin.includes('official_portal_integrations?select=id'), "Admin integration registry query missing");
assert.ok(admin.includes('nextStatus==="connected"&&nextMode==="external_link"'), "Admin must prevent false connected status for plain external links");
assert.match(admin, /create_user:false/);
const adminOperations = read("admin-operations.js");
new vm.Script(adminOperations, { filename: "admin-operations.js" });
for (const feature of ["admin_get_control_center_summary","admin_list_member_directory","admin_moderate_member_profile","admin_list_community_posts","admin_moderate_community_post","admin_build_report","site_content_blocks","admin-public-assets","p_include_sensitive"]) assert.ok(adminOperations.includes(feature), "Admin operation missing: " + feature);
assert.ok(admin.includes("YIAdminBridge") && admin.includes("YIAdminPageChanged"), "Admin session bridge is required");
assert.ok(read("homepage-experience.js").includes("applyManagedHero(art,imageUrl,imageAlt)"), "Homepage must consume CMS hero content");
assert.match(admin, /verify.*type:"email"/);
assert.match(admin, /token\?grant_type=password/);
assert.ok(admin.includes('flowType:"pkce"') && admin.includes('storageKey:"yi-admin-auth"') && admin.includes("client.auth.signInWithOAuth({") && admin.includes('provider:"google"') && admin.includes("client.auth.getSession()") && admin.includes('localStorage.setItem("yi_admin_google_session","1")'), "Admin Google OAuth must use Supabase SDK-managed PKCE and persist the verified session");
assert.doesNotMatch(admin, /createPkcePair|code_challenge_method:"s256"|token\\?grant_type=pkce|code_verifier:verifier/, "Admin OAuth must not use a second hand-written PKCE verifier alongside the Supabase SDK");
assert.doesNotMatch(admin, /create_user:true/);
console.log("✓ Parkent-style admin OTP/password/Google gate uses a server-side allowlist RPC and prevents self-signup");
const index = read("index.html");
const opportunities = read("imkoniyatlar.html");
const assessment = read("assessment.js");
const memberHtml = read("hamjamiyat.html");
const memberCss = read("hamjamiyat.css");
const memberJs = read("hamjamiyat.js");
for (const marker of ['id="hpAuthGate"','id="hpAuthTabs"','id="hpAuthForm"','id="hpGoogleLogin"','id="hpRecoveryForm"','id="hpResendConfirmation"','id="hpPasswordStrength"','id="hpConfirmToggle"','id="hpTabProfile"','id="hpTabActivity"','id="hpTabSettings"','id="hpCvForm"','id="hpPortfolioForm"','id="hpPostType"','id="hpFeedType"','id="hpPrivacySave"']) assert.ok(memberHtml.includes(marker),"Member UI is missing " + marker);
for (const category of ["project","achievement","question","collaboration","team","learning","event","volunteer","opportunity","resource"]) assert.ok(memberHtml.includes('value="' + category + '"'),"Member post category missing: " + category);
for (const marker of ["signInWithPassword","signUp","signInWithOAuth","resetPasswordForEmail","auth.resend","PASSWORD_RECOVERY","getVerifiedIdentity","member_profiles","member_private_assets","member_posts","member_portfolio_items","member_activity_events","record_member_daily_visit","member-cv","createSignedUrl","post_type:postType","save_member_cv_path","save_member_privacy_settings","PROFILE_FIELDS"]) assert.ok(memberJs.includes(marker),"Supabase member workflow missing " + marker);
assert.doesNotMatch(memberJs,/save_my_member_privacy/,"Disabled legacy CV RPC must not be called by the UI");
assert.match(memberJs,/async function loadActivity\(/);
assert.match(memberJs,/function drawChart\(/);
assert.match(memberJs,/function openDrawer\(/);
assert.match(memberJs,/function closeDrawer\(/);
assert.match(memberCss,/\.hp-drawer/);
assert.doesNotMatch(memberJs,/service_role|SUPABASE_SERVICE_ROLE_KEY|client_secret/i);
assert.doesNotMatch(memberJs,/\.from\("member_profiles"\)\.select\("\*"\)/,"Discoverable profiles must use an explicit, privacy-safe field allowlist");
assert.ok(memberJs.includes('.select(PROFILE_FIELDS)'),"Restricted profile fields must be explicitly selected");
assert.match(memberJs,/\.from\("member_private_assets"\)\.select\("cv_object_path,cv_is_public"\)/);
new vm.Script(memberJs.split("\n").filter(line => !line.startsWith("import ")).join("\n"), { filename: "hamjamiyat.js" });
console.log("✓ member authentication, private profiles/CV, portfolio, ten post categories, activity charts and drawer syntax validated");
console.log("✓ admin login, allowlist checks, review pages, auto-refresh, CSV export and integration registry are present");
for (const feature of [
  'data-page="youth-programs"',
  'programSourceUrl',
  'programEligibility',
  'programSteps',
  'programDocuments',
  'programActive',
  'function resetYouthProgramForm()',
]) {
  assert.ok(admin.includes(feature), `Admin youth catalogue control missing: ${feature}`);
}
console.log("✓ allowlist-protected youth programme admin form supports create, edit, activate/deactivate and official-source verification fields");


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
assert.match(liveHealthWorkflow, /SITE_URL:\s*https:\/\/yoshlar-ishi-site\.vercel\.app/);
assert.doesNotMatch(liveHealthWorkflow, /vars\.SITE_URL/, "Live health must not inherit a stale deployment-specific URL");
assert.match(liveHealthWorkflow, /Check website, current feature set and admin page/);
assert.ok(liveHealthWorkflow.includes('"$BASE_URL/mobile-guard.css"'), "Live health must verify the mobile stylesheet is deployed");
assert.match(liveHealthWorkflow, /paths:/);
assert.ok(liveHealthWorkflow.includes('"davlat-xizmatlari.html"'));
assert.ok(liveHealthWorkflow.includes('curl --fail --silent --show-error --location --max-time 30 "$BASE_URL/davlat-xizmatlari.html" -o /tmp/yoshlar-services.html'));
assert.match(liveHealthWorkflow, /Idorani toifasiga qarab toping/);
assert.match(liveHealthWorkflow, /media-card/);
for (const marker of [
  'grep -Fqi "imkoniyatdan" /tmp/yoshlar-home.html',
  'grep -Fqi "amaliy natijagacha." /tmp/yoshlar-home.html',
  'class="hero-expanded-copy"',
  'class="hero-storyline yi-hero-ribbon"',
  'id="afzalliklar"',
  'class="platform-proof yi-platform-proof"',
  'class="showcase-empty"',
]) {
  assert.ok(liveHealthWorkflow.includes(marker), `Live health check is missing new design freshness marker: ${marker}`);
}
console.log("✓ live-site health check defaults to the current production deployment, checks current design markers and runs when public pages change");


console.log("✓ daily official portal availability monitor is present");
assert.match(liveHealthWorkflow, /class="media-fallback"/);
assert.match(liveHealthWorkflow, /URL’lar 2026-yil 29-oktabrda javob berish bo‘yicha tekshirilgan/);

assert.match(deployWorkflow, /VERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
assert.match(deployWorkflow, /VERCEL_ORG_ID:\s*\$\{\{ vars\.VERCEL_ORG_ID \}\}/);
assert.match(deployWorkflow, /VERCEL_PROJECT_ID:\s*\$\{\{ vars\.VERCEL_PROJECT_ID \}\}/);
assert.match(deployWorkflow, /vercel build --prod/);
assert.match(deployWorkflow, /vercel deploy --prebuilt --prod/);
assert.match(deployWorkflow, /smoke-test/i);
assert.match(deployWorkflow, /Optional Vercel CLI deploy skipped/i);
assert.match(deployWorkflow, /configured=false/);
assert.match(deployWorkflow, /steps\.credentials\.outputs\.configured == 'true'/);
assert.doesNotMatch(deployWorkflow, /Vercel deployment is blocked/);
assert.ok(deployWorkflow.includes('"$SITE_URL/mobile-guard.css"'), "Deployment smoke test must verify the mobile stylesheet");
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
  assert.ok(data.icons.some((icon) => icon.src === "/icon-192.png" || icon.src === "/icon-512.png"), `${file} must use a supported raster install icon`);
  console.log(`✓ ${file}: valid JSON web-app manifest`);
}
const icon = read("icon.svg");
assert.match(icon, /<svg[\s\S]*viewBox="0 0 512 512"/);
console.log("✓ app icon is an SVG with a square viewBox");


const youthOpportunityMigration = read("supabase/migrations/20261107101800_youth_opportunity_engine.sql");
const contractSupportMigration = read("supabase/migrations/20261107113500_add_professional_education_contract_support.sql");
const updatedYouthCatalogueMigration = read("supabase/migrations/20261107120000_refresh_youth_opportunities_2026.sql");
for (const feature of [
  "youth_opportunity_programs",
  "opportunity_journeys",
  "users read own opportunity journeys",
  "public can read active youth programmes",
  "yoshlar-daftari",
  "2-plus-6",
  "kelajak-tadbirkori",
]) {
  assert.ok(youthOpportunityMigration.includes(feature), "Youth opportunity schema/seed missing: " + feature);
}
for (const feature of [
  "yoshlar-daftari-kontrakt",
  "advice.adliya.uz/oz/news/3230",
  "2plus6.uz/opportunity",
  "BHM",
]) {
  assert.ok(contractSupportMigration.includes(feature), "Updated official youth support migration missing: " + feature);
}
for (const feature of [
  "yoshlar-daftari-kontrakt",
  "kelajak-tadbirkori-uzvc",
  "B1/B2",
  "PF-175",
  "2plus6.uz/",
]) {
  assert.ok(updatedYouthCatalogueMigration.includes(feature), "Updated catalogue migration missing: " + feature);
}
assert.ok(read("imkoniyatlar.html").includes('p.application_url?"Rasmiy ariza kanalini ochish ↗":"Rasmiy ma’lumotni ko‘rish ↗"'), "Unconfirmed application paths must not be labelled as application forms");
assert.ok(admin.includes('id="programSort"'), "Admin must preserve manual programme ordering");
const journeyEventMigration = read("supabase/migrations/20261113180000_add_opportunity_journey_event_history.sql");
for (const feature of ["opportunity_journey_events", "journey_started", "progress_updated", "status_changed", "enable row level security", "users read own opportunity journey events", "users create own opportunity journey events", "opportunity_journey_events_journey_created_idx"]) {
  assert.ok(journeyEventMigration.includes(feature), "Private journey event history migration missing: " + feature);
}
console.log("✓ youth opportunity schema, owner-scoped progress and private chronological event history are reproducible");

const opportunityStatusMigration = read("supabase/migrations/20261113193000_verified_opportunity_status_and_2026_contest.sql");
for (const feature of ["availability_status", "'open'", "'permanent'", "'upcoming'", "'unverified'", "'closed'", "inson-huquqlari-innovatsion-tanlov-2026", "2026-yil 15-noyabrgacha"]) {
  assert.ok(opportunityStatusMigration.includes(feature), "Verified catalogue status migration missing: " + feature);
}
console.log("✓ youth catalogue availability states and the dated 2026 national contest are reproducible");
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
assert.ok(serviceGuide.includes('href="./imkoniyatlar.html"'), "Service guide must route to the real opportunities catalogue");
assert.ok(!serviceGuide.includes("Tashabbus yuborish ↗"), "Service guide must not use the legacy initiative CTA");
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
assert.match(serviceGuide, /onerror="this\.style\.display='none';this\.nextElementSibling\.style\.display='grid'"><div class="media-fallback"[^>]*>[\s\S]*?<\/div><div class="caption">/);
assert.match(serviceGuide, /UZINFOCOM/);
assert.match(serviceGuide, /Murojaat.gov.uz/);
console.log(`✓ illustrated public-services guide, ${imageCards.length} attributed portal media cards, official directory categories, filters and service-flow visualization are present`);


const opportunitiesPage = read("imkoniyatlar.html");
for (const feature of [
  "youth_opportunity_programs?select=",
  "opportunity_journeys?select=",
  'id="programGrid"',
  'id="detailMain"',
  'id="draftSituation"',
  'id="saveJourney"',
  'id="journeyTimeline"',
  "availability_status",
  "availabilityLabels",
  "Ochiq qabul",
  "Tasdiqlanmagan",
  "Yopilgan",
  "opportunity_journey_events?select=",
  "async function loadJourneyTimeline(journeyId)",
  "event_type:eventType",
  "data-step-check",
  "data-doc-check",
  "function fitProgram(p)",
  "function saveJourney()",
  "Rasmiy manbaga o‘tish",
  "Kredit — grant emas",
]) {
  assert.ok(opportunitiesPage.includes(feature), `Youth opportunity engine feature missing: ${feature}`);
}
assert.match(opportunitiesPage, /opportunity_journeys\?select=\*&program_slug=eq\./);
console.log("✓ youth opportunity catalogue, explicit application states, age-fit guide, preparation checklist, draft builder and private journey timeline are present");


const cabinet = read("kabinet.html");
for (const feature of [
  "YI_AUTH_READY",
  "getIdentity()",
  "rpc/get_my_initiatives",
  "rpc/update_my_initiative",
  "owner_id=user.id",
  "authLinks",
]) {
  assert.ok(cabinet.includes(feature), `Personal cabinet control missing: ${feature}`);
}
assert.doesNotMatch(cabinet,/yi_user_token|yi_user_refresh|yi_user_id|auth[./]v1[./]otp/,"Cabinet must not duplicate token storage or expose a second sign-in flow");
const sharedAuth = read("auth-client.js");
const authBridge = read("auth-bridge.js");
assert.ok(sharedAuth.includes("supabase.auth.getUser()"),"Shared auth client must verify user identity against Supabase");
assert.ok(sharedAuth.includes("persistSession: true") && sharedAuth.includes("autoRefreshToken: true") && sharedAuth.includes('flowType: "pkce"'),"Shared auth client must persist and refresh the PKCE session");
assert.ok(authBridge.includes("getIdentity: getVerifiedIdentity") && authBridge.includes("yi-auth-change"),"Legacy pages must share verified identity and cross-tab auth changes");
assert.doesNotMatch(index,/yi_user_token|yi_user_refresh|yi_user_id/,"Homepage must not use ad-hoc auth token storage");
assert.ok(index.includes("YI_AUTH_READY") && index.includes("getIdentity()"),"Homepage forms and votes must use the shared auth bridge");
assert.ok(index.includes("updateHomepageAccountUi") && index.includes("yi-auth-change") && index.includes("Shaxsiy kabinet"),"Homepage account action must reflect the verified signed-in state");
assert.ok(memberHtml.includes('id="hpRecoveryForm"') && memberHtml.includes('id="hpResendConfirmation"'),"Password reset and confirmation resend controls are required");
assert.doesNotMatch(memberJs,/sessionStorage.*yi_user_token/,"Community page must not duplicate the access token");
assert.ok(opportunities.includes("YI_AUTH_READY") && opportunities.includes("getIdentity"),"Opportunity catalogue must use shared Supabase Auth");
assert.doesNotMatch(opportunities,/yi_user_token|yi_user_refresh|yi_user_id|auth[./]v1[./]user|auth[./]v1[./]token/,"Opportunity catalogue must not manage a duplicate session or refresh flow");
const laboratoryAuthPage = read("laboratoriya.html");
assert.ok(laboratoryAuthPage.includes('import { supabase, getVerifiedIdentity } from "./auth-client.js"'),"3D laboratory must use the shared authenticated client");
assert.doesNotMatch(laboratoryAuthPage,/yi_user_token|yi_user_refresh|yi_user_id/,"3D laboratory must not duplicate user session tokens");
assert.ok(laboratoryAuthPage.includes('supabase.from("lab_runs").insert(payload)') && laboratoryAuthPage.includes('supabase.from("lab_runs").delete()'),"3D laboratory saves and deletes must use the shared Supabase client");
assert.ok(laboratoryAuthPage.includes('id="nazariya"') && laboratoryAuthPage.includes('href="#nazariya"'),"3D laboratory theory navigation must have a real target");
assert.ok(opportunities.includes('mode=login#hpAuthGate') && opportunities.includes('mode=register#hpAuthGate'),"Opportunity catalogue must provide unified login and registration routes");
assert.ok(assessment.includes('import { supabase, getVerifiedIdentity } from "./auth-client.js"'),"Assessment page must use the shared Auth client");
assert.ok(!assessment.includes("createClient(") && !assessment.includes("auth.getSession()"),"Assessment page must not create an independent Auth client or trust an unverified local user");
const assessmentForSyntax=assessment.split(String.fromCharCode(10)).filter(line=>!line.startsWith("import ")).join(String.fromCharCode(10));
new vm.Script(assessmentForSyntax,{filename:"assessment.js"});
const opportunityMarker="<script>"+String.fromCharCode(10)+'(()=>{"use strict";';
const opportunityStart=opportunities.indexOf(opportunityMarker);
assert.ok(opportunityStart>=0,"Opportunity inline application script is missing");
const opportunityEnd=opportunities.indexOf("</script>",opportunityStart);
assert.ok(opportunityEnd>opportunityStart,"Opportunity inline application script is incomplete");
new vm.Script(opportunities.slice(opportunityStart+8,opportunityEnd),{filename:"imkoniyatlar.html"});
const authMigration=read("supabase/migrations/20261118120000_harden_initiative_owner_update_and_admin_review.sql");
assert.ok(authMigration.includes("owners update own pending initiatives or admins review"),"Owner-scoped initiative update policy must be versioned");
const authClientForSyntax=sharedAuth.split("\n").filter(line=>!line.startsWith("import ")).join("\n").replaceAll("export ","");
const authBridgeForSyntax=authBridge.split("\n").filter(line=>!line.startsWith("import ")).join("\n");
new vm.Script(authClientForSyntax,{filename:"auth-client.js"});
new vm.Script(authBridgeForSyntax,{filename:"auth-bridge.js"});
console.log("✓ shared Supabase auth, owner-scoped cabinet and single account/session flow validated");

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


const communitySubmit = read("supabase/functions/community-submit/index.ts");
for (const feature of [
  'action !== "team_post" && action !== "team_interest"',
  "consume_community_submission_quota",
  "COMMUNITY_RATE_LIMIT_SALT",
  "crypto.subtle.digest",
  "status: \"pending\"",
  "status: \"new\"",
  "contact_shared: shareContact",
]) {
  assert.ok(communitySubmit.includes(feature), `Community submission safeguard missing: ${feature}`);
}
assert.match(communitySubmit, /windowSeconds = 86400/);
assert.match(communitySubmit, /windowSeconds = 600/);
assert.match(communitySubmit, /httpsUrl\(enteredContact\)/);
assert.match(communitySubmit, /status.*published/);
assert.match(communitySubmit, /COMMUNITY_RATE_LIMIT_SALT.*serverSecret/);
assert.match(communitySubmit, /rateHash\(action, clientAddress\(req\), key\)/);
console.log("✓ community Edge Function validates consent, enforces status, checks public links and applies hashed-IP quotas");


for (const feature of [
  "initiative_submit",
  "newReferenceCode()",
  'status: "submitted"',
  'ageBands.has(ageBand)',
  "initiativeCategories.has(category)",
  "windowSeconds = 3600",
  "reference_code: referenceCode",
]) {
  assert.ok(communitySubmit.includes(feature), `Public initiative server safeguard missing: ${feature}`);
}
assert.match(communitySubmit, /supportTypes\.has\(item\)/);
assert.match(communitySubmit, /owner_id: ownerId/);
console.log("✓ public initiative submission validates fields, generates tracking codes server-side and derives owner identity from a verified session");

const publicInitiativeMigration = read("supabase/migrations/20261029031323_server_side_public_initiative_submissions.sql");
assert.match(publicInitiativeMigration, /initiative_submit/);
assert.match(publicInitiativeMigration, /drop policy if exists "public can submit initiatives"/i);
assert.match(publicInitiativeMigration, /revoke insert on table public\.initiatives from public, anon/i);
assert.match(publicInitiativeMigration, /grant execute on function public\.consume_community_submission_quota/i);

const communityMigration = read("supabase/migrations/20261029030615_server_side_community_submission_limits.sql");
for (const feature of [
  "community_submission_rate_limits",
  "consume_community_submission_quota",
  "revoke insert on table public.team_posts from public, anon, authenticated",
  "revoke insert on table public.team_interest_requests from public, anon, authenticated",
  "grant execute on function public.consume_community_submission_quota(text,text,integer,integer) to service_role",
]) {
  assert.ok(communityMigration.toLowerCase().includes(feature.toLowerCase()), `Community submission migration requirement missing: ${feature}`);
}
console.log("✓ community write permissions are restricted and quota migration is reproducible");

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
assert.match(ideaReview, /AI_RATE_LIMIT_SALT.*key/);
console.log("✓ server-side AI safeguards and protected Telegram webhook/notification handlers are present");

const accountMigration = read("supabase/migrations/20261028163033_secure_account_owned_initiatives.sql");
const adminLoginMigration = read("supabase/migrations/20261107163000_admin_login_otp_gate.sql");
assert.match(adminLoginMigration, /create or replace function public\.admin_console_check\(\)/i);
assert.match(adminLoginMigration, /security invoker/i);
assert.match(adminLoginMigration, /revoke all on function public\.admin_console_check\(\) from anon/i);
assert.match(adminLoginMigration, /grant execute on function public\.admin_console_check\(\) to authenticated/i);
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


const indexMigration = read("supabase/migrations/20261028181147_index_foreign_key_columns.sql");
for (const feature of [
  "admin_activity_log_actor_id_idx",
  "admin_activity_log_initiative_id_idx",
  "initiative_showcase_created_by_idx",
  "initiative_showcase_initiative_id_idx",
  "initiative_showcase_votes_voter_id_idx",
  "initiative_updates_author_id_idx",
  "initiative_updates_initiative_id_idx",
  "initiatives_owner_id_idx",
  "initiatives_reviewed_by_idx",
  "team_interest_requests_team_post_id_idx",
  "team_posts_owner_id_idx",
  "telegram_subscriptions_reference_code_idx",
]) {
  assert.ok(indexMigration.includes(feature), `Foreign-key index migration missing: ${feature}`);
}
console.log("✓ foreign-key index migration includes all 12 performance indexes");



const dedupMigration = read("supabase/migrations/20261029030212_deduplicate_official_portal_destinations.sql");
assert.match(dedupMigration, /where slug = 'ministries-directory'/i);
assert.match(dedupMigration, /set active = false/i);
assert.match(dedupMigration, /where slug = 'advice-legal'/i);
assert.match(dedupMigration, /https:\/\/advice\.adliya\.uz\//i);
console.log("✓ duplicate portal listings are normalized to distinct useful destinations");


const backendOnlyMigration = read("supabase/migrations/20261029030418_document_server_only_table_policies.sql");
assert.match(backendOnlyMigration, /on public\.ai_review_rate_limits/i);
assert.match(backendOnlyMigration, /to service_role/i);
assert.match(backendOnlyMigration, /on public\.telegram_subscriptions/i);
assert.match(backendOnlyMigration, /with check \(true\)/i);
console.log("✓ AI quota and Telegram subscription tables are explicitly scoped to the server role");


const opportunityDesignHome = read("index.html");
const opportunityStyles = read("site.css");
for (const feature of [
  '<title>Yoshlar-Ishi — yoshlar uchun imkoniyatlar va yo‘l-yo‘riq</title>',
  '<link rel="stylesheet" href="./site.css">',
  'id="qo-shimcha-vositalar"',
  "Qo‘shimcha vositalar",
  "Bu vositalar asosiy davlat imkoniyatlari katalogidan alohida.",
  "YOSHLAR UCHUN IMKONIYATLAR",
  "IMKONIYAT · TAYYORGARLIK · ARIZA · NATIJA",
  "Imkoniyatlar",
  "href=\"./imkoniyatlar.html#savedJourneys\"",
  'class="hero-expanded-copy"',
  'class="hero-focus"',
  'id="afzalliklar"',
  'class="platform-proof yi-platform-proof"',
  'class="benefit-grid"',
  'class="hero-note"',
  'id="yiSearchToggle"',
  'class="showcase-empty"',
  'id="jamoadoshlar"',
  'id="top-tashabbuslar"',
  'id="ai-yordamchi"',
  'id="ariza-holati"',
  'class="hero-storyline yi-hero-ribbon"',
  'Loyiha va hamjamiyat vositalari',
  'Bu forma davlat idorasiga ariza yubormaydi.',
  'Yuborgan tashabbus holati',
]) {
  assert.ok(opportunityDesignHome.includes(feature), `Opportunity-first homepage marker missing: ${feature}`);
}
for (const feature of [
  '--navy:#123255',
  '--blue:#15558a',
  '.hero.wrap{position:relative',
  '.nav{position:sticky',
  '.hero-storyline{',
  '@media(max-width:680px)',
  'prefers-reduced-motion:reduce',
  '.mobile-nav-panel',
  '.benefit-grid',
  '.steps',
  '.additional-tools',
]) {
  assert.ok(opportunityStyles.includes(feature), `Consolidated homepage design rule missing: ${feature}`);
}
assert.match(opportunityStyles, /@media\(max-width:900px\)/);
assert.match(opportunityStyles, /@media\(max-width:680px\)/);
assert.match(opportunityStyles, /prefers-reduced-motion:reduce/);
assert.ok(!opportunityDesignHome.includes('#101317') && !opportunityDesignHome.includes('--uc-acid:#d7ff66'), "Superseded dark lime design tokens must not remain embedded in homepage markup");
assert.match(opportunityDesignHome, /function softGlow\(/, "Animated background source remains in the homepage JavaScript");
assert.ok(opportunityDesignHome.includes("document.body.style.zoom=String(fontScale)"), "A11y text-size controls must scale the visible interface, not only an inherited base font");
console.log("✓ opportunity-first homepage uses one consolidated navy/blue design system, sticky navigation, accessible mobile menu and reduced-motion layouts");

const serviceDesign = read("davlat-xizmatlari.html");

const stateAssistant = read("state-service-assistant.js");
const stateAssistantCss = read("state-service-assistant.css");
for (const marker of [
  'id="amaliy-yordam"',
  'id="saGeneratePlan"',
  'id="saChecklist"',
  'id="saGenerateDraft"',
  'id="saTaskForm"',
  'id="saTaskList"',
  'state-service-assistant.css',
  'state-service-assistant.js',
  'Yordam markazi',
]) {
  assert.ok(serviceDesign.includes(marker), "Cross-portal service helper UI marker missing: " + marker);
}
for (const feature of [
  'my.edu.uz', 'my.gov.uz', 'my.soliq.uz', 'PM.gov.uz',
  'Murojaat.gov.uz', 'OneID', 'ARGOS', 'Birdarcha',
  'localStorage', '14–18 yosh', 'SMS-kod',
  'ariza', 'shikoyat', 'Yoshlar-Ishi grant ajratmaydi'
]) {
  assert.ok(stateAssistant.includes(feature), "Cross-portal helper capability missing: " + feature);
}
for (const feature of [
  '.state-assist', '.sa-layout', '.sa-panel', '.sa-control',
  'min-height:48px', '@media(max-width:680px)',
  'prefers-reduced-motion:reduce'
]) {
  assert.ok(stateAssistantCss.includes(feature), "Cross-portal helper responsive rule missing: " + feature);
}
new vm.Script(stateAssistant, { filename: "state-service-assistant.js" });
console.log("✓ cross-portal service navigator, document checklist, appeal drafter and local case tracker are wired and syntax-checked");

const accountDesign = read("kabinet.html");
const adminDesign = read("admin.html");
assert.match(serviceDesign, /Yoshlar-Ishi shared startup palette/);
assert.match(serviceDesign, /id="tashkilotlar"/);
assert.match(serviceDesign, /class="media-grid"/);

const mediaSection = serviceDesign.match(/<section class="section" id="media"[\s\S]*?<\/section>/)?.[0] ?? "";
assert.equal((mediaSection.match(/class="media-fallback"/g) || []).length, 5, "Each official screenshot needs an accessible fallback");
assert.equal((mediaSection.match(/onerror="/g) || []).length, 5, "Each media image must define an onerror fallback");
assert.ok(serviceDesign.includes("Xizmat tafsilotlari 2026-yil 28-oktabr") && serviceDesign.includes("URL’lar 2026-yil 29-oktabrda javob berish bo‘yicha tekshirilgan"), "Content and URL monitoring dates must be clearly distinguished");

assert.match(accountDesign, /Yoshlar-Ishi shared startup palette/);
assert.ok(read("shared-theme.css").includes(".navlinks{"), "Personal cabinet navigation must use the shared visual rules");
assert.ok(read("site.css").includes(".showcase-empty-art"), "Empty portfolio state must have its own accessible visual hierarchy");
assert.ok(read("site.css").includes(".detail-btn"), "Dynamic team interest actions must not fall back to unstyled browser buttons");
assert.match(accountDesign, /rpc\/get_my_initiatives/);
assert.match(adminDesign, /Yoshlar-Ishi shared startup palette/);
assert.match(adminDesign, /id="page-team"/);
assert.match(adminDesign, /id="page-showcase"/);
assert.match(adminDesign, /id="page-control-center"/);
assert.match(adminDesign, /id="page-content"/);
assert.match(adminDesign, /id="page-reports"/);
console.log("✓ service directory, personal cabinet and admin panel share the visual system without removing core flows");



const compactHome = read("index.html");
const homepageRuntime = read("homepage-experience.js");
for (const feature of [
  'id="ambientCanvas"',
  'class="hero-storyline yi-hero-ribbon"',
  'class="hero-story-step"',
  'data-flow-label="IMKONIYAT · TAYYORGARLIK · ARIZA · NATIJA"',
  "IMKONIYAT · TAYYORGARLIK · ARIZA · NATIJA",
  'id="readingProgress"',
  'id="draftReadiness"',
  'id="draftReadinessScore"',
  'id="draftReadinessFill"',
  'id="backToTop"',
  'function updateDraftReadiness()',
  'function initAmbientBackground()',
  'foldAfterHeader("jarayon"',
  'foldAfterHeader("imkoniyatlar-yakun"',
  'className="compact-fold compact-ai"',
  'className="compact-fold compact-composer"',
  'className="compact-fold compact-composer compact-initiative"',
  'className="compact-fold compact-partner-fold"',
]) {
  assert.ok(compactHome.includes(feature), `Compact homepage feature missing: ${feature}`);
}
assert.match(compactHome, /requestAnimationFrame/);
assert.match(compactHome, /scrollIntoView\(/);
assert.match(compactHome, /IntersectionObserver/);
assert.match(compactHome, /new ResizeObserver/);
assert.match(compactHome, /function softGlow\(/);
assert.ok(homepageRuntime.includes('class="yi-hero-banner"') && homepageRuntime.includes('https://d2ol7oe51mr4n9.cloudfront.net/user_3JM13LmKQo41EGZkNQHbTC0mG4m/f0a06878-17e7-4fdb-94e6-0437ce7f174c.jpg'), "The homepage uses the exact user-supplied banner image");
assert.match(compactHome, /ctx\.createRadialGradient/);
assert.match(compactHome, /ctx\.globalCompositeOperation="screen"/);
assert.doesNotMatch(compactHome, /function traceFlow\(/, "Atmospheric background must not draw a fixed route line");
assert.doesNotMatch(compactHome, /ctx\.ellipse\(/, "Atmospheric background must not draw orbital border rings");
assert.doesNotMatch(compactHome, /lineDashOffset/, "Atmospheric background must not draw a dashed border path");
assert.match(read("site.css"), /position:sticky/);
assert.match(read("site.css"), /flex-wrap:wrap/);
assert.match(compactHome, /if\(reduced\)\{render\(0\);return;\}/);
assert.match(compactHome, /Tashabbus formasi tayyorgarligi/);
assert.match(compactHome, /grant yoki davlat tanlovi bahosi emas/);
assert.match(compactHome, /Yangi tashabbusni to‘ldirish/);
console.log("✓ compact homepage, live form completeness score, motion-safe background, accordions and scroll interactions are checked");


const rlsInitplanMigration = read("supabase/migrations/20261029051817_optimize_rls_policy_initplans.sql");
assert.match(rlsInitplanMigration, /replace\(p\.qual, 'auth\.jwt\(\)', '\(select auth\.jwt\(\)\)'\)/);
assert.match(rlsInitplanMigration, /replace\(p\.with_check, 'auth\.jwt\(\)', '\(select auth\.jwt\(\)\)'\)/);
assert.match(rlsInitplanMigration, /\(select current_setting\('request\.headers'::text, true\)\)/);
assert.match(rlsInitplanMigration, /public can track with matching reference header/);
console.log("✓ RLS initplan optimization preserves admin allowlist and private tracking predicates");


const startupPath = read("startap-yoli.html");
for (const feature of [
  'data-stage="idea"',
  'data-stage="validate"',
  'data-stage="mvp"',
  'data-stage="market"',
  'data-stage="growth"',
  'id="readinessChecklist"',
  'id="goalFilter"',
  'id="sectorFilter"',
  'id="sourceFilter"',
  'id="recommendations"',
  'function scoresFor(stage,goal,sector,source)',
  'function renderChecklist()',
  'function updateReadiness()',
  'UzCombinator — 45 kunlik startap akseleratori',
  'https://uzcombinator.uz/apply',
  'https://www.it-park.uz/en/itpark/startups',
  'https://itparkventures.uz/',
  'https://www.startupuzbekistan.com/',
  'official_portal_integrations',
  'Supabase katalogi bilan sinxronlandi',
  "Moslik '+match+'/10",
  'Yoshlar-Ishi mustaqil navigator',
]) {
  assert.ok(startupPath.includes(feature), `Startup navigator feature missing: ${feature}`);
}
assert.match(publicHtml, /\.\/startap-yoli\.html/);
assert.match(serviceDesign, /\.\/imkoniyatlar\.html/);
assert.match(accountDesign, /\.\/imkoniyatlar\.html/);
assert.doesNotMatch(startupPath, /% moslik/, "Heuristic rank must not be presented as a probability");
const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
for (const path of ["/", "/startap-yoli.html", "/davlat-xizmatlari.html", "/privacy.html"]) {
  assert.ok(sitemap.includes("https://yoshlar-ishi-site.vercel.app" + path), `Public sitemap page missing: ${path}`);
}
assert.match(robots, /Sitemap: https:\/\/yoshlar-ishi-site\.vercel\.app\/sitemap\.xml/);
assert.doesNotMatch(sitemap, /admin\.html|kabinet\.html/);
assert.match(read("BENCHMARK_NOTES.md"), /IT Park Uzbekistan — Startups/);
assert.match(read("BENCHMARK_NOTES.md"), /does \*\*not\*\* submit applications/);
console.log("✓ startup benchmarking notes, canonical public sitemap and private-page exclusions are present");

console.log("✓ startup navigator has five stage paths, stage-specific readiness checklists, data-backed scoring and official source disclaimers");

const laboratory = read("laboratoriya.html");
for (const feature of [
  'data-mode="projectile"',
  'data-mode="pendulum"',
  'data-mode="gas"',
  'data-mode="wave"',
  'data-mode="refraction"',
  'data-mode="nuclear"',
  'new THREE.WebGLRenderer',
  'OrbitControls',
  'n₁ sin(θ₁) = n₂ sin(θ₂)',
  'Yadro bo‘linishining konseptual modeli',
  'lab_runs',
  'experiment_key:currentMode==="nuclear"?"nuclear-concept":currentMode',
]) {
  assert.ok(laboratory.includes(feature), "Virtual lab feature missing: " + feature);
}
const laboratoryModule = laboratory.match(/<script type="module">([\s\S]*?)<\/script>/i)?.[1];
assert.ok(laboratoryModule, "Virtual lab module script missing");
assert.match(laboratoryModule,/nuclearBtn\.addEventListener\("click",startNuclear\)/,"Nuclear demo button must be wired only after it is created");
assert.doesNotMatch(laboratoryModule,/\$\("runNuclear"\)\.addEventListener/,"Do not attach handlers before the dynamic nuclear button exists");
const parseableLabModule = laboratoryModule.replace(/^import .*?;\s*/gm, "");
new vm.Script(parseableLabModule, { filename: "laboratoriya.html:module-script" });
console.log("✓ 3D virtual laboratory, six learning models, module syntax and account-scoped result storage are present");

const mobileGuard = read("mobile-guard.css");
const mobileExperienceCss = read("mobile-experience.css");
const mobileExperienceJs = read("mobile-experience.js");
assert.ok(mobileGuard.includes('@import url("./mobile-experience.css");'), "Global mobile styles must include the dedicated mobile layer");
assert.ok(mobileGuard.includes('@import url("./site-background.css");'), "Every page must inherit the site-wide flag background through the mobile guard");
const siteBackground = read("site-background.css");
assert.ok(siteBackground.includes("body::before") && siteBackground.includes('url("/assets/uzbekistan-flag.svg")'), "The flag must be rendered as a fixed visible image layer behind page content");
assert.ok(siteBackground.includes("rgba(246,249,252,.42)"), "The national flag must not be hidden beneath an opaque overlay");
assert.ok(siteBackground.includes("background-size:auto,min(100vw,1200px) auto"), "The full flag must retain its 2:1 image proportions on desktop");

for (const marker of ["--yi-mobile-dock-height:64px","grid-template-columns:repeat(5,minmax(0,1fr))","env(safe-area-inset-bottom","yi-keyboard-open","yi-mobile-overlay-open","yi-mobile-table-scroll"]) assert.ok(mobileExperienceCss.includes(marker), "Mobile CSS marker missing: "+marker);
for (const marker of ["Yoshlar hamjamiyati","Jarayonlar va murojaatlar","visualViewport","yi-services-expanded","yi-mobile-table-scroll","aria-current"]) assert.ok(mobileExperienceJs.includes(marker), "Mobile JS marker missing: "+marker);
assert.ok(mobileExperienceJs.includes("__YI_MOBILE_EXPERIENCE_BOOTED"), "The mobile controller must be idempotent when a page injects scripts more than once");
assert.ok(read("pwa.js").includes('script.src = "/mobile-experience.js"'), "PWA must load the standalone mobile controller");


assert.match(mobileGuard,/^@import url\("\.\/design-system\.css"\);/,"Every page must receive the unified design system through the shared mobile stylesheet");
const benchmark100=read("DESIGN_BENCHMARK_100.md");
const designGuide=read("DESIGN_SYSTEM.md");
const unifiedDesign=read("design-system.css");
for(const marker of ["100 ta xalqaro","### A. Buyuk Britaniya","### J. Yangi Zelandiya","100. Transport","Metodologiya"]){
 assert.ok(benchmark100.includes(marker),"International benchmark evidence missing: "+marker);
}
for(const marker of ["#123255","#15558A","WCAG 2.2","Maxfiylik"]){
 assert.ok(designGuide.toLowerCase().includes(marker.toLowerCase()),"Design system documentation marker missing: "+marker);
}
for(const marker of ["--navy:#123255!important","--blue:#15558a!important","font-size:16px!important","prefers-reduced-motion:reduce","prefers-contrast:more","@media(max-width:680px)"]){
 assert.ok(unifiedDesign.includes(marker),"Unified visual rule missing: "+marker);
}
console.log("✓ 100 international service examples and the unified design system are documented and wired through the shared stylesheet");
assert.equal(JSON.parse(read("package.json")).scripts?.["check:contrast"],"node scripts/check-contrast.mjs");
execFileSync(process.execPath,["scripts/check-contrast.mjs"],{stdio:"inherit"});

for (const feature of ["--yi-mobile-tap-size:44px","font-size:16px!important","env(safe-area-inset-bottom","overscroll-behavior-x:contain","prefers-reduced-motion"]) {
  assert.ok(mobileGuard.includes(feature), "Mobile resilience rule missing: " + feature);
}
assert.doesNotMatch(mobileGuard,/overflow-x:\s*clip/i,"Mobile CSS must not hide horizontal overflow instead of fixing it");
assert.match(mobileGuard,/@media\(max-width:900px\)/,"Touch controls must be usable on tablets as well as phones");
for (const file of ["index.html","imkoniyatlar.html","davlat-xizmatlari.html","kabinet.html","admin.html","startap-yoli.html","laboratoriya.html","privacy.html","physics-lab/index.html"]) {
  const html = read(file);
  const mobilePath = file === "physics-lab/index.html" ? "../mobile-guard.css" : "./mobile-guard.css";
  assert.ok(html.includes('href="' + mobilePath + '"'), file + " must load the mobile resilience layer");
  assert.match(html, /name="viewport" content="[^"]*viewport-fit=cover/);
}
const mobileWorkflow=read(".github/workflows/quality.yml");
assert.match(mobileWorkflow,/playwright install --with-deps chromium/);
assert.match(mobileWorkflow,/npm run check:mobile/);
assert.equal(JSON.parse(read("package.json")).devDependencies?.playwright,"1.65.0");
assert.match(liveHealthWorkflow,/Checkout tested source for mobile browser tests/);
assert.match(liveHealthWorkflow,/MOBILE_BASE_URL:/);
assert.match(liveHealthWorkflow,/npm run check:mobile/);
execFileSync(process.execPath,["--check","scripts/check-mobile.mjs"],{stdio:"pipe"});
console.log("✓ mobile resilience CSS is loaded across all pages and Playwright regression tests are wired into CI");

execFileSync(process.execPath, ["scripts/check-pwa.mjs"], { stdio: "inherit" });
execFileSync(process.execPath, ["scripts/check-government-pilot.mjs"], { stdio: "inherit" });

console.log("\nYoshlar-Ishi checks passed.");
