import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const read = (file) => fs.readFileSync(file, "utf8");
const bankSource = read("assessment-bank.js");
const sandbox = { window: {} };
vm.runInNewContext(bankSource, sandbox, { timeout: 1500 });
const bank = sandbox.window.YI_ASSESSMENT_BANK;

assert.ok(bank && bank.version === "2026.11.17-v1");
assert.deepEqual(Object.keys(bank.tracks).sort(), ["humanities", "natural", "vocational"]);
assert.equal(bank.questions.length, 75);
assert.doesNotMatch(bankSource, /correctOption|answerKey|isCorrect/, "Public question bank must not expose answer keys");

for (const [track, config] of Object.entries(bank.tracks)) {
  const rows = bank.questions.filter((q) => q.track === track);
  assert.equal(rows.length, 25, track + " must contain 25 questions");
  assert.equal(config.subjects.length, 5, track + " must define five subjects");

  for (const subject of config.subjects) {
    assert.equal(rows.filter((q) => q.subject === subject).length, 5, track + " / " + subject + " must contain five questions");
  }

  for (const question of rows) {
    assert.ok(question.id && question.prompt && question.competency, question.id + " is missing metadata");
    assert.ok(["Tushunish", "Qo‘llash", "Tahlil"].includes(question.domain), question.id + " has an invalid cognitive domain");
    assert.equal(question.options.length, 4, question.id + " must have four options");
    assert.deepEqual(Array.from(question.options, (option) => option.key).sort(), ["A", "B", "C", "D"], question.id + " options must be unique A-D");
    assert.ok(question.options.every((option) => typeof option.text === "string" && option.text.length > 0));
  }
}

assert.equal(new Set(bank.questions.map((question) => question.id)).size, 75, "Question IDs must be unique");
const page = read("assessment.html");
for (const marker of ["yiAuthGate", "yiTrackGrid", "yiTestPanel", "yiQuestionNav", "yiResultPanel", "yiHistoryList", "SOON", "TEZ KUNDA", "assessment-bank.js", "assessment.js"]) {
  assert.ok(page.includes(marker), "Assessment page missing " + marker);
}

const app = read("assessment.js");
for (const marker of ["auth.getSession", "assessment_progress", "assessment_attempts", "submit_assessment_attempt", "p_track_id", "p_bank_version", "p_answers", "subjectResults", "sessionStorage", "assessment_daily_attempt_limit_reached"]) {
  assert.ok(app.includes(marker), "Assessment app missing " + marker);
}
assert.doesNotMatch(app, /p_user_id/, "Client must not pass a user identity to the scoring RPC");
execFileSync(process.execPath, ["--check", "--input-type=module"], { input: app, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

const migration = read("supabase/migrations/20261117190000_competency_assessment_engine.sql");
assert.match(migration, /security definer/i);
assert.ok(migration.includes("auth.uid()"), "Score RPC must derive the caller with auth.uid()");
assert.ok(migration.includes("revoke all on function public.submit_assessment_attempt(text,text,jsonb) from public,anon,authenticated"), "Score RPC must not be callable by PUBLIC, anon or authenticated by default");
assert.ok(migration.includes("grant execute on function public.submit_assessment_attempt(text,text,jsonb) to authenticated"), "Only signed-in users should receive score RPC execution rights");
assert.doesNotMatch(migration, /grant execute[^;]*\bto\s+(anon|public)\b/i);

const home = read("index.html");
assert.ok(home.includes('href="./assessment.html"') && home.includes("yi-assessment-announcement"), "Homepage needs a prominent assessment announcement");
const community = read("hamjamiyat.js");
assert.ok(community.includes('assessment_completed:"Bilim sinovi yakunlandi"'), "Member activity must include completed assessments");

const worker = read("service-worker.js");
for (const asset of ["/assessment.html", "/assessment.css", "/assessment-bank.js", "/assessment.js"]) {
  assert.ok(worker.includes('"' + asset + '"'), "PWA cache missing " + asset);
}

console.log("✓ 75 competency questions, 25 per track and five per subject validated");
console.log("✓ public question bank contains no answer keys; authenticated server-side scoring path validated");
console.log("✓ results/history, platform announcement, community activity and PWA assets validated");
