import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import vm from "node:vm";

const repo = new URL("..", import.meta.url);
const dir = new URL("concesionarios/", repo);

const banned = /Medina|Tigre|San Fernando|Canestrari|\+54|Argentin|video\.mp4|Schweiz|\+41|Italia|Olbia|Tallinn/;

function walk(path, out = []) {
  for (const name of readdirSync(path)) {
    const next = join(path, name);
    if (statSync(next).isDirectory()) walk(next, out);
    else out.push(next);
  }
  return out;
}

function read(rel) {
  return readFileSync(new URL(rel, repo), "utf8");
}

test("concesionarios files do not keep the nautical video or the banned place names", () => {
  const files = walk(dir.pathname);
  assert.ok(files.some((path) => path.endsWith("concesionarios/es/index.html")));
  assert.equal(files.filter((path) => path.endsWith("video.mp4")).length, 0);
  for (const path of files) {
    assert.doesNotMatch(readFileSync(path, "utf8"), banned, path);
  }
  for (const lang of ["es", "de", "en", "it"]) {
    const html = read(`concesionarios/${lang}/index.html`);
    assert.doesNotMatch(html, /<video\b|poster=|\.vtt|subtitle|webvtt/i);
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
    assert.doesNotMatch(visible, /\$/);
    assert.match(html, /Ejemplo ilustrativo|anschauliches Beispiel|illustrative example|Esempio illustrativo/);
    assert.match(html, /skipgc/);
    assert.match(html, /internal=\(\[01\]\)/);
    assert.match(html, /m\[1\]==="1"/);
    assert.match(html, new RegExp(`__concPath\\(raw,"video-${lang}"\\)`));
    assert.match(html, new RegExp(`title:"concesionarios video-${lang}"`));
    assert.match(html, /data-keep-query/);
    assert.match(html, /a\.href=u\.pathname\+location\.search\+location\.hash/);
    assert.match(html, /https:\/\/bollastudio\.goatcounter\.com\/count/);
  }
  const entry = read("concesionarios/index.html");
  assert.match(entry, /location\.search/);
  assert.doesNotMatch(entry, /gc\.zgo\.at\/count\.js/);
  for (const lang of ["en", "de"]) {
    const html = read(`concesionarios/${lang}/index.html`);
    assert.match(html, /bolla-p-redirect/);
    assert.match(html, /q\.get\('p'\)/);
    assert.match(html, /&internal=1/);
    assert.match(html, /"aktiv-hotel-spa-hannigalp":"\/hotel-ch\/de\/\?p=aktiv-hotel-spa-hannigalp"/);
  }
  for (const lang of ["es", "it"]) {
    assert.doesNotMatch(read(`concesionarios/${lang}/index.html`), /bolla-p-redirect/);
  }
});

function sectorScript(html) {
  const match = html.match(/<script id="sector-demo">([\s\S]*?)<\/script>/);
  assert.ok(match, "sector-demo missing");
  return match[1];
}

function packOf(html) {
  const match = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/);
  assert.ok(match, "demo-pack missing");
  return JSON.parse(match[1]);
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

function concPath(html) {
  const match = html.match(/window\.__concPath=function\(raw,leaf\)\{\n([\s\S]*?)\n \};/);
  assert.ok(match, "path helper missing");
  return new Function("raw", "leaf", match[1]);
}

const langs = ["es", "de", "en", "it"];
const pages = Object.fromEntries(langs.map((lang) => [lang, read(`concesionarios/${lang}/index.html`)]));
const demos = Object.fromEntries(langs.map((lang) => [lang, loadDemo(pages[lang], `concesionarios/${lang}/index.html`)]));

const questions = {
  es: [
    ["¿Tienes un SUV compacto híbrido disponible?", "stock"],
    ["Quiero reservar una prueba de conducción", "testdrive"],
    ["Necesito una cita de taller para la revisión", "workshop"],
    ["¿Me puedes orientar sobre la financiación y una permuta?", "finance"],
    ["¿Cuál es el horario?", "hours"],
    ["¿Dónde está el concesionario?", "location"],
    ["Quiero hablar con una persona", "human"],
    ["He tenido un accidente", "emergency"],
  ],
  de: [
    ["Haben Sie einen kompakten Hybrid-SUV auf Lager?", "stock"],
    ["Ich möchte eine Probefahrt reservieren", "testdrive"],
    ["Ich brauche einen Werkstatttermin für die Inspektion", "workshop"],
    ["Können Sie mich zur Finanzierung und zur Inzahlungnahme beraten?", "finance"],
    ["Wie sind die Öffnungszeiten?", "hours"],
    ["Wo befindet sich das Autohaus?", "location"],
    ["Ich möchte mit einer Person sprechen", "human"],
    ["Ich hatte einen Unfall", "emergency"],
  ],
  en: [
    ["Do you have a compact hybrid SUV in stock?", "stock"],
    ["I would like to book a test drive", "testdrive"],
    ["I need a workshop appointment for a service", "workshop"],
    ["Can you outline financing and a trade-in?", "finance"],
    ["What are your opening hours?", "hours"],
    ["Where is the dealership?", "location"],
    ["I want to speak to a person", "human"],
    ["I have had an accident", "emergency"],
  ],
  it: [
    ["C'è un SUV compatto ibrido disponibile?", "stock"],
    ["Vorrei prenotare una prova su strada", "testdrive"],
    ["Ho bisogno di un appuntamento in officina per il tagliando", "workshop"],
    ["Può orientarmi su finanziamento e permuta?", "finance"],
    ["Qual è l'orario?", "hours"],
    ["Dove si trova la concessionaria?", "location"],
    ["Vorrei parlare con una persona", "human"],
    ["Ho avuto un incidente", "emergency"],
  ],
};

test("the dealership matcher answers eight questions in each language", () => {
  const scripts = langs.map((lang) => sectorScript(pages[lang]));
  for (const script of scripts) assert.equal(script, scripts[0]);
  assert.match(scripts[0], /\\p\{L\}/);
  assert.doesNotMatch(scripts[0], /indexOf\(nk\)/);
  assert.doesNotMatch(scripts[0], /\bfetch\s*\(/);
  for (const lang of langs) {
    assert.equal(questions[lang].length, 8, lang);
    const demo = demos[lang];
    assert.equal(demo.liveAI, false);
    assert.equal(demo.mode, "static-example");
    assert.equal(demo.lang, lang);
    for (const [question, id] of questions[lang]) {
      assert.equal(demo.answerFor(question).id, id, lang + " " + question);
    }
  }
});

test("whole words do not match inside longer words, and an emergency wins", () => {
  const traps = {
    es: [
      ["accidentalmente miré el stock", "stock"],
      ["tallerista", "fallback"],
      ["stockton", "fallback"],
      ["manejable", "fallback"],
      ["He tenido un accidente y quiero el stock", "emergency"],
      ["   ", "empty"],
    ],
    de: [
      ["Unfallversicherung", "fallback"],
      ["Werk", "fallback"],
      ["Lagerfeuer", "fallback"],
      ["Ich hatte einen Unfall und will eine Probefahrt", "emergency"],
    ],
    en: [
      ["accidentally", "fallback"],
      ["stocking", "fallback"],
      ["workshopped", "fallback"],
      ["I have had an accident and I want a test drive", "emergency"],
    ],
    it: [
      ["incidentalmente", "fallback"],
      ["disponibilmente", "fallback"],
      ["Ho avuto un incidente e voglio lo stock", "emergency"],
    ],
  };
  for (const lang of langs) {
    for (const [question, id] of traps[lang]) {
      assert.equal(demos[lang].answerFor(question).id, id, lang + " " + question);
    }
  }
  assert.equal(demos.es.answerFor("He tenido un accidente").text, "Llama al 112.");
  assert.equal(demos.de.answerFor("Ich hatte einen Unfall").text, "Rufen Sie 112 an.");
  assert.equal(demos.en.answerFor("I have had an accident").text, "Call 112.");
  assert.equal(demos.it.answerFor("Ho avuto un incidente").text, "Chiami il 112.");
  for (const lang of langs) {
    const emergency = demos[lang].answerFor(questions[lang][7][0]).text;
    assert.match(emergency, /112/);
    assert.doesNotMatch(emergency, /protocolo|Protokoll|protocol|protocollo|extintor|primeros auxilios|evacue|Verband/i);
    const finance = demos[lang].answerFor(questions[lang][3][0]).text;
    assert.doesNotMatch(finance, /\d/);
    assert.doesNotMatch(demos[lang].answerFor(questions[lang][0][0]).text, /112/);
  }
  assert.match(demos.es.answerFor(questions.es[3][0]).text, /euros/);
  assert.match(demos.de.answerFor(questions.de[3][0]).text, /Euro/);
  assert.doesNotMatch(demos.en.answerFor(questions.en[3][0]).text, /€|\$|CHF/);
  assert.match(demos.es.answerFor(questions.es[5][0]).text, /nuestro concesionario/);
  assert.match(demos.de.answerFor(questions.de[5][0]).text, /unser Autohaus/);
  assert.match(demos.en.answerFor(questions.en[5][0]).text, /our dealership/);
  assert.match(demos.it.answerFor(questions.it[5][0]).text, /nostra concessionaria/);
});

test("the campaign path stays /p/video-lang and chat events omit the typed text", () => {
  for (const lang of langs) {
    const html = pages[lang];
    const path = concPath(html);
    assert.equal(path("ACME-1", "video-" + lang), "/acme-1/video-" + lang);
    assert.equal(path("", "video-" + lang), "/video-" + lang);
    assert.equal(path(null, "video-" + lang), "/video-" + lang);
    assert.equal(path("a".repeat(80), "video-" + lang), "/" + "a".repeat(60) + "/video-" + lang);
    assert.equal(path("Foo Bar", "video-" + lang), "/foobar/video-" + lang);
    assert.equal(path("ok", "conc-intent-stock"), "/ok/conc-intent-stock");
    assert.equal(path("ok", "user typed this"), "");
    assert.equal(path("p.with.dots", "video-" + lang), "/pwithdots/video-" + lang);
    const script = sectorScript(html);
    const play = script.slice(script.indexOf("  function play(i){"), script.indexOf("  PACK.rules.forEach"));
    assert.doesNotMatch(play, /bsTrack/);
    const submit = script.match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
    assert.ok(submit, lang);
    assert.match(submit[0], /preventDefault/);
    assert.match(submit[0], /trackUse\(entry\.id\)/);
    assert.doesNotMatch(submit[0], /trackUse\(\s*q|trackUse\(\s*input|bsTrack\([^)]*input/);
    assert.match(script, /allowed = \{ stock:1, testdrive:1, workshop:1, finance:1, hours:1, location:1, human:1, emergency:1, fallback:1, request:1 \}/);
    assert.match(html, /onsubmit="return false"/);
    assert.doesNotMatch(html, /method\s*=\s*["']post["']/i);
    assert.match(html, /bsTrack\("conc-intent-" \+ id, "conc-intent-" \+ id\)/);
    assert.match(html, /bsTrack\("conc-intent-request", "conc-intent-request"\)/);
    assert.equal(packOf(html).lang, lang);
  }
  const esVisible = pages.es.replace(/<script[\s\S]*?<\/script>/g, " ");
  assert.doesNotMatch(esVisible, /\b(vos|tenés|tenes|podés|podes|querés|queres|decime|usted)\b/i);
  const deVisible = pages.de.replace(/<script[\s\S]*?<\/script>/g, " ");
  assert.doesNotMatch(deVisible, /\b(du|dein|deine|dir|dich)\b/i);
  assert.match(deVisible, /\bSie\b/);
});
