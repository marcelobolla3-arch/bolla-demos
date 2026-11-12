import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
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
  for (const lang of ["es", "de", "en", "it", "fr"]) {
    const html = read(`concesionarios/${lang}/index.html`);
    assert.doesNotMatch(html, /<video\b|poster=|\.vtt|subtitle|webvtt/i);
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
    assert.doesNotMatch(visible, /\$/);
    assert.match(html, /Ejemplo ilustrativo|anschauliches Beispiel|illustrative example|Esempio illustrativo|Exemple illustratif/);
    assert.match(html, /skipgc/);
    assert.match(html, /internal=\(\[01\]\)/);
    assert.match(html, /m\[1\]==="1"/);
    assert.match(html, new RegExp(`__concPath\\(raw,"video-${lang}"\\)`));
    assert.match(html, new RegExp(`title:"concesionarios video-${lang}"`));
    assert.doesNotMatch(html, /data-keep-query/);
    assert.doesNotMatch(html, /a\.href=u\.pathname\+location\.search\+location\.hash/);
    assert.doesNotMatch(html, /<nav class="langs"/);
    assert.match(html, /https:\/\/bollastudio\.goatcounter\.com\/count/);
  }
  const entry = read("concesionarios/index.html");
  assert.match(entry, /location\.search/);
  assert.doesNotMatch(entry, /gc\.zgo\.at\/count\.js/);
  for (const lang of ["en", "de", "fr"]) {
    const html = read(`concesionarios/${lang}/index.html`);
    assert.match(html, /bolla-p-redirect/);
    assert.match(html, /q0\.get\("p"\)/);
    assert.match(html, /internal=1/);
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

const langs = ["es", "de", "en", "it", "fr"];
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
  fr: [
    ["Avez-vous un SUV compact hybride disponible ?", "stock"],
    ["Je voudrais un essai routier", "testdrive"],
    ["J'ai besoin d'un rendez-vous à l'atelier", "workshop"],
    ["Pouvez-vous m'orienter sur le financement et la reprise ?", "finance"],
    ["Quels sont les horaires ?", "hours"],
    ["Où se trouve la concession ?", "location"],
    ["Je voudrais parler à une personne", "human"],
    ["J'ai eu un accident", "emergency"],
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

function shownGerman(html) {
  const pack = packOf(html);
  const fixed = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const spoken = [
    ...pack.chat.map((row) => row[1]),
    ...pack.rules.flatMap((rule) => [rule.button, rule.text]),
    pack.fallback,
    pack.empty,
    pack.ok,
    pack.pick,
  ];
  return fixed + " " + spoken.join(" ");
}

test("German dealership copy stays usable in Switzerland and does not name TÜV", () => {
  const html = pages.de;
  const shown = shownGerman(html);
  assert.doesNotMatch(html, /TÜV|tüv|tuev/i);
  assert.doesNotMatch(shown, /TÜV-HU/);
  assert.doesNotMatch(shown, /ß/);
  assert.doesNotMatch(shown, /€/);
  assert.match(shown, /Fahrzeugprüfung/);
  const keys = packOf(html).rules.flatMap((rule) => rule.keys || []);
  assert.deepEqual(keys.filter((key) => /^(?:tüv(?: hu)?|tuv(?: hu)?|hu)$/i.test(key)), []);
  for (const question of ["MFK", "Hauptuntersuchung", "Inspektion"]) {
    const answer = demos.de.answerFor(question);
    assert.equal(answer.id, "workshop", question);
    assert.match(answer.text, /Fahrzeugprüfung/);
    assert.doesNotMatch(answer.text, /TÜV|MFK/);
  }
  for (const question of ["TÜV", "HU", "TÜV-HU", "tuev"]) {
    assert.equal(demos.de.answerFor(question).id, "fallback", question);
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
    fr: [
      ["accidentellement", "fallback"],
      ["le personnel de la concession", "fallback"],
      ["stockage", "fallback"],
      ["au cours de la journée", "fallback"],
      ["contrôle technique", "fallback"],
      ["MFK", "fallback"],
      ["TÜV", "fallback"],
      ["J'ai eu un accident et je veux un essai routier", "emergency"],
      ["   ", "empty"],
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
  assert.equal(demos.fr.answerFor("J'ai eu un accident").text, "Appelez le 112.");
  for (const lang of langs) {
    const emergency = demos[lang].answerFor(questions[lang][7][0]).text;
    assert.match(emergency, /112/);
    assert.doesNotMatch(emergency, /protocolo|Protokoll|protocol|protocollo|extintor|primeros auxilios|evacue|Verband/i);
    const finance = demos[lang].answerFor(questions[lang][3][0]).text;
    assert.doesNotMatch(finance, /\d/);
    assert.doesNotMatch(demos[lang].answerFor(questions[lang][0][0]).text, /112/);
  }
  assert.match(demos.es.answerFor(questions.es[3][0]).text, /euros/);
  assert.match(demos.de.answerFor(questions.de[3][0]).text, /Orientierung/);
  assert.doesNotMatch(demos.de.answerFor(questions.de[3][0]).text, /Euro|€|CHF/);
  assert.doesNotMatch(demos.en.answerFor(questions.en[3][0]).text, /€|\$|CHF/);
  assert.match(demos.es.answerFor(questions.es[5][0]).text, /nuestro concesionario/);
  assert.match(demos.de.answerFor(questions.de[5][0]).text, /unser Autohaus/);
  assert.match(demos.en.answerFor(questions.en[5][0]).text, /our dealership/);
  assert.match(demos.it.answerFor(questions.it[5][0]).text, /nostra concessionaria/);
  assert.match(demos.fr.answerFor(questions.fr[5][0]).text, /notre concession/);
  assert.match(demos.fr.answerFor(questions.fr[3][0]).text, /orientation/);
  assert.doesNotMatch(demos.fr.answerFor(questions.fr[3][0]).text, /\d|€|CHF|EUR/);
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
  const frShown = shownGerman(pages.fr);
  assert.match(frShown, /\bvous\b/i);
  assert.doesNotMatch(frShown, /\b(tu|ton|ta|tes|toi)\b/i);
});

test("French dealership copy names no country, city, currency or foreign phone", () => {
  const html = pages.fr;
  const shown = shownGerman(html);
  assert.equal(packOf(html).lang, "fr");
  assert.equal(demos.fr.liveAI, false);
  assert.match(shown, /Exemple statique/);
  assert.match(shown, /pas une intelligence artificielle réelle/);
  assert.match(shown, /pas une page personnalisée/);
  assert.match(shown, /000 000 000/);
  assert.doesNotMatch(html, /TÜV|tüv|tuev|MFK|contrôle technique/i);
  assert.doesNotMatch(shown, /France|Suisse|Schweiz|Paris|Lyon|Marseille|Genève|Geneve|Lausanne|Zurich|Zürich|Berne|\bBern\b|Bâle|Bale|Romandie|€|CHF|\bEUR\b|\bUSD\b|\$/i);
  assert.doesNotMatch(shown, /\+\d/);
  assert.match(html, /\[\?&#\]interno=\(\[01\]\)/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /function bollaStore/);
  assert.equal(redirectScript(html), redirectScript(pages.en));
});

test("the concesionarios entry keeps Italian by default and can open French", () => {
  const html = read("concesionarios/index.html");
  assert.match(html, /href="it\/"/);
  assert.match(html, /href="en\/"/);
  assert.match(html, /href="de\/"/);
  assert.match(html, /href="es\/"/);
  assert.match(html, /href="fr\/"/);
  assert.match(html, /location\.search/);
  assert.doesNotMatch(html, /gc\.zgo\.at\/count\.js/);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  function go(search, languages) {
    let replaced = "";
    const sandbox = {
      location: { search, hash: "#note", replace(url) { replaced = url; } },
      URLSearchParams,
      navigator: { languages, language: languages[0] || "" },
    };
    vm.createContext(sandbox);
    vm.runInContext(script, sandbox);
    return replaced;
  }
  assert.equal(go("", ["it-IT"]), "it/#note");
  assert.equal(go("", ["en-US"]), "it/#note");
  assert.equal(go("", ["de-CH"]), "it/#note");
  assert.equal(go("", ["es-ES"]), "it/#note");
  assert.equal(go("?p=camp-1&internal=1", ["en"]), "it/?p=camp-1&internal=1#note");
  assert.equal(go("", ["fr-CH", "fr"]), "fr/#note");
  assert.equal(go("?p=camp-1&internal=1", ["fr-FR"]), "fr/?p=camp-1&internal=1#note");
  assert.equal(go("?lang=fr&p=camp-1", ["en-US"]), "fr/?lang=fr&p=camp-1#note");
  assert.equal(go("?lang=en&p=camp-1", ["fr-FR"]), "it/?lang=en&p=camp-1#note");
});

function prospectMap(html) {
  const dest = redirectScript(html).match(/var DEST=(\{.*?\});/);
  assert.ok(dest, "hashed map missing");
  return JSON.parse(dest[1]);
}

test("the prospect redirect publishes 133 hashes and no plaintext slug keys", () => {
  const map = prospectMap(pages.en);
  const keys = Object.keys(map);
  assert.equal(keys.length, 133);
  for (const key of keys) assert.match(key, /^[0-9a-f]{16}$/, key);
  for (const path of Object.values(map)) {
    assert.match(path, /^\/[a-z0-9-]+\/[a-z]{2}\/$/);
    assert.doesNotMatch(path, /\?/);
  }
  assert.equal(redirectScript(pages.de), redirectScript(pages.en));
  assert.equal(redirectScript(pages.fr), redirectScript(pages.en));
  assert.equal(map.fcad07227666865f, "/hotel-ch/de/");
  assert.equal(map.d26d1440d5da6449, "/immobilien-ch/de/");
  assert.equal(map["1a4116d708f47e62"], "/ferienwohnung-ch/fr/");
  assert.equal(map["5545d17a893e80a8"], "/fahrschule-ch/de/");
  assert.equal(map.ecae45dad3a7108a, "/zahnarzt-ch/de/");
});

test("no file served by Pages contains one of the 133 prospect slugs", () => {
  const banned = new Set(Object.keys(prospectMap(pages.en)));
  assert.equal(banned.size, 133);
  const rootDir = new URL(".", repo).pathname;
  const files = execFileSync("git", ["ls-files", "-z"], { cwd: rootDir, encoding: "utf8" }).split("\0").filter(Boolean);
  assert.ok(files.length > 500);
  const hits = [];
  for (const file of files) {
    const runs = readFileSync(join(rootDir, file)).toString("latin1").toLowerCase().match(/[a-z0-9_-]{7,200}/g) || [];
    for (const run of runs) {
      const max = Math.min(run.length, 32);
      for (let len = 7; len <= max; len++) {
        for (let i = 0; i + len <= run.length; i++) {
          const token = run.slice(i, i + len);
          const hash = createHash("sha256").update("bolla-p-v1:" + token).digest("hex").slice(0, 16);
          if (banned.has(hash)) hits.push(file);
        }
      }
    }
  }
  assert.deepEqual([...new Set(hits)], []);
});

function redirectScript(html) {
  const match = html.match(/<script id="bolla-p-redirect">([\s\S]*?)<\/script>/);
  assert.ok(match, "redirect script missing");
  return match[1];
}

async function land(search, useSubtle) {
  let replaced = "";
  const sandbox = {
    location: { search, replace(url) { replaced = url; } },
    URLSearchParams,
    TextEncoder,
    Uint8Array,
    Promise,
    crypto: useSubtle ? globalThis.crypto : undefined,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(redirectScript(pages.en), sandbox, { filename: "bolla-p-redirect.js" });
  if (sandbox.__bollaRedirect) await sandbox.__bollaRedirect;
  return replaced;
}

test("a synthetic label does not redirect, and a hashed label does", async () => {
  const synthetic = "ejemplo-sintetico";
  assert.equal(await land("?p=" + synthetic, true), "");
  assert.equal(await land("?p=" + synthetic, false), "");
  assert.equal(await land("?p=" + synthetic + "&internal=1", false), "");
  assert.equal(await land("", true), "");
  const hex = createHash("sha256").update("bolla-p-v1:" + synthetic).digest("hex").slice(0, 16);
  const code = redirectScript(pages.en).replace(/var DEST=\{.*?\}/, `var DEST={"${hex}":"/hotel-ch/de/"}`);
  async function landCode(search, useSubtle) {
    let replaced = "";
    const sandbox = {
      location: { search, replace(url) { replaced = url; } },
      URLSearchParams,
      TextEncoder,
      Uint8Array,
      Promise,
      crypto: useSubtle ? globalThis.crypto : undefined,
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: "bolla-p-redirect.js" });
    if (sandbox.__bollaRedirect) await sandbox.__bollaRedirect;
    return replaced;
  }
  const expected = "/hotel-ch/de/?p=" + synthetic;
  assert.equal(await landCode("?p=" + synthetic, true), expected);
  assert.equal(await landCode("?p=" + synthetic.toUpperCase(), false), expected);
  assert.equal(await landCode("?p=" + synthetic + "&internal=1", true), expected + "&internal=1");
  assert.equal(await landCode("?p=" + synthetic + "&internal=0", false), expected);
});
