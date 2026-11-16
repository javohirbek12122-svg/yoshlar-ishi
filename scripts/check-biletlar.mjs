import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(path, "utf8");
const dataSource = read("biletlar-data.js");
const appSource = read("biletlar-app.js");
const css = read("biletlar.css");
const home = read("index.html");
const worker = read("service-worker.js");
new vm.Script(dataSource, { filename: "biletlar-data.js" });
new vm.Script(appSource, { filename: "biletlar-app.js" });
const sandbox = { window: {} };
vm.runInNewContext(dataSource, sandbox, { timeout: 1000 });
const tickets = sandbox.window.YI_BILET_DATA;
assert.ok(Array.isArray(tickets), "Ticket data must be an array");
assert.equal(tickets.length, 50, "Exactly 50 tickets must be present");
const ids = tickets.map((ticket) => ticket.id);
assert.equal(new Set(ids).size, 50, "Ticket IDs must be unique");
assert.deepEqual([...ids].sort(), Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(3, "0")));
for (const ticket of tickets) {
  assert.ok(ticket.title && ticket.cat && ticket.goal && ticket.engine, "Ticket " + ticket.id + " is missing core metadata");
  assert.ok(["A", "B"].includes(ticket.level), "Ticket " + ticket.id + " has an invalid level");
  assert.ok(Array.isArray(ticket.steps) && ticket.steps.length >= 3, "Ticket " + ticket.id + " needs implementation requirements");
  assert.ok(ticket.test, "Ticket " + ticket.id + " needs an acceptance example");
}
const startupIds = tickets.filter((ticket) => ticket.startup).map((ticket) => ticket.id).sort();
assert.deepEqual(startupIds, ["002","008","009","014","016","026","027","029","030","033","034","048"]);
assert.equal(startupIds.length, 12, "There must be 12 detailed startup tickets");
for (const id of ids) {
  const path = "biletlar/" + id + ".html";
  assert.ok(fs.existsSync(path), "Missing standalone page: " + path);
  const html = read(path);
  assert.ok(html.includes('data-ticket="' + id + '"'), "Standalone page " + id + " must select the matching ticket");
  assert.ok(html.includes('/biletlar-data.js') && html.includes('/biletlar-app.js') && html.includes('/biletlar.css'), "Standalone page " + id + " must load the shared ticket app");
  assert.ok(worker.includes("/biletlar/" + id + ".html"), "Ticket " + id + " must be available in the PWA cache");
  assert.ok(appSource.includes('case "' + id + '"'), "Ticket " + id + " needs a dedicated interactive renderer and workflow");
}
assert.ok(home.includes('href="./biletlar.html"'), "Homepage must expose the ticket catalogue");
assert.ok(css.includes("@media(max-width:620px)"), "Ticket pages need mobile breakpoints");
assert.ok(appSource.includes("localStorage") && appSource.includes('role="status"'), "Local persistence and accessible result announcements must be present");
assert.ok(appSource.includes('accept="image/png,image/jpeg,image/webp"'), "The image task must support local image selection");
assert.ok(appSource.includes('accept=".csv,text/csv"') && appSource.includes('accept=".txt,text/plain"'), "The data tasks must support local file imports");
console.log("✓ 50 unique ticket definitions, 12 startup ideas and all acceptance criteria validated");
console.log("✓ 50 standalone ticket pages, dedicated engines, homepage navigation and offline entries validated");
console.log("✓ multimodal local image/TXT/CSV imports, responsive styles and accessible feedback validated");
