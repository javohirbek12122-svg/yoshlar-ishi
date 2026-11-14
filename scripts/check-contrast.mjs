import fs from "node:fs";
import assert from "node:assert/strict";

const css = fs.readFileSync(new URL("../design-system.css", import.meta.url), "utf8");

function token(name) {
  const match = css.match(new RegExp("--" + name + ":(#[0-9a-f]{6})!important", "i"));
  assert.ok(match, "Missing design token: " + name);
  return match[1].toLowerCase();
}
function luminance(hex) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function checkText(name, foreground, backgrounds, minimum = 4.5) {
  for (const background of backgrounds) {
    const ratio = contrast(foreground, background);
    assert.ok(
      ratio >= minimum,
      name + " contrast " + ratio.toFixed(2) + ":1 is below " + minimum + ":1 on " + background
    );
  }
}
const white = "#ffffff";
const paper = "#f5f8fb";
const blueSoft = "#eaf3fb";
const greenSoft = "#e8f5ef";
const goldSoft = "#fff5e5";
const lightSurfaces = [white, paper, blueSoft, greenSoft, goldSoft];

const muted = token("muted");
const gold = token("gold");
const focus = (css.match(/--yi-focus:(#[0-9a-f]{6})/i) || [])[1]?.toLowerCase();
assert.ok(focus, "Missing keyboard focus token");

checkText("Muted helper text", muted, lightSurfaces);
checkText("Placeholder text", muted, [white, paper]);
checkText("Empty-state text", muted, [white, paper]);
checkText("Amber/warning text", gold, [goldSoft, white, paper]);

for (const selector of [
  /input::placeholder,textarea::placeholder\{color:var\(--muted\)!important;opacity:1\}/,
  /\.state-assist \.sa-head p\{color:var\(--muted\)!important/,
  /\.sa-proof small\{color:var\(--muted\)!important\}/,
  /\.sa-panel-head p,\.sa-fine,\.sa-muted,\.sa-status\{color:var\(--muted\)!important\}/,
  /\.empty,\.community-empty,\.showcase-empty\{[^}]*color:var\(--muted\)!important\}/,
]) {
  assert.match(css, selector, "A secondary text component bypasses the accessible muted token");
}
assert.ok(contrast(focus, white) >= 3, "Keyboard focus indicator must reach 3:1 against white");
assert.ok(contrast(focus, paper) >= 3, "Keyboard focus indicator must reach 3:1 against the page surface");

console.log("✓ design text colors meet WCAG AA 4.5:1 on intended light surfaces");
console.log("✓ keyboard focus indicator meets the 3:1 non-text contrast target");
