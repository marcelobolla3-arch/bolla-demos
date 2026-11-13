import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function visible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
}

function spoken(pack) {
  const out = [];
  function walk(value) {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  }
  walk(pack);
  return out.join("\n");
}

function loadDemo(html, filename) {
  const packJson = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = html.match(/<script id="sector-demo">([\s\S]*?)<\/script>/)[1];
  const elements = {};
  function makeEl(id) {
    return {
      id,
      textContent: id === "demo-pack" ? packJson : "",
      value: "",
      hidden: false,
      className: "",
      children: [],
      style: {},
      classList: { add() {}, remove() {} },
      setAttribute() {},
      appendChild(child) { this.children.push(child); return child; },
      remove() {},
      addEventListener() {},
      scrollTop: 0,
      scrollHeight: 0,
    };
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

const places = /Tallinn|Tallin|Pärnu|Parnu|Kuressaare|Saaremaa|Hiiumaa|Muhu|Pirita|Haapsalu|Tartu|Narva|Paldiski|Kärdla|Kardla|Roomassaare|Noblessner|Lennusadam|Vanasadam|Läänemeri|Laanemeri|Balti|Baltic|Euroopa|Europe|Estland|Estonia|Viljandi|Rakvere|Võru|Voru|Valga|Jõhvi|Johvi|Sillamäe|Sillamae|Maardu|Keila|Rapla|Põlva|Polva|Paide/i;

test("the neutral Estonian charter is a static example and does not name a town", () => {
  const html = read("charter-ee/et/index.html");
  const pack = JSON.parse(html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1]);
  const shown = `${visible(html)}\n${spoken(pack)}`;
  const withoutLanguageName = shown.replaceAll("Eesti keel", "").replaceAll("eesti keeles", "");
  assert.equal(pack.lang, "et");
  assert.match(html, /<html lang="et"/);
  assert.match(html, /data-demo="static-example"/);
  assert.match(html, /data-lang="et"/);
  assert.match(html, /Kirjutatud näidis/);
  assert.match(html, /mitte reaalajas abiline/);
  assert.match(html, /ei ole seotud ühegi linnaga ega sadamaga/);
  assert.match(html, /mitte ühe linna oma/);
  assert.match(html, /\/bolla-demo-charter-ee\/et/);
  assert.match(html, /title:"charter-ee demo et"/);
  assert.doesNotMatch(html, /\/bolla-demo-charter\/et/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /\[\?&#\]interno=\(\[01\]\)/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /\[\?&\]p=/);
  assert.match(html, /marcelo@bollastudio\.com/);
  assert.match(html, /liveAI:\s*false/);
  assert.doesNotMatch(html, /<nav class="langs?"/);
  assert.doesNotMatch(html, /data-keep-query/);
  assert.doesNotMatch(html, /id="bolla-lang-links"/);
  assert.doesNotMatch(html, /href="(?:\.\.\/|\/)(?:en|es|et|ru|de|fr|it)\//);
  assert.doesNotMatch(html, /tel:|\+372|wa\.me/);
  assert.doesNotMatch(shown, places);
  assert.doesNotMatch(withoutLanguageName, /Eesti|eesti/);
  assert.match(shown, /Eesti keel/);
  assert.match(shown, /eesti keeles/);
  assert.doesNotMatch(html, places);
  const tallinn = read("charter/et/index.html");
  assert.match(tallinn, /Tallinn/);
  assert.match(tallinn, /var BASE="\/bolla-demo-charter\/et"/);
  assert.notEqual(html, tallinn);
});

test("the neutral Estonian charter keeps the scripted answers", () => {
  const html = read("charter-ee/et/index.html");
  const demo = loadDemo(html, "charter-ee/et/index.html");
  assert.equal(demo.mode, "static-example");
  assert.equal(demo.lang, "et");
  assert.equal(demo.liveAI, false);
  const cases = [
    ["Kas on purjekursust?", "course"],
    ["Kas jahti saab laupäevaks?", "yacht"],
    ["Meid on kümme inimest", "party"],
    ["Kas ilm on halb?", "weather"],
    ["päästevest", "safety"],
    ["inimene kukkus vette", "emergency"],
    ["Kas malet saab mängida?", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const emergency = demo.answerFor("inimene kukkus vette");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /hädaabinumber/);
  assert.doesNotMatch(emergency.text, places);
  assert.doesNotMatch(emergency.text, /viska|päästerõngas|hüppa|juhend on järgmine/i);
  const script = html.match(/<script id="sector-demo">([\s\S]*?)<\/script>/)[1];
  const source = read("charter/et/index.html").match(/<script id="sector-demo">([\s\S]*?)<\/script>/)[1];
  assert.equal(script, source);
  assert.doesNotMatch(script, /bsTrack\([^)]*input\.value/);
});
