
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
assert.match(js, /parentDetails\.open\s*=\s*true/);
assert.match(js, /createHeroPreview/);
assert.match(css, /\.yi-home-accordion/);
assert.match(css, /@media\(max-width:760px\)/);
assert.doesNotMatch(css, /overflow-x:\s*clip/i);
assert.ok(worker.includes('"/homepage-experience.css"'));
assert.ok(worker.includes('"/homepage-experience.js"'));
console.log("✓ homepage modular panels, preserved interactive modules, page shortcuts, JavaScript syntax, and responsive styles");
