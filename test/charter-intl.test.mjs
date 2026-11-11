import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root));
}

function text(path) {
  return read(path).toString("utf8");
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

function bootCounter(html, href, store = new Map()) {
  const metrics = html.match(/<script>\s*(\(function\(\)\{\s*var BASE=[\s\S]*?\}\)\(\);)\s*<\/script>/);
  assert.ok(metrics, "counter script missing");
  const url = new URL(href);
  const created = [];
  const scriptEl = {
    async: false,
    attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name]; },
  };
  const context = {
    document: {
      createElement() { return scriptEl; },
      head: { appendChild(node) { created.push(node); } },
    },
    location: { search: url.search, hash: url.hash, href },
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); },
    },
    decodeURIComponent,
  };
  context.window = context;
  vm.runInNewContext(metrics[1], context, { filename: "metrics.js" });
  return { created, scriptEl, window: context, store };
}

function keepQuery(html, href) {
  const source = html.match(/<script id="bolla-lang-links">([\s\S]*?)<\/script>/)[1];
  const url = new URL(href);
  const links = [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*data-keep-query[^>]*>/g)].map((match) => ({
    href: match[1],
  }));
  const document = {
    querySelectorAll() {
      return links.map((link) => ({
        getAttribute() { return link.href; },
        set href(value) { link.href = value; },
        get href() { return link.href; },
      }));
    },
  };
  const context = { document, location: url, URL };
  vm.runInNewContext(source, context, { filename: "lang-links.js" });
  return links.map((link) => link.href);
}

const kept = {
  "charter/index.html": "6f67d34e0e35b4d7d717951909513212d4cfb974e7c35530f8a8bbdb8ba92863",
  "charter/en/index.html": "72e319be2c9c5c74cc6b37054220e9af63c62023790d6fd6549ec1afff89211c",
  "charter/et/index.html": "3f38a1f2776a42f42bc27e9881882596f01292d9bfceb8614c21af19274b1ccf",
  "charter-de/index.html": "f34b85dbc85e360d98a0b608e9b38463ccd06647929c1243d128f6d0fef76154",
  "charter-de/de/index.html": "cc7c68c4868f8fd7f650cbfbe2299396c366427f21e9895948a57bd4da25a01a",
  "charter-de/en/index.html": "05d5d6456dfcdd7a2c8a6afe478d154f35a342d02baab5161ff5598dc847b6c4",
};

test("sent charter-intl routes stay byte-identical to main", () => {
  const sent = {
    "charter-intl/en/index.html": "60a42d5aedaa741885a974a2d505031221085d19fbf9d209e50b04fb27bd9f02",
    "charter-intl/es/index.html": "a320efe9db4da5f1830722d8e7c1c5c0ddf047714bac46da1b1c3c6b4e95a0c6",
    "charter-intl/fr/index.html": "a7d10253f89d4a0d937314344426bb9312748c35062bc80342b568c9fc39f096",
    "charter-intl/index.html": "4ed2bde63b144b9cc418e029d3b71c1c180854673f49b0472a0695aa38c2cc93",
  };
  for (const [path, hash] of Object.entries(sent)) {
    assert.equal(createHash("sha256").update(read(path)).digest("hex"), hash, path);
  }
});

test("sent charter and charter-de pages stay byte-identical", () => {
  for (const [path, hash] of Object.entries(kept)) {
    assert.equal(createHash("sha256").update(read(path)).digest("hex"), hash, path);
  }
  assert.match(text("charter/en/index.html"), /Tallinn/);
  assert.match(text("charter/en/index.html"), /Estonian/);
});

test("charter-intl pages are generic, fictional, and keep the Unicode matcher", () => {
  const source = matcherBlock(text("charter/en/index.html"));
  assert.match(source, /\\p\{L\}/);
  assert.doesNotMatch(source, /indexOf\(nk\)/);
  for (const path of ["charter-intl/en/index.html", "charter-intl/fr/index.html", "charter-intl/es/index.html"]) {
    const html = text(path);
    assert.equal(matcherBlock(html), source, path);
    assert.doesNotMatch(html, /Tallinn|Eston|\+372|Pirita|Baltic|Eesti|Italia|italiano|Roma|Milán/i, path);
    assert.doesNotMatch(html, /\+\d{1,3}\s+\d/, path);
    assert.match(html, /000 000 0000/);
    assert.doesNotMatch(html, /Mediterranean|Méditerranée|Mediterráneo|Caribbean|Caraïbes|Caribe|Australia|Australie|Oceanía|North America|Amérique du Nord|América del Norte/);
    assert.match(html, /not set in one city or country|aucune ville ni à aucun pays|una ciudad ni en un país/);
    assert.match(html, /fictional|fictif|ficticio/i);
    assert.match(html, /112/);
    assert.match(html, /local emergency number|numéro d’urgence local|número de emergencia local/);
    assert.doesNotMatch(html, /€|\$\d|\bUSD\b|\bAUD\b|\bEUR\b/);
    assert.match(html, /data-keep-query/);
    assert.match(html, /liveAI:\s*false/);
    assert.doesNotMatch(sectorScript(html), /bsTrack\([^)]*input\.value/);
    const submit = sectorScript(html).match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
    assert.ok(submit, path);
    assert.doesNotMatch(submit[0], /bsTrack/);
    assert.match(submit[0], /preventDefault/);
  }
  const fr = text("charter-intl/fr/index.html");
  const frProse = fr
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<script id="sector-demo">[\s\S]*?<\/script>/g, " ")
    .replace(/<script id="bolla-lang-links">[\s\S]*?<\/script>/g, " ")
    .replace(/<script>\s*\(function\(\)\{\s*var BASE=[\s\S]*?<\/script>/g, " ");
  assert.match(fr, /lang="fr"/);
  assert.match(frProse, /\bvous\b/i);
  assert.match(frProse, /Veuillez/);
  assert.doesNotMatch(frProse, /\b(tu|toi|ton|ta|tes)\b/);
  assert.match(fr, /href="\.\.\/en\/"/);
  assert.match(text("charter-intl/en/index.html"), /href="\.\.\/fr\/"/);
  const es = text("charter-intl/es/index.html");
  const esProse = es
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<script id="sector-demo">[\s\S]*?<\/script>/g, " ")
    .replace(/<script id="bolla-lang-links">[\s\S]*?<\/script>/g, " ")
    .replace(/<script>\s*\(function\(\)\{\s*var BASE=[\s\S]*?<\/script>/g, " ");
  assert.match(es, /lang="es"/);
  assert.match(esProse, /de usted/);
  assert.match(esProse, /Escriba/);
  assert.doesNotMatch(esProse, /\b(puedes|tienes|quieres|vosotros|tú|pulsa|vos)\b/i);
  assert.match(es, /href="\.\.\/en\/"/);
  assert.match(es, /href="\.\.\/fr\/"/);
  assert.match(text("charter-intl/en/index.html"), /href="\.\.\/es\/"/);
  assert.match(fr, /href="\.\.\/es\/"/);
});

test("French whole words refuse false friends and emergencies stay at 112", () => {
  const html = text("charter-intl/fr/index.html");
  const demo = loadDemo(html, "charter-intl/fr/index.html");
  const cases = [
    ["Y a-t-il un cours de voile ?", "course"],
    ["Avez-vous des stages ?", "course"],
    ["Que se passe-t-il au cours de la journée ?", "fallback"],
    ["Je dois faire les courses", "fallback"],
    ["Quel est le parcours ?", "fallback"],
    ["Un discours et un concours", "fallback"],
    ["Le stagiaire arrive demain", "fallback"],
    ["Peut-on demander un catamaran ?", "yacht"],
    ["Avez-vous un voilier ?", "yacht"],
    ["Un noyer est dans le jardin", "fallback"],
    ["Un noyau dur", "fallback"],
    ["Nous sommes quatre", "party"],
    ["Le personnel du port", "fallback"],
    ["Et si le vent est fort ?", "weather"],
    ["Et si le temps est mauvais ?", "weather"],
    ["En cas de mauvais temps", "weather"],
    ["Quel temps fait-il ?", "weather"],
    ["Nous partons en même temps", "fallback"],
    ["J’ai du temps libre", "fallback"],
    ["Depuis quelque temps", "fallback"],
    ["La vente est ouverte", "fallback"],
    ["J’ai mal au ventre", "fallback"],
    ["Une grande aventure", "fallback"],
    ["Temps orageux", "weather"],
    ["Avez-vous des gilets de sauvetage ?", "safety"],
    ["Un gilet de costume", "fallback"],
    ["L’urgentiste du quartier", "fallback"],
    ["Homme à la mer", "emergency"],
    ["Quelqu’un se noie", "emergency"],
    ["C’est une urgence", "emergency"],
    ["Un client est blessé", "emergency"],
    ["Une blessure à la main", "emergency"],
    ["Peut-on filmer à bord ?", "fallback"],
    ["Est-ce un bon investissement ?", "fallback"],
    ["Quel est le prix ?", "price"],
    ["Un skipper est-il inclus ?", "skipper"],
    ["Y a-t-il une caution ?", "deposit"],
    ["Que se passe-t-il en cas d’annulation ?", "cancel"],
    ["Quel est le prix d’une urgence ?", "emergency"],
    ["Y a-t-il le wifi ?", "fallback"],
    ["Peut-on jouer aux échecs ?", "fallback"],
    ["Naviguez-vous jusqu’au Japon ?", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const off = demo.answerFor("Peut-on jouer aux échecs ?");
  assert.match(off.text, /exemple écrit/);
  assert.match(off.text, /ne couvre pas/);
  assert.match(off.text, /répondrait/);
  const emergency = demo.answerFor("Homme à la mer");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /numéro d’urgence local/);
  assert.doesNotMatch(emergency.text, /bouée|sautez|lancez|corde|protocole|gilet/i);
  for (const id of ["price", "skipper", "deposit", "cancel"]) {
    const answer = demo.answerFor(packOf(html).rules.find((rule) => rule.id === id).button);
    assert.equal(answer.id, id);
    assert.match(answer.text, /L’entreprise dirait/);
    assert.doesNotMatch(answer.text, /\d/);
  }
  const weather = packOf(html).rules.find((rule) => rule.id === "weather");
  assert.ok(weather.keys.includes("temps est mauvais"));
  assert.ok(!weather.keys.includes("temps"));
  assert.equal(packOf(html).rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(demo.liveAI, false);
});

test("Spanish whole words refuse false friends and name no country or phone", () => {
  const html = text("charter-intl/es/index.html");
  const demo = loadDemo(html, "charter-intl/es/index.html");
  const cases = [
    ["¿Hay un curso de vela?", "course"],
    ["Quiero aprender a navegar", "course"],
    ["En el curso del día", "fallback"],
    ["Quiero hacer las compras", "fallback"],
    ["¿Se puede consultar por un catamarán?", "yacht"],
    ["Un velero", "yacht"],
    ["Somos cuatro", "party"],
    ["El personal del puerto", "fallback"],
    ["¿Y si el viento es fuerte?", "weather"],
    ["¿Y si el tiempo está malo?", "weather"],
    ["Tengo tiempo libre", "fallback"],
    ["Al mismo tiempo", "fallback"],
    ["Me duele el vientre", "fallback"],
    ["¿Tienen chalecos salvavidas?", "safety"],
    ["Un chaleco de traje", "fallback"],
    ["Hombre al agua", "emergency"],
    ["Alguien se ahoga", "emergency"],
    ["Es una emergencia", "emergency"],
    ["Un cliente está herido", "emergency"],
    ["Una palabra adherida", "fallback"],
    ["¿Se puede filmar a bordo?", "fallback"],
    ["¿Es una buena inversión?", "fallback"],
    ["¿Cuál es el precio?", "price"],
    ["Es un regalo precioso", "fallback"],
    ["Aprecio su trabajo", "fallback"],
    ["¿El patrón está incluido?", "skipper"],
    ["¿Hay una fianza?", "deposit"],
    ["¿Qué pasa si cancelamos?", "cancel"],
    ["¿Cuál es el precio de una emergencia?", "emergency"],
    ["¿Hay wifi?", "fallback"],
    ["¿Se puede jugar al ajedrez?", "fallback"],
    ["¿Navegan hasta Japón?", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const off = demo.answerFor("¿Se puede jugar al ajedrez?");
  assert.match(off.text, /ejemplo escrito/);
  assert.match(off.text, /no cubre/);
  assert.match(off.text, /respondería/);
  const emergency = demo.answerFor("Hombre al agua");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /número de emergencia local/);
  assert.doesNotMatch(emergency.text, /boya|salte|cuerda|protocolo|chaleco/i);
  for (const id of ["price", "skipper", "deposit", "cancel"]) {
    const answer = demo.answerFor(packOf(html).rules.find((rule) => rule.id === id).button);
    assert.equal(answer.id, id);
    assert.match(answer.text, /La empresa diría/);
    assert.doesNotMatch(answer.text, /\d/);
  }
  assert.equal(packOf(html).rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(demo.liveAI, false);
  assert.doesNotMatch(html, /Italia|Tallinn|\+39|\+372/);
  assert.match(html, /nombre@ejemplo\.com/);
  assert.match(html, /marcelo@bollastudio\.com/);
});

test("German whole words use Sie and name no country or sea", () => {
  const html = text("charter-intl/de/index.html");
  const demo = loadDemo(html, "charter-intl/de/index.html");
  assert.equal(matcherBlock(html), matcherBlock(text("charter/en/index.html")));
  const cases = [
    ["Gibt es einen Segelkurs?", "course"],
    ["Ich möchte segeln lernen", "course"],
    ["Im Laufe des Tages", "fallback"],
    ["Kann man einen Katamaran anfragen?", "yacht"],
    ["Ein Segelboot", "yacht"],
    ["Wir sind zu viert", "party"],
    ["Das Personal im Hafen", "fallback"],
    ["Und wenn der Wind stark ist?", "weather"],
    ["Und wenn das Wetter schlecht ist?", "weather"],
    ["Ich habe Zeit", "fallback"],
    ["Zur gleichen Zeit", "fallback"],
    ["Mir tut der Bauch weh", "fallback"],
    ["Haben Sie Rettungswesten?", "safety"],
    ["Eine Weste zum Anzug", "fallback"],
    ["Mann über Bord", "emergency"],
    ["Jemand ertrinkt", "emergency"],
    ["Das ist ein Notfall", "emergency"],
    ["Ein Gast ist verletzt", "emergency"],
    ["Wie hoch ist der Preis?", "price"],
    ["Das ist preiswert", "fallback"],
    ["Ist ein Skipper dabei?", "skipper"],
    ["Gibt es eine Kaution?", "deposit"],
    ["Was passiert, wenn wir stornieren?", "cancel"],
    ["Was kostet ein Notfall?", "emergency"],
    ["Gibt es WLAN?", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const emergency = demo.answerFor("Mann über Bord");
  assert.match(emergency.text, /112/);
  assert.match(emergency.text, /örtliche Notrufnummer/);
  assert.doesNotMatch(emergency.text, /Rettungsring|springen|Seil|Protokoll/i);
  for (const id of ["price", "skipper", "deposit", "cancel"]) {
    const answer = demo.answerFor(packOf(html).rules.find((rule) => rule.id === id).button);
    assert.equal(answer.id, id);
    assert.match(answer.text, /Das Unternehmen würde/);
    assert.doesNotMatch(answer.text, /\d/);
  }
  assert.equal(demo.liveAI, false);
  assert.doesNotMatch(html, /Mittelmeer|Karibik|Europa|Deutschland|\bBerlin\b|Tallinn|Mediterraneo|France|Italia|\+49|€/);
  assert.match(html, /keiner Stadt und keinem Land/);
  assert.match(html, /\bSie\b/);
  assert.doesNotMatch(html, /mit Sie/);
  assert.match(html, /<title>Beispielgespräch für einen Segelcharter · BOLLA STUDIO<\/title>/);
  assert.match(html, /weiß|große/);
  assert.doesNotMatch(html, /weiss|grosse/);
  assert.doesNotMatch(html.replace(/<script[\s\S]*?<\/script>/g, " "), /\b(du|dein|deine|dir|dich)\b/i);
  assert.match(html, /href="\.\.\/en\/"/);
  assert.doesNotMatch(text("charter-intl/en/index.html") + text("charter-intl/fr/index.html") + text("charter-intl/es/index.html"), /href="\.\.\/de\/"/);
});

test("English intl page keeps the charter boundaries and names no city", () => {
  const demo = loadDemo(text("charter-intl/en/index.html"), "charter-intl/en/index.html");
  const cases = [
    ["Can we film on board?", "fallback"],
    ["Is this a good investment?", "fallback"],
    ["someone fell overboard", "emergency"],
    ["man overboard", "emergency"],
    ["He is drowning", "emergency"],
    ["A guest is injured", "emergency"],
    ["What if the weather is bad?", "weather"],
    ["Do you have a lifejacket?", "safety"],
    ["Is there a window?", "fallback"],
    ["Do you offer training?", "course"],
    ["Can I learn to sail?", "course"],
    ["Are there lessons?", "course"],
    ["Of course I like boats", "fallback"],
    ["Is a costume allowed?", "fallback"],
    ["What is the price?", "price"],
    ["Is a skipper included?", "skipper"],
    ["Is there a deposit?", "deposit"],
    ["What if we cancel?", "cancel"],
    ["What is the price of an emergency?", "emergency"],
    ["There are ten of us", "party"],
    ["Is there a sailing course?", "course"],
    ["Can we play chess?", "fallback"],
    ["Do you sail to Japan?", "fallback"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  const emergency = demo.answerFor("man overboard");
  assert.match(emergency.text, /local emergency number/);
  assert.match(emergency.text, /112/);
  assert.doesNotMatch(emergency.text, /lifebuoy|throw a rope|do not jump|protocol/i);
  const off = demo.answerFor("Can we play chess?");
  assert.match(off.text, /does not cover that question/);
  assert.match(off.text, /business would answer/);
  const page = text("charter-intl/en/index.html");
  const course = packOf(page).rules.find((rule) => rule.id === "course");
  assert.deepEqual(course.keys, ["sailing course", "lesson", "lessons", "learn to sail", "training"]);
  assert.ok(!(course.roots || []).includes("course"));
  for (const id of ["price", "skipper", "deposit", "cancel"]) {
    const answer = demo.answerFor(packOf(page).rules.find((rule) => rule.id === id).button);
    assert.equal(answer.id, id);
    assert.match(answer.text, /The company would say/);
    assert.doesNotMatch(answer.text, /\d/);
  }
});

test("counted paths keep au-uwin style tags, skip internal, and language links keep the query", () => {
  const tags = ["au-uwin", "ca-highwaymotors", "us-balzekas"];
  const pages = [
    ["charter-intl/en/index.html", "/bolla-demo-charter-intl/en", "charter-intl demo en"],
    ["charter-intl/fr/index.html", "/bolla-demo-charter-intl/fr", "charter-intl demo fr"],
    ["charter-intl/es/index.html", "/bolla-demo-charter-intl/es", "charter-intl demo es"],
    ["charter-intl/de/index.html", "/bolla-demo-charter-intl/de", "charter-intl demo de"],
  ];
  for (const [path, base, title] of pages) {
    const html = text(path);
    for (const tag of tags) {
      const page = bootCounter(html, `http://127.0.0.1/${path.replace("index.html", "")}?p=${tag}`);
      const hits = [];
      page.window.goatcounter.count = (row) => hits.push(row);
      page.scriptEl.onload();
      page.window.bsTrack("/chat/course", "example");
      page.window.bsTrack("/request/confirm", "example");
      assert.equal(hits[0].path, `${base}/?p=${tag}`);
      assert.equal(hits[0].title, title);
      assert.equal(hits[0].event, undefined);
      assert.equal(hits[1].path, `${base}/chat/course?p=${tag}`);
      assert.equal(hits[1].title, "example");
      assert.equal(hits[1].event, true);
      assert.equal(hits[2].path, `${base}/request/confirm?p=${tag}`);
      assert.equal(hits[2].title, "example");
      assert.equal(hits[2].event, true);
      assert.doesNotMatch(JSON.stringify(hits), /secret@|Guest Name|000 000 0000/);
    }
    const dirty = bootCounter(html, `http://127.0.0.1/charter-intl/en/?p=AU_Uwin!!`);
    const dirtyHits = [];
    dirty.window.goatcounter.count = (row) => dirtyHits.push(row);
    dirty.scriptEl.onload();
    assert.equal(dirtyHits[0].path, `${base}/?p=auuwin`);
    const blocked = bootCounter(html, `http://127.0.0.1/charter-intl/en/?p=au-uwin&internal=1`);
    assert.equal(blocked.created.length, 0);
    assert.equal(blocked.store.get("skipgc"), "t");
    blocked.window.goatcounter = { count() { throw new Error("counted while internal"); } };
    blocked.window.bsTrack("/chat/course", "example");
    blocked.window.bsTrack("/request/confirm", "example");
    const links = keepQuery(html, `http://127.0.0.1/${path.replace("index.html", "")}?p=us-balzekas&internal=1`);
    assert.ok(links.some((href) => href.includes("p=us-balzekas") && href.includes("internal=1")));
    assert.ok(links.some((href) => href.includes("/charter-intl/en/") || href.endsWith("/en/") || href.includes("/en/?")));
    assert.ok(links.some((href) => href.includes("/fr/") || href.includes("/fr?")));
    assert.ok(links.some((href) => href.includes("/es/") || href.includes("/es?")));
  }
});

test("the charter-intl entry keeps the campaign query and does not count", () => {
  const html = text("charter-intl/index.html");
  assert.doesNotMatch(html, /gc\.zgo\.at\/count\.js/);
  assert.match(html, /location\.search/);
  function go(search, languages) {
    const source = html.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/)[1];
    let replaced = "";
    const sandbox = {
      location: { search, hash: "", replace(url) { replaced = url; } },
      navigator: { languages, language: languages[0] },
      URLSearchParams,
    };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    return replaced;
  }
  assert.equal(go("", ["en-US"]), "en/");
  assert.equal(go("", ["fr-FR"]), "fr/");
  assert.equal(go("", ["es-MX", "es"]), "es/");
  assert.equal(go("", ["de-DE"]), "en/");
  assert.equal(go("?lang=de&p=au-uwin", ["en-US"]), "en/?p=au-uwin");
  assert.equal(go("", ["en", "es"]), "en/");
  assert.equal(go("?p=au-uwin&internal=1", ["en"]), "en/?p=au-uwin&internal=1");
  assert.equal(go("?lang=fr&p=ca-highwaymotors", ["en-US"]), "fr/?p=ca-highwaymotors");
  assert.equal(go("?lang=es&p=au-uwin", ["fr-FR"]), "es/?p=au-uwin");
  assert.equal(go("?lang=et&p=us-balzekas", ["en"]), "en/?p=us-balzekas");
});
