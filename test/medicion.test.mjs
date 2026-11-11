import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { inventory, renderDoc } from "../scripts/medicion-inventory.mjs";

const root = new URL("..", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function metricsSource(html) {
  const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    if (match[1].includes("function bollaStore")) return match[1];
  }
  throw new Error("metrics script missing");
}

function installCookie(document, initial = "") {
  const jar = new Map();
  for (const part of initial.split(";").map((item) => item.trim()).filter(Boolean)) {
    const eq = part.indexOf("=");
    jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  const writes = [];
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get() {
      return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
    },
    set(raw) {
      writes.push(String(raw));
      const [pair, ...attrs] = String(raw).split(";").map((item) => item.trim());
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      const maxAge = attrs.find((item) => item.toLowerCase().startsWith("max-age="));
      if (maxAge && Number(maxAge.split("=")[1]) <= 0) jar.delete(name);
      else jar.set(name, value);
    },
  });
  return { jar, writes };
}

function runMetrics(html, href, { store = new Map(), cookie = "" } = {}) {
  const source = metricsSource(html);
  const url = new URL(href);
  const created = [];
  const element = { setAttribute() {} };
  const document = {
    documentElement: { setAttribute(name, value) { this[name] = value; } },
    createElement() { return element; },
    head: { appendChild(node) { created.push(node); } },
    addEventListener() {},
  };
  const cookies = installCookie(document, cookie);
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
  };
  const location = { search: url.search, hash: url.hash, protocol: url.protocol };
  const context = { window: {}, document, location, localStorage, decodeURIComponent, URLSearchParams };
  context.window = context;
  vm.runInNewContext(source, context, { filename: "bolla-metrics.js" });
  return { created, element, window: context.window, document, store, cookies };
}

function countsOf(page) {
  const hits = [];
  if (page.window.goatcounter) page.window.goatcounter.count = (row) => hits.push(row);
  if (page.element.onload) page.element.onload();
  return hits;
}

const hotel = read("hotel/es/index.html");
const SECRET = "mi número es 600 123 456 y me llamo Ana";

test("internal=1 and interno=1 are remembered in localStorage and a first-party cookie, and 0 clears both", () => {
  const marked = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?interno=1");
  assert.equal(marked.created.length, 0);
  assert.equal(marked.store.get("skipgc"), "t");
  assert.equal(marked.cookies.jar.get("bolla_internal"), "1");
  const write = marked.cookies.writes[0];
  assert.match(write, /Path=\//);
  assert.match(write, /SameSite=Lax/);
  assert.match(write, /Max-Age=34560000/);
  assert.match(write, /Secure/);
  assert.doesNotMatch(write, /Domain=/);

  const remembered = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=hotel-es-1", { store: marked.store, cookie: "bolla_internal=1" });
  assert.equal(remembered.created.length, 0);

  const cookieOnly = new Map();
  const fromCookie = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/", { store: cookieOnly, cookie: "other=1; bolla_internal=1" });
  assert.equal(fromCookie.created.length, 0);
  assert.equal(cookieOnly.get("skipgc"), "t");

  const cleared = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=hotel-es-1&interno=0", { store: marked.store, cookie: "bolla_internal=1" });
  assert.equal(cleared.created.length, 1);
  assert.equal(marked.store.has("skipgc"), false);
  assert.equal(cleared.cookies.jar.has("bolla_internal"), false);

  const hash = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=hotel-es-1#internal=1");
  assert.equal(hash.created.length, 0);
  const laterWins = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?interno=1&internal=0");
  assert.equal(laterWins.created.length, 1);
  assert.equal(laterWins.store.has("skipgc"), false);
  const hashWins = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?internal=0#interno=1");
  assert.equal(hashWins.created.length, 0);
});

test("bmaudit- is internal, is remembered, and an explicit 0 does not let that hit into external counts", () => {
  const audit = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=BMaudit-Nov%201");
  assert.equal(audit.created.length, 0);
  assert.equal(audit.store.get("skipgc"), "t");
  assert.equal(audit.cookies.jar.get("bolla_internal"), "1");
  const again = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/", { store: audit.store });
  assert.equal(again.created.length, 0);

  const off = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?internal=0&p=bmaudit-nov", { store: audit.store, cookie: "bolla_internal=1" });
  assert.equal(off.created.length, 0);
  assert.equal(audit.store.has("skipgc"), false);
  assert.equal(off.cookies.jar.has("bolla_internal"), false);
  const external = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=hotel-es-1", { store: audit.store });
  assert.equal(external.created.length, 1);

  const plain = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=bmaudit");
  assert.equal(plain.created.length, 1);
  const embedded = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=xxbmaudit-1");
  assert.equal(embedded.created.length, 1);
});

test("a visit carries the sanitised p and a usage event fires only when bsTrack is called, without the typed text", () => {
  const page = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=Mario%20Rossi!!extra");
  page.window.bsTrack("/chat/checkin", "example");
  const hits = countsOf(page);
  assert.deepEqual(hits.map((hit) => ({ path: hit.path, title: hit.title, event: hit.event })), [
    { path: "/bolla-demo-hotel/es/?p=mariorossiextra", title: "hotel demo es", event: undefined },
    { path: "/bolla-demo-hotel/es/chat/checkin?p=mariorossiextra", title: "example", event: true },
  ]);
  assert.doesNotMatch(JSON.stringify(hits), /Mario|Rossi|600|Ana/);

  const queued = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/?p=" + "a".repeat(80));
  queued.window.bsTrack("/request/confirm", "example");
  const queuedHits = [];
  queued.window.goatcounter.count = (row) => queuedHits.push(row);
  queued.element.onload();
  assert.equal(queuedHits[0].path, `/bolla-demo-hotel/es/?p=${"a".repeat(60)}`);
  assert.equal(queuedHits[0].event, undefined);
  assert.equal(queuedHits[1].event, true);
  assert.equal(queuedHits[1].path, `/bolla-demo-hotel/es/request/confirm?p=${"a".repeat(60)}`);

  const unknown = runMetrics(hotel, "https://demo.bollastudio.com/hotel/es/");
  const unknownHits = countsOf(unknown);
  assert.equal(unknownHits.length, 1);
  assert.equal(unknownHits[0].path, "/bolla-demo-hotel/es/");
  assert.equal(unknownHits[0].event, undefined);
});

test("path() visits use the sanitised label and drop the raw query", () => {
  const page = runMetrics(read("viticcio-greve/index.html"), "https://demo.bollastudio.com/viticcio-greve/?p=Mario%20Rossi&utm_source=mail");
  assert.equal(page.created.length, 1);
  assert.equal(page.element.src, "https://gc.zgo.at/count.js");
  assert.equal(page.window.goatcounter.path("/viticcio-greve/index.html?p=Mario Rossi&utm_source=mail"), "/bolla-viticcio-greve/?p=mariorossi");
  page.window.bsTrack("/confirm", "Conferma demo");
  const hits = [];
  page.window.goatcounter.count = (row) => hits.push(row);
  assert.equal(hits.length, 0);
  page.window.bsTrack("/confirm", "Conferma demo");
  assert.deepEqual(hits.map((hit) => ({ path: hit.path, title: hit.title, event: hit.event })), [
    { path: "/bolla-viticcio-greve/confirm?p=mariorossi", title: "Conferma demo", event: true },
  ]);
  assert.doesNotMatch(JSON.stringify(hits), /Mario|utm_source/);

  const internal = runMetrics(read("viticcio-greve/index.html"), "https://demo.bollastudio.com/viticcio-greve/?p=acme", { cookie: "bolla_internal=1" });
  assert.equal(internal.created.length, 0);
  assert.equal(internal.window.goatcounter, undefined);
});

test("legacy path-segment families keep their route and still skip bmaudit", () => {
  const nautica = runMetrics(read("nautica/index.html"), "https://demo.bollastudio.com/nautica/?p=Acme_42");
  const nauticaHits = countsOf(nautica);
  assert.equal(nauticaHits[0].path, "/acme42/demo");
  assert.equal(nauticaHits[0].event, undefined);
  assert.equal(nautica.window.BS.internal, false);
  nautica.window.bsTrack("/acme42/q-manual", "q-manual");
  assert.equal(nauticaHits[1].path, "/acme42/q-manual");
  assert.equal(nauticaHits[1].event, true);
  assert.equal(nauticaHits[1].title, "q-manual");

  const audit = runMetrics(read("nautica/index.html"), "https://demo.bollastudio.com/nautica/?p=bmaudit-lagoon");
  assert.equal(audit.created.length, 0);
  assert.equal(audit.window.BS.internal, true);
  assert.equal(audit.window.BS.slug, "bmaudit-lagoon");
  audit.window.goatcounter = { count() { throw new Error("counted bmaudit"); } };
  audit.window.bsTrack("/bmaudit-lagoon/q-manual", "q-manual");

  const bare = runMetrics(read("nautica-cat/index.html"), "https://demo.bollastudio.com/nautica-cat/");
  assert.equal(countsOf(bare)[0].path, "/cat42/demo");

  const general = runMetrics(read("es/index.html"), "https://demo.bollastudio.com/es/?p=Acme_1");
  assert.equal(general.created.length, 1);
  assert.equal(general.window.goatcounter.path(), "/acme_1/demo-es-general");
  const generalAudit = runMetrics(read("es/index.html"), "https://demo.bollastudio.com/es/?p=bmaudit-es");
  assert.equal(generalAudit.created.length, 0);

  const dealers = runMetrics(read("concesionarios/es/index.html"), "https://demo.bollastudio.com/concesionarios/es/?p=Dealer-9");
  const dealerHits = countsOf(dealers);
  assert.equal(dealerHits[0].path, "/dealer-9/video-es");
  assert.equal(dealerHits[0].title, "concesionarios video-es");
  assert.equal(dealerHits[0].event, undefined);
  dealers.window.bsTrack("conc-intent-request", "conc-intent-request");
  assert.equal(dealerHits[1].path, "/dealer-9/conc-intent-request");
  assert.equal(dealerHits[1].event, true);
  assert.doesNotMatch(JSON.stringify(dealerHits), /<video|video-play/);

  const schloss = runMetrics(read("voz/schloss-wuelflingen/index.html"), "https://demo.bollastudio.com/voz/schloss-wuelflingen/?interno=1");
  assert.equal(schloss.created.length, 0);
  const schlossVisit = runMetrics(read("voz/schloss-wuelflingen/index.html"), "https://demo.bollastudio.com/voz/schloss-wuelflingen/?p=Ok_1");
  assert.equal(schlossVisit.window.goatcounter.path(), "/schloss-wuelflingen/voice?p=ok1");
});

test("a scripted chat click counts and the free-text send does not", () => {
  for (const path of ["hotel/es/index.html", "charter/et/index.html", "garage/et/index.html", "dentist/et/index.html", "marina-pirita/et/index.html"]) {
    const html = read(path);
    const packJson = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
    const script = html.match(/<script id="sector-demo">([\s\S]*?)<\/script>/)[1];
    const hits = [];
    const elements = {};
    function makeEl(id) {
      return {
        id,
        textContent: id === "demo-pack" ? packJson : "",
        value: id === "arr" ? "2026-12-01" : "",
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
    const document = {
      getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
      createElement() { return makeEl("node"); },
      querySelectorAll() { return []; },
    };
    const sandbox = {
      document,
      window: {
        matchMedia() { return { matches: true }; },
        bsTrack(sub, title) { hits.push({ sub, title }); },
      },
      console,
    };
    vm.createContext(sandbox);
    vm.runInContext(script, sandbox, { filename: path });
    assert.equal(hits.length, 0, path);
    const button = document.getElementById("qr").children.find((child) => child.onclick);
    button.onclick();
    assert.equal(hits.length, 1, path);
    assert.match(hits[0].sub, /^\/chat\/[a-z0-9-]+$/);
    assert.equal(hits[0].title, "example");
    assert.doesNotMatch(hits[0].sub, new RegExp(SECRET.slice(0, 8)));
    document.getElementById("ask").value = SECRET;
    const submit = document.getElementById("ask-form").listeners.find((item) => item.type === "submit");
    submit.fn({ preventDefault() {} });
    assert.equal(hits.length, 1, path);
    document.getElementById("slots").children[0].onclick();
    document.getElementById("cta").listeners.find((item) => item.type === "click").fn();
    assert.deepEqual(hits[1], { sub: "/request/confirm", title: "example" });
    assert.doesNotMatch(JSON.stringify(hits), new RegExp(SECRET.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("link_id is the same label as p when p is absent, including the audit prefix", () => {
  const crotta = read("garage-crotta-lugano/chat/index.html");
  const linked = runMetrics(crotta, "https://demo.bollastudio.com/garage-crotta-lugano/chat/?link_id=Camp-1");
  assert.equal(countsOf(linked)[0].path, "/bolla-garage-crotta-lugano/chat/?p=camp-1");
  const audit = runMetrics(crotta, "https://demo.bollastudio.com/garage-crotta-lugano/chat/?link_id=bmaudit-crotta");
  assert.equal(audit.created.length, 0);
  assert.equal(audit.store.get("skipgc"), "t");
  const prospectWins = runMetrics(crotta, "https://demo.bollastudio.com/garage-crotta-lugano/chat/?p=real-guest&link_id=bmaudit-crotta");
  assert.equal(prospectWins.created.length, 1);
  assert.equal(countsOf(prospectWins)[0].path, "/bolla-garage-crotta-lugano/chat/?p=real-guest");
});

test("peccadille copies interno and the cookie onto the chat link only", () => {
  const html = read("peccadille/index.html");
  const metrics = metricsSource(html);
  const links = html.match(/<script id="peccadille-links">([\s\S]*?)<\/script>/)[1];
  function boot(href, cookie = "", store = new Map()) {
    const url = new URL(href);
    const records = {
      "chat-link": { href: "https://demo.bollastudio.com/restaurant-ch/de/?p=de-ber-32-peccadille", attrs: {} },
      "voice-link": { href: "https://elevenlabs.io/app/talk-to?agent_id=agent_9701m72qec37f23r4wryyfqn0vpr", attrs: {} },
    };
    function wrap(id) {
      return {
        get href() { return records[id].href; },
        set href(value) { records[id].href = value; },
        getAttribute() { return null; },
        addEventListener() {},
      };
    }
    const document = {
      documentElement: { setAttribute() {} },
      createElement() { return { setAttribute() {} }; },
      head: { appendChild() {} },
      getElementById(id) { return records[id] ? wrap(id) : null; },
      querySelectorAll() { return []; },
    };
    const cookies = installCookie(document, cookie);
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
    vm.runInNewContext(metrics, context);
    vm.runInNewContext(links, context);
    return { records, cookies };
  }
  const marked = boot("https://demo.bollastudio.com/peccadille/?p=de-ber-32-peccadille&interno=1");
  assert.equal(marked.records["chat-link"].href, "https://demo.bollastudio.com/restaurant-ch/de/?p=de-ber-32-peccadille&internal=1");
  assert.equal(marked.records["voice-link"].href, "https://elevenlabs.io/app/talk-to?agent_id=agent_9701m72qec37f23r4wryyfqn0vpr");
  const fromCookie = boot("https://demo.bollastudio.com/peccadille/?p=camp-2", "bolla_internal=1");
  assert.match(fromCookie.records["chat-link"].href, /internal=1$/);
  assert.doesNotMatch(fromCookie.records["voice-link"].href, /internal/);
});

function withoutUnlistedDemos(rendered, committed) {
  const listed = new Set([...committed.matchAll(/^\| (\/[^|\n]+\/) \|/gm)].map((match) => match[1]));
  let dropped = 0;
  let droppedUse = 0;
  const lines = [];
  for (const line of rendered.split("\n")) {
    const route = line.match(/^\| (\/[^|\n]+\/) \|/);
    if (route && !listed.has(route[1])) {
      dropped += 1;
      if (!line.includes("| solo visita |")) droppedUse += 1;
      continue;
    }
    lines.push(line);
  }
  return lines.join("\n").replace(
    /^(\d+) demos cuentan\. (\d+) tienen al menos un uso\. (\d+) solo tienen la visita\./m,
    (_, demos, use, visitOnly) => {
      const demoCount = Number(demos) - dropped;
      const useCount = Number(use) - droppedUse;
      const visitCount = Number(visitOnly) - (dropped - droppedUse);
      return `${demoCount} demos cuentan. ${useCount} tienen al menos un uso. ${visitCount} solo tienen la visita.`;
    },
  );
}

test("every counting page shares the marker and the doc lists its visit and events", () => {
  const rows = inventory(new URL(".", root).pathname);
  const doc = readFileSync(new URL("docs/medicion.md", root), "utf8");
  assert.equal(doc, withoutUnlistedDemos(renderDoc(new URL(".", root).pathname), doc));
  assert.match(doc, /localStorage/);
  assert.match(doc, /bolla_internal/);
  assert.match(doc, /bmaudit-/);
  assert.match(doc, /\?interno=0/);
  const demos = rows.filter((row) => row.kind === "demo");
  assert.ok(demos.length > 500);
  for (const row of demos) {
    const html = read(row.rel);
    assert.match(html, /function bollaStore/, row.rel);
    assert.match(html, /bolla_internal/, row.rel);
    assert.match(html, /\[\?&#\]interno=\(\[01\]\)/, row.rel);
    assert.match(html, /bmaudit-/, row.rel);
    assert.match(html, /skipgc/, row.rel);
    assert.equal(row.visit.length > 0, true, row.rel);
    if (doc.includes(`| ${row.route} |`)) {
      assert.match(doc, new RegExp(`\\| ${row.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\|`));
    }
    assert.doesNotMatch(html, /bsTrack\([^)\n]{0,180}input\.value/, row.rel);
    assert.doesNotMatch(html, /bsTrack\([\s\S]{0,220}transcript/i, row.rel);
  }
  for (const row of rows.filter((item) => item.kind !== "demo")) {
    const html = read(row.rel);
    assert.doesNotMatch(html, /bollastudio\.goatcounter\.com\/count/, row.rel);
  }
  const hotelRow = demos.find((row) => row.route === "/hotel/es/");
  assert.match(hotelRow.events.join(" "), /\/bolla-demo-hotel\/es\/chat\/\{id\}\?p=\{p\}/);
  assert.match(hotelRow.events.join(" "), /\/request\/confirm\?p=\{p\}/);
  const chat = demos.find((row) => row.route === "/garage-crotta-lugano/chat/");
  assert.match(chat.events.join(" "), /\/response\/\{lang\}/);
  const voice = demos.find((row) => row.route === "/garage-crotta-lugano/voce/");
  assert.match(voice.events.join(" "), /\/connected\/\{lang\}/);
  assert.equal(demos.find((row) => row.route === "/es/").events.length, 0);
});
