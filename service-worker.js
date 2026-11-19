const CACHE_NAME = "yi-pwa-v28";
const PRECACHE_URLS = [
  "/index.html",
  "/hamjamiyat.css",
  "/hamjamiyat.js",
  "/auth-client.js",
  "/auth-bridge.js",
  "/biletlar.html",
  "/assessment.html",
  "/assessment.css",
  "/assessment-bank.js",
  "/assessment.js",
  "/biletlar.css",
  "/biletlar-app.js",
  "/biletlar-data.js",
  "/biletlar/001.html",
  "/biletlar/002.html",
  "/biletlar/003.html",
  "/biletlar/004.html",
  "/biletlar/005.html",
  "/biletlar/006.html",
  "/biletlar/007.html",
  "/biletlar/008.html",
  "/biletlar/009.html",
  "/biletlar/010.html",
  "/biletlar/011.html",
  "/biletlar/012.html",
  "/biletlar/013.html",
  "/biletlar/014.html",
  "/biletlar/015.html",
  "/biletlar/016.html",
  "/biletlar/017.html",
  "/biletlar/018.html",
  "/biletlar/019.html",
  "/biletlar/020.html",
  "/biletlar/021.html",
  "/biletlar/022.html",
  "/biletlar/023.html",
  "/biletlar/024.html",
  "/biletlar/025.html",
  "/biletlar/026.html",
  "/biletlar/027.html",
  "/biletlar/028.html",
  "/biletlar/029.html",
  "/biletlar/030.html",
  "/biletlar/031.html",
  "/biletlar/032.html",
  "/biletlar/033.html",
  "/biletlar/034.html",
  "/biletlar/035.html",
  "/biletlar/036.html",
  "/biletlar/037.html",
  "/biletlar/038.html",
  "/biletlar/039.html",
  "/biletlar/040.html",
  "/biletlar/041.html",
  "/biletlar/042.html",
  "/biletlar/043.html",
  "/biletlar/044.html",
  "/biletlar/045.html",
  "/biletlar/046.html",
  "/biletlar/047.html",
  "/biletlar/048.html",
  "/biletlar/049.html",
  "/biletlar/050.html",
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
  "/mobile-experience.css",
  "/mobile-experience.js",
  "/homepage-experience.css",
  "/platform-polish.css",
  "/reference-home.css",
  "/homepage-experience.js",
  "/opportunity-page-filters.js",
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
const PRIVATE_PATHS = new Set(["/admin.html", "/kabinet.html", "/hamjamiyat.html"]);
const CACHEABLE_EXTERNAL_IMAGE_ORIGINS = new Set(["https://images.unsplash.com", "https://uzchess.uz", "https://static.tildacdn.com", "https://uzreport.news", "https://res.cloudinary.com", "https://d2ol7oe51mr4n9.cloudfront.net"]);

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

// Cache only public images from the fixed external image-host allow-list. Opaque CORS responses are accepted
// because the host allow-list is fixed and no API/auth requests use this path.
async function cacheExternalImage(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response && (response.type === "opaque" || response.ok)) {
      try { await cache.put(request, response.clone()); } catch { /* keep the network response */ }
    }
    return response;
  });
  if (cached) {
    refresh.catch(() => {});
    return cached;
  }
  try { return await refresh; }
  catch { return new Response("", { status: 504, statusText: "Offline" }); }
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
  if (url.origin !== self.location.origin) {
    if (request.destination === "image" && CACHEABLE_EXTERNAL_IMAGE_ORIGINS.has(url.origin)) {
      event.respondWith(cacheExternalImage(request));
    }
    return;
  }
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
