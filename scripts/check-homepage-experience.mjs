
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
const read = (file) => fs.readFileSync(file, "utf8");
const html = read("index.html");
const js = read("homepage-experience.js");
const css = read("homepage-experience.css");
const worker = read("service-worker.js");
assert.ok(html.includes('href="./homepage-experience.css"'), "Homepage must load the modular homepage stylesheet");
assert.ok(html.includes('src="./homepage-experience.js"'), "Homepage must load the modular homepage controller");
new vm.Script(js, { filename: "homepage-experience.js" });
execFileSync(process.execPath, ["--check", "homepage-experience.js"], { stdio: "pipe" });
for (const id of ["afzalliklar","jarayon","rasmiy-xizmatlar","imkoniyatlar","imkoniyatlar-yakun","jamoadoshlar","top-tashabbuslar","tashabbus","hamkorlik","initiativeForm","trackForm","partnerForm","teamPostForm","aiIdeaForm","showcaseBoard","opportunityGrid","sourceSearch"]) {
  assert.ok(html.includes('id="' + id + '"'), "Existing homepage feature was removed: " + id);
}
for (const page of ["./startap-yoli.html","./laboratoriya.html","./kabinet.html"]) {
  assert.ok(js.includes(page), "Homepage quick navigation is missing " + page);
}
assert.match(js, /NESTED_GROUPS/);
assert.match(js, /addEventListener\("click"/);
assert.match(js, /fold\.open\s*=\s*true/);
assert.match(js, /createHeroPreview/);
assert.match(js, /required\.slice\(3\)\.every/);
assert.ok(js.indexOf('sectionParent.insertBefore(launcher,overviewSection);') < js.indexOf('var overview=createAccordion'), "New homepage containers must be inserted before their source sections are moved");
assert.ok(js.indexOf('sectionParent.insertBefore(stack,overviewSection);') < js.indexOf('var overview=createAccordion'), "Accordion stack must exist before createAccordion moves source sections");

assert.match(css, /\.yi-home-accordion/);
assert.match(css, /@media\(max-width:760px\)/);
assert.doesNotMatch(css, /overflow-x:\s*clip/i);
assert.ok(worker.includes('"/homepage-experience.css"'));
assert.ok(worker.includes('"/homepage-experience.js"'));

assert.ok(html.includes('class="yi-site-directory wrap"') && html.includes('id="site-pages"'), "A structured page directory must be present beneath the homepage");
for (const route of ["./imkoniyatlar.html","./davlat-xizmatlari.html","./startap-yoli.html","./laboratoriya.html","./kabinet.html","./privacy.html"]) {
  assert.ok(html.includes('href="' + route + '"'), "The page directory is missing " + route);
}
assert.match(js, /yi-hero-scene/);
assert.match(js, /images\.unsplash\.com/);
assert.match(css, /images\.pexels\.com/);
assert.match(css, /perspective\(1300px\)/);
assert.match(css, /\.yi-directory-groups/);

assert.ok(html.includes('class="yi-nav"'), "Reference-style navigation bar is present");
assert.ok(html.includes('id="yiSearchPanel"'), "Search panel is present");
assert.ok(html.includes('id="yiThemeToggle"'), "Theme toggle is present");
assert.equal((html.match(/class="quickservice yi-quick-/g)||[]).length, 8, "Eight homepage quick-access cards are required");
assert.ok(js.includes("yi-ai-helper-card") && js.includes("setupSearch") && js.includes("setupTheme"));
assert.ok(js.includes("assets/yoshlar-people.webp"), "Hero uses the cropped reference youth image");
assert.ok(worker.includes('"/assets/yoshlar-people.webp"'));

console.log("✓ homepage modular panels, preserved interactive modules, page shortcuts, JavaScript syntax, and responsive styles");
