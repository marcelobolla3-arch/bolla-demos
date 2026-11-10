import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function packOf(html) {
  const match = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/);
  assert.ok(match, "demo-pack missing");
  return JSON.parse(match[1]);
}

function sectorScript(html) {
  const match = html.match(/<script id="sector-demo">([\s\S]*?)<\/script>/);
  assert.ok(match, "sector-demo missing");
  return match[1];
}

function loadDemo(html, filename) {
  const packJson = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = sectorScript(html);
  function makeEl(id) {
    return {
      id,
      textContent: id === "demo-pack" ? packJson : "",
      value: "",
      hidden: false,
      min: "",
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
  const elements = {};
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
    createElement() { return makeEl("node"); },
    querySelectorAll() { return []; },
  };
  const sandbox = {
    document,
    window: { matchMedia() { return { matches: true }; } },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename });
  return sandbox.window.__sectorDemo;
}

const pages = [
  "charter/et/index.html",
  "charter/en/index.html",
  "charter-de/de/index.html",
  "charter-de/en/index.html",
  "marina-pirita/et/index.html",
];

const counters = {
  "charter/et/index.html": ["/bolla-demo-charter/et", "charter demo et"],
  "charter/en/index.html": ["/bolla-demo-charter/en", "charter demo en"],
  "charter-de/de/index.html": ["/bolla-demo-charter-de/de", "charter-de demo de"],
  "charter-de/en/index.html": ["/bolla-demo-charter-de/en", "charter-de demo en"],
  "marina-pirita/et/index.html": ["/bolla-demo-marina-pirita/et", "marina-pirita demo et"],
};

test("the same whole-word matcher replaces substring search on the five charter pages", () => {
  const blocks = pages.map((path) => {
    const script = sectorScript(read(path));
    const start = script.indexOf("  function tokensOf(raw){");
    const end = script.indexOf("  window.__sectorDemo");
    assert.ok(start > 0 && end > start, path);
    return script.slice(start, end);
  });
  for (const block of blocks) assert.equal(block, blocks[0]);
  assert.match(blocks[0], /\\p\{L\}/);
  assert.doesNotMatch(blocks[0], /indexOf\(nk\)/);
  for (const path of pages) {
    const html = read(path);
    assert.doesNotMatch(html, /n\.indexOf\(nk\)/);
    assert.match(html, /liveAI:\s*false/);
    assert.doesNotMatch(sectorScript(html), /\bfetch\s*\(/);
    const [base, title] = counters[path];
    assert.match(html, new RegExp(`var BASE="${base.replaceAll("/", "\\/")}"`));
    assert.match(html, new RegExp(`title:"${title}"`));
    assert.match(html, /s\.src="https:\/\/gc\.zgo\.at\/count\.js"/);
    assert.match(html, /bsTrack\("\/chat\/" \+ r\.id, "example"\)/);
    assert.match(html, /bsTrack\("\/request\/confirm", "example"\)/);
    assert.doesNotMatch(html, /bsTrack\([^)]*input\.value/);
    const submit = sectorScript(html).match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
    assert.ok(submit, path);
    assert.doesNotMatch(submit[0], /bsTrack/);
    assert.match(submit[0], /answerFor\(q\)/);
    new Function(sectorScript(html));
    const demo = loadDemo(html, path);
    assert.equal(demo.liveAI, false);
    assert.equal(demo.mode, "static-example");
  }
  assert.equal(existsSync(new URL("charter/de/index.html", root)), false);
  assert.doesNotMatch(read("marina-pirita/index.html"), /function answerFor/);
  assert.match(read("dentist/et/index.html"), /n\.indexOf\(nk\)/);
  assert.match(read("charter/index.html"), /location\.replace/);
  assert.doesNotMatch(read("charter/index.html"), /gc\.zgo\.at\/count\.js/);
});

test("Estonian charter matches a whole stem, refuses false friends, and puts 112 first", () => {
  const html = read("charter/et/index.html");
  const pack = packOf(html);
  const demo = loadDemo(html, "charter/et/index.html");
  const buttons = pack.rules.filter((rule) => rule.button).map((rule) => rule.id);
  assert.deepEqual(buttons, ["yacht", "course", "party", "weather", "safety"]);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").priority, true);
  const cases = [
    ["Kas pardal võib filmida?", "fallback"],
    ["Kas see on hea investeering?", "fallback"],
    ["inimene kukkus vette", "emergency"],
    ["Appi!", "emergency"],
    ["Keegi uppub", "emergency"],
    ["See on hädaolukord", "emergency"],
    ["Tal on vigastus", "emergency"],
    ["inimene kukkus vette ja ilm on halb", "emergency"],
    ["Kas tormiga sõidate?", "weather"],
    ["Kas ilm on halb?", "weather"],
    ["Kas ilmaga sõidate?", "weather"],
    ["päästevest", "safety"],
    ["Kas päästevestiga on korras?", "safety"],
    ["Kas vestid on pardal?", "safety"],
    ["vestlus", "fallback"],
    ["ilmselt", "fallback"],
    ["harvest", "fallback"],
    ["Kas saan broneerida?", "fallback"],
    ["Mis on hind?", "fallback"],
    ["Meid on kümme", "party"],
    ["Meid on kümme inimest", "party"],
    ["Kas pardal on wifi?", "fallback"],
    ["Kas malet saab mängida?", "fallback"],
    ["Kas sobib?", "fallback"],
    ["Kas sõidate Jaapanisse?", "fallback"],
    ["Kas on purjekursust?", "course"],
    ["Kas jahti saab laupäevaks?", "yacht"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const film = demo.answerFor("Kas pardal võib filmida?");
  assert.match(film.text, /kirjutatud näidis/);
  assert.match(film.text, /ei kata/);
  assert.match(film.text, /ettevõte/);
  assert.doesNotMatch(film.text, /Ilma vaataks/);
  const emergency = demo.answerFor("inimene kukkus vette");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /Euroopa Liidu hädaabinumber/);
  assert.doesNotMatch(emergency.text, /viska|päästerõngas|hüppa|juhend on järgmine/i);
  assert.match(demo.answerFor("päästevest").text, /Ohutuse ja varustuse/);
  assert.match(html, /väljamõeldud/);
  assert.match(html, /Kirjutatud näidis/);
});

test("English charter and the Berlin charter pages use the same boundary rules", () => {
  const en = loadDemo(read("charter/en/index.html"), "charter/en/index.html");
  const english = [
    ["Can we film on board?", "fallback"],
    ["Is this a good investment?", "fallback"],
    ["someone fell overboard", "emergency"],
    ["man overboard", "emergency"],
    ["fell over board", "emergency"],
    ["He is drowning", "emergency"],
    ["This is an emergency", "emergency"],
    ["A guest is injured", "emergency"],
    ["Do you sail in a storm?", "weather"],
    ["What if the weather is bad?", "weather"],
    ["stormy weather and a man overboard", "emergency"],
    ["Do you have a lifejacket?", "safety"],
    ["Do you have a life jacket?", "safety"],
    ["Can I book a reservation?", "fallback"],
    ["What is the price?", "fallback"],
    ["There are ten of us", "party"],
    ["Is there wifi?", "fallback"],
    ["Can we play chess?", "fallback"],
    ["Does it suit us?", "fallback"],
    ["Do you sail to Japan?", "fallback"],
    ["Is there a sailing course?", "course"],
    ["Is there a window?", "fallback"],
    ["Do you offer training?", "fallback"],
    ["Is a costume allowed?", "fallback"],
  ];
  for (const [question, id] of english) assert.equal(en.answerFor(question).id, id, question);
  const off = en.answerFor("Can we play chess?");
  assert.match(off.text, /written example/i);
  assert.match(off.text, /does not cover that question/i);
  assert.match(off.text, /business would answer/i);
  assert.doesNotMatch(off.text, /weather|lifejacket|112/i);
  const overboard = en.answerFor("man overboard");
  assert.match(overboard.text, /Call 112 now/);
  assert.match(overboard.text, /European Union emergency number/);
  assert.doesNotMatch(overboard.text, /lifebuoy|throw a rope|do not jump/i);
  assert.match(read("charter/en/index.html"), /fictional|does not guarantee|written example|scripted/i);

  const de = loadDemo(read("charter-de/de/index.html"), "charter-de/de/index.html");
  const german = [
    ["Kann man an Bord filmen?", "fallback"],
    ["Mann über Bord", "emergency"],
    ["ein Mensch ist über Bord gefallen", "emergency"],
    ["Jemand ertrinkt", "emergency"],
    ["Das ist ein Notfall", "emergency"],
    ["Ein Gast ist verletzt", "emergency"],
    ["Was kostet der Notfall?", "emergency"],
    ["Fahrt ihr bei Sturm?", "fallback"],
    ["Habt ihr Rettungswesten?", "fallback"],
    ["Kann ich reservieren?", "fallback"],
    ["Wir sind zehn", "fallback"],
    ["Gibt es WLAN?", "fallback"],
    ["Kann man Schach spielen?", "fallback"],
    ["Passt das?", "fallback"],
    ["Fahrt ihr nach Japan?", "fallback"],
    ["Was ist ein Kostüm?", "fallback"],
    ["Wie kann ich ein Angebot anfordern?", "n1"],
    ["Darf ich eigene Getränke mitbringen?", "n2"],
    ["Wie kann ich Tickets buchen?", "n3"],
    ["In welchen Sprachen wird moderiert?", "n4"],
    ["Was kostet die Fahrt am Samstag?", "edge-price"],
    ["Ist noch ein Platz frei?", "edge-berth"],
    ["Getränkekarte", "n2"],
    ["Ist das preiswert?", "edge-price"],
    ["Sonderangebot", "n1"],
  ];
  for (const [question, id] of german) assert.equal(de.answerFor(question).id, id, question);
  const deOff = de.answerFor("Kann man Schach spielen?");
  assert.match(deOff.text, /geschriebenes Beispiel/);
  assert.match(deOff.text, /nicht abgedeckt/);
  assert.match(deOff.text, /Unternehmen würde/);
  const deEmergency = de.answerFor("Mann über Bord");
  assert.match(deEmergency.text, /Rufen Sie jetzt 112 an/);
  assert.match(deEmergency.text, /Notrufnummer der Europäischen Union/);
  assert.doesNotMatch(deEmergency.text, /Rettungsring|springen Sie/i);
  assert.match(de.answerFor("Was kostet die Fahrt am Samstag?").text, /nennt keinen Preis/);

  const deEn = loadDemo(read("charter-de/en/index.html"), "charter-de/en/index.html");
  const deEnglish = [
    ["Is a costume allowed?", "fallback"],
    ["Is there a window?", "fallback"],
    ["man overboard", "emergency"],
    ["What is the price of an emergency?", "emergency"],
    ["What is the price?", "edge-price"],
    ["What does the trip cost on Saturday?", "edge-price"],
    ["How can I ask for a quote?", "n1"],
    ["May I bring my own drinks?", "n2"],
    ["How can I buy tickets?", "n3"],
    ["Is a place still free?", "edge-berth"],
    ["Can we play chess?", "fallback"],
    ["Do you sail to Japan?", "fallback"],
    ["There are ten of us", "fallback"],
    ["Is there wifi?", "fallback"],
  ];
  for (const [question, id] of deEnglish) assert.equal(deEn.answerFor(question).id, id, question);
  assert.match(deEn.answerFor("Is a costume allowed?").text, /does not cover that question/);
  assert.doesNotMatch(deEn.answerFor("Is a costume allowed?").text, /names no price/);
});

test("the Pirita marina page uses the matcher and has no vest or weather topic", () => {
  const html = read("marina-pirita/et/index.html");
  const demo = loadDemo(html, "marina-pirita/et/index.html");
  const cases = [
    ["Kas pardal võib filmida?", "fallback"],
    ["Kas see on hea investeering?", "fallback"],
    ["inimene kukkus vette", "emergency"],
    ["Appi, keegi uppub", "emergency"],
    ["Kas tormiga sõidate?", "fallback"],
    ["päästevest", "fallback"],
    ["Kas saan broneerida?", "fallback"],
    ["Mis on hind?", "fallback"],
    ["Meid on kümme", "fallback"],
    ["Kas on wifi?", "fallback"],
    ["Kas malet saab mängida?", "fallback"],
    ["Kas sobib?", "fallback"],
    ["Kas sõidate Jaapanisse?", "fallback"],
    ["Kas see on hotell?", "hotel"],
    ["elekter ja dušš", "services"],
    ["Kas külaliskohta saab küsida?", "berth"],
    ["kohtumine sadamas", "fallback"],
    ["elektri ja dušiga", "services"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const off = demo.answerFor("päästevest");
  assert.match(off.text, /ei kata/);
  assert.match(off.text, /ettevõte/);
  assert.doesNotMatch(off.text, /Ohutuse ja varustuse|Ilma vaataks/);
  assert.match(demo.answerFor("inimene kukkus vette").text, /112/);
  assert.match(html, /ei ole hotell/i);
  assert.match(html, /väljamõeldud/);
  const buttons = packOf(html).rules.filter((rule) => rule.button).map((rule) => rule.id);
  assert.deepEqual(buttons, ["berth", "services", "hotel", "hours", "change"]);
});
