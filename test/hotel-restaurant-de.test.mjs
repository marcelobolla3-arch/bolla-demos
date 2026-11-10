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

const swissBytes = {
  "hotel-ch/index.html": "7df4ef6dc262a0ecaf85139b73e9e7b4cec4f9c66d348a36029e1967970e1a87",
  "hotel-ch/de/index.html": "5975981c7ff4dac5247cd665239e7b89d0b80c6e609ca83472583e83c11c14f7",
  "hotel-ch/en/index.html": "72a3ff9fac04c6221d182ba066b33831346b5c89a05d77de81cc20535346f3b4",
  "hotel-ch/fr/index.html": "1fa12fe8648c71f2b140a7c9d93f6c1313345184ae1fda2d430c75547dbf51eb",
  "restaurant-ch/index.html": "7df4ef6dc262a0ecaf85139b73e9e7b4cec4f9c66d348a36029e1967970e1a87",
  "restaurant-ch/de/index.html": "ef28ad80eaa4263d58948a3574557cdaab428b13767e3c822da8dcfc2e32e790",
  "restaurant-ch/en/index.html": "c7a7de9226670c11031d416afbe9be16b82d9bf027330b4b49670945757b7a94",
  "restaurant-ch/fr/index.html": "7ba66176f1fd67a4df80fcbc0a6bb16cf2cf5392e4c6f7e975a186b32204ae24",
};

const pages = [
  ["hotel-de/de/index.html", "/bolla-demo-hotel-de/de", "hotel-de demo de"],
  ["restaurant-de/de/index.html", "/bolla-demo-restaurant-de/de", "restaurant-de demo de"],
];

function blocks(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
}

function boot(html, href, store = new Map()) {
  const parts = blocks(html);
  const metrics = parts.find((source) => source.includes("bollastudio.goatcounter.com/count"));
  const demo = parts.find((source) => source.includes("var D="));
  assert.ok(metrics, "counter script missing");
  assert.ok(demo, "demo script missing");
  const url = new URL(href);
  const created = [];
  const scriptEl = {
    async: false,
    attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name]; },
  };
  const elements = {};
  function make(id) {
    return {
      id,
      value: "",
      textContent: "",
      className: "",
      min: "",
      style: {},
      children: [],
      classList: { add() {}, remove() {} },
      appendChild(child) { this.children.push(child); return child; },
      setAttribute() {},
      remove() {},
      scrollTop: 0,
      scrollHeight: 0,
      onclick: null,
    };
  }
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = make(id)); },
    createElement(tag) { return tag === "script" ? scriptEl : make(tag); },
    head: { appendChild(node) { created.push(node); } },
    querySelectorAll() { return []; },
  };
  const context = {
    document,
    location: { search: url.search, hash: url.hash, href },
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); },
    },
    decodeURIComponent,
    setTimeout(fn) { fn(); return 0; },
  };
  context.window = context;
  vm.runInNewContext(metrics, context, { filename: "metrics.js" });
  if (created.length) vm.runInNewContext(demo, context, { filename: "demo.js" });
  return { created, scriptEl, elements, document, window: context, store };
}

test("swiss hotel-ch and restaurant-ch pages stay byte-identical", () => {
  for (const [path, hash] of Object.entries(swissBytes)) {
    assert.equal(createHash("sha256").update(read(path)).digest("hex"), hash, path);
  }
  assert.match(text("hotel-ch/de/index.html"), /in der Schweiz/);
  assert.match(text("hotel-ch/de/index.html"), /\+41/);
  assert.match(text("restaurant-ch/de/index.html"), /in der Schweiz/);
  assert.match(text("restaurant-ch/de/index.html"), /fiktives Restaurant in der Schweiz/);
  assert.match(text("restaurant-ch/de/index.html"), /\+41/);
});

test("germany pages drop Swiss markers and keep the fictional disclaimer", () => {
  for (const [path] of pages) {
    const html = text(path);
    assert.doesNotMatch(html, /Schweiz/i, path);
    assert.doesNotMatch(html, /Reservation/, path);
    assert.doesNotMatch(html, /Take-away/i, path);
    assert.doesNotMatch(html, /Zürich|Zuerich|Basel|Luzern|Genf|Lausanne|Lugano|Davos|Zermatt|Interlaken|Locarno/, path);
    assert.doesNotMatch(html, /\+41/, path);
    assert.doesNotMatch(html, /CHF/i, path);
    assert.doesNotMatch(html, /\.ch\b/, path);
    assert.doesNotMatch(html, /Grüezi|gemäss|zu Fuss|Bergsicht|Bergbahnen|Apéro|Merci!/, path);
    assert.doesNotMatch(html, /href="\.\.\/(?:en|fr)\/"/, path);
    assert.match(html, /in Deutschland/);
    assert.match(html, /placeholder="\+49 … \/ name@…"/);
    assert.match(html, /fiktiver Beispielbetrieb, keine echten Buchungen/);
    assert.match(html, /Alle Angaben sind Beispiele, ohne echte Preise oder Verfügbarkeiten/);
    assert.match(html, /mailto:marcelo@bollastudio\.com/);
    assert.doesNotMatch(html, /\bfetch\s*\(|method\s*=\s*["']post["']/i);
  }
  assert.match(text("hotel-de/de/index.html"), /fiktives Hotel in Deutschland/);
  assert.match(text("hotel-de/de/index.html"), /gemäß Ihren AGB/);
  assert.match(text("hotel-de/de/index.html"), /nicht sicher weiß/);
  assert.match(text("hotel-de/de/index.html"), /zu Fuß/);
  assert.match(text("hotel-de/de/index.html"), /Stadtblick/);
  assert.match(text("hotel-de/de/index.html"), /ÖPNV, Museen, Ausflüge in der Stadt/);
  assert.match(text("restaurant-de/de/index.html"), /fiktives Restaurant in Deutschland/);
  assert.match(text("restaurant-de/de/index.html"), /gemäß Ihrer Website/);
  assert.match(text("restaurant-de/de/index.html"), /gemäß Ihren Angaben/);
  assert.match(text("restaurant-de/de/index.html"), /Aperitif/);
  assert.doesNotMatch(text("restaurant-de/de/index.html"), /Apéro/);
  assert.match(text("hotel-de/de/index.html"), /Reservierungsanfrage/);
  assert.match(text("hotel-de/de/index.html"), /Reservierungen/);
  assert.match(text("restaurant-de/de/index.html"), /Tischreservierung/);
  assert.match(text("restaurant-de/de/index.html"), /Reservierungssystem/);
  assert.match(text("restaurant-de/de/index.html"), /Essen zum Mitnehmen/);
  for (const path of ["hotel-de/index.html", "restaurant-de/index.html"]) {
    const entry = text(path);
    assert.match(entry, /location\.replace\("de\/"\+location\.search\)/);
    assert.doesNotMatch(entry, /gc\.zgo\.at\/count\.js/);
    let landed = "";
    const sandbox = {
      location: { search: "?p=berlin-1&internal=1", replace(url) { landed = url; } },
    };
    vm.createContext(sandbox);
    vm.runInContext(entry.match(/<script>([\s\S]*?)<\/script>/)[1], sandbox);
    assert.equal(landed, "de/?p=berlin-1&internal=1", path);
  }
});

test("counted path keeps a sanitised p, and internal=1 sends nothing", () => {
  for (const [path, base, title] of pages) {
    const html = text(path);
    const tagged = boot(html, `http://127.0.0.1${path.replace("index.html", "")}?p=De-BER_1%20xx!!`);
    assert.equal(tagged.created.length, 1);
    assert.equal(tagged.scriptEl.src, "https://gc.zgo.at/count.js");
    assert.equal(tagged.scriptEl.getAttribute("data-goatcounter"), "https://bollastudio.goatcounter.com/count");
    const hits = [];
    tagged.window.goatcounter.count = (row) => hits.push({ ...row });
    tagged.scriptEl.onload();
    tagged.document.getElementById("nm").value = "Geheim Name";
    tagged.document.getElementById("ph").value = "secret@example.com";
    assert.ok(tagged.elements.qr.children.length > 0, path + " quick questions");
    tagged.elements.qr.children[0].onclick();
    tagged.elements.slots.children[0].onclick();
    tagged.elements.cta.onclick();
    assert.equal(hits.length, 3);
    assert.equal(hits[0].path, `${base}/?p=de-ber1xx`);
    assert.equal(hits[0].title, title);
    assert.equal(hits[0].event, undefined);
    assert.match(hits[1].path, new RegExp(`^${base}/chat/[a-z-]{3,50}\\?p=de-ber1xx$`));
    assert.equal(hits[1].title, "script-option");
    assert.equal(hits[1].event, true);
    assert.equal(hits[2].path, `${base}/request/confirm?p=de-ber1xx`);
    assert.equal(hits[2].title, "Demo-Anfrage");
    assert.equal(hits[2].event, true);
    assert.doesNotMatch(JSON.stringify(hits), /Geheim|secret@example|name@|WhatsApp/);

    const longTag = "b".repeat(80);
    const longPage = boot(html, `http://127.0.0.1${path.replace("index.html", "")}?p=${longTag}`);
    const longHits = [];
    longPage.window.goatcounter.count = (row) => longHits.push(row);
    longPage.scriptEl.onload();
    assert.equal(longHits[0].path, `${base}/?p=${"b".repeat(60)}`);

    const plain = boot(html, `http://127.0.0.1${path.replace("index.html", "")}`);
    const plainHits = [];
    plain.window.goatcounter.count = (row) => plainHits.push(row);
    plain.scriptEl.onload();
    assert.equal(plainHits[0].path, `${base}/`);
    assert.equal(plainHits[0].event, undefined);

    const blocked = boot(html, `http://127.0.0.1${path.replace("index.html", "")}?p=de-ber1xx&internal=1`);
    assert.equal(blocked.created.length, 0);
    assert.equal(blocked.scriptEl.src, undefined);
    assert.equal(blocked.store.get("skipgc"), "t");
    blocked.window.goatcounter = { count() { throw new Error(path + " counted while internal"); } };
    blocked.window.bsTrack("/chat/sind-hunde-erlaubt", "script-option");
    blocked.window.bsTrack("/request/confirm", "Demo-Anfrage");
    assert.equal(blocked.created.length, 0);

    const store = new Map();
    boot(html, `http://127.0.0.1${path.replace("index.html", "")}?internal=1`, store);
    const remembered = boot(html, `http://127.0.0.1${path.replace("index.html", "")}?p=de-ber1xx`, store);
    assert.equal(remembered.created.length, 0);
    const cleared = boot(html, `http://127.0.0.1${path.replace("index.html", "")}?p=de-ber1xx&internal=0`, store);
    assert.equal(cleared.created.length, 1);
    assert.equal(store.has("skipgc"), false);
  }
});
