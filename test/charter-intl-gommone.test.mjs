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
    ["Il carburante è incluso?", "gommone-fuel"],
    ["Il pieno è a carico?", "gommone-fuel"],
    ["Chi fa il rifornimento?", "gommone-fuel"],
    ["Il carburante del gommone è a carico?", "gommone-fuel"],
    ["Nel noleggio di un gommone il carburante è incluso?", "gommone-fuel"],
    ["Senza patente, il carburante è incluso?", "gommone-fuel"],
    ["C'è un briefing prima della partenza?", "gommone-briefing"],
    ["Quali sono le dotazioni?", "gommone-briefing"],
    ["Quali sono le zone?", "gommone-briefing"],
    ["Quali sono i limiti?", "gommone-briefing"],
    ["C'è un briefing del gommone?", "gommone-briefing"],
    ["C'è una cauzione?", "deposit"],
    ["C'è una cauzione per il gommone?", "gommone-deposit"],
    ["Nel noleggio di un gommone la cauzione è prevista?", "gommone-deposit"],
    ["E se il tempo è brutto?", "weather"],
    ["E se il vento è forte?", "weather"],
    ["E se il meteo ferma l'uscita in gommone?", "gommone-weather"],
    ["E se il tempo è brutto per il gommone?", "gommone-weather"],
    ["E se il vento è forte per il gommone?", "gommone-weather"],
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
  const fuel = demo.answerFor("Il carburante del gommone è incluso o è a carico?");
  assert.equal(fuel.id, "gommone-fuel");
  assert.match(fuel.text, /pieno/);
  assert.match(fuel.text, /rifornimento/);
  assert.match(fuel.text, /Il team risponderebbe/);
  assert.doesNotMatch(fuel.text, /\d|€|\+/);
  const briefing = demo.answerFor("C'è un briefing prima della partenza, con dotazioni, zone e limiti?");
  assert.equal(briefing.id, "gommone-briefing");
  assert.match(briefing.text, /dotazioni/);
  assert.match(briefing.text, /zone/);
  assert.match(briefing.text, /limiti/);
  const deposit = demo.answerFor("C'è una cauzione per il gommone?");
  assert.equal(deposit.id, "gommone-deposit");
  assert.match(deposit.text, /deposito/);
  assert.doesNotMatch(deposit.text, /\d|€|\+/);
  const weather = demo.answerFor("E se il meteo ferma l'uscita in gommone?");
  assert.equal(weather.id, "gommone-weather");
  assert.match(weather.text, /meteo/);
  assert.doesNotMatch(weather.text, /\d|€|\+/);
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
    "charter-intl/en/index.html": "32ff8cba1c1aed38ef729b857455e21207b3593790afc69d95e87eb9cd4a806d",
    "charter-intl/es/index.html": "d27ea7023885565a6acfab7ed133dae2900e99a2c70ffbb779152c5aec38d81e",
    "charter-intl/fr/index.html": "00f587f28dc421c464d6f9c155f2ea47a7799c04535b0dfd12cd94ba17a76b54",
    "charter-intl/de/index.html": "0296a442c92a3d53b8afa47a0ec3af58992be2e9e52c7fcbf3f8d614bd890461",
  };
  for (const [path, hash] of Object.entries(sent)) {
    assert.equal(createHash("sha256").update(read(path)).digest("hex"), hash, path);
  }
});
