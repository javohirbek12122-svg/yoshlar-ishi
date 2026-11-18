
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const read = (file) => fs.readFileSync(file, "utf8");
const html = read("index.html");
const js = read("homepage-experience.js");
const css = read("homepage-experience.css");
const refcss = read("reference-home.css");
const polish = read("platform-polish.css");
const worker = read("service-worker.js");
const staticMarkup = html.split(/<script\b/i)[0];
assert.equal((staticMarkup.match(/id="ai-yordamchi"/g) || []).length, 1, "The homepage must define one static AI anchor target");
assert.ok(html.includes('details.id="ai-yordamchi"'), "The inline homepage controller must retain the AI accordion anchor");
assert.ok(html.includes('aiCard.removeAttribute("id")'), "The original AI card ID must be removed when moved");
assert.ok(html.includes('href="./homepage-experience.css"'), "Homepage must load the modular homepage stylesheet");
assert.ok(html.includes('src="./homepage-experience.js"'), "Homepage must load the modular homepage controller");
new vm.Script(js, { filename: "homepage-experience.js" });
execFileSync(process.execPath, ["--check", "homepage-experience.js"], { stdio: "pipe" });
for (const id of ["afzalliklar","jarayon","rasmiy-xizmatlar","imkoniyatlar","imkoniyatlar-yakun","jamoadoshlar","top-tashabbuslar","tashabbus","hamkorlik","initiativeForm","trackForm","partnerForm","teamPostForm","aiIdeaForm","showcaseBoard","opportunityGrid","sourceSearch"]) {
  assert.ok(html.includes('id="' + id + '"'), "Existing homepage feature was removed: " + id);
}
for (const page of ["./startap-yoli.html","./laboratoriya.html","./kabinet.html","./assessment.html"]) {
  assert.ok(js.includes(page), "Homepage quick navigation is missing " + page);
}
assert.match(js, /NESTED_GROUPS/);
assert.match(js, /addEventListener\("click"/);
assert.match(js, /fold\.open\s*=\s*true/);
assert.match(js, /createHeroPreview/);
assert.match(js, /required\.slice\(3\)\.every/);
assert.ok(js.indexOf('sectionParent.insertBefore(launcher,overview);') < js.indexOf('const first=createAccordion'), "New homepage containers must be inserted before their source sections are moved");
assert.ok(js.indexOf('sectionParent.insertBefore(stack,overview);') < js.indexOf('const first=createAccordion'), "Accordion stack must exist before createAccordion moves source sections");

assert.match(css, /\.yi-home-accordion/);
assert.match(css, /@media\(max-width:760px\)/);
assert.doesNotMatch(css, /overflow-x:\s*clip/i);
assert.ok(worker.includes('"/homepage-experience.css"'));
assert.ok(worker.includes('"/homepage-experience.js"'));

assert.ok(html.includes('class="yi-site-directory wrap"') && html.includes('id="site-pages"'), "A structured page directory must be present beneath the homepage");
for (const route of ["./imkoniyatlar.html","./davlat-xizmatlari.html","./startap-yoli.html","./laboratoriya.html","./kabinet.html","./privacy.html"]) {
  assert.ok(html.includes('href="' + route + '"'), "The page directory is missing " + route);
}
assert.match(js, /yi-hero-banner/);
assert.match(js, /function setupHeroExperience\(art\)/);
assert.match(js, /aria-modal=\"true\"/);
assert.match(js, /Escape/);
assert.match(js, /pointermove/);
assert.match(js, /prefers-reduced-motion/);
assert.match(refcss, /\.yi-hero-banner[\s\S]*?object-fit:\s*contain/);
assert.match(refcss, /\.yi-hero-casing[\s\S]*?preserve-3d/);
assert.match(refcss, /\.yi-hero-modal[\s\S]*?position:fixed/);
assert.match(refcss, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(refcss, /aspect-ratio:\s*16\/9/);
assert.match(css, /\.yi-directory-groups/);

assert.ok(html.includes('href="https://gov.uz/oz/yoshlar" target="_blank" rel="noopener noreferrer"'), "Agency logo must open the official agency site safely");
assert.ok(html.includes('href="https://www.ustoz.ai/uz" target="_blank" rel="noopener noreferrer"'), "Ustoz AI logo must open its official site safely");
assert.ok(html.includes('https://uzchess.uz/images/partners/6/photo6fe378ad750c9351681f39aca9de5c32.png') && html.includes('https://uzreport.news/fotobank/image/2cbf2330eea2f444c4bf454a6b8f69e6.jpeg'), "Verified agency and Ustoz AI logo assets must be present");
assert.ok(html.includes('href="./platform-polish.css"'), "Homepage must load the final shared design layer after the legacy styles");
assert.ok(html.includes('href="./reference-home.css"') && html.indexOf('href="./reference-home.css"') > html.indexOf('href="./platform-polish.css"'), "Reference homepage skin must load after existing styles");
assert.ok(html.includes('class="yi-agency-brand"') && html.includes('href="https://gov.uz/oz/yoshlar"'), "Agency logo must open the official agency website");
assert.ok(html.includes('class="yi-register-link"') && html.includes('href="./hamjamiyat.html?mode=register#hpAuthGate"'), "Registration must route to the existing OTP form");
assert.ok(html.includes('class="yi-hero-quote"') && html.includes('Imkoniyatlarni ko‘rish'), "Reference hero and primary CTA must exist");
assert.ok(worker.includes('"/reference-home.css"'), "PWA must precache the new homepage skin");

assert.match(polish, /yi-official-logo[\s\S]*?object-fit:contain/);
assert.match(polish, /body \.yi-platform-proof\s*\{[\s\S]*?margin:18px auto 0/);
assert.match(polish, /body \.yi-nav\s*\{[\s\S]*?margin:12px auto 0/);
assert.ok(html.includes('class="yi-official-resources"') && html.includes('aria-label="Yoshlar uchun rasmiy platformalar"'), "Hero must present an accessible official resource strip");
assert.ok(html.includes('class="yi-official-card yi-official-agency"') && html.includes('class="yi-official-card yi-official-ustoz"'), "Official platform links must use the separated card layout");
assert.ok(html.includes("yi-drawer-brand-icon") && html.includes("yi-drawer-ustoz-icon"), "The side navigation must use the same official brand logos as the hero strip");
assert.ok(css.includes(".yi-official-resources") && css.includes("@media(max-width:680px)"), "Official resource strip must have mobile-specific styling");
assert.ok(html.includes("yi-nav"), "Reference-style navigation bar is present");
assert.ok(html.includes("yi-assessment-announcement") && html.includes("SOON · TEZ KUNDA") && html.includes("./assessment.html"), "Hero must prominently announce the new tests and upcoming partnership review");
assert.match(css, /\.yi-assessment-announcement\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/i, "Assessment announcement must span the full hero grid");
assert.ok(html.includes('id="yiSearchPanel"'), "Search panel is present");
assert.ok(html.includes('id="yiThemeToggle"'), "Theme toggle is present");
assert.ok(html.includes('id="yiDrawerToggle"') && html.includes('id="yiSideDrawer"') && html.includes('id="yiDrawerBackdrop"'), "Three-line navigation must provide a trigger, modal drawer and backdrop");
assert.ok(html.includes('role="dialog" aria-modal="true" aria-labelledby="yiDrawerTitle"'), "Side drawer must expose an accessible modal dialog");
assert.ok(js.includes("function setupDrawer()") && js.includes('setupSearch();setupTheme();setupDrawer();'), "Side drawer controller must initialize with homepage controls");
assert.ok(css.includes(".yi-side-drawer") && css.includes(".yi-drawer-backdrop"), "Side drawer needs responsive panel and backdrop styles");
assert.equal((html.match(/class="quickservice yi-quick-[^"]*yi-quick-card/g)||[]).length, 8, "Eight redesigned homepage quick-access cards are required");
assert.ok(html.includes('class="yi-quick-card-top"') && html.includes('class="yi-quick-card-bottom"'), "Quick-access cards must include the new icon and action hierarchy");
assert.ok(html.includes('class="yi-partner-tags"') && html.includes('id="partnerForm"'), "Partnership themes and the working partnership form must remain present");
assert.ok(js.includes("setupSearch") && js.includes("setupTheme") && js.includes("setupDrawer"), "Homepage search, theme and drawer controls remain initialized alongside the supplied static banner");


assert.ok(js.includes('class="yi-hero-banner"') && js.includes("https://d2ol7oe51mr4n9.cloudfront.net/user_3JM13LmKQo41EGZkNQHbTC0mG4m/f0a06878-17e7-4fdb-94e6-0437ce7f174c.jpg"), "Hero uses the original user-supplied banner without image generation or modification");
assert.equal(worker.includes('"/assets/yoshlar-people.webp"'), false, "Broken local image must not be precached");
assert.match(worker, /CACHE_NAME = "yi-pwa-v24"/);
assert.match(worker, /CACHEABLE_EXTERNAL_IMAGE_ORIGINS/);
assert.match(worker, /function cacheExternalImage\(request\)/);
assert.ok(worker.includes("https://d2ol7oe51mr4n9.cloudfront.net"), "The supplied hero image host must be cache-allowlisted for offline use");

console.log("✓ homepage modular panels, preserved interactive modules, page shortcuts, JavaScript syntax, and responsive styles");
