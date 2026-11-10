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
    .replace(/<nav class="langs"[\s\S]*?<\/nav>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadDemo(html) {
  const packJson = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = sectorScript(html);
  const tracks = [];
  function makeEl(id) {
    const el = {
      id,
      textContent: id === "demo-pack" ? packJson : "",
      value: id === "item" ? "Kontrolle" : "",
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
    return el;
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
  vm.runInContext(script, sandbox, { filename: "dentist/de/index.html" });
  return { demo: sandbox.window.__sectorDemo, elements, tracks };
}

function counterScript(html) {
  const match = html.match(/\(function\(\)\{\s*var BASE="\/bolla-demo-dentist\/de";[\s\S]*?\}\)\(\);/);
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
  vm.runInContext(counterScript(html), context, { filename: "dentist/de/counter.js" });
  return { counts, appended, store, bsTrack: context.bsTrack, goatcounter: context.goatcounter };
}

function redirectTarget(search, languages, hash = "") {
  const page = read("dentist/index.html");
  const match = page.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/);
  assert.ok(match, "redirect script missing");
  let replaced = "";
  const sandbox = {
    location: {
      search,
      hash,
      replace(url) { replaced = url; },
    },
    navigator: { languages, language: languages[0] || "en" },
    URLSearchParams,
  };
  vm.createContext(sandbox);
  vm.runInContext(match[1], sandbox);
  return replaced;
}

const html = read("dentist/de/index.html");
const pack = packOf(html);
const loaded = loadDemo(html);
const demo = loaded.demo;
const shown = visible(html);

test("dentist/de uses the charter whole-word matcher and the dentist counter", () => {
  assert.equal(matcherBlock(html), matcherBlock(read("charter/et/index.html")));
  assert.match(sectorScript(html), /\\p\{L\}/);
  assert.doesNotMatch(html, /n\.indexOf\(nk\)/);
  assert.equal(demo.liveAI, false);
  assert.equal(demo.mode, "static-example");
  assert.equal(demo.lang, "de");
  assert.match(html, /<html lang="de"/);
  assert.match(html, /data-demo="static-example"/);
  assert.match(html, /var BASE="\/bolla-demo-dentist\/de"/);
  assert.match(html, /title:"dentist demo de"/);
  assert.match(html, /s\.src="https:\/\/gc\.zgo\.at\/count\.js"/);
  assert.match(html, /skipgc/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);
  assert.match(html, /path:BASE\+'\/'\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /bsTrack\("\/chat\/" \+ r\.id, "example"\)/);
  assert.match(html, /bsTrack\("\/request\/confirm", "example"\)/);
  assert.doesNotMatch(html, /bsTrack\([^)]*input\.value/);
  assert.doesNotMatch(sectorScript(html), /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.doesNotMatch(html, /wa\.me|elevenlabs|openai|tel:/i);
  assert.doesNotMatch(html, /<audio\b/i);
  const submit = sectorScript(html).match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
  assert.ok(submit);
  assert.doesNotMatch(submit[0], /bsTrack/);
  assert.match(submit[0], /answerFor\(q\)/);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").priority, true);
  assert.deepEqual(pack.rules.filter((rule) => rule.button).map((rule) => rule.id), ["pain", "hours", "children", "afraid", "price"]);
  for (const lang of ["et", "ru", "en"]) {
    const page = read(`dentist/${lang}/index.html`);
    assert.match(page, /n\.indexOf\(nk\)/);
    assert.doesNotMatch(page, /function tokensOf/);
    assert.match(page, new RegExp(`var BASE="/bolla-demo-dentist/${lang}"`));
  }
});

test("German replies match whole words and reject false friends", () => {
  const cases = [
    ["Ich habe starke Zahnschmerzen. Was soll ich tun?", "pain"],
    ["Ich habe Zahnschmerzen", "pain"],
    ["Backenzahnschmerzen", "pain"],
    ["Ich habe Schmerzen", "pain"],
    ["zahnweh", "pain"],
    ["Wann haben Sie geöffnet?", "hours"],
    ["Wie sind die Öffnungszeiten?", "hours"],
    ["Sprechzeiten bitte", "hours"],
    ["Sind Sie offen?", "hours"],
    ["Nehmen Sie Kinder an?", "children"],
    ["mein Kind", "children"],
    ["Kinder", "children"],
    ["Ich habe Angst vor dem Zahnarzt.", "afraid"],
    ["Ich bin ängstlich", "afraid"],
    ["Ich habe Ängste", "afraid"],
    ["Ich bin nervös", "afraid"],
    ["Was kostet ein Implantat?", "price"],
    ["Implantate", "price"],
    ["Zahnimplantat", "price"],
    ["Sonderpreis", "price"],
    ["Wie hoch ist das Honorar?", "price"],
    ["Wie hoch ist die Gebühr?", "price"],
    ["Notfall", "emergency"],
    ["Notfälle", "emergency"],
    ["Jemand ist bewusstlos", "emergency"],
    ["Er atmet nicht", "emergency"],
    ["starke Blutung", "emergency"],
    ["Es brennt", "emergency"],
    ["112", "emergency"],
    ["Feuerwehr", "emergency"],
    ["Was kostet der Notfall?", "emergency"],
    ["Zahnschmerzen und ein Notfall", "emergency"],
    ["Ich bin schmerzfrei", "fallback"],
    ["Haben Sie ein Schmerzmittel?", "fallback"],
    ["Das ist schmerzlich", "fallback"],
    ["Schmerzensgeld", "fallback"],
    ["hoffentlich heute", "fallback"],
    ["Das ist offenbar ein Fehler", "fallback"],
    ["Kindheit", "fallback"],
    ["Ist der Kinderarzt da?", "fallback"],
    ["Kindergeld", "fallback"],
    ["Gibt es einen Kindergarten?", "fallback"],
    ["Ist das preiswert?", "fallback"],
    ["preislich", "fallback"],
    ["Die Implantation ist geplant", "fallback"],
    ["Was ist ein Kostüm?", "fallback"],
    ["kostbar", "fallback"],
    ["Wie ist der Blutdruck?", "fallback"],
    ["Welche Blutgruppe?", "fallback"],
    ["Vollblut", "fallback"],
    ["unfallfrei seit Jahren", "fallback"],
    ["Ist das notwendig?", "fallback"],
    ["Bitte notieren Sie das", "fallback"],
    ["Das Auto ist brandneu", "fallback"],
    ["Feuerwerk am Samstag", "fallback"],
    ["Kann man hier filmen?", "fallback"],
    ["Ist das eine gute Geldanlage?", "fallback"],
    ["Kann man Schach spielen?", "fallback"],
    ["Fahren Sie nach Japan?", "fallback"],
    ["Gibt es WLAN?", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);

  const off = demo.answerFor("Kann man Schach spielen?");
  assert.match(off.text, /geschriebenes Beispiel/);
  assert.match(off.text, /kein Assistent in Echtzeit/);
  assert.match(off.text, /nicht mit WhatsApp/);
  assert.match(off.text, /Sprachassistenten/);
  assert.doesNotMatch(off.text, /112/);

  const emergency = demo.answerFor("Jemand ist bewusstlos");
  assert.match(emergency.text, /Rufen Sie jetzt 112 an/);
  assert.match(emergency.text, /Notrufnummer in Deutschland/);
  assert.match(emergency.text, /Europäischen Union/);
  assert.doesNotMatch(emergency.text, /Ibuprofen|Paracetamol|spülen|kühlen Sie|Herzdruckmassage|stabile Seitenlage|Druckverband|Mund-zu-Mund|Protokoll|legen Sie|heben Sie|Beatmung/i);
  const pricedEmergency = demo.answerFor("Was kostet der Notfall?");
  assert.equal(pricedEmergency.id, "emergency");
  assert.match(pricedEmergency.text, /112/);
  assert.doesNotMatch(pricedEmergency.text, /€|\b\d+\s*Euro\b|Euro\s*\d|Kostenvoranschlag|keinen Betrag/i);

  const pain = demo.answerFor("Ich habe Zahnschmerzen");
  assert.match(pain.text, /kann nicht diagnostizieren/);
  assert.match(pain.text, /112/);
  assert.match(pain.text, /keine Behandlungsschritte/);
  assert.doesNotMatch(pain.text, /Ibuprofen|spülen Sie|kühlen Sie|Milligramm|Dosierung/i);

  const price = demo.answerFor("Was kostet ein Implantat?");
  assert.match(price.text, /keinen Betrag in Euro/);
  assert.doesNotMatch(price.text, /€|\b\d+\s*Euro\b|Euro\s*\d/i);
  assert.match(html, /erfunden|erfundenen|erfundene/);
  assert.match(html, /geschriebenes Beispiel|Geschriebenes Beispiel/);
  assert.match(html, /kein Assistent in Echtzeit/);
});

test("the Germany page stays fictional, formal, and free of Swiss marks", () => {
  assert.match(shown, /Beispielpraxis Zahn/);
  assert.match(shown, /Berlin/);
  assert.match(shown, /Beispielstraße 12/);
  assert.match(shown, /\+49 30 0000 0000/);
  assert.match(shown, /Euro/);
  assert.match(shown, /nicht personalisiert/);
  assert.match(shown, /keine Personalisierung/);
  assert.match(shown, /vorher geschrieben/);
  assert.match(shown, /nicht mit WhatsApp/);
  assert.match(shown, /Es wird kein Ton abgespielt/);
  assert.match(shown, /Sprachassistent ist hier nicht verbunden/);
  assert.match(shown, /Sie/);
  assert.match(shown, /Ihnen/);
  assert.match(shown, /Beispielstraße/);
  assert.match(shown, /große/);
  assert.match(shown, /Außerhalb/);
  assert.match(shown, /heißt/);
  assert.match(html, /Marcelo Bolla/);
  assert.match(html, /https:\/\/bollastudio\.com/);
  assert.match(html, /<ol class="steps">/);
  assert.match(html, /min-height:48px/);
  assert.doesNotMatch(html, /Schweiz|\+41|CHF|Swiss/i);
  assert.doesNotMatch(html, /\b(du|dich|dir|dein|deine|deinen)\b/);
  assert.doesNotMatch(html, /Charité|Ku64|Zahnkultur|künstliche Intelligenz|KI-Agent|ChatGPT/i);
  assert.doesNotMatch(shown, /\b(scripted|please|hello|toothache|sample guest|check-up)\b/i);
  assert.match(pack.chat[0][1], /^Guten Tag/);
  assert.match(pack.chat[1][1], /^Guten Tag/);
  assert.match(pack.ok, /nichts gebucht/);
  assert.match(pack.ok, /nichts gesendet/);
});

test("counted paths keep a sanitised p and internal=1 sends nothing", () => {
  const plain = runCounter("");
  assert.equal(plain.appended.length, 1);
  assert.equal(plain.appended[0].src, "https://gc.zgo.at/count.js");
  assert.deepEqual(plainCounts(plain.counts), [{ path: "/bolla-demo-dentist/de/", title: "dentist demo de" }]);
  plain.bsTrack("/chat/pain", "example");
  plain.bsTrack("/request/confirm", "example");
  assert.deepEqual(plainCounts(plain.counts.slice(1)), [
    { path: "/bolla-demo-dentist/de/chat/pain", title: "example", event: true },
    { path: "/bolla-demo-dentist/de/request/confirm", title: "example", event: true },
  ]);

  const tagged = runCounter("?p=Berlin_Demo!&utm=1");
  assert.equal(tagged.counts[0].path, "/bolla-demo-dentist/de/?p=berlindemo");
  tagged.bsTrack("/chat/hours", "example");
  assert.equal(tagged.counts[1].path, "/bolla-demo-dentist/de/chat/hours?p=berlindemo");
  assert.equal(tagged.counts[1].title, "example");
  assert.equal(tagged.counts[1].event, true);

  const clean = runCounter("?p=de-berlin-01");
  assert.equal(clean.counts[0].path, "/bolla-demo-dentist/de/?p=de-berlin-01");
  const long = runCounter("?p=" + "A".repeat(80));
  assert.equal(long.counts[0].path, "/bolla-demo-dentist/de/?p=" + "a".repeat(60));

  const skipped = runCounter("?internal=1&p=de-berlin-01");
  assert.equal(skipped.appended.length, 0);
  assert.equal(skipped.counts.length, 0);
  assert.equal(skipped.store.skipgc, "t");
  skipped.bsTrack("/chat/pain", "Ich habe Zahnschmerzen");
  assert.equal(skipped.counts.length, 0);

  const again = runCounter("?internal=0", { skipgc: "t" });
  assert.equal(again.store.skipgc, undefined);
  assert.equal(again.counts[0].path, "/bolla-demo-dentist/de/");

  const queued = runCounter("?p=de-berlin-01", {}, { load: false });
  assert.equal(queued.counts.length, 0);
  queued.bsTrack("/chat/children", "example");
  queued.goatcounter.count = (payload) => queued.counts.push(payload);
  queued.appended[0].onload();
  assert.deepEqual(plainCounts(queued.counts), [
    { path: "/bolla-demo-dentist/de/?p=de-berlin-01", title: "dentist demo de" },
    { path: "/bolla-demo-dentist/de/chat/children?p=de-berlin-01", title: "example", event: true },
  ]);
  assert.equal(JSON.stringify(queued.counts).includes("Nehmen Sie"), false);
});

test("usage is counted only for a real button or the example note", () => {
  assert.equal(loaded.tracks.length, 0);
  const pain = loaded.elements.qr.children.find((button) => button.textContent.startsWith("Ich habe starke Zahnschmerzen"));
  assert.ok(pain);
  pain.onclick();
  assert.deepEqual(loaded.tracks, [{ sub: "/chat/pain", title: "example" }]);
  loaded.elements.ask.value = "Ich bin schmerzfrei und heiße Gast Beispiel";
  const submit = loaded.elements["ask-form"].listeners.find((listener) => listener.type === "submit");
  submit.fn({ preventDefault() {} });
  assert.equal(loaded.tracks.length, 1);
  assert.equal(loaded.elements.ask.value, "");
  const last = loaded.elements.chat.children.at(-1).textContent;
  assert.match(last, /geschriebenes Beispiel/);
  assert.equal(JSON.stringify(loaded.tracks).includes("heiße"), false);

  const cta = loaded.elements.cta.listeners.find((listener) => listener.type === "click");
  cta.fn();
  assert.match(loaded.elements.ok.textContent, /Bitte wählen Sie zuerst/);
  assert.equal(loaded.tracks.length, 1);
  loaded.elements.slots.children[0].onclick();
  cta.fn();
  assert.deepEqual(loaded.tracks.at(-1), { sub: "/request/confirm", title: "example" });
  assert.match(loaded.elements.ok.textContent, /Nur ein Beispiel: Kontrolle · \d{2}\.\d{2}\.\d{4} · Vormittag/);
  assert.match(loaded.elements.ok.textContent, /nichts gebucht/);
  assert.match(loaded.elements.ok.textContent, /nichts gesendet/);
  assert.doesNotMatch(sectorScript(html), /getElementById\("nm"\)|getElementById\("ph"\)/);
});

test("Deutsch is added without changing the et, ru or en URLs", () => {
  assert.equal(redirectTarget("", ["et-EE", "et"]), "et/");
  assert.equal(redirectTarget("", ["ru-RU"]), "ru/");
  assert.equal(redirectTarget("", ["en-GB", "en"]), "en/");
  assert.equal(redirectTarget("", ["en", "de"]), "en/");
  assert.equal(redirectTarget("", ["fr-FR"]), "en/");
  assert.equal(redirectTarget("", ["de-DE", "de"]), "de/");
  assert.equal(redirectTarget("?lang=et", ["de-DE"]), "et/");
  assert.equal(redirectTarget("?lang=ru", ["de-DE"]), "ru/");
  assert.equal(redirectTarget("?lang=en", ["de-DE"]), "en/");
  assert.equal(redirectTarget("?lang=de", ["en-GB"]), "de/");
  assert.equal(redirectTarget("?p=sakala&internal=1", ["et"]), "et/?p=sakala&internal=1");
  assert.equal(redirectTarget("?p=de-berlin-01&internal=1", ["de-DE"], "#frage"), "de/?p=de-berlin-01&internal=1#frage");

  const index = read("dentist/index.html");
  assert.match(index, /href="et\/" lang="et" data-keep-query>Eesti/);
  assert.match(index, /href="ru\/" lang="ru" data-keep-query>Русский/);
  assert.match(index, /href="en\/" lang="en" data-keep-query>English/);
  assert.match(index, /href="de\/" lang="de" data-keep-query>Deutsch/);
  assert.match(index, /supported=\["et","ru","en","de"\]/);
  assert.doesNotMatch(index, /gc\.zgo\.at\/count\.js/);
  assert.match(index, /location\.search/);

  for (const lang of ["et", "ru", "en"]) {
    const page = read(`dentist/${lang}/index.html`);
    assert.match(page, /href="\.\.\/de\/" hreflang="de" lang="de" data-keep-query>Deutsch</);
    assert.match(page, /hreflang="et"/);
    assert.match(page, /hreflang="ru"/);
    assert.match(page, /hreflang="en"/);
  }
  assert.match(read("dentist/et/index.html"), /Näidishambaravi/);
  assert.match(read("dentist/en/index.html"), /Example Dental/);
  assert.match(read("dentist/ru/index.html"), /Стоматология Пример/);

  let kept = "";
  const anchor = {
    getAttribute() { return "../et/"; },
    set href(value) { kept = value; },
  };
  const sandbox = {
    location: {
      href: "https://demo.bollastudio.com/dentist/de/?p=de-berlin-01&internal=1#oben",
      search: "?p=de-berlin-01&internal=1",
      hash: "#oben",
    },
    document: { querySelectorAll() { return [anchor]; } },
    URL,
  };
  vm.createContext(sandbox);
  const links = html.match(/<script id="bolla-lang-links">([\s\S]*?)<\/script>/)[1];
  vm.runInContext(links, sandbox);
  assert.equal(kept, "/dentist/et/?p=de-berlin-01&internal=1#oben");
});
