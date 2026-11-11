import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function loadDemo(html, filename) {
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
  vm.runInContext(script, sandbox, { filename });
  return sandbox.window.__sectorDemo;
}

const banned = /(?:^|[^a-z])(?:island|isola|isle|estonia|tallinn|palau|italia|france|spain|germany|switzerland|berlin|rome|paris|london)(?:[^a-z]|$)|€|\$\d|\bUSD\b|\bEUR\b|\+\d{2,}/i;

test("the English boat-tour example is neutral and static", () => {
  const html = read("boat-tours-intl/en/index.html");
  const demo = loadDemo(html, "boat-tours-en.js");
  assert.equal(demo.lang, "en");
  assert.equal(demo.liveAI, false);
  assert.match(html, /<html lang="en"/);
  assert.match(html, /scripted example, not a live assistant/);
  assert.match(html, /\/bolla-demo-boat-tours-intl\/en/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /interno=/);
  assert.match(html, /internal=/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /\[\?&\]p=/);
  assert.match(html, /marcelo@bollastudio\.com/);
  assert.doesNotMatch(html, banned);
  const cases = [
    ["Is it a half day or a full day?", "duration"],
    ["Is the departure private or shared?", "share"],
    ["Is there a sunset tour?", "sunset"],
    ["Is there snorkelling in a cove?", "snorkel"],
    ["What should we bring?", "bring"],
    ["Where is the meeting point?", "meeting"],
    ["What if the weather cancels the tour?", "weather"],
    ["Can children come?", "children"],
    ["Can a dog come?", "pets"],
    ["Can we reserve?", "book"],
    ["Man overboard", "emergency"],
    ["Can we play chess?", "fallback"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const emergency = demo.answerFor("Man overboard");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /local emergency service/);
  assert.doesNotMatch(emergency.text, /lifebuoy|jump|rope|protocol/i);
  assert.doesNotMatch(demo.answerFor("Can we reserve?").text, /€|\d/);
});

test("the Italian boat-tour example uses Lei and stays neutral", () => {
  const html = read("boat-tours-intl/it/index.html");
  const demo = loadDemo(html, "boat-tours-it.js");
  assert.equal(demo.lang, "it");
  assert.equal(demo.liveAI, false);
  assert.match(html, /<html lang="it"/);
  assert.match(html, /con il Lei/);
  assert.match(html, /Scriva/);
  assert.doesNotMatch(html, /\b(tu|tuo|tua|tuoi|tue)\b/i);
  assert.match(html, /\/bolla-demo-boat-tours-intl\/it/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /\[\?&\]p=/);
  assert.match(html, /marcelo@bollastudio\.com/);
  assert.doesNotMatch(html, banned);
  const cases = [
    ["È una mezza giornata o una giornata intera?", "duration"],
    ["L'uscita è privata o condivisa?", "share"],
    ["C'è un'uscita al tramonto?", "sunset"],
    ["Si fa snorkeling in una cala?", "snorkel"],
    ["Che cosa dobbiamo portare?", "bring"],
    ["Dov'è il punto di incontro?", "meeting"],
    ["E se il meteo annulla l'uscita?", "weather"],
    ["E se il tempo è brutto?", "weather"],
    ["I bambini possono venire?", "children"],
    ["Il cane può venire?", "pets"],
    ["Si può prenotare?", "book"],
    ["Uomo in mare", "emergency"],
    ["Una gomma da masticare", "fallback"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const emergency = demo.answerFor("Uomo in mare");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /servizio di emergenza locale/);
  assert.match(html, /escursione in barca/);
  assert.match(html, /Mezza giornata/);
});
