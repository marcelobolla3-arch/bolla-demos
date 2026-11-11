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
  vm.runInContext(`${html.slice(start, end)}\nthis.uiLang=uiLang;`, sandbox, { filename: "nautica-lang-init.js" });
  return sandbox.uiLang;
}

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
  assert.match(data.topics.find((topic) => topic.id === "refuse-nav").q.it, /Portisco/);
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
  assert.equal(resolveLang(html, { search: "?p=lagoon", pathname: "/nautica/", stored: "en", navigatorLanguage: "it" }), "en");
  assert.equal(resolveLang(html, { search: "", pathname: "/nautica/", stored: null, navigatorLanguage: "es-ES" }), "es");
  assert.equal(resolveLang(html, { search: "", pathname: "/nautica/", stored: null, navigatorLanguage: "fr-FR" }), "fr");
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

test("static /nautica/es/ and /nautica/en/ ship the right lang and title and the same ?p= counter", () => {
  const canonical = read("nautica/index.html");
  const normalize = (html) => html
    .replace(/<html lang="[a-z]{2}">/, '<html lang="*">')
    .replace(/<title>[^<]*<\/title>/, "<title>*</title>");
  const same = normalize(canonical);
  for (const [path, lang, title] of [
    ["nautica/es/index.html", "es", "Lagoon 42 · Asistente de a bordo · BOLLA STUDIO"],
    ["nautica/en/index.html", "en", "Lagoon 42 · Onboard assistant · BOLLA STUDIO"],
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

function loadBoat(html) {
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
    location: { search: "", pathname: "/nautica/", hash: "" },
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
  const banned = /Bordeaux|Francia|\bFrance\b|\bUS version\b|\bU\.S\. version\b|versione US|versión US|\bversion US\b|33\s*\(\s*0\s*\)|\+\d{1,3}[\s-]\d/i;
  for (const path of pages) {
    const html = read(path);
    assert.doesNotMatch(html, banned, path);
    assert.match(html, /contact the manufacturer's service network/, path);
    assert.match(html, /rete di assistenza del costruttore/, path);
    assert.match(html, /red de servicio del fabricante/, path);
    assert.match(html, /réseau d'assistance du constructeur/, path);
    assert.match(html, /1530/, path);
    assert.match(html, /tel:112/, path);
    assert.doesNotMatch(html, /heladera|lavarropas/i, path);
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
});
