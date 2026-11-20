import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const pages={"index.html":22,"imkoniyatlar.html":7,"startap-yoli.html":6,"davlat-xizmatlari.html":10,"assessment.html":6,"laboratoriya.html":8,"hamjamiyat.html":7,"kabinet.html":4,"privacy.html":7,"physics-lab/index.html":3};
const js=fs.readFileSync("uz-flag-3d.js","utf8"),css=fs.readFileSync("uz-flag-3d.css","utf8");
new vm.Script(js,{filename:"uz-flag-3d.js"});
const match=js.match(/const quotas=(\{[^;]+\});/);
assert.ok(match,"flag distribution map is present");
assert.deepEqual(JSON.parse(match[1]),pages);
assert.equal(Object.values(pages).reduce((a,b)=>a+b,0),80);
for(const page of Object.keys(pages)){
 const html=fs.readFileSync(page,"utf8"),prefix=page.startsWith("physics-lab/")?"../":"./";
 assert.ok(html.includes('href="'+prefix+'uz-flag-3d.css"'),page+" loads the 3D flag styles");
 assert.ok(html.includes('src="'+prefix+'uz-flag-3d.js"'),page+" loads the 3D flag controller");
}
for(const motion of ["yiFlagWave","yiFlagSail","yiFlagRipple","yiFlagGlide","yiFlagFlutter"])assert.ok(css.includes("@keyframes "+motion),"missing distinct flag animation: "+motion);
assert.ok(css.includes("prefers-reduced-motion"));
assert.ok(js.includes("IntersectionObserver"),"off-screen flags should pause animation");
assert.ok(js.includes("physics-lab/index.html"),"nested physics lab route must be recognized");
console.log("✓ 80 compact 3D Uzbekistan flag placements across ten public pages, with five motion patterns");
