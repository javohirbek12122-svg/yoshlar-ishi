const CACHE_NAME = "yi-pwa-v2";
const PRECACHE_URLS = [
  "/index.html",
  "/offline.html",
  "/imkoniyatlar.html",
  "/davlat-xizmatlari.html",
  "/startap-yoli.html",
  "/laboratoriya.html",
  "/physics-lab/index.html",
  "/privacy.html",
  "/site.css",
  "/shared-theme.css",
  "/design-system.css",
  "/mobile-guard.css",
  "/state-service-assistant.css",
  "/state-service-assistant.js",
  "/config.js",
  "/pwa.js",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png"
];
const PRIVATE_PATHS = new Set(["/admin.html", "/kabinet.html"]);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("yi-pwa-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cachePublicResponse(request, response) {
  if (!response || !response.ok || response.type !== "basic") return;
  const cacheControl = (response.headers.get("Cache-Control") || "").toLowerCase();
  if (cacheControl.includes("no-store") || cacheControl.includes("private")) return;
  await (await caches.open(CACHE_NAME)).put(request, response.clone());
}

async function networkFirstNavigation(request, url) {
  if (PRIVATE_PATHS.has(url.pathname) || url.search) {
    try { return await fetch(request); }
    catch { return (await caches.match("/offline.html")) || new Response("Internet aloqasi yo‘q.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }); }
  }
  try {
    const response = await fetch(request);
    await cachePublicResponse(new Request(url.origin + url.pathname), response);
    return response;
  } catch {
    return (await caches.match(url.pathname === "/" ? "/index.html" : url.pathname))
      || (await caches.match("/offline.html"))
      || new Response("Internet aloqasi yo‘q.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function staticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request).then((response) => cachePublicResponse(request, response)).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    await cachePublicResponse(request, response);
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request, url));
    return;
  }
  if (url.search) return;
  if (request.destination === "script" || request.destination === "style" ||
      request.destination === "image" || request.destination === "font" ||
      url.pathname === "/manifest.webmanifest") {
    event.respondWith(staticAsset(request));
  }
});
