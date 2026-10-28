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
console.log("✓ public forms + constrained tracking RPC are present");

const admin = read("admin.html");
for (const feature of [
  'id="loginForm"',
  'admin_allowlist',
  'id="page-initiatives"',
  'id="page-partners"',
  'id="page-sources"',
  'id="page-activity"',
  'setInterval(()=>{if(token)Promise.all([loadData(),loadStats()])},60000)',
  'id="exportBtn"',
]) {
  assert.ok(admin.includes(feature), `Admin feature missing: ${feature}`);
}
console.log("✓ admin login, allowlist checks, review pages, auto-refresh and CSV export are present");

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
assert.ok(migrationFiles.length >= 5, "Migration history files are incomplete");
const dashboardMigration = read("supabase/migrations/20261028152132_owner_dashboard_and_secure_tracking.sql");
assert.match(dashboardMigration, /alter table public\.admin_allowlist enable row level security/i);
assert.match(dashboardMigration, /security definer[\s\S]*track_initiative|track_initiative[\s\S]*security definer/i);
assert.match(dashboardMigration, /admin_activity_log/);
console.log(`✓ database migrations: ${migrationFiles.length} file(s); admin RLS and audit trail checked`);

console.log("\nYoshlar-Ishi checks passed.");
