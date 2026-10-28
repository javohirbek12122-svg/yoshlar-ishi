import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const required = [
  "index.html",
  "admin.html",
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
  "supabase/migrations/20261028145226_initial_yoshlar_ishi_schema.sql",
  "supabase/migrations/20261028145259_enable_reference_code_tracking.sql",
  "supabase/migrations/20261028152132_owner_dashboard_and_secure_tracking.sql",
  "supabase/migrations/20261028152553_harden_internal_trigger_functions.sql",
  "supabase/migrations/20261028152748_restrict_authenticated_tracking_rpc.sql",
  "supabase/migrations/20261028154054_harden_tracking_rpc_with_rls.sql",
  "supabase/migrations/20261028154603_official_portal_registry.sql",
  "supabase/migrations/20261028154926_admin_read_inactive_sources.sql",
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
for (const file of ["index.html", "admin.html"]) {
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
assert.match(publicHtml, /privacy\.html/);
for (const host of ["my.gov.uz", "gov.uz", "lex.uz", "murojaat.gov.uz", "openbudget.uz", "data.egov.uz"]) {
  assert.ok(publicHtml.includes(host), `Official portal missing from public directory: ${host}`);
}
console.log("✓ public forms, official portal directory, guided service finder, readiness scoring, and privacy notice are present");

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
console.log("✓ daily official portal availability monitor is present");
assert.match(deployWorkflow, /VERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
assert.match(deployWorkflow, /VERCEL_ORG_ID:\s*\$\{\{ vars\.VERCEL_ORG_ID \}\}/);
assert.match(deployWorkflow, /VERCEL_PROJECT_ID:\s*\$\{\{ vars\.VERCEL_PROJECT_ID \}\}/);
assert.match(deployWorkflow, /vercel build --prod/);
assert.match(deployWorkflow, /vercel deploy --prebuilt --prod/);
assert.match(deployWorkflow, /smoke-test/i);
console.log("✓ optional Vercel CLI deployment uses protected GitHub secret/vars and runs smoke tests");

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

console.log("\nYoshlar-Ishi checks passed.");
