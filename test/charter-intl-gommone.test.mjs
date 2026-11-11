import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root));
}

function loadDemo(html) {
  const packJson = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = html.match(/<script id="sector-demo">([\s\S]*?)<\/script>/)[1];
  const elements = {};
  function makeEl(id) {
    return { id, textContent: id === "demo-pack" ? packJson : "", value: "", hidden: false, className: "", children: [], style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild(child) { this.children.push(child); return child; }, remove() {}, addEventListener() {}, scrollTop: 0, scrollHeight: 0 };
  }
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
    createElement() { return makeEl("node"); },
    querySelectorAll() { return []; },
  };
  const sandbox = { document, window: { matchMedia() { return { matches: true }; } }, console };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename: "charter-intl-it.js" });
  return sandbox.window.__sectorDemo;
}

test("the Italian charter can note a dinghy rental without naming a place", () => {
  const html = read("charter-intl/it/index.html").toString("utf8");
  const demo = loadDemo(html);
  const cases = [
    ["Si può noleggiare un gommone, con o senza patente?", "gommone"],
    ["Vorrei il noleggio di un gommone", "gommone"],
    ["Noleggio gommoni", "gommone"],
    ["Si può andare senza patente?", "gommone"],
    ["Serve la patente nautica?", "gommone"],
    ["Si può chiedere di uno yacht o di un catamarano?", "yacht"],
    ["C'è un corso di vela?", "course"],
    ["Una gomma da masticare", "fallback"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const answer = demo.answerFor("Noleggio di un gommone");
  assert.match(answer.text, /gommone/);
  assert.match(answer.text, /con o senza patente/);
  assert.match(answer.text, /Il team risponderebbe/);
  assert.doesNotMatch(answer.text, /\d|€|\+/);
  const emergency = demo.answerFor("Uomo in mare");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /numero di emergenza locale/);
  assert.match(html, /Noleggio di un gommone/);
  assert.match(html, /lang="it"/);
  assert.match(html, /\/bolla-demo-charter-intl\/it/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /\[\?&\]p=/);
  assert.doesNotMatch(html, /Palau|Tallinn|Estonia|\bItalia\b|\+39|€/);
  assert.doesNotMatch(html, /\b(tu|tuo|tua|tuoi|tue)\b/i);
  const sent = {
    "charter-intl/en/index.html": "60a42d5aedaa741885a974a2d505031221085d19fbf9d209e50b04fb27bd9f02",
    "charter-intl/es/index.html": "a320efe9db4da5f1830722d8e7c1c5c0ddf047714bac46da1b1c3c6b4e95a0c6",
    "charter-intl/fr/index.html": "a7d10253f89d4a0d937314344426bb9312748c35062bc80342b568c9fc39f096",
    "charter-intl/de/index.html": "4bc20b54c90a99e2717ca64bd8f9bb19abd81c0671eb904ea60839820d2875be",
  };
  for (const [path, hash] of Object.entries(sent)) {
    assert.equal(createHash("sha256").update(read(path)).digest("hex"), hash, path);
  }
});
