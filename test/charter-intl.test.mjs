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
  "charter/en/index.html": "5940b13def586242cb2d885c3f5a0ee474ade2d651a2858662ad10b2d73842e2",
  "charter/et/index.html": "8098d7141c78164fddf4d8759aaa7a1426da10c07f92ba09857f01f69a08308f",
  "charter-de/index.html": "f34b85dbc85e360d98a0b608e9b38463ccd06647929c1243d128f6d0fef76154",
  "charter-de/de/index.html": "09de5f1ea76c0db09ae152c8b49f5bfe5d1f46b3c24a63b4477d77f1a0e55427",
  "charter-de/en/index.html": "887c15ee4cec223a4eaa1815fa39b0c618e2849ff6b8012b519a58895dfe48af",
};

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
  for (const path of ["charter-intl/en/index.html", "charter-intl/fr/index.html"]) {
    const html = text(path);
    assert.equal(matcherBlock(html), source, path);
    assert.doesNotMatch(html, /Tallinn|Eston|\+372|Pirita|Baltic|Eesti/i, path);
    assert.doesNotMatch(html, /\+\d{1,3}\s+\d/, path);
    assert.match(html, /000 000 0000/);
    assert.match(html, /Mediterranean|Méditerranée/);
    assert.match(html, /Caribbean|Caraïbes/);
    assert.match(html, /Australia|Australie/);
    assert.match(html, /North America|Amérique du Nord/);
    assert.match(html, /fictional|fictif/i);
    assert.match(html, /112/);
    assert.match(html, /local emergency number|numéro d’urgence local/);
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
    ["Quel est le prix ?", "fallback"],
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
  assert.equal(packOf(html).rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(demo.liveAI, false);
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
    ["Do you offer training?", "fallback"],
    ["Is a costume allowed?", "fallback"],
    ["What is the price?", "fallback"],
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
});

test("counted paths keep au-uwin style tags, skip internal, and language links keep the query", () => {
  const tags = ["au-uwin", "ca-highwaymotors", "us-balzekas"];
  const pages = [
    ["charter-intl/en/index.html", "/bolla-demo-charter-intl/en", "charter-intl demo en"],
    ["charter-intl/fr/index.html", "/bolla-demo-charter-intl/fr", "charter-intl demo fr"],
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
  assert.equal(go("?p=au-uwin&internal=1", ["en"]), "en/?p=au-uwin&internal=1");
  assert.equal(go("?lang=fr&p=ca-highwaymotors", ["en-US"]), "fr/?p=ca-highwaymotors");
  assert.equal(go("?lang=et&p=us-balzekas", ["en"]), "en/?p=us-balzekas");
});
