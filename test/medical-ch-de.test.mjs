import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function matcherBlock(html) {
  const script = sectorScript(html);
  const start = script.indexOf("  function tokensOf(raw){");
  const end = script.indexOf("  window.__sectorDemo");
  assert.ok(start > 0 && end > start);
  return script.slice(start, end);
}

function visible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadDemo(html) {
  const packJson = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = sectorScript(html);
  const tracks = [];
  function makeEl(id) {
    return {
      id,
      textContent: id === "demo-pack" ? packJson : "",
      value: id === "item" ? "Hausarzt: Kontrolle" : "",
      hidden: false,
      min: "",
      className: "",
      children: [],
      style: {},
      classList: { add() {}, remove() {} },
      setAttribute() {},
      appendChild(child) { this.children.push(child); return child; },
      remove() {},
      listeners: [],
      addEventListener(type, fn) { this.listeners.push({ type, fn }); },
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
    window: {
      matchMedia() { return { matches: true }; },
      bsTrack(sub, title) { tracks.push({ sub, title }); },
    },
    console,
    setTimeout(fn) { fn(); return 0; },
  };
  vm.createContext(sandbox);
  document.getElementById("ask");
  vm.runInContext(script, sandbox, { filename: "medical-ch/de/index.html" });
  return { demo: sandbox.window.__sectorDemo, elements, tracks };
}

function counterScript(html) {
  const match = html.match(/\(function\(\)\{\s*var BASE="\/bolla-demo-medical-ch\/de";[\s\S]*?\}\)\(\);/);
  assert.ok(match, "counter script missing");
  return match[0];
}

function plainCounts(counts) {
  return JSON.parse(JSON.stringify(counts));
}

function runCounter(search, store = {}, { load = true } = {}) {
  const counts = [];
  const appended = [];
  const context = {
    location: { search, hash: "" },
    localStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
      setItem(key, value) { store[key] = String(value); },
      removeItem(key) { delete store[key]; },
    },
    document: {
      createElement() { return { setAttribute() {}, async: false, onload: null }; },
      head: {
        appendChild(el) {
          appended.push(el);
          if (!load) return;
          context.window.goatcounter.count = (payload) => counts.push(payload);
          el.onload();
        },
      },
    },
    window: null,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(counterScript(html), context, { filename: "medical-ch/de/counter.js" });
  return { counts, appended, store, bsTrack: context.bsTrack, goatcounter: context.goatcounter };
}

const html = read("medical-ch/de/index.html");
const pack = packOf(html);
const loaded = loadDemo(html);
const demo = loaded.demo;
const shown = visible(html);
const places = [
  "Zürich", "Zurich", "Zuerich", "Schweiz", "Schweizer", "Suisse", "Svizzera", "Switzerland", "Swiss",
  "Deutschland", "Germany", "Österreich", "Austria", "Berlin", "München", "Hamburg", "Köln", "Frankfurt",
  "Wien", "Salzburg", "Tallinn", "Tallin", "España", "Spanien", "Spain", "Italia", "Italien", "Italy",
  "France", "Frankreich", "Eesti", "Estland", "Estonia", "Bern", "Basel", "Genf", "Genève", "Geneva",
  "Lausanne", "Lugano", "Luzern", "Lucerne", "Winterthur", "St. Gallen", "Sankt Gallen", "Kanton", "Cantón",
  "Paris", "Madrid", "Barcelona", "Roma", "Mailand", "Milano", "London", "Europa", "Europe", "Euro",
];
const insurers = [
  "Helsana", "Swica", "Sanitas", "Visana", "Concordia", "Atupri", "Sympany", "Assura", "Medbase",
  "Sanacare", "Centramed", "Arzthaus", "Aquilana", "ÖKK", "Groupe Mutuel", "TARMED", "TARDOC",
];

test("medical-ch/de uses the same matcher and the medical counter", () => {
  assert.equal(matcherBlock(html), matcherBlock(read("dentist/de/index.html")));
  assert.match(sectorScript(html), /\\p\{L\}/);
  assert.doesNotMatch(html, /n\.indexOf\(nk\)/);
  assert.equal(demo.liveAI, false);
  assert.equal(demo.mode, "static-example");
  assert.equal(demo.lang, "de");
  assert.match(html, /<html lang="de"/);
  assert.match(html, /data-demo="static-example"/);
  assert.match(html, /var BASE="\/bolla-demo-medical-ch\/de"/);
  assert.match(html, /title:"medical-ch demo de"/);
  assert.match(html, /s\.src="https:\/\/gc\.zgo\.at\/count\.js"/);
  assert.match(html, /function bollaStore/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /\[\?&#\]interno=\(\[01\]\)/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /skipgc/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);
  assert.match(html, /path:BASE\+'\/'\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /bsTrack\("\/chat\/" \+ r\.id, "example"\)/);
  assert.match(html, /bsTrack\("\/request\/confirm", "example"\)/);
  assert.match(html, /bsTrack\("\/call\/example", "example"\)/);
  assert.doesNotMatch(html, /bsTrack\([^)]*input\.value/);
  assert.doesNotMatch(sectorScript(html), /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|fingerprint|canvas|RTCPeer/);
  assert.doesNotMatch(html, /wa\.me|elevenlabs|openai|tel:/i);
  assert.doesNotMatch(html, /<audio\b/i);
  const submit = sectorScript(html).match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
  assert.ok(submit);
  assert.doesNotMatch(submit[0], /bsTrack/);
  assert.match(submit[0], /answerFor\(q\)/);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").priority, true);
  assert.deepEqual(pack.rules.filter((rule) => rule.button).map((rule) => rule.id), ["illness", "hausarzt", "walkin", "physio", "vaccine", "hours", "insurance"]);
  assert.doesNotMatch(html, /<nav class="langs"/);
  assert.doesNotMatch(html, /data-keep-query/);
  assert.doesNotMatch(html, /id="bolla-lang-links"/);
  assert.doesNotMatch(html, /href="(?:\.\.\/|\/)(?:en|es|et|ru|de|fr|it)\//);
});

test("German replies match whole words and stay an example", () => {
  const cases = [
    ["Nehmen Sie neue Patientinnen und Patienten auf?", "hausarzt"],
    ["Ich brauche einen Hausarzt", "hausarzt"],
    ["Allgemeinmedizin", "hausarzt"],
    ["Kann ich ohne Termin in die Permanence?", "walkin"],
    ["Walk-in heute", "walkin"],
    ["Brauche ich für die Physiotherapie eine Verordnung?", "physio"],
    ["Physiotherapeutin", "physio"],
    ["Kann ich eine Impfung reservieren?", "vaccine"],
    ["Auffrischimpfung", "vaccine"],
    ["Wie sind die Öffnungszeiten?", "hours"],
    ["Wann haben Sie geöffnet?", "hours"],
    ["Sprechzeiten bitte", "hours"],
    ["Sind Sie offen?", "hours"],
    ["Am Sonntag schliesst die Praxis", "hours"],
    ["Was deckt die Grundversicherung?", "insurance"],
    ["Krankenkasse", "insurance"],
    ["Wie hoch ist die Franchise?", "insurance"],
    ["Selbstbehalt", "insurance"],
    ["Zusatzversicherung", "insurance"],
    ["Ich fühle mich krank", "illness"],
    ["Ich habe Schmerzen", "illness"],
    ["Fieber seit gestern", "illness"],
    ["Termin vereinbaren", "appointment"],
    ["Termine", "appointment"],
    ["Ich möchte einen Termin buchen", "appointment"],
    ["Terminreservation", "appointment"],
    ["Termin absagen", "cancel"],
    ["verschieben", "cancel"],
    ["stornieren", "cancel"],
    ["Bitte anrufen", "call"],
    ["Telefonnummer", "call"],
    ["Terminologie", "fallback"],
    ["Ich bin schmerzfrei", "fallback"],
    ["Haben Sie ein Schmerzmittel?", "fallback"],
    ["Das ist schmerzlich", "fallback"],
    ["Das ist offensichtlich ein Fehler", "fallback"],
    ["Feuerwerk am Samstag", "fallback"],
    ["Das Auto ist brandneu", "fallback"],
    ["unfallfrei seit Jahren", "fallback"],
    ["Ist das notwendig?", "fallback"],
    ["Bitte notieren Sie das", "fallback"],
    ["Wie ist der Blutdruck?", "fallback"],
    ["Welche Blutgruppe?", "fallback"],
    ["Vollblut", "fallback"],
    ["Gibt es einen Kindergarten?", "fallback"],
    ["Kann man Schach spielen?", "fallback"],
    ["Jemand ist bewusstlos", "emergency"],
    ["Er atmet nicht", "emergency"],
    ["starke Blutung", "emergency"],
    ["Es brennt", "emergency"],
    ["Brustschmerz", "emergency"],
    ["Was kostet der Notfall?", "emergency"],
    ["Zahnschmerzen und ein Notfall", "emergency"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);

  const off = demo.answerFor("Kann man Schach spielen?");
  assert.match(off.text, /geschriebenes Beispiel/);
  assert.match(off.text, /kein Assistent in Echtzeit/);
  assert.match(off.text, /nicht mit WhatsApp/);
  assert.match(off.text, /Sprachassistenten/);
  assert.doesNotMatch(off.text, /112|144/);

  const emergency = demo.answerFor("Jemand ist bewusstlos");
  assert.match(emergency.text, /örtlichen Notdienst/);
  assert.match(emergency.text, /keine medizinischen Anweisungen/);
  assert.doesNotMatch(emergency.text, /112|144|Ibuprofen|Paracetamol|Dosierung|Herzdruckmassage/);

  const illness = demo.answerFor("Ich fühle mich krank");
  assert.match(illness.text, /kann nicht diagnostizieren/);
  assert.match(illness.text, /nennt keine Behandlung/);
  assert.doesNotMatch(illness.text, /Milligramm|Dosierung|Ibuprofen/);

  const insurance = demo.answerFor("Was deckt die Grundversicherung?");
  assert.match(insurance.text, /keinen Betrag/);
  assert.match(insurance.text, /keine Krankenkasse/);
  assert.doesNotMatch(insurance.text, /€|CHF|Franken|\b\d+\s*Euro\b/);

  const appointment = demo.answerFor("Termin vereinbaren");
  assert.match(appointment.text, /reserviert nicht/);
  assert.match(appointment.text, /nennt keinen Preis/);
  const vaccine = demo.answerFor("Kann ich eine Impfung reservieren?");
  assert.match(vaccine.text, /empfiehlt keine Impfung/);
  assert.match(vaccine.text, /reserviert nicht/);
  const cancel = demo.answerFor("Termin absagen");
  assert.match(cancel.text, /sagt nichts ab/);
  assert.match(cancel.text, /nichts gesendet/);
});

test("the page stays a fictional Swiss-spelling example without a place name", () => {
  assert.equal((html.match(/ß/g) || []).length, 0);
  assert.equal((shown.match(/ß/g) || []).length, 0);
  assert.match(shown, /Musterpraxis/);
  assert.match(shown, /Musterstrasse 12/);
  assert.match(shown, /000 000 00 00/);
  assert.match(shown, /heisst/);
  assert.match(shown, /grosse/);
  assert.match(shown, /schliesst/);
  assert.match(shown, /Ausserhalb/);
  assert.match(shown, /Hausarzt/);
  assert.match(shown, /Permanence/);
  assert.match(shown, /Walk-in/);
  assert.match(shown, /Physiotherapie/);
  assert.match(shown, /Impfung/);
  assert.match(shown, /Grundversicherung/);
  assert.match(shown, /Krankenkasse/);
  assert.match(shown, /Franchise/);
  assert.match(shown, /Terminreservation/);
  assert.match(shown, /nicht personalisiert/);
  assert.match(shown, /keine Personalisierung/);
  assert.match(shown, /vorher geschrieben/);
  assert.match(shown, /nicht mit WhatsApp/);
  assert.match(shown, /Es wird kein Ton abgespielt/);
  assert.match(shown, /Sprachassistent ist hier nicht verbunden/);
  assert.match(shown, /geschriebenes Beispiel|Geschriebenes Beispiel/);
  assert.match(shown, /kein Assistent in Echtzeit/);
  assert.match(html, /Marcelo Bolla/);
  assert.match(html, /https:\/\/bollastudio\.com/);
  assert.match(html, /<ol class="steps">/);
  assert.match(html, /min-height:48px/);
  assert.match(pack.chat[0][1], /^Guten Tag/);
  assert.match(pack.ok, /nichts reserviert/);
  assert.match(pack.ok, /nichts gesendet/);
  assert.match(pack.callNote, /niemand angerufen/);
  assert.doesNotMatch(html, /\b(du|dich|dir|dein|deine|deinen)\b/);
  assert.doesNotMatch(html, /Straße|groß|außer|heißt|schließt|Grüße|daß|muß/);
  assert.doesNotMatch(html, /\+41|\+49|CHF|Franken|€/);
  assert.doesNotMatch(html, /\b(112|144)\b/);
  assert.doesNotMatch(html, /künstliche Intelligenz|KI-Agent|ChatGPT|antwortet sofort/i);
  for (const place of places) assert.doesNotMatch(html, new RegExp(place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), place);
  for (const name of insurers) assert.doesNotMatch(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), name);
  assert.doesNotMatch(shown, /\b(scripted|please|hello|sample guest|check-up)\b/i);
});

test("counted paths keep a sanitised p and internal=1 sends nothing", () => {
  const plain = runCounter("");
  assert.equal(plain.appended.length, 1);
  assert.equal(plain.appended[0].src, "https://gc.zgo.at/count.js");
  assert.deepEqual(plainCounts(plain.counts), [{ path: "/bolla-demo-medical-ch/de/", title: "medical-ch demo de" }]);
  plain.bsTrack("/chat/hausarzt", "example");
  plain.bsTrack("/request/confirm", "example");
  plain.bsTrack("/call/example", "example");
  assert.deepEqual(plainCounts(plain.counts.slice(1)), [
    { path: "/bolla-demo-medical-ch/de/chat/hausarzt", title: "example", event: true },
    { path: "/bolla-demo-medical-ch/de/request/confirm", title: "example", event: true },
    { path: "/bolla-demo-medical-ch/de/call/example", title: "example", event: true },
  ]);

  const tagged = runCounter("?p=Muster_Demo!&utm=1");
  assert.equal(tagged.counts[0].path, "/bolla-demo-medical-ch/de/?p=musterdemo");
  tagged.bsTrack("/chat/hours", "example");
  assert.equal(tagged.counts[1].path, "/bolla-demo-medical-ch/de/chat/hours?p=musterdemo");
  assert.equal(tagged.counts[1].title, "example");
  assert.equal(tagged.counts[1].event, true);

  const clean = runCounter("?p=zentrum-01");
  assert.equal(clean.counts[0].path, "/bolla-demo-medical-ch/de/?p=zentrum-01");
  const long = runCounter("?p=" + "A".repeat(80));
  assert.equal(long.counts[0].path, "/bolla-demo-medical-ch/de/?p=" + "a".repeat(60));

  const skipped = runCounter("?internal=1&p=zentrum-01");
  const interno = runCounter("?interno=1");
  assert.equal(interno.appended.length, 0);
  assert.equal(interno.store.skipgc, "t");
  const audit = runCounter("?p=bmaudit-zentrum");
  assert.equal(audit.appended.length, 0);
  assert.equal(audit.counts.length, 0);
  assert.equal(skipped.appended.length, 0);
  assert.equal(skipped.counts.length, 0);
  assert.equal(skipped.store.skipgc, "t");
  skipped.bsTrack("/chat/illness", "Ich fühle mich krank");
  assert.equal(skipped.counts.length, 0);

  const again = runCounter("?internal=0", { skipgc: "t" });
  assert.equal(again.store.skipgc, undefined);
  assert.equal(again.counts[0].path, "/bolla-demo-medical-ch/de/");

  const queued = runCounter("?p=zentrum-01", {}, { load: false });
  assert.equal(queued.counts.length, 0);
  queued.bsTrack("/chat/vaccine", "example");
  queued.goatcounter.count = (payload) => queued.counts.push(payload);
  queued.appended[0].onload();
  assert.deepEqual(plainCounts(queued.counts), [
    { path: "/bolla-demo-medical-ch/de/?p=zentrum-01", title: "medical-ch demo de" },
    { path: "/bolla-demo-medical-ch/de/chat/vaccine?p=zentrum-01", title: "example", event: true },
  ]);
  assert.equal(JSON.stringify(queued.counts).includes("Impfung"), false);
});

test("usage is counted only for a real button or the example note", () => {
  assert.equal(loaded.tracks.length, 0);
  const hausarzt = loaded.elements.qr.children.find((button) => button.textContent.startsWith("Nehmen Sie neue Patientinnen"));
  assert.ok(hausarzt);
  hausarzt.onclick();
  assert.deepEqual(loaded.tracks, [{ sub: "/chat/hausarzt", title: "example" }]);
  loaded.elements.ask.value = "Ich bin schmerzfrei und heisse Gast Beispiel";
  const submit = loaded.elements["ask-form"].listeners.find((listener) => listener.type === "submit");
  submit.fn({ preventDefault() {} });
  assert.equal(loaded.tracks.length, 1);
  assert.equal(loaded.elements.ask.value, "");
  const last = loaded.elements.chat.children.at(-1).textContent;
  assert.match(last, /geschriebenes Beispiel/);
  assert.equal(JSON.stringify(loaded.tracks).includes("heisse"), false);

  const cta = loaded.elements.cta.listeners.find((listener) => listener.type === "click");
  cta.fn();
  assert.match(loaded.elements.ok.textContent, /Bitte wählen Sie zuerst/);
  assert.equal(loaded.tracks.length, 1);
  loaded.elements.slots.children[0].onclick();
  cta.fn();
  assert.deepEqual(loaded.tracks.at(-1), { sub: "/request/confirm", title: "example" });
  assert.match(loaded.elements.ok.textContent, /Nur ein Beispiel: Hausarzt: Kontrolle · \d{2}\.\d{2}\.\d{4} · Vormittag/);
  assert.match(loaded.elements.ok.textContent, /nichts reserviert/);
  assert.match(loaded.elements.ok.textContent, /nichts gesendet/);
  assert.doesNotMatch(sectorScript(html), /getElementById\("nm"\)|getElementById\("ph"\)/);

  const call = loaded.elements.call.listeners.find((listener) => listener.type === "click");
  call.fn();
  assert.deepEqual(loaded.tracks.at(-1), { sub: "/call/example", title: "example" });
  assert.match(loaded.elements["call-note"].textContent, /niemand angerufen/);
  assert.match(loaded.elements["call-note"].textContent, /000 000 00 00/);
});

test("the entry keeps the query and does not count", () => {
  const entry = read("medical-ch/index.html");
  assert.match(entry, /location\.replace\("de\/"\+location\.search\+location\.hash\)/);
  assert.match(entry, /location\.search/);
  assert.doesNotMatch(entry, /gc\.zgo\.at|goatcounter|data-keep-query|bolla-lang-links|nav class="langs/);
  let replaced = "";
  const sandbox = {
    location: {
      search: "?p=zentrum-01&internal=1",
      hash: "#frage",
      replace(url) { replaced = url; },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext('location.replace("de/"+location.search+location.hash)', sandbox);
  assert.equal(replaced, "de/?p=zentrum-01&internal=1#frage");
});
