import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const configSource = fs.readFileSync(path.join(root, "config.js"), "utf8");
const context = { window: {} };
new vm.Script(configSource, { filename: "config.js" }).runInNewContext(context);
const config = context.window.YI_CONFIG;

if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
  throw new Error("Public Supabase URL/key are missing from config.js.");
}

const supabaseBase = String(config.supabaseUrl).replace(/\/+$/, "");
const apiUrl = new URL(supabaseBase + "/rest/v1/official_portal_integrations");
apiUrl.search = new URLSearchParams({
  select: "slug,name,portal_url,source_url,hero_image_url,verified_on,category",
  active: "eq.true",
  order: "sort_order.asc,name.asc",
  limit: "500",
}).toString();

const mediaExamples = [
  {
    name: "my.gov.uz screenshot",
    url: "https://dgov.uz/media/solutions/photos/Screenshot_2.png",
    type: "gallery-image",
  },
  {
    name: "Open Budget screenshot",
    url: "https://dgov.uz/media/solutions/photos/Open_budget_sayt.PNG",
    type: "gallery-image",
  },
  {
    name: "ARGOS vacancy portal image",
    url: "https://api-portal.gov.uz/uploads/237/2026/06/12/5a42aef3-3f47-2165-96ca-fbcddb069583_pages_113709.jpg",
    type: "gallery-image",
  },
  {
    name: "Gov.uz / UZINFOCOM image",
    url: "https://uzinfocom.uz/media/photo_widget1.jpg",
    type: "gallery-image",
  },
  {
    name: "Murojaat.gov.uz screenshot",
    url: "https://dgov.uz/media/solutions/photos/mgo_zeoC3R0.png",
    type: "gallery-image",
  },
];

const MAX_CONCURRENCY = 6;
const TIMEOUT_MS = 12000;
const requestHeaders = {
  "User-Agent": "Yoshlar-Ishi-Official-Portal-Monitor/1.0 (+https://github.com/javohirbek12122-svg/yoshlar-ishi)",
  "Accept": "text/html,application/xhtml+xml,image/avif,image/webp,*/*;q=0.8",
};

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

async function readPortalRegistry() {
  const response = await fetch(apiUrl, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: "Bearer " + config.supabaseAnonKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error("Supabase public portal registry returned HTTP " + response.status);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Portal registry did not return a JSON array.");
  return rows;
}

function buildTargets(rows) {
  const targets = new Map();
  function add(rawUrl, name, type) {
    const url = safeUrl(rawUrl);
    if (!url) return;
    const current = targets.get(url) || { url, names: new Set(), types: new Set() };
    current.names.add(String(name || "Official portal"));
    current.types.add(type);
    targets.set(url, current);
  }

  for (const row of rows) {
    add(row.portal_url, row.name, "portal");
    if (row.source_url) add(row.source_url, row.name + " (source)", "source");
    if (row.hero_image_url) add(row.hero_image_url, row.name + " (card image)", "catalogue-image");
  }
  for (const image of mediaExamples) add(image.url, image.name, image.type);
  return [...targets.values()].map((item) => ({
    ...item,
    names: [...item.names].sort((a, b) => a.localeCompare(b, "uz")),
    types: [...item.types].sort(),
  }));
}

async function fetchStatus(url, method) {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    headers: method === "GET" ? { ...requestHeaders, Range: "bytes=0-0" } : requestHeaders,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const result = { status: response.status, finalUrl: response.url || url };
  try {
    await response.body?.cancel();
  } catch {
    // A cancellation failure must not change the recorded HTTP status.
  }
  return result;
}

async function probe(target) {
  const started = Date.now();
  let head;
  try {
    head = await fetchStatus(target.url, "HEAD");
    let status = head.status;
    let finalUrl = head.finalUrl;
    let method = "HEAD";

    // Some legitimate portals or CDNs reject HEAD; retry with a one-byte GET.
    if ([403, 404, 405, 410, 501].includes(status)) {
      try {
        const get = await fetchStatus(target.url, "GET");
        status = get.status;
        finalUrl = get.finalUrl || finalUrl;
        method = "GET";
      } catch {
        // Keep the HEAD response if GET is blocked or times out.
      }
    }

    let state = "review";
    if (status >= 200 && status < 400) state = "reachable";
    else if ([401, 403, 429].includes(status)) state = "blocked-or-rate-limited";
    else if ([404, 410].includes(status)) state = "possible-broken-link";
    else if (status >= 500 && status <= 599) state = "server-error";
    else if (status === 0) state = "no-response";

    return {
      ...target,
      status,
      finalUrl,
      method,
      state,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ...target,
      status: null,
      finalUrl: target.url,
      method: "HEAD",
      state: "no-response",
      latencyMs: Date.now() - started,
      error: error?.name === "TimeoutError" ? "timeout" : "network error",
    };
  }
}

async function mapLimit(items, limit, fn) {
  const output = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return output;
}

function tableCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}

const rows = await readPortalRegistry();
const targets = buildTargets(rows);
const results = await mapLimit(targets, MAX_CONCURRENCY, probe);
const counts = {
  reachable: results.filter((x) => x.state === "reachable").length,
  blocked: results.filter((x) => x.state === "blocked-or-rate-limited").length,
  broken: results.filter((x) => x.state === "possible-broken-link").length,
  serverError: results.filter((x) => x.state === "server-error").length,
  noResponse: results.filter((x) => x.state === "no-response").length,
  other: results.filter((x) => !["reachable", "blocked-or-rate-limited", "possible-broken-link", "server-error", "no-response"].includes(x.state)).length,
};

console.log(
  "Portal link audit: " + targets.length + " distinct HTTPS targets across " +
  rows.length + " active catalogue rows; " +
  counts.reachable + " reachable, " + counts.blocked + " bot/rate-limit responses, " +
  counts.broken + " possible broken links, " + counts.serverError + " server errors, " +
  counts.noResponse + " no responses."
);

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  const summary = [
    "## Official portal link and media audit",
    "",
    "- Active catalogue rows: **" + rows.length + "**",
    "- Distinct HTTPS targets checked (portal, source, catalogue images, gallery images): **" + targets.length + "**",
    "- Reachable: **" + counts.reachable + "**",
    "- Bot/rate-limit responses (manual check needed): **" + counts.blocked + "**",
    "- Possible broken links (404/410): **" + counts.broken + "**",
    "- Server errors: **" + counts.serverError + "**",
    "- No response / timeout: **" + counts.noResponse + "**",
    "",
    "A 403, 429, timeout, or 5xx response is not proof the source is permanently unavailable. The monitor uses a small HEAD request and a one-byte GET fallback, then flags uncertain outcomes for manual review.",
    "",
    "| Target | Type | Catalogue entries | HTTP | Result | Method | Time |",
    "|---|---|---|---:|---|---|---:|",
    ...results.map((x) =>
      "| " + tableCell(x.url) +
      " | " + tableCell(x.types.join(", ")) +
      " | " + tableCell(x.names.join("; ")) +
      " | " + tableCell(x.status ?? "—") +
      " | " + tableCell(x.state) +
      " | " + tableCell(x.method) +
      " | " + tableCell(x.latencyMs + " ms") + " |"
    ),
  ].join("\n") + "\n";
  fs.appendFileSync(summaryPath, summary, "utf8");
}

for (const item of results.filter((x) => x.state === "possible-broken-link")) {
  console.warn("::warning title=Possible broken official portal link::HTTP " + item.status + " — " + item.url + " — " + item.names.join(", "));
}
for (const item of results.filter((x) => x.state === "no-response" || x.state === "server-error" || x.state === "blocked-or-rate-limited")) {
  console.warn("::warning title=Official portal requires manual verification::" + item.state + " — " + item.url + " — " + item.names.join(", "));
}

// This is a monitoring report, not a deploy gate. Links with uncertain statuses are surfaced
// as warnings and in the summary instead of automatically blocking the public website.
