import fs from "node:fs";
import assert from "node:assert/strict";
const read = (file) => fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
const files = [
  "government-pilot/README.md",
  "government-pilot/01_CONCEPT_NOTE_UZ.md",
  "government-pilot/02_COMPLIANCE_MATRIX_UZ.md",
  "government-pilot/03_ARCHITECTURE_AND_DATA_UZ.md",
  "government-pilot/04_SECURITY_GAP_REGISTER_UZ.md",
  "government-pilot/05_PILOT_PLAN_UZ.md",
  "government-pilot/06_GOVERNANCE_AND_OPERATIONS_UZ.md"
];
const dossier = files.map((file) => read(file)).join("\n").toLowerCase();
for (const term of ["ap-south-1", "uzinfocom", "oneid", "o‘rq-395", "o‘rq-547", "o‘rq-764", "o‘rq-684", "90 kun", "no-production", "pentest", "groq"]) {
  assert.ok(dossier.includes(term), "Government readiness dossier is missing: " + term);
}
for (const phrase of ["davlat tomonidan tasdiqlangan", "rasmiy davlat platformasi hisoblanadi", "oneid integratsiyasi mavjud", "davlat bazasiga ulangan"]) {
  assert.ok(!dossier.includes(phrase), "Do not claim unverified official status: " + phrase);
}
const privacy = read("privacy.html");
assert.ok(privacy.includes("davlat pilotiga tasdiqlanmagan"));
assert.ok(privacy.includes("ap-south-1"));
assert.ok(privacy.includes("Groq API"));
const homepage = read("index.html");
assert.ok(homepage.includes("Pasport, JSHSHIR"));
assert.ok(homepage.includes("davlat organiga rasmiy ariza yubormaydi"));
console.log("✓ government pilot dossier, legal guardrails, data disclosure and official-status safeguards passed");
