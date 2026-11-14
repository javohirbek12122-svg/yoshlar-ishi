import fs from "node:fs";
import assert from "node:assert/strict";

const read = (file) => fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
const exists = (file) => fs.existsSync(new URL("../" + file, import.meta.url));
const manifest = JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.id, "/");
assert.equal(manifest.scope, "/");
assert.equal(manifest.start_url, "/index.html");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.prefer_related_applications, false);
assert.ok(manifest.name && manifest.short_name && manifest.lang);
for (const size of ["192x192", "512x512"]) {
  assert.ok(manifest.icons.some((icon) => icon.sizes === size && icon.type === "image/png"),
    "PWA manifest needs a PNG icon at " + size);
}
for (const file of ["icon-192.png", "icon-512.png", "apple-touch-icon.png"]) {
  assert.ok(exists(file), "Missing PWA raster icon: " + file);
  const data = fs.readFileSync(new URL("../" + file, import.meta.url));
  assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], file + " is not a PNG");
  assert.ok(data.length > 500, file + " is unexpectedly small");
}
const sizeOf = (file) => {
  const data = fs.readFileSync(new URL("../" + file, import.meta.url));
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};
assert.deepEqual(sizeOf("icon-192.png"), [192, 192]);
assert.deepEqual(sizeOf("icon-512.png"), [512, 512]);
assert.deepEqual(sizeOf("apple-touch-icon.png"), [180, 180]);

const publicPages = [
  "index.html", "imkoniyatlar.html", "davlat-xizmatlari.html", "kabinet.html",
  "startap-yoli.html", "laboratoriya.html", "physics-lab/index.html", "privacy.html"
];
for (const page of publicPages) {
  const html = read(page);
  assert.match(html, /manifest\.webmanifest/, page + " must reference the public app manifest");
  assert.match(html, /apple-touch-icon\.png/, page + " must expose the iOS home-screen icon");
  assert.match(html, /pwa\.js/, page + " must load install guidance and service-worker registration");
  assert.match(html, /viewport-fit=cover/, page + " must support safe-area insets");
}
const admin = read("admin.html");
assert.doesNotMatch(admin, /<script[^>]+pwa\.js/i, "Admin panel must not show the public app-install banner");
assert.match(admin, /admin-manifest\.webmanifest/, "Admin manifest remains separate");

const pwa = read("pwa.js");
for (const marker of [
  "beforeinstallprompt", "appinstalled", "serviceWorker.register",
  "isIOS", "isAndroid", "Safari", "Add to Home Screen", "Open as Web App",
  "Internet aloqasi yo‘q"
]) assert.ok(pwa.includes(marker), "PWA install UX marker missing: " + marker);

const worker = read("service-worker.js");
assert.match(worker, /request\.method !== "GET"/);
assert.match(worker, /url\.origin !== self\.location\.origin/);
assert.match(worker, /request\.mode === "navigate"/);
assert.match(worker, /networkFirstNavigation/);
const precache = worker.match(/const PRECACHE_URLS = \[([\s\S]*?)\];/)?.[1] || "";
assert.ok(precache.includes("/offline.html"), "PWA must precache its custom offline screen");
assert.ok(precache.includes("/index.html"), "PWA must precache its home page");
assert.ok(!precache.includes("/admin.html"), "Admin page must never be precached");
assert.ok(!precache.includes("/kabinet.html"), "Personal cabinet must never be precached");
assert.match(worker, /PRIVATE_PATHS = new Set\(\["\/admin\.html", "\/kabinet\.html"\]\)/);
assert.match(worker, /url\.search/);
assert.match(worker, /Cache-Control/);

const offline = read("offline.html");
assert.match(offline, /noindex,nofollow/);
assert.match(offline, /Internet aloqasi yo‘q/);
assert.match(offline, /Shaxsiy kabinet, admin paneli/);

const vercel = JSON.parse(read("vercel.json"));
const headers = vercel.headers || [];
const rules = new Map(headers.map((rule) => [rule.source, new Map((rule.headers || []).map((header) => [header.key.toLowerCase(), header.value]))]));
const common = rules.get("/(.*)");
assert.equal(common?.get("x-content-type-options"), "nosniff");
assert.equal(common?.get("referrer-policy"), "strict-origin-when-cross-origin");
assert.equal(common?.get("x-frame-options"), "DENY");
assert.equal(rules.get("/admin.html")?.get("cache-control"), "private, no-store, max-age=0, must-revalidate");
assert.equal(rules.get("/kabinet.html")?.get("cache-control"), "private, no-store, max-age=0, must-revalidate");
assert.equal(rules.get("/service-worker.js")?.get("cache-control"), "no-cache, no-store, must-revalidate");

console.log("✓ PWA manifest and 192/512/180px icons validated");
console.log("✓ Android/iOS install guidance and public-page wiring validated");
console.log("✓ offline shell caches public pages only; admin and personal cabinet are excluded");
console.log("✓ Vercel security and sensitive-page cache headers validated");
