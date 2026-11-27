import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const home = read("index.html");
const homeJs = read("homepage-experience.js");
const css = read("turnir-integratsiya.css");
const turnir = read("turnir.js");
const turnirPage = read("turnir.html");
const sw = read("service-worker.js");

assert.match(home, /<section class="wrap hero yi-turnir-hero"/, "Tournament hero exists");
assert.match(home, /class="yi-turnir-hero-logo" href="\.\/turnir\.html"/, "Tournament logo opens the tournament page");
assert.match(home, /class="art yi-turnir-hero-art"/, "Tournament demo artwork exists in the hero");
assert.match(home, /yi-turnir-demo-row/g, "Four-team demo table is present");
assert.ok(homeJs.includes('const isTurnirHero=hero&&hero.classList.contains("yi-turnir-hero");'), "Shared hero code detects the custom tournament hero");
assert.ok(homeJs.includes("if(!isTurnirHero){createHeroPreview(art);setupHeroExperience(art);}"), "Shared banner replacement is skipped for the tournament hero");
assert.ok(homeJs.includes("else if(art&&!isTurnirHero)"), "Fallback also preserves the tournament artwork");
assert.ok(css.includes(".yi-turnir-hero .hero-storyline{grid-column:1/-1;"), "Hero ribbon spans the full grid");
assert.ok(css.includes("@media(max-width:900px)"), "Hero has a tablet breakpoint");
assert.ok(css.includes("@media(max-width:600px)"), "Hero has a mobile breakpoint");

assert.ok(css.includes('body main > .hero.wrap.yi-turnir-hero'), "Tournament hero styles outrank conflicting legacy homepage rules");
assert.ok(css.includes('grid-template-areas:"copy art" "ribbon ribbon"'), "Desktop hero uses explicit copy, artwork and ribbon grid areas");
assert.ok(css.includes("grid-template-columns:repeat(4,minmax(0,1fr))"), "Four hero navigation links use all four desktop columns");
assert.ok(css.includes('grid-template-areas:"copy" "art" "ribbon"'), "Tablet layout explicitly stacks copy, artwork and ribbon");
assert.ok(css.includes("@media(max-width:1080px)"), "Tablet layout activates before legacy 1080px homepage breakpoint");
assert.ok(css.includes("@media(max-width:720px){"), "Mobile controls also cover the 601–720px range");
assert.ok(css.includes("padding:88px 18px 23px"), "Mobile hero keeps clearance below the compact sticky navigation");
assert.ok(css.includes("padding:104px clamp(24px,4vw,40px) 28px"), "Tablet hero keeps clearance below the sticky navigation");
assert.ok(css.includes("padding:108px clamp(26px,4vw,54px) 28px"), "Desktop hero respects the sticky navigation clearance");
assert.ok(css.includes("grid-column:auto;"), "Mobile hero keeps both primary actions in their own grid cells");
assert.ok(css.includes("grid-template-columns:1fr;"), "Mobile hero facts remain readable in a single column");
assert.ok(!turnir.includes("import.meta.env"), "Static browser module does not use Vite-only import.meta.env");
assert.ok(turnirPage.includes('<script src="./pwa.js" defer></script>'), "Tournament page registers shared PWA behavior");
assert.ok(sw.includes('const CACHE_NAME = "yi-pwa-v39";'), "PWA cache is versioned");
for (const asset of ["/index.html","/homepage-experience.js","/turnir.html","/turnir.js","/turnir.css","/turnir-integratsiya.css","/turnir-scoring.mjs","/turnir-logo.svg","/pwa.js"]) assert.ok(sw.includes(JSON.stringify(asset)), "PWA precache includes " + asset);
console.log("TURNIR HERO + SITE REGRESSION CHECK: PASS");
