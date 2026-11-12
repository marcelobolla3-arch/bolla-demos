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

function visible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<nav class="langs"[\s\S]*?<\/nav>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function redirectTarget(search, languages) {
  const html = read("hotel/index.html");
  const match = html.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/);
  assert.ok(match, "redirect script missing");
  let replaced = "";
  const sandbox = {
    location: {
      search,
      hash: "",
      replace(url) { replaced = url; },
    },
    navigator: { languages, language: languages[0] || "en" },
    URLSearchParams,
  };
  vm.createContext(sandbox);
  vm.runInContext(match[1], sandbox);
  return replaced;
}

const html = read("hotel/es/index.html");
const demo = loadDemo(html, "hotel/es/index.html");
const pack = packOf(html);

test("hotel/es uses the whole-word matcher, the hotel counter, and does not book", () => {
  const script = sectorScript(html);
  assert.match(script, /\\p\{L\}/);
  assert.doesNotMatch(script, /indexOf\(nk\)/);
  assert.equal(demo.liveAI, false);
  assert.equal(demo.mode, "static-example");
  assert.equal(demo.lang, "es");
  assert.match(html, /<html lang="es"/);
  assert.match(html, /var BASE="\/bolla-demo-hotel\/es"/);
  assert.match(html, /title:"hotel demo es"/);
  assert.match(html, /s\.src="https:\/\/gc\.zgo\.at\/count\.js"/);
  assert.match(html, /skipgc/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);
  assert.match(html, /path:BASE\+'\/'\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /bsTrack\("\/chat\/" \+ r\.id, "example"\)/);
  assert.match(html, /bsTrack\("\/request\/confirm", "example"\)/);
  assert.doesNotMatch(html, /bsTrack\([^)]*input\.value/);
  assert.doesNotMatch(html, /method\s*=\s*["']post["']/i);
  assert.match(html, /onsubmit="return false"/);
  assert.match(html, /Solo ejemplo: no se ha reservado ni enviado nada/);
  const submit = script.match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
  assert.ok(submit);
  assert.doesNotMatch(submit[0], /bsTrack/);
  assert.match(submit[0], /preventDefault/);
  assert.match(submit[0], /answerFor\(q\)/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.match(html, /liveAI:\s*false/);
  assert.match(pack.ok, /Solo ejemplo: no se ha reservado ni enviado nada/);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").priority, true);
});

test("hotel/es answerFor covers the script and refuses traps, prices and off-script questions", () => {
  const cases = [
    ["check-in", "checkin"],
    ["check-out", "checkin"],
    ["¿A qué hora es la entrada?", "checkin"],
    ["desayuno", "breakfast"],
    ["desayunos", "breakfast"],
    ["parking", "parking"],
    ["aparcamiento", "parking"],
    ["perro", "dogs"],
    ["perros", "dogs"],
    ["mascota", "dogs"],
    ["wifi", "wifi"],
    ["precio", "rooms"],
    ["precios", "rooms"],
    ["disponibilidad", "rooms"],
    ["¿hay habitaciones?", "rooms"],
    ["cancelación", "cancel"],
    ["cancelar", "cancel"],
    ["¿se puede filmar?", "fallback"],
    ["¿es buena inversión?", "fallback"],
    ["ajedrez", "fallback"],
    ["Japón", "fallback"],
    ["hay un incendio", "emergency"],
    ["mi padre no respira", "emergency"],
    ["emergencia", "emergency"],
    ["herido", "emergency"],
    ["se ha caído", "emergency"],
    ["ambulancia", "emergency"],
    ["desayunador", "fallback"],
    ["parkinson", "fallback"],
    ["wifiiii", "fallback"],
    ["perrera", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);

  const off = demo.answerFor("ajedrez");
  assert.match(off.text, /ejemplo escrito/);
  assert.match(off.text, /no está cubierta/);
  assert.match(off.text, /respondería el hotel/);
  assert.doesNotMatch(off.text, /112/);

  const emergency = demo.answerFor("hay un incendio");
  assert.match(emergency.text, /Llamen ya al 112/);
  assert.doesNotMatch(emergency.text, /extintor|evacue|primeros auxilios|compresiones|salga por|protocolo es el siguiente/i);
  const breath = demo.answerFor("mi padre no respira");
  assert.equal(breath.id, "emergency");
  assert.match(breath.text, /112/);

  const price = demo.answerFor("precio");
  assert.doesNotMatch(price.text, /€|\b\d+\s*euros?\b|desde\s+\d+/i);
  assert.match(price.text, /no están inventados|No indico ni el precio/i);
  const availability = demo.answerFor("disponibilidad");
  assert.match(availability.text, /disponibilidad/);
  assert.doesNotMatch(availability.text, /queda una|última habitación|está libre/i);
  const cancel = demo.answerFor("cancelación");
  assert.match(cancel.text, /confirma el hotel/);
  assert.doesNotMatch(cancel.text, /48 horas|%|sin cargo|reembols/i);
  assert.match(html, /ficticio/);
  assert.match(html, /ejemplo escrito/);
  assert.match(html, /no un asistente en vivo/);
});

test("Spanish redirect is added without changing et, ru or en, and the other hotel pages only gain Español", () => {
  assert.equal(redirectTarget("", ["et-EE", "et"]), "et/");
  assert.equal(redirectTarget("", ["ru-RU"]), "ru/");
  assert.equal(redirectTarget("", ["en-GB", "en"]), "en/");
  assert.equal(redirectTarget("", ["en", "es"]), "en/");
  assert.equal(redirectTarget("", ["fr-FR"]), "en/");
  assert.equal(redirectTarget("", ["es-ES", "es"]), "es/");
  assert.equal(redirectTarget("?lang=et", ["es-ES"]), "et/");
  assert.equal(redirectTarget("?lang=ru", ["es-ES"]), "ru/");
  assert.equal(redirectTarget("?lang=en", ["es-ES"]), "en/");
  assert.equal(redirectTarget("?lang=es", ["en-GB"]), "es/");
  assert.equal(redirectTarget("?p=tallinn&internal=1", ["et"]), "et/?p=tallinn&internal=1");
  assert.equal(redirectTarget("?p=es-hotel-xxx&internal=1", ["es-ES"]), "es/?p=es-hotel-xxx&internal=1");

  for (const lang of ["en", "et", "ru"]) {
    const page = read(`hotel/${lang}/index.html`);
    assert.doesNotMatch(page, /data-keep-query/);
    assert.match(page, /n\.indexOf\(nk\)/);
    assert.doesNotMatch(page, /function tokensOf/);
    assert.match(page, new RegExp(`var BASE="/bolla-demo-hotel/${lang}"`));
  }
  const shown = visible(html);
  assert.doesNotMatch(shown, /\b(scripted|please|hello|breakfast|booking|double room|sample guest|check-in|check-out|parking)\b/i);
  assert.match(shown, /Hotel de Ejemplo/);
  assert.match(shown, /Solo ejemplo: no se ha reservado ni enviado nada/);
  assert.doesNotMatch(read("hotel/es/index.html"), /es-alojamiento/);
});
