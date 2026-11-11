import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const pagePath = "gastro-gruppe/de/index.html";
const html = readFileSync(new URL(pagePath, root), "utf8");
const entry = readFileSync(new URL("gastro-gruppe/index.html", root), "utf8");

const FULL_HASHES = [
  "9c8a27a54508cfde90ba049392d708fd79168972a3bd986f217e292ceb4d5bc5",
  "06c50cace1e8070fea385a5d9518551db17c29ad8cb33944a93fd5f7d3846932",
  "f769598a7bd07bf6d55cab601ad0f4b7712389ec75e8ef5fcecbd604301dfdf0",
  "1af3cd2d889f2fd2133fc229b27cff3ba4e1b2c3071b2e345955bdf337031a8b",
  "97d5d821ec92fe9a69c2b749f9c7c833dca1418d244a97e6ff6622f08f33972a",
  "f2063f2f5327d5e377cf6a4a39caf8d386c72cf19632e84047db62c24193fc95",
  "a9a95751399f4f4b964bae5d86bd40d7af94b084a512bcda603f09992fccdc9a",
  "cc356d1df5029c8ac32e8f069c4386c075dbbc444de3d84184c90f59bf2b539a",
  "46dd8d66513b26dbe10fa60c1fc9295410daac1d659533adaaeefcd660fdd9b9",
  "85d19c4753a138f4be3950b558e9471812a18005391a7b8b04bd0dcdd8190a94",
  "f11e77a1dc87040c3236a95925335e5583b6afd5c010553172b932fc9f62d4e7",
  "3d5ead9a066e7f130c88d1b8b94ef914e22fb891831979c105519afda87de4e7",
  "9b489a19c343055ec75c34ff80230a0e0ef8eec68b32803c6a24f33047a9700b",
  "569f4666ca342237c4ab936ec5cbec8aa0f61f48c3cc140fbc0b37778f725abd",
  "b49f3718f4d71644bc9179b21b5d518da91dc9d300f6bf7dfda5e7dc838c4a89",
  "c3e3a8b8049e9656edcf772f32c61263a0588118a9662bfd9b038fb438cdf09f",
  "b7b19cc749e50400c0181314e190eedc3408814ecd84c2976dd2558fc5d614f8",
  "21d7ee03b848001ff988f04a381dbf9a5bd444557e966ac768d90ef2313ae96e",
  "5188f4462b401eb4acaa42667f33b0c680cc0d6301908eb91c47236b95f24df9",
  "48431177fb4b4035fa040efcc159ca347e0078f843702c9a83f9a689925199c4",
  "e187ee03247c4bd245416b4a60bc295d85a75f59be9903874a7de85606b39064",
  "89a731a09bdae353cfd70b80f11a6bd2a1f74a750e522df18262162459e2add2",
  "9392f47f2f0ad280ac98544b991a1284523990b31ec607049e932b84558234d5",
  "df000d285559c0dd35d6cbdd79c3a766d21739c14b05fe9541dda8878621239b",
  "611f10281ebe2fe8c44e8447e75da41f4e9a26507bcc002a62fd75f7196cd386",
  "28289c494d3852f44f6529bccfe7cc90216e708451f80d7be65a3fbe0908773e",
  "6d9e56e75f54d346443d91678b7c8ac02a33cb596f3090f2a931ab632fd1c5ee",
  "970943a80aab8afe6ab329da730dae9003d591f27e5cf2d08da80677ab4f5c83",
  "c069d82be3f6fcd7b17aab01b66797c3fd439af32e31ad57906471fdf88e9580",
  "043caa772514ce3c4ff964368f26e79473d777d42270d0ab63972a38de432139",
  "3635075a021e36b4a1de854f63075914ca7a8271e9f6de6e452ee14747af7a80",
  "21d084c3fb6a5ed5d4e9c756590dd8d2b9e129383467682d643faa84ba5033da",
  "087c7acf29b0d9b6e2e3855bab78a4a14101757cc916a7fe31567227824764e4",
  "b2cfb3387586c35502fbe214a047124923e36db32bccd36a2643fb80e6673e77",
  "e64de651cd37c5c88b848e132ad6f976fff62446dbbb06c34784f5c254eb33a8",
  "946b064d666ee8bd49ffa073aa13822c8072d0259d0462aaf3cc9d0c4b1bbc30",
  "74b552199459bba87358289e3249068ccd0a8b71a495e6839e888c6d5cac0045",
  "bc1a63bc3687e0a3f6eae9c0b3bde2c60269f5f62d95dc0efaf216487b52202b",
  "c6898a4caba9fae5964d2e777d5edc49fae6dcbe03da78862e89fc27d37e7c14",
];

const ALLOWED_URLS = new Set([
  "https://bollastudio.com",
  "https://gc.zgo.at/count.js",
  "https://bollastudio.goatcounter.com/count",
  "https://www.peclard.net/de/ihr-anlass/ihr-anlass/",
  "https://www.peclard.net/de/unsere-betriebe/lulu/",
  "https://www.fonduezelt-lulu.ch/de/",
  "https://www.fonduezelt-lulu.ch/en/",
  "https://www.peclard.net/de/unsere-betriebe/coco-grill-bar/",
  "https://www.restaurant-coco.ch/",
  "https://www.peclard.net/de/ihr-anlass/coco-grill-bar/",
  "https://www.peclard.net/de/unsere-betriebe/fischers-fritz/",
  "https://www.fischers-fritz.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/fischers-fritz/",
  "https://www.peclard.net/de/unsere-betriebe/gasthof-luegeten/",
  "https://www.gasthof-luegeten.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/gasthof-luegeten/",
  "https://www.peclard.net/de/unsere-betriebe/hafenbeiz/",
  "https://www.hafenbeiz.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/hafenbeiz/",
  "https://www.peclard.net/de/unsere-betriebe/inselwirtschaft-ufnau/",
  "https://www.inselufnau.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/inselwirtschaft-ufnau/",
  "https://www.peclard.net/de/unsere-betriebe/kreuz-zug/",
  "https://www.kreuz-zug.ch/",
  "https://www.peclard.net/de/ihr-anlass/kreuz-zug/",
  "https://www.peclard.net/de/unsere-betriebe/lo/",
  "https://www.lo-horgen.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/lo/",
  "https://www.lulu-zh.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/lulu/",
  "https://www.peclard.net/de/unsere-betriebe/milchbar/",
  "https://www.milchbar.ch/",
  "https://www.peclard.net/de/ihr-anlass/milchbar/",
  "https://www.peclard.net/de/unsere-betriebe/moenchhof-am-see/",
  "https://www.moenchhof-am-see.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/moenchhof-am-see/",
  "https://www.peclard.net/de/unsere-betriebe/muensterhoefli/",
  "https://www.muensterhoefli.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/muensterhoefli/",
  "https://www.peclard.net/de/unsere-betriebe/portofino/",
  "https://www.portofino-am-see.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/portofino/",
  "https://www.peclard.net/de/unsere-betriebe/restaurant-kiosk/",
  "https://www.restaurant-kiosk.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/restaurant-kiosk/",
  "https://www.peclard.net/de/unsere-betriebe/restaurant-pumpstation/",
  "https://www.peclard.net/de/unsere-betriebe/rooftop-restaurant/",
  "https://www.ooo-zh.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/rooftop-restaurant/",
  "https://www.peclard.net/de/unsere-betriebe/schiffstation/",
  "https://www.schiffstation.ch/de/kontakt/",
  "https://www.peclard.net/de/unsere-betriebe/seebadi-richterswil/",
  "https://www.seebadi-richterswil.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/seebadi-richterswil/",
  "https://www.peclard.net/de/unsere-betriebe/straeme-kuesnacht/",
  "https://www.straeme-kuesnacht.ch/de/kontakt/",
  "https://www.peclard.net/de/ihr-anlass/straeme-kuesnacht/",
  "https://www.peclard.net/de/kontakt/adressen/",
  "https://www.seebadi-zollikon.ch/",
  "https://www.brueggli-zug.ch/",
  "https://www.brueggli-zug.ch/about-us",
  "https://www.peclard.net/de/presse-artikel/brueggli-zug/",
]);

function source(id) {
  const match = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));
  assert.ok(match, id);
  return match[1];
}

function textOf(node) {
  if (!node) return "";
  if (Object.prototype.hasOwnProperty.call(node, "nodeText")) {
    return node.nodeText + (node.children || []).map(textOf).join("");
  }
  return node.textContent || "";
}

function makeNode(tag) {
  const node = {
    tag,
    nodeText: "",
    className: "",
    value: "",
    hidden: false,
    href: "",
    target: "",
    rel: "",
    type: "",
    children: [],
    listeners: [],
    scrollTop: 0,
    scrollHeight: 40,
    appendChild(child) { this.children.push(child); return child; },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      return child;
    },
    get firstChild() { return this.children[0] || null; },
    addEventListener(type, fn) { this.listeners.push({ type, fn }); },
    setAttribute() {},
    removeAttribute() {},
  };
  Object.defineProperty(node, "textContent", {
    get() { return textOf(node); },
    set(value) { node.nodeText = String(value); },
  });
  return node;
}

function bootDemo() {
  const hits = [];
  const ids = {};
  function ensure(id) {
    if (!ids[id]) ids[id] = makeNode(id);
    return ids[id];
  }
  for (const id of ["chat", "qr", "ask-form", "ask", "venue", "date", "time", "people", "ok", "show-venue", "cta", "reset", "venues"]) {
    ensure(id);
  }
  ensure("gastro-pack").nodeText = html.match(/<script type="application\/json" id="gastro-pack">([\s\S]*?)<\/script>/)[1];
  const document = {
    getElementById(id) { return ensure(id); },
    createElement(tag) { return makeNode(tag); },
    createTextNode(text) { return { textContent: String(text) }; },
  };
  const context = {
    document,
    window: {},
    bsTrack(sub, title) { hits.push({ sub, title }); },
  };
  context.window = context;
  vm.runInNewContext(source("gastro-demo"), context, { filename: "gastro-demo.js" });
  return { hits, ids, context };
}

function click(node) {
  const found = node.listeners.find((item) => item.type === "click");
  assert.ok(found, "click");
  found.fn();
}

function button(page, label) {
  const found = page.ids.qr.children.find((child) => child.textContent === label);
  assert.ok(found, label);
  return found;
}

function outs(page) {
  return page.ids.chat.children.filter((child) => String(child.className).includes("out")).map((child) => child.textContent);
}

function hrefs(node) {
  const found = [];
  function walk(current) {
    if (!current) return;
    if (current.href) found.push(current.href);
    for (const child of current.children || []) walk(child);
  }
  walk(node);
  return found;
}

function lastOut(page) {
  const rows = outs(page);
  return rows[rows.length - 1] || "";
}

function ask(page, text) {
  const before = page.hits.length;
  page.ids.ask.value = text;
  const submit = page.ids["ask-form"].listeners.find((item) => item.type === "submit");
  submit.fn({ preventDefault() {} });
  return before;
}

function prospectMap(file) {
  const raw = readFileSync(new URL(file, root), "utf8");
  const match = raw.match(/var DEST=(\{.*?\});/) || raw.match(/const PROSPECT_DEST = (\{.*?\});/);
  assert.ok(match, file);
  return JSON.parse(match[1]);
}

test("the page is a labelled German demo and publishes only the checked sources", () => {
  assert.match(html, /<html lang="de"/);
  assert.match(html, /id="demo-banner">Individuelle Demo für Péclard — Beispiel von BOLLA STUDIO\. Keine offizielle Website\. Keine Live-Reservation\.</);
  assert.match(html, /id="privacy">Bitte keine persönlichen Daten eingeben</);
  assert.match(html, /Wählen Sie/);
  assert.equal(html.includes("ß"), false);
  assert.equal(html.includes("&szlig;"), false);
  assert.doesNotMatch(html, /type="email"|type="tel"|name="email"|name="phone"/);
  assert.doesNotMatch(html, /Lindenhof|Peccadille|Peppersack|Olde Hansa|\+41/);
  assert.deepEqual([...new Set(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi))], ["marcelo@bollastudio.com"]);
  assert.match(html, /min-height:48px/);
  assert.match(html, /@media\(min-width:800px\)/);
  assert.match(html, /@media\(min-width:800px\)/);
  assert.match(html, /\.grid\{grid-template-columns:1fr 1fr\}/);
  assert.doesNotMatch(source("gastro-demo"), /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage/);
  const urls = [...html.matchAll(/https:\/\/[^"'\s<]+/g)].map((match) => match[0]);
  assert.deepEqual(urls.filter((url) => !ALLOWED_URLS.has(url)), []);
  assert.ok(urls.includes("https://www.kreuz-zug.ch/"));
  assert.ok(urls.includes("https://www.fonduezelt-lulu.ch/en/"));
  assert.ok(urls.includes("https://www.peclard.net/de/kontakt/adressen/"));
  assert.ok(urls.includes("https://www.peclard.net/de/presse-artikel/brueggli-zug/"));
});

test("the entry redirects with the query and the hash and does not count", () => {
  assert.match(entry, /location\.replace\("de\/"\+location\.search\+location\.hash\)/);
  assert.match(entry, /Individuelle Demo für Péclard — Beispiel von BOLLA STUDIO\. Keine offizielle Website\. Keine Live-Reservation\./);
  assert.doesNotMatch(entry, /goatcounter|count\.js|gc\.zgo\.at/);
  assert.match(entry, /location\.search/);
});

test("prepared topics count and the example note is not a reservation", () => {
  const page = bootDemo();
  assert.equal(page.hits.length, 0);
  assert.match(outs(page)[0], /Bitte keine persönlichen Daten eingeben/);
  assert.equal(page.ids.venue.children.length, 20);

  click(button(page, "Tisch"));
  assert.deepEqual(page.hits, [{ sub: "/chat/tisch", title: "example" }]);
  assert.match(lastOut(page), /nichts reserviert/i);
  assert.match(lastOut(page), /nichts gesendet/i);

  click(button(page, "Anlass"));
  assert.equal(page.hits.at(-1).sub, "/chat/anlass");
  assert.match(lastOut(page), /ab 15 Personen/);
  assert.match(lastOut(page), /Hochzeiten/);
  assert.match(lastOut(page), /bestätigt keine Verfügbarkeit/);
  assert.ok(hrefs(page.ids.chat.children.at(-1)).includes("https://www.peclard.net/de/ihr-anlass/ihr-anlass/"));

  click(button(page, "Camping"));
  assert.equal(page.hits.at(-1).sub, "/chat/camping");
  assert.match(lastOut(page), /Fischer/);
  assert.match(lastOut(page), /keine Camping-Reservation/);
  assert.match(lastOut(page), /Januar und Februar/);
  assert.match(lastOut(page), /keine Verfügbarkeit/);

  click(button(page, "Catering"));
  assert.equal(page.hits.at(-1).sub, "/chat/catering");
  assert.match(lastOut(page), /Bernhard-Theaters/);
  assert.match(lastOut(page), /Opernhausgäste/);
  assert.match(lastOut(page), /nicht belegt/);

  click(button(page, "Öffnungszeiten"));
  assert.equal(page.hits.at(-1).sub, "/chat/oeffnungszeiten");
  assert.match(lastOut(page), /Livestatus/);

  page.ids.venue.value = "kreuz-zug";
  click(page.ids["show-venue"]);
  assert.equal(page.hits.at(-1).sub, "/chat/betrieb");
  assert.match(lastOut(page), /Frühling 2027/);
  assert.match(lastOut(page), /keine aktuelle Winteröffnung/);
  assert.match(lastOut(page), /geschlossen/);

  page.ids.date.value = "2027-04-12";
  page.ids.time.value = "19.00";
  page.ids.people.value = "4";
  click(page.ids.cta);
  assert.equal(page.hits.at(-1).sub, "/request/confirm");
  assert.equal(page.hits.at(-1).title, "example");
  assert.match(page.ids.ok.textContent, /BEISPIEL, keine Reservation/);
  assert.match(page.ids.ok.textContent, /Nichts wurde gesendet/);
  assert.match(page.ids.ok.textContent, /12\.04\.2027/);
  assert.match(page.ids.ok.textContent, /Frühling 2027/);
  assert.doesNotMatch(page.ids.ok.textContent, /Reservation ist bestätigt|ist gebucht/);

  const beforeReset = page.hits.length;
  click(page.ids.reset);
  assert.equal(page.hits[beforeReset].sub, "/reset");
  assert.equal(page.ids.ok.hidden, true);
  assert.equal(page.ids.ok.textContent, "");
  assert.match(outs(page).at(-1), /individuelle Demo für Péclard/i);
});

test("negative answers stay inside the checked facts and free text is not counted", () => {
  const page = bootDemo();
  const before = ask(page, "Samstag Rooftop");
  assert.equal(page.hits.length, before);
  assert.match(lastOut(page), /Keine verbindliche Samstagszeit/);
  assert.match(lastOut(page), /11\.00–24\.00/);
  assert.match(lastOut(page), /10\.00–24\.00/);
  assert.ok(hrefs(page.ids.chat.children.at(-1)).includes("https://www.ooo-zh.ch/de/kontakt/"));

  ask(page, "Fonduezelt 2026");
  assert.match(lastOut(page), /2025/);
  assert.match(lastOut(page), /kein Jahr/);
  assert.doesNotMatch(lastOut(page), /2026/);
  assert.deepEqual(hrefs(page.ids.chat.children.at(-1)).sort(), [
    "https://www.fonduezelt-lulu.ch/de/",
    "https://www.fonduezelt-lulu.ch/en/",
  ]);

  ask(page, "Ist Seebadi Zollikon heute offen?");
  assert.match(lastOut(page), /nicht als aktuell verfügbarer Standort empfohlen/);
  assert.match(lastOut(page), /Adressverzeichnis|500|Zertifikat/);

  ask(page, "Brüggli im Winter");
  assert.match(lastOut(page), /assoziierter Betrieb/i);
  assert.match(lastOut(page), /Keine Winteröffnung/);
  assert.match(lastOut(page), /Sommer 2026/);
  assert.match(lastOut(page), /Brüggli Zugersee Paradies AG/);
  assert.match(lastOut(page), /kein vollständig übernommener Standort/);

  ask(page, "Was kostet das Menu in der Milchbar?");
  assert.match(lastOut(page), /nicht verifiziert/);
  assert.doesNotMatch(lastOut(page), /\d+\s*(CHF|Franken)/i);

  ask(page, "Gibt es Gerichte ohne Gluten?");
  assert.match(lastOut(page), /nicht verifiziert/);
  assert.match(lastOut(page), /nichts bestätigt/i);

  ask(page, "Camping in der Milchbar");
  assert.match(outs(page).slice(-2).join("\n"), /kein Camping/);

  ask(page, "Catering bei Portofino für unser Büro");
  assert.match(outs(page).slice(-2).join("\n"), /kein Catering|externes Gruppen-Catering/);

  ask(page, "Hafenbeiz oder Mönchhof");
  assert.match(lastOut(page), /nur einen Betrieb/);
  assert.match(lastOut(page), /Hafenbeiz/);
  assert.match(lastOut(page), /Mönchhof/);
  assert.doesNotMatch(lastOut(page), /Twents/);

  ask(page, "Wie ist die Pumpstation?");
  assert.match(lastOut(page), /Gruppenname/);
  assert.match(lastOut(page), /Utoquai/);
  ask(page, "Restaurant Pumpstation bei Regen");
  assert.match(lastOut(page), /bei Regen geschlossen/);
  assert.match(lastOut(page), /Konkrete Uhrzeiten sind nicht publiziert/);

  ask(page, "Gibt es einen Parkplatz?");
  assert.match(lastOut(page), /nicht verifiziert/);

  ask(page, "Öffnungszeiten Portofino");
  assert.match(lastOut(page), /widersprüchlich/);
  assert.match(lastOut(page), /Keine Verfügbarkeit/);
  ask(page, "Restaurant Kiosk");
  assert.match(lastOut(page), /wetterunabhängige Öffnung wird nicht zugesagt/);
  ask(page, "Hunde im Sträme");
  assert.match(lastOut(page), /Hunde sind auf der ganzen Anlage und im Restaurant nicht erlaubt/);
  ask(page, "Inselwirtschaft im Winter");
  assert.match(lastOut(page), /Keine Winteröffnung/);
  ask(page, "Schiffstation");
  assert.match(lastOut(page), /Keine Winteröffnung/);
  assert.equal(hrefs(page.ids.chat.children.at(-1)).includes("https://www.peclard.net/de/ihr-anlass/schiffstation/"), false);

  const secret = "anna@example.com";
  ask(page, "Mein Name ist Anna, " + secret + ", +41 44 123 45 67");
  assert.equal(page.ids.chat.textContent.includes(secret), false);
  assert.equal(page.ids.chat.textContent.includes("+41"), false);
  assert.match(lastOut(page), /Bitte keine persönlichen Daten eingeben/);
  assert.equal(page.hits.length, before);

  page.ids.venue.value = "milchbar";
  page.ids.date.value = "";
  click(page.ids.cta);
  assert.equal(page.hits.length, before);
  assert.match(page.ids.ok.textContent, /Beispielnotiz/);

  click(button(page, "Anlass"));
  page.ids.venue.value = "restaurant-pumpstation";
  page.ids.date.value = "2026-12-01";
  page.ids.time.value = "19.30";
  page.ids.people.value = "4";
  click(page.ids.cta);
  assert.match(page.ids.ok.textContent, /ab 15 Personen/);
  assert.match(page.ids.ok.textContent, /keine Zusage/);

  page.ids.venue.value = "seebadi-zollikon";
  page.ids.people.value = "20";
  click(page.ids.cta);
  assert.match(page.ids.ok.textContent, /nicht als aktuell verfügbarer Standort empfohlen/);
  assert.doesNotMatch(page.ids.ok.textContent, /Beispielzeit: 19\.30/);

  page.ids.venue.value = "brueggli-zug";
  page.ids.date.value = "2026-01-15";
  click(button(page, "Camping"));
  click(page.ids.cta);
  assert.match(page.ids.ok.textContent, /assoziierter Betrieb/);
  assert.match(page.ids.ok.textContent, /Wintermonat/);
  assert.match(page.ids.ok.textContent, /Camping wird hier nicht reserviert/);
});

function metricsSource(file) {
  const raw = readFileSync(new URL(file, root), "utf8");
  const match = raw.match(/<script(?:\s[^>]*)?>([\s\S]*?function bollaStore[\s\S]*?)<\/script>/);
  assert.ok(match, file);
  return match[1];
}

function runMetrics(href, { store = new Map(), cookie = "" } = {}) {
  const url = new URL(href);
  const created = [];
  const element = { setAttribute() {}, onload: null };
  const jar = new Map();
  for (const part of cookie.split(";").map((item) => item.trim()).filter(Boolean)) {
    const eq = part.indexOf("=");
    jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  const document = {
    documentElement: { setAttribute() {} },
    createElement() { return element; },
    head: { appendChild(node) { created.push(node); } },
    addEventListener() {},
  };
  Object.defineProperty(document, "cookie", {
    get() { return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; "); },
    set(raw) {
      const [pair] = String(raw).split(";").map((item) => item.trim());
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (/max-age=0/i.test(raw)) jar.delete(name);
      else jar.set(name, value);
    },
  });
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
  };
  const context = {
    window: {},
    document,
    location: { search: url.search, hash: url.hash, protocol: url.protocol },
    localStorage,
    decodeURIComponent,
  };
  context.window = context;
  vm.runInNewContext(metricsSource(pagePath), context, { filename: "bolla-metrics.js" });
  return { created, element, window: context.window, store };
}

test("a visit is separate from use, and internal traffic sends nothing", () => {
  const page = runMetrics("https://demo.bollastudio.com/gastro-gruppe/de/?p=Camp_1");
  assert.equal(page.created.length, 1);
  assert.equal(page.element.src, "https://gc.zgo.at/count.js");
  page.window.bsTrack("/chat/tisch", "example");
  const hits = [];
  page.window.goatcounter.count = (row) => hits.push(row);
  page.element.onload();
  assert.deepEqual(hits.map((hit) => ({ path: hit.path, title: hit.title, event: hit.event })), [
    { path: "/bolla-demo-gastro-gruppe/de/?p=camp1", title: "gastro-gruppe demo de", event: undefined },
    { path: "/bolla-demo-gastro-gruppe/de/chat/tisch?p=camp1", title: "example", event: true },
  ]);

  const internal = runMetrics("https://demo.bollastudio.com/gastro-gruppe/de/?interno=1&p=camp-1");
  assert.equal(internal.created.length, 0);
  assert.equal(internal.store.get("skipgc"), "t");
  internal.window.bsTrack("/request/confirm", "example");
  assert.equal(internal.window.goatcounter, undefined);

  const audit = runMetrics("https://demo.bollastudio.com/gastro-gruppe/de/?p=BMaudit-qa");
  assert.equal(audit.created.length, 0);
  assert.equal(audit.store.get("skipgc"), "t");
  const linked = runMetrics("https://demo.bollastudio.com/gastro-gruppe/de/?link_id=bmaudit-link");
  assert.equal(linked.created.length, 0);
});

test("the 39 opaque hashes use the current 16-character truncation and the old map stays", () => {
  const en = prospectMap("concesionarios/en/index.html");
  const de = prospectMap("concesionarios/de/index.html");
  const build = prospectMap("scripts/build-concesionarios.mjs");
  assert.deepEqual(de, en);
  assert.deepEqual(build, en);
  assert.equal(Object.keys(en).length, 133);
  assert.equal(FULL_HASHES.length, 39);
  for (const full of FULL_HASHES) {
    assert.equal(full.length, 64);
    assert.equal(en[full.slice(0, 16)], "/gastro-gruppe/de/", full);
  }
  const previous = Object.entries(en).filter(([, path]) => path !== "/gastro-gruppe/de/");
  assert.equal(previous.length, 94);
  const canon = previous.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([key, path]) => `${key} ${path}`).join("\n");
  assert.equal(createHash("sha256").update(canon).digest("hex"), "7870f7c833a0ed36f0da211dc7e3314caeca8a0a6d10ef12a3efbdcdba9cc0f5");
  assert.equal(en.fcad07227666865f, "/hotel-ch/de/");
  assert.equal(en.d26d1440d5da6449, "/immobilien-ch/de/");
});
