import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const pages={"index.html":12,"imkoniyatlar.html":4,"startap-yoli.html":3,"davlat-xizmatlari.html":3,"assessment.html":2,"laboratoriya.html":2,"hamjamiyat.html":2,"kabinet.html":2};
const js=fs.readFileSync("uz-flag-3d.js","utf8"),css=fs.readFileSync("uz-flag-3d.css","utf8");
new vm.Script(js,{filename:"uz-flag-3d.js"});
const match=js.match(/const quotas=(\{[^;]+\});/);
assert.ok(match,"flag distribution map is present");
assert.deepEqual(JSON.parse(match[1]),pages);
assert.equal(Object.values(pages).reduce((a,b)=>a+b,0),30);
for(const page of Object.keys(pages)){
 const html=fs.readFileSync(page,"utf8");
 assert.ok(html.includes('href="./uz-flag-3d.css"'),page+" loads the 3D flag styles");
 assert.ok(html.includes('src="./uz-flag-3d.js"'),page+" loads the 3D flag controller");
}
assert.ok(css.includes("@keyframes yiFlagWave"));
assert.ok(css.includes("prefers-reduced-motion"));
assert.ok(js.includes("IntersectionObserver"),"off-screen flags should pause animation");
console.log("✓ 30 compact 3D Uzbekistan flag placements across eight public pages");
