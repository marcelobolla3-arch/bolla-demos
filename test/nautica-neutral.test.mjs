import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const banned = /Italia|Italy|Olbia|Sardegna|Cerdeña|Sardinia|1530|\+39|Guardia Costiera|Tallinn|Schweiz|\+41|Portisco/;

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function dataOf(html) {
  const match = html.match(/window\.DATA=(\{.*?\});<\/script>/s);
  assert.ok(match, "nautica DATA missing");
  return JSON.parse(match[1]);
}

function uiOf(html) {
  const match = html.match(/<script>\s*(const UI=\{[\s\S]*?)<\/script>/);
  assert.ok(match, "nautica UI missing");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${match[1]}\nthis.UI=UI; this.KB_CLUSTERS=KB_CLUSTERS; this.KB_LANES=KB_LANES;`, sandbox, { filename: "nautica-ui.js" });
  assert.equal(typeof sandbox.UI.fr.tagline, "string");
  return sandbox;
}

function langStrings(node, lang, out = []) {
  if (typeof node === "string") {
    if (lang === "en" || lang === "es" || lang === "fr") out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) langStrings(item, lang, out);
    return out;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "svg") continue;
      const next = key === "it" || key === "en" || key === "es" || key === "fr" ? key : lang;
      langStrings(value, next, out);
    }
  }
  return out;
}

function quotedLangStrings(html, lang) {
  const out = [];
  const re = new RegExp(`(?:["']${lang}["']\\s*:\\s*|\\b${lang}:\\s*)"((?:\\\\.|[^"\\\\])*)"`, "g");
  let match;
  while ((match = re.exec(html))) out.push(JSON.parse(`"${match[1]}"`));
  return out;
}

function headScript(html) {
  const match = html.match(/<script id="nautica-lang">([\s\S]*?)<\/script>/);
  assert.ok(match, "nautica-lang script missing");
  assert.doesNotMatch(match[0], /\b(?:defer|async|type\s*=)\b|DOMContentLoaded/);
  const head = html.slice(html.indexOf("<head"), html.indexOf("</head>"));
  assert.match(head, /<script id="nautica-lang">/);
  assert.ok(html.indexOf("<title>") < html.indexOf('<script id="nautica-lang">'));
  return match[1];
}

function applyHead(html, search, pathname) {
  const document = {
    documentElement: { lang: "it" },
    title: "Lagoon 42 · Assistente di bordo · BOLLA STUDIO",
  };
  const sandbox = { document, location: { search, pathname, hash: "" } };
  vm.createContext(sandbox);
  vm.runInContext(headScript(html), sandbox, { filename: "nautica-lang.js" });
  return document;
}

function resolveLang(html, { search, pathname, stored, navigatorLanguage }) {
  return resolveVisit(html, { search, pathname, stored, navigatorLanguage }).uiLang;
}

function resolveVisit(html, { search, pathname, stored, navigatorLanguage }) {
  const start = html.indexOf("const LANGS=");
  const end = html.indexOf("const T=()", start);
  assert.ok(start > 0 && end > start);
  const sandbox = {
    localStorage: { getItem(key) { assert.equal(key, "bs_lang"); return stored ?? null; } },
    navigator: { language: navigatorLanguage ?? "it" },
    location: { search, pathname },
    URLSearchParams,
  };
  vm.createContext(sandbox);
  vm.runInContext(`${html.slice(start, end)}\nthis.uiLang=uiLang; this.routeLang=routeLang;`, sandbox, { filename: "nautica-lang-init.js" });
  return { uiLang: sandbox.uiLang, routeLang: sandbox.routeLang };
}

test("without ?lang= the route chooses the language, and a query still overrides it", () => {
  const html = read("nautica/index.html");
  const root = resolveVisit(html, { search: "", pathname: "/nautica/", stored: "es", navigatorLanguage: "en" });
  assert.equal(root.uiLang, "it");
  assert.equal(root.routeLang, "it");
  const spanish = resolveVisit(html, { search: "", pathname: "/nautica/es/", stored: "en", navigatorLanguage: "it" });
  assert.equal(spanish.uiLang, "es");
  assert.equal(spanish.routeLang, "es");
  const french = resolveVisit(html, { search: "?lang=fr", pathname: "/nautica/", stored: "es", navigatorLanguage: "en" });
  assert.equal(french.uiLang, "fr");
  assert.equal(french.routeLang, "fr");
  const mixed = resolveVisit(html, { search: "?lang=es", pathname: "/nautica/en/", stored: "fr", navigatorLanguage: "it" });
  assert.equal(mixed.uiLang, "es");
  assert.equal(mixed.routeLang, "en");
  assert.match(html, /localStorage\.setItem\("bs_lang",uiLang\)/);
  assert.doesNotMatch(html, /localStorage\.getItem\("bs_lang"\)/);
});

const pages = ["nautica/index.html", "nautica/en/index.html", "nautica/es/index.html", "nautica/fr/index.html"];

test("Spanish and English Lagoon 42 copy names no country, city or local phone", () => {
  for (const path of pages) {
    const html = read(path);
    const data = dataOf(html);
    const ui = uiOf(html);
    const authored = [
      ...langStrings(data, null),
      ...langStrings(ui.UI, null),
      ...langStrings(ui.KB_CLUSTERS, null),
      ...langStrings(ui.KB_LANES, null),
      ...quotedLangStrings(html, "en"),
      ...quotedLangStrings(html, "es"),
    ];
    assert.ok(authored.length > 40, path);
    for (const text of authored) assert.doesNotMatch(text, banned, `${path}: ${text}`);
    for (const page of data.pages) assert.doesNotMatch(page.t, banned, `${path} manual p.${page.p}`);
  }

  const data = dataOf(read("nautica/index.html"));
  const vhf = data.topics.find((topic) => topic.id === "vhf");
  assert.match(vhf.steps[2][0].it, /In Italia la Guardia Costiera risponde anche al 1530/);
  assert.match(vhf.nocover.it, /1530/);
  assert.equal(
    vhf.steps[2][0].es,
    "Canal 16 VHF: canal internacional de socorro y llamada. En caso de emergencia, contacta con el servicio de salvamento marítimo local o llama al 112.",
  );
  assert.match(vhf.steps[2][0].en, /Channel 16 VHF/);
  assert.match(vhf.steps[2][0].en, /call 112/);
  for (const id of ["water-ingress", "gas-leak", "fire", "mob"]) {
    const topic = data.topics.find((item) => item.id === id);
    assert.match(topic.lead.it, /Guardia Costiera/);
    assert.match(topic.lead.it, /1530/);
    assert.match(topic.lead.es, /VHF 16 o 112/);
    assert.match(topic.lead.en, /VHF 16 or 112/);
    assert.match(topic.lead.fr, /VHF 16 ou 112/);
    assert.doesNotMatch(topic.lead.es, /protocolo|MAYDAY|mayday/i);
    assert.doesNotMatch(topic.lead.en, /\bprotocol\b|MAYDAY|mayday/i);
    assert.doesNotMatch(topic.lead.fr, /protocole|MAYDAY|mayday/i);
  }

  const html = read("nautica/index.html");
  const callStart = html.indexOf(`(routeLang==="it"?'<a href="tel:1530">'+esc(t.calls)+' 1530</a>':'')`);
  const callEnd = html.indexOf(`+'<a href="tel:112">'+esc(t.calls)+' 112</a>`, callStart);
  assert.ok(callStart > 0 && callEnd > callStart, "emergency calls must keep 1530 behind the Italian route");
  assert.doesNotMatch(html, /L==="it"\?'<a href="tel:1530">/);
  const build = new Function("routeLang", "esc", "t", `return ${html.slice(callStart, callEnd)}+'<a href="tel:112">'+esc(t.calls)+' 112</a>'`);
  const label = (routeLang) => build(routeLang, (value) => value, { calls: "Call", vhf: "VHF" });
  assert.match(label("it"), /tel:1530/);
  assert.match(label("it"), /tel:112/);
  assert.doesNotMatch(label("es"), /1530/);
  assert.match(label("es"), /tel:112/);
  assert.doesNotMatch(label("en"), /1530/);
  assert.match(label("en"), /tel:112/);
  assert.doesNotMatch(label("fr"), /1530/);
  assert.match(label("fr"), /tel:112/);
  assert.match(data.topics.find((topic) => topic.id === "refuse-nav").q.it, /fondeggio/);
  assert.doesNotMatch(data.topics.find((topic) => topic.id === "refuse-nav").q.it, /Portisco/);
  assert.equal(data.topics.find((topic) => topic.id === "vhf").steps[2][0].fr.includes("112"), true);
});

test("?lang=es sets html lang and title before the page renders", () => {
  const html = read("nautica/index.html");
  const spanish = applyHead(html, "?lang=es", "/nautica/");
  assert.equal(spanish.documentElement.lang, "es");
  assert.equal(spanish.title, "Lagoon 42 · Asistente de a bordo · BOLLA STUDIO");

  const withProspect = applyHead(html, "?p=lagoon&lang=es", "/nautica/");
  assert.equal(withProspect.documentElement.lang, "es");
  assert.equal(withProspect.title, "Lagoon 42 · Asistente de a bordo · BOLLA STUDIO");

  const english = applyHead(html, "?lang=en&p=lagoon", "/nautica/index.html");
  assert.equal(english.documentElement.lang, "en");
  assert.equal(english.title, "Lagoon 42 · Onboard assistant · BOLLA STUDIO");

  const french = applyHead(html, "?p=lagoon&lang=fr", "/nautica/");
  assert.equal(french.documentElement.lang, "fr");
  assert.equal(french.title, "Lagoon 42 · Assistant de bord · BOLLA STUDIO");

  const untouched = applyHead(html, "?p=lagoon", "/nautica/");
  assert.equal(untouched.documentElement.lang, "it");
  assert.equal(untouched.title, "Lagoon 42 · Assistente di bordo · BOLLA STUDIO");

  assert.equal(resolveLang(html, { search: "?lang=es", pathname: "/nautica/", stored: "it", navigatorLanguage: "it" }), "es");
  assert.equal(resolveLang(html, { search: "?p=lagoon&lang=en", pathname: "/nautica/", stored: "es", navigatorLanguage: "it" }), "en");
  assert.equal(resolveLang(html, { search: "?p=lagoon", pathname: "/nautica/", stored: "en", navigatorLanguage: "it" }), "it");
  assert.equal(resolveLang(html, { search: "", pathname: "/nautica/", stored: null, navigatorLanguage: "es-ES" }), "it");
  assert.equal(resolveLang(html, { search: "", pathname: "/nautica/", stored: null, navigatorLanguage: "fr-FR" }), "it");
  assert.equal(resolveLang(html, { search: "", pathname: "/nautica/", stored: null, navigatorLanguage: "de" }), "it");
  assert.equal(resolveLang(html, { search: "?lang=fr&p=lagoon", pathname: "/nautica/", stored: "it", navigatorLanguage: "it" }), "fr");
  assert.equal(resolveLang(html, { search: "?p=lagoon", pathname: "/nautica/es/", stored: "it", navigatorLanguage: "it" }), "es");
  assert.equal(resolveLang(html, { search: "?lang=en&p=lagoon", pathname: "/nautica/es/", stored: "it", navigatorLanguage: "it" }), "en");

  assert.match(html, /path:"\/"\+slug\+"\/demo",title:"demo"/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /localStorage\.setItem\("skipgc","t"\)/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /\[\?&#\]interno=\(\[01\]\)/);
});

test("static /nautica/es/ and /nautica/fr/ match the Italian page except lang and title", () => {
  const canonical = read("nautica/index.html");
  const normalize = (html) => html
    .replace(/<html lang="[a-z]{2}">/, '<html lang="*">')
    .replace(/<title>[^<]*<\/title>/, "<title>*</title>");
  const same = normalize(canonical);
  for (const [path, lang, title] of [
    ["nautica/es/index.html", "es", "Lagoon 42 · Asistente de a bordo · BOLLA STUDIO"],
    ["nautica/fr/index.html", "fr", "Lagoon 42 · Assistant de bord · BOLLA STUDIO"],
  ]) {
    const html = read(path);
    assert.equal(normalize(html), same, path);
    assert.match(html, new RegExp(`<html lang="${lang}"><head>`));
    assert.match(html, new RegExp(`<title>${title}</title>`));
    const served = applyHead(html, "?p=prospecto", `/nautica/${lang}/`);
    assert.equal(served.documentElement.lang, lang);
    assert.equal(served.title, title);
    assert.match(html, /path:"\/"\+slug\+"\/demo",title:"demo"/);
    assert.match(html, /skipgc/);
  }
  const en = read("nautica/en/index.html");
  assert.match(en, /<html lang="en"><head>/);
  assert.match(en, /<title>Lagoon 42 · Onboard assistant · BOLLA STUDIO<\/title>/);
  const served = applyHead(en, "?p=prospecto", "/nautica/en/");
  assert.equal(served.documentElement.lang, "en");
  assert.equal(served.title, "Lagoon 42 · Onboard assistant · BOLLA STUDIO");
  assert.match(en, /path:"\/"\+slug\+"\/demo",title:"demo"/);
  assert.match(en, /skipgc/);
  assert.match(read("nautica/index.html"), /data-l="fr">FR</);
});

test("French questions use the same matcher and emergencies stay on channel 16 or 112", () => {
  const html = read("nautica/index.html");
  const data = dataOf(html);
  const start = html.indexOf("const norm=");
  const end = html.indexOf("/* ---------- BM25");
  const sandbox = { D: data, LANGS: ["it", "en", "es", "fr"] };
  vm.createContext(sandbox);
  vm.runInContext(`${html.slice(start, end)}\nthis.matchTopic=matchTopic;`, sandbox, { filename: "nautica-match.js" });
  for (const topic of data.topics) {
    for (const lang of ["it", "en", "es", "fr"]) {
      const hit = sandbox.matchTopic(topic.q[lang]);
      assert.equal(hit && hit.id, topic.id, `${lang} ${topic.q[lang]}`);
    }
  }
  const cases = [
    ["de l'eau entre dans la coque", "water-ingress"],
    ["je sens le gaz", "gas-leak"],
    ["il y a un incendie", "fire"],
    ["homme à la mer", "mob"],
    ["où est le pilote automatique", "autopilot-info"],
    ["allume le pilote automatique", "refuse-nav"],
    ["emmène-nous au mouillage", "refuse-nav"],
    ["pas d'eau chaude", "water-heater"],
    ["Engage the autopilot and take us to Portisco", "refuse-nav"],
    ["Pon el piloto automático y llévanos a Portisco", "refuse-nav"],
    ["Accendi il pilota e portaci a Portisco", "refuse-nav"],
  ];
  for (const [question, id] of cases) assert.equal(sandbox.matchTopic(question).id, id, question);
});

function makeEl() {
  return {
    innerHTML: "",
    textContent: "",
    className: "",
    children: [],
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    setAttribute() {},
    addEventListener() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    appendChild(child) { this.children.push(child); return child; },
    insertBefore(node) { return node; },
    closest() { return this; },
    remove() {},
    getBBox() { return {}; },
    scrollIntoView() {},
  };
}

function loadBoat(html, where = {}) {
  const data = dataOf(html);
  const uiScript = html.match(/<script>\s*(const UI=\{[\s\S]*?)<\/script>/)[1];
  const start = html.indexOf("const D=window.DATA");
  const end = html.indexOf("window.__ask=ask;", start);
  assert.ok(start > 0 && end > start);
  const document = {
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    createElement() { return makeEl(); },
    getElementById() { return makeEl(); },
  };
  const sandbox = {
    document,
    localStorage: { getItem() { return null; } },
    navigator: { language: "it" },
    location: { search: where.search || "", pathname: where.pathname || "/nautica/", hash: "" },
    URLSearchParams,
    requestAnimationFrame() {},
    matchMedia() { return { matches: true }; },
    console,
  };
  sandbox.window = sandbox;
  sandbox.window.DATA = data;
  sandbox.window.bsTrack = () => {};
  sandbox.window.BS = { slug: "lagoon42" };
  vm.createContext(sandbox);
  vm.runInContext(`${uiScript}\n${html.slice(start, end + "window.__ask=ask;".length)}
this.setPageLang=function(l){uiLang=l; routeLang=l;};
this.visit=function(){return {uiLang, routeLang, sample: KB_MSGS[uiLang][0].m};};
this.askCard=function(q){
  const det=detect(q);
  const L=det||uiLang;
  const m=matchTopic(q);
  if(!m) return {L, html:"", det, id:null};
  const tp=D.topics.find(function(x){return x.id===m.id;});
  const card=answerCurated(tp,L,det&&det!==uiLang);
  return {L, html:card.innerHTML, det, id:m.id};
};
this.detect=detect;`, sandbox, { filename: "nautica-ask.js" });
  return { data, ui: uiOf(html), boat: sandbox };
}

const typedEmergencies = {
  it: ["entra acqua nello scafo", "sento odore di gas", "c'è un incendio", "uomo a mare"],
  en: ["water is coming in", "I smell gas", "there is a fire", "man overboard"],
  es: ["entra agua", "huele a gas", "hay fuego", "hombre al agua"],
  fr: ["de l'eau entre dans la coque", "je sens le gaz", "il y a un incendie", "Il y a de la fumée / un feu", "homme à la mer"],
};

function escText(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function assertPageLanguage(card, lang, ui, label) {
  assert.equal(card.L, lang, label);
  assert.match(card.html, new RegExp(`${ui.UI[lang].calls} 112`), label);
  if (lang === "it") assert.match(card.html, /1530/, label);
  else assert.doesNotMatch(card.html, /1530/, label);
  for (const other of ["it", "en", "es", "fr"]) {
    if (other === lang || ui.UI[other].calls === ui.UI[lang].calls) continue;
    assert.doesNotMatch(card.html, new RegExp(`${ui.UI[other].calls} 112`), `${label} ${other}`);
  }
}

test("a ?lang= link on /nautica/ follows that language's country, and a bare visit stays on 1530", () => {
  const html = read("nautica/index.html");
  assert.match(html, /if\(!pathLang&&\["en","es","fr"\]\.includes\(qs\.get\("lang"\)\)\)routeLang=qs\.get\("lang"\)/);
  assert.match(html, /path:"\/"\+slug\+"\/demo",title:"demo"/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);

  const bare = loadBoat(html).boat;
  assert.deepEqual(
    { uiLang: bare.visit().uiLang, routeLang: bare.visit().routeLang },
    { uiLang: "it", routeLang: "it" },
  );
  assert.match(bare.visit().sample, /^Ciao!/);
  const bareFire = bare.askCard("c'è un incendio");
  assert.equal(bareFire.id, "fire");
  assert.match(bareFire.html, /tel:1530/);
  assert.match(bareFire.html, /tel:112/);
  const bareVhf = bare.askCard("VHF e canale 16");
  assert.equal(bareVhf.id, "vhf");
  assert.match(bareVhf.html, /In Italia la Guardia Costiera risponde anche al 1530/);

  const italian = loadBoat(html, { search: "?lang=it&p=lagoon", pathname: "/nautica/" }).boat;
  assert.equal(italian.visit().routeLang, "it");
  assert.match(italian.visit().sample, /^Ciao!/);
  assert.match(italian.askCard("VHF e canale 16").html, /In Italia/);
  assert.match(italian.askCard("c'è un incendio").html, /tel:1530/);

  const visits = {
    es: { emergency: "hay fuego", sample: "Hola, el agua caliente no sale de la ducha. ¿Qué hacemos?", calls: "Llamar" },
    en: { emergency: "there is a fire", sample: "Hi, no hot water is coming out of the shower. What should we do?", calls: "Call" },
    fr: { emergency: "il y a un incendie", sample: "Bonjour, l'eau chaude ne sort pas de la douche. Que fait-on ?", calls: "Appeler" },
  };
  for (const [lang, expect] of Object.entries(visits)) {
    const boat = loadBoat(html, { search: `?lang=${lang}&p=lagoon`, pathname: "/nautica/" }).boat;
    const visit = boat.visit();
    assert.equal(visit.uiLang, lang);
    assert.equal(visit.routeLang, lang);
    assert.equal(visit.sample, expect.sample);
    assert.doesNotMatch(visit.sample, /Ciao|frigorifero|doccia/);
    const card = boat.askCard(expect.emergency);
    assert.equal(card.L, lang, lang);
    assert.match(card.html, new RegExp(`tel:112`), lang);
    assert.match(card.html, new RegExp(`${expect.calls} 112`), lang);
    assert.doesNotMatch(card.html, /1530|In Italia/, lang);
    const vhf = boat.askCard("VHF e canale 16");
    assert.equal(vhf.id, "vhf", lang);
    assert.doesNotMatch(vhf.html, /1530|In Italia/, `${lang} vhf`);
    assert.match(vhf.html, /112/, `${lang} vhf`);
  }

  const pathWins = loadBoat(html, { search: "?lang=it&p=lagoon", pathname: "/nautica/es/" }).boat;
  assert.equal(pathWins.visit().uiLang, "it");
  assert.equal(pathWins.visit().routeLang, "es");
  assert.doesNotMatch(pathWins.askCard("VHF e canale 16").html, /1530|In Italia/);
});

test("prepared questions and typed emergencies answer in the page language", () => {
  const html = read("nautica/index.html");
  const { data, ui, boat } = loadBoat(html);
  assert.equal(boat.detect("il y a de la fumée / un feu"), "fr");
  assert.equal(boat.detect("il y a du feu"), "fr");
  assert.equal(boat.detect("il y du monde à bord"), "fr");
  for (const lang of ["it", "en", "es", "fr"]) {
    boat.setPageLang(lang);
    for (const topic of data.topics) {
      const card = boat.askCard(topic.q[lang]);
      assert.equal(card.id, topic.id, `${lang} ${topic.q[lang]}`);
      assert.equal(card.L, lang, `${lang} ${topic.q[lang]}`);
      assert.ok(card.html.includes(escText(topic.title[lang])), `${lang} title ${topic.q[lang]}`);
      assert.ok(card.html.includes(escText(topic.lead[lang])), `${lang} lead ${topic.q[lang]}`);
      if (topic.level === "emergency") assertPageLanguage(card, lang, ui, `${lang} ${topic.id}`);
      else assert.doesNotMatch(card.html, /tel:112/, `${lang} ${topic.id}`);
    }
    for (const question of typedEmergencies[lang]) {
      const card = boat.askCard(question);
      assert.equal(data.topics.find((topic) => topic.id === card.id).level, "emergency", question);
      assert.ok(card.html.includes(escText(data.topics.find((topic) => topic.id === card.id).lead[lang])), question);
      assertPageLanguage(card, lang, ui, question);
    }
  }
  boat.setPageLang("fr");
  const smoke = boat.askCard("Il y a de la fumée / un feu");
  assert.equal(smoke.id, "fire");
  assert.match(smoke.html, /Préviens tout de suite le skipper et appelle : VHF 16 ou 112/);
  assert.match(smoke.html, /Appeler 112/);
  assert.doesNotMatch(smoke.html, /Llamar|Avisa ya al patrón/);
});

function kbBox(html) {
  const script = html.match(/<script>\s*(const UI=\{[\s\S]*?)<\/script>/)[1];
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${script}\nthis.KB_MSGS=KB_MSGS; this.KB_CLUSTERS=KB_CLUSTERS; this.KB_LANES=KB_LANES;`, sandbox, { filename: "nautica-kb.js" });
  return sandbox;
}

test("each nautica language shows only its own KB example messages", () => {
  const langs = ["it", "en", "es", "fr"];
  for (const path of pages) {
    const html = read(path);
    assert.match(html, /KB_MSGS\[uiLang\]/, path);
    assert.doesNotMatch(html, /KB_MSGS\.map\(/, path);
    const box = kbBox(html);
    const texts = Object.fromEntries(langs.map((lang) => [lang, box.KB_MSGS[lang].map((row) => row.m)]));
    for (const lang of langs) {
      assert.equal(texts[lang].length, 6, `${path} ${lang}`);
      for (const other of langs) {
        if (other === lang) continue;
        for (const foreign of texts[other]) {
          assert.equal(texts[lang].includes(foreign), false, `${path} ${lang} shows ${other}: ${foreign}`);
        }
      }
    }
    const italian = texts.it.join("\n");
    assert.match(italian, /Ciao, come funziona il WC elettrico\? Premo e non succede niente\./);
    assert.match(italian, /Il frigorifero si è spento e non riparte\./);
    assert.match(italian, /Possiamo riconsegnare la barca un giorno dopo\? Quanto costa\?/);
    assert.doesNotMatch(italian, /heladera|Hi, how does|devolver el barco|réfrigérateur/i);
    const spanish = texts.es.join("\n");
    assert.match(spanish, /nevera/);
    assert.doesNotMatch(spanish, /heladera|\bvos\b|tenés|podés|Shore power|\bbreaker\b/i);
    const cards = [
      ...box.KB_LANES.agent.es,
      ...box.KB_LANES.human.es,
      ...box.KB_CLUSTERS.map((row) => [row.q.es, ""]),
    ].map((row) => row.join(" ")).join("\n");
    assert.match(cards, /nevera/);
    assert.doesNotMatch(cards, /heladera|Shore power|\bbreaker\b/i);
    assert.doesNotMatch(texts.en.join("\n"), /heladera|devolver el barco|riconsegnare|réfrigérateur/i);
    assert.doesNotMatch(texts.fr.join("\n"), /heladera|devolver el barco|riconsegnare|Nothing happens/i);
  }
});

test("nautica names no manufacturer city, country version or foreign phone", () => {
  const banned = /Bordeaux|Francia|\bFrance\b|US Version|Europe Version|Brazil Version|Portisco|33\s*\(\s*0\s*\)|\+\d{1,3}[\s-]\d/i;
  for (const path of pages) {
    const html = read(path);
    const data = dataOf(html);
    assert.doesNotMatch(html, banned, path);
    assert.doesNotMatch(JSON.stringify(data), banned, `${path} DATA`);
    for (const page of data.pages) {
      assert.doesNotMatch(page.t || "", banned, `${path} ${page.d} p.${page.p}`);
    }
    for (const topic of data.topics) {
      for (const field of ["q", "title", "lead", "nocover"]) {
        const value = topic[field];
        if (value && typeof value === "object") {
          for (const text of Object.values(value)) {
            if (typeof text === "string") assert.doesNotMatch(text, banned, `${path} ${topic.id} ${field}`);
          }
        }
      }
    }
    assert.match(html, /contact the manufacturer's service network/, path);
    assert.match(html, /rete di assistenza del costruttore/, path);
    assert.match(html, /red de servicio del fabricante/, path);
    assert.match(html, /réseau d'assistance du constructeur/, path);
    assert.match(html, /1530/, path);
    assert.match(html, /tel:112/, path);
    assert.doesNotMatch(html, /heladera|lavarropas/i, path);
  }
  const spanish = dataOf(read("nautica/es/index.html"));
  const fridge = spanish.topics.find((topic) => topic.id === "fridge");
  assert.match(fridge.lead.es, /Nevera de serie de 137 l/);
  assert.doesNotMatch(JSON.stringify(spanish), /heladera|lavarropas/i);
  function shownSpanish(node, path, out = []) {
    if (typeof node === "string") {
      if (path.endsWith(".es") && !path.includes(".kw")) out.push(node);
      return out;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => shownSpanish(item, `${path}[${index}]`, out));
      return out;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (key === "pages" || key === "svg" || key === "kw") continue;
        shownSpanish(value, path ? `${path}.${key}` : key, out);
      }
    }
    return out;
  }
  for (const text of shownSpanish(spanish, "")) {
    assert.doesNotMatch(text, /\bshore power\b|\bbreakers?\b/i, text);
  }
});

test("each nautica route shows its own language and keeps 1530 on the Italian route only", () => {
  const routes = {
    it: "/nautica/",
    en: "/nautica/en/",
    es: "/nautica/es/",
    fr: "/nautica/fr/",
  };
  const pagesByRoute = {
    it: "nautica/index.html",
    en: "nautica/en/index.html",
    es: "nautica/es/index.html",
    fr: "nautica/fr/index.html",
  };
  for (const [route, path] of Object.entries(pagesByRoute)) {
    const html = read(path);
    assert.equal(resolveLang(html, {
      search: "",
      pathname: routes[route],
      stored: route === "it" ? null : "en",
      navigatorLanguage: route === "it" ? "it" : "en",
    }), route);
    const box = kbBox(html);
    const own = box.KB_MSGS[route].map((row) => row.m);
    for (const other of ["it", "en", "es", "fr"]) {
      if (other === route) continue;
      for (const foreign of box.KB_MSGS[other].map((row) => row.m)) {
        assert.equal(own.includes(foreign), false, `${route} KB shows ${other}`);
      }
      for (const cluster of box.KB_CLUSTERS) {
        assert.notEqual(cluster.q[route], cluster.q[other], `${route} cluster ${cluster.n}`);
      }
    }
    const data = dataOf(html);
    for (const id of data.chips) {
      const topic = data.topics.find((item) => item.id === id);
      for (const other of ["it", "en", "es", "fr"]) {
        if (other === route) continue;
        assert.notEqual(topic.q[route], topic.q[other], `${route} chip ${id}`);
      }
    }
    if (route === "es") assert.doesNotMatch(html, /heladera|lavarropas/i);
  }
  const { boat } = loadBoat(read("nautica/es/index.html"));
  const question = "Cosa devo fare quando il motore non funziona e il fuoco entra nella barca?";
  for (const route of ["es", "en", "fr"]) {
    boat.setPageLang(route);
    const card = boat.askCard(question);
    assert.equal(card.L, "it", route);
    assert.doesNotMatch(card.html, /1530/, route);
    assert.doesNotMatch(card.html, /tel:1530/, route);
    assert.match(card.html, /112/, route);
  }
  boat.setPageLang("it");
  const italian = boat.askCard(question);
  assert.match(italian.html, /1530/);
  assert.match(italian.html, /tel:1530/);
  assert.match(italian.html, /112/);
  const vhf = "VHF e canale 16";
  for (const route of ["es", "en", "fr"]) {
    boat.setPageLang(route);
    const card = boat.askCard(vhf);
    assert.doesNotMatch(card.html, /In Italia|1530/, route);
    assert.match(card.html, /112/, route);
  }
  boat.setPageLang("it");
  const onItalianRoute = boat.askCard(vhf);
  assert.match(onItalianRoute.html, /In Italia/);
  assert.match(onItalianRoute.html, /1530/);
});

const commonEnglish = new Set("the and of to for with from this that is are was were be been not when where what how can do does you your we our they their have has had will would should could there here into over under about only than then which who but because while during before after without between through each every also just its must may might these those them she he his if or by it at operate washing machine dishwasher forbidden dangerous sail reset press button black manually circuit breaker risk gennaker demasting sea".split(" "));

function englishRuns(text) {
  const words = String(text).toLowerCase().replace(/[^a-z']+/g, " ").split(" ").filter(Boolean);
  const runs = [];
  let cur = [];
  for (const word of words) {
    if (commonEnglish.has(word)) cur.push(word);
    else {
      if (cur.length >= 3) runs.push(cur.join(" "));
      cur = [];
    }
  }
  if (cur.length >= 3) runs.push(cur.join(" "));
  return runs;
}

function citeNode() {
  const node = {
    className: "",
    dataset: {},
    children: [],
    parent: null,
    listeners: {},
    classList: { add() {}, remove() {}, contains() { return false; } },
    setAttribute() {},
    appendChild(child) { child.parent = node; node.children.push(child); return child; },
    insertBefore(child) { return node.appendChild(child); },
    remove() {},
    addEventListener(type, fn) { (node.listeners[type] ||= []).push(fn); },
    click() { for (const fn of node.listeners.click || []) fn({ stopPropagation() {} }); },
    get parentElement() { return node.parent; },
    closest() { return null; },
    querySelector(sel) { return node.querySelectorAll(sel)[0] || null; },
    querySelectorAll(sel) {
      const found = [];
      const visit = (item) => {
        if (sel === ".cite" && String(item.className).includes("cite")) found.push(item);
        const attr = sel.match(/^\.excerpt\[data-c='([^']+)'\]$/);
        if (attr && item.className === "excerpt" && item.dataset.c === attr[1]) found.push(item);
        for (const child of item.children || []) visit(child);
      };
      for (const child of node.children) visit(child);
      return found;
    },
    get innerHTML() { return node._html || ""; },
    set innerHTML(value) {
      node._html = value;
      node.children = [];
      const re = /<span class="cite"[^>]*data-c="([^"]+)"[^>]*>/g;
      let match;
      while ((match = re.exec(value))) {
        const cite = citeNode();
        cite.className = "cite";
        cite.dataset.c = match[1];
        cite.parent = node;
        node.children.push(cite);
      }
    },
  };
  return node;
}

function bootNautica(html, pathname) {
  const data = dataOf(html);
  const uiScript = html.match(/<script>\s*(const UI=\{[\s\S]*?)<\/script>/)[1];
  const start = html.indexOf("const D=window.DATA");
  const end = html.indexOf("window.__ask=ask;", start);
  const document = {
    querySelector() { return citeNode(); },
    querySelectorAll() { return []; },
    createElement() { return citeNode(); },
    getElementById() { return citeNode(); },
  };
  const sandbox = {
    document,
    localStorage: { getItem() { return null; } },
    navigator: { language: "en" },
    location: { search: "", pathname, hash: "" },
    URLSearchParams,
    requestAnimationFrame() {},
    matchMedia() { return { matches: true }; },
    console,
  };
  sandbox.window = sandbox;
  sandbox.window.DATA = data;
  sandbox.window.bsTrack = () => {};
  sandbox.window.BS = { slug: "lagoon42" };
  vm.createContext(sandbox);
  vm.runInContext(`${uiScript}\n${html.slice(start, end + "window.__ask=ask;".length)}
this.answerCurated=answerCurated;
this.answerSearch=answerSearch;
this.bindCites=bindCites;
this.D=D;`, sandbox, { filename: "nautica-cite.js" });
  return sandbox;
}

function openCites(card) {
  const excerpts = [];
  for (const cite of [...card.querySelectorAll(".cite")]) {
    const before = card.querySelector(`.excerpt[data-c='${cite.dataset.c}']`);
    cite.click();
    const excerpt = card.querySelector(`.excerpt[data-c='${cite.dataset.c}']`);
    if (!before && excerpt) excerpts.push(excerpt.innerHTML);
  }
  return excerpts;
}

test("non-English nautica routes hide the English manual and keep route-language copy", () => {
  const fresh = read("nautica/index.html");
  const englishFile = read("nautica/en/index.html");
  assert.doesNotMatch(englishFile, /US model|UK model|European regulations|English or German|French is the authentic/i);
  const routes = {
    es: "/nautica/es/",
    fr: "/nautica/fr/",
    it: "/nautica/",
  };
  const searches = {
    es: ["¿Cómo se usa el gennaker?", "¿Cómo funciona la lavadora?", "¿Cómo limpio la tapicería de alcantara?"],
    fr: ["Comment utiliser le gennaker ?", "Comment fonctionne le lave-linge ?", "Comment nettoyer l'alcantara ?"],
    it: ["Come si usa il gennaker?", "Come funziona la lavatrice?", "Come pulisco la tappezzeria in alcantara?"],
  };
  const phrase = {
    es: /El manual del propietario trata este tema en la p\. \d+\.|La guía del usuario trata este tema en la p\. \d+\./,
    fr: /Le manuel du propriétaire traite ce sujet à la p\. \d+\.|Le guide de l'utilisateur traite ce sujet à la p\. \d+\./,
    it: /Il manuale del proprietario tratta questo argomento a p\. \d+\.|La guida dell'utente tratta questo argomento a p\. \d+\./,
  };
  const bannedPassage = /circuit-breaker can be reset|forbidden and dangerous to sail with only the gennaker|Do not operate the washing machine|Texto original|Texte original|Testo originale|FR\/EN/;
  for (const [lang, pathname] of Object.entries(routes)) {
    const boat = bootNautica(fresh, pathname);
    const shown = [];
    for (const topic of boat.D.topics) {
      const card = boat.answerCurated(topic, lang, false);
      shown.push(card.innerHTML);
      for (const excerpt of openCites(card)) {
        shown.push(excerpt);
        assert.match(excerpt, phrase[lang], `${lang} ${topic.id}`);
        assert.doesNotMatch(excerpt, bannedPassage, `${lang} ${topic.id}`);
      }
    }
    const list = citeNode();
    for (const checklist of boat.D.checklists) {
      for (const item of checklist.items) {
        for (const cite of item[1] || []) {
          const chip = citeNode();
          chip.className = "cite";
          chip.dataset.c = `${cite[0]}:${cite[1]}`;
          chip.parent = list;
          list.children.push(chip);
        }
      }
    }
    boat.bindCites(list);
    for (const excerpt of openCites(list)) {
      shown.push(excerpt);
      assert.match(excerpt, phrase[lang]);
      assert.doesNotMatch(excerpt, bannedPassage);
    }
    for (const question of searches[lang]) {
      const found = boat.answerSearch(question, lang, false);
      assert.equal(found.topic, "manual", question);
      shown.push(found.card.innerHTML);
      assert.match(found.card.innerHTML, phrase[lang], question);
      assert.doesNotMatch(found.card.innerHTML, bannedPassage, question);
      assert.doesNotMatch(found.card.innerHTML, /searchLead|Original text|Texto original/, question);
    }
    const runs = englishRuns(shown.join("\n"));
    assert.deepEqual(runs, [], `${lang} ${runs.join(" || ")}`);
  }
  const oldBoat = bootNautica(englishFile, "/nautica/en/");
  const newBoat = bootNautica(fresh, "/nautica/en/");
  const sample = oldBoat.D.topics.find((topic) => topic.id === "breakers-12v");
  const oldCard = oldBoat.answerCurated(sample, "en", false);
  const newCard = newBoat.answerCurated(sample, "en", false);
  assert.equal(newCard.innerHTML, oldCard.innerHTML);
  const oldExcerpt = openCites(oldCard)[0];
  const newExcerpt = openCites(newCard)[0];
  assert.match(oldExcerpt, /circuit-breaker can be reset|passage|<\/small>/);
  assert.equal(newExcerpt, oldExcerpt);
  const question = "¿Cómo se usa el gennaker?";
  assert.equal(newBoat.answerSearch(question, "en", true).card.innerHTML, oldBoat.answerSearch(question, "en", true).card.innerHTML);
});

test("nautica names no country and no foreign model or version", () => {
  const banned = /US model|UK model|U\.S\.|United States|United Kingdom|\bAmerica(?:n)?\b|Britain|British|European regulations|English or German|versión americana|version américaine|versione americana|modelo US|\bUS version\b|\bUK version\b|French is the authentic/i;
  for (const path of pages) assert.doesNotMatch(read(path), banned, path);
});
