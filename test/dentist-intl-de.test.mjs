import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../dentist-intl/de/index.html", import.meta.url), "utf8");
const berlin = readFileSync(new URL("../dentist/de/index.html", import.meta.url), "utf8");
const entry = readFileSync(new URL("../dentist-intl/index.html", import.meta.url), "utf8");

function loadDemo(source) {
  const packJson = source.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = source.match(/<script id="sector-demo">([\s\S]*?)<\/script>/)[1];
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
  vm.runInContext(script, sandbox, { filename: "dentist-intl-de.js" });
  return sandbox.window.__sectorDemo;
}

test("the neutral German dental page stays off the Berlin route", () => {
  const demo = loadDemo(html);
  assert.equal(demo.lang, "de");
  assert.equal(demo.liveAI, false);
  assert.match(html, /<html lang="de"/);
  assert.match(html, /mit Sie/);
  assert.match(html, /Schreiben Sie/);
  assert.doesNotMatch(html, /\b(du|dein|deine|dir|dich)\b/);
  const places = ["Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Dresden", "Hannover", "Bremen", "Nürnberg", "Leipzig", "Düsseldorf", "Wien", "Salzburg", "Graz", "Innsbruck", "Zürich", "Zurich", "Bern", "Basel", "Genf", "Lausanne", "Lugano", "Tallinn", "Tallin", "Tartu", "Riga", "Vilnius", "Paris", "Lyon", "Marseille", "Bordeaux", "Madrid", "Barcelona", "Lissabon", "Rom", "Roma", "Mailand", "Florenz", "Venedig", "Amsterdam", "Brüssel", "Brussels", "Kopenhagen", "Stockholm", "Oslo", "Helsinki", "Warschau", "Prag", "London", "Dublin", "Deutschland", "Österreich", "Schweiz", "Suisse", "Estland", "Estonia", "Eesti", "Spanien", "España", "Frankreich", "France", "Italien", "Italia", "Portugal", "Belgien", "Niederlande", "Dänemark", "Schweden", "Finnland", "Polen", "Griechenland", "Germany", "Austria", "Switzerland", "Spain", "Italy", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Ireland", "Euro"];
  for (const place of places) assert.doesNotMatch(html, new RegExp(`\\b${place}\\b`, "i"), place);
  assert.doesNotMatch(html, /€|\+49|\+\d/);
  assert.match(html, /örtlichen Notdienst/);
  assert.doesNotMatch(html, /\b112\b/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /data-keep-query/);
  assert.match(html, /\/bolla-demo-dentist-intl\/de/);
  assert.doesNotMatch(html, /\/bolla-demo-dentist\/de/);
  assert.doesNotMatch(html, /href="\.\.\/en\/"|href="\.\.\/de\/"|\/dentist\/de\//);
  assert.match(berlin, /Berlin/);
  assert.match(berlin, /\+49 30 0000 0000/);
  const cases = [
    ["Ich habe starke Zahnschmerzen.", "pain"],
    ["Wann haben Sie geöffnet?", "hours"],
    ["Nehmen Sie Kinder an?", "children"],
    ["Ich habe Angst vor dem Zahnarzt.", "afraid"],
    ["Was kostet ein Implantat?", "price"],
    ["Der Kindergarten hat heute geschlossen.", "fallback"],
    ["Die Kindheit war lang.", "fallback"],
    ["Das Angebot ist preiswert.", "fallback"],
    ["Das ist offensichtlich geschlossen.", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  assert.doesNotMatch(demo.answerFor("Was kostet ein Implantat?").text, /Euro|€|\d+\s*EUR|\+49/);
  assert.match(entry, /location\.search/);
  assert.match(entry, /location\.replace\("de\//);
  assert.doesNotMatch(entry, /gc\.zgo\.at|goatcounter/);
});
