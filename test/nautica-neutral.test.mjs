import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const banned = /Italia|Italy|Olbia|Sardegna|Cerdeña|Sardinia|1530|\+39|Guardia Costiera|Tallinn|Schweiz|\+41/;

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
  vm.runInContext(match[1], sandbox, { filename: "nautica-ui.js" });
  return sandbox;
}

function langStrings(node, lang, out = []) {
  if (typeof node === "string") {
    if (lang === "en" || lang === "es") out.push(node);
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
  const start = html.indexOf('const LANGS=["it","en","es"];');
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

const pages = ["nautica/index.html", "nautica/en/index.html", "nautica/es/index.html"];

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
    assert.doesNotMatch(topic.lead.es, /protocolo|MAYDAY|mayday/i);
    assert.doesNotMatch(topic.lead.en, /\bprotocol\b|MAYDAY|mayday/i);
  }

  const html = read("nautica/index.html");
  const callStart = html.indexOf(`(L==="it"?'<a href="tel:1530">'+esc(t.calls)+' 1530</a>':'')`);
  const callEnd = html.indexOf(`+'<a href="tel:112">'+esc(t.calls)+' 112</a>`, callStart);
  assert.ok(callStart > 0 && callEnd > callStart, "emergency calls must keep 1530 behind the Italian branch");
  const build = new Function("L", "esc", "t", `return ${html.slice(callStart, callEnd)}+'<a href="tel:112">'+esc(t.calls)+' 112</a>'`);
  const label = (L) => build(L, (value) => value, { calls: "Call", vhf: "VHF" });
  assert.match(label("it"), /tel:1530/);
  assert.match(label("it"), /tel:112/);
  assert.doesNotMatch(label("es"), /1530/);
  assert.match(label("es"), /tel:112/);
  assert.doesNotMatch(label("en"), /1530/);
  assert.match(label("en"), /tel:112/);
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

  const untouched = applyHead(html, "?p=lagoon", "/nautica/");
  assert.equal(untouched.documentElement.lang, "it");
  assert.equal(untouched.title, "Lagoon 42 · Assistente di bordo · BOLLA STUDIO");

  assert.equal(resolveLang(html, { search: "?lang=es", pathname: "/nautica/", stored: "it", navigatorLanguage: "it" }), "es");
  assert.equal(resolveLang(html, { search: "?p=lagoon&lang=en", pathname: "/nautica/", stored: "es", navigatorLanguage: "it" }), "en");
  assert.equal(resolveLang(html, { search: "?p=lagoon", pathname: "/nautica/", stored: "en", navigatorLanguage: "it" }), "en");
  assert.equal(resolveLang(html, { search: "", pathname: "/nautica/", stored: null, navigatorLanguage: "es-ES" }), "es");
  assert.equal(resolveLang(html, { search: "", pathname: "/nautica/", stored: null, navigatorLanguage: "fr" }), "it");
  assert.equal(resolveLang(html, { search: "?p=lagoon", pathname: "/nautica/es/", stored: "it", navigatorLanguage: "it" }), "es");
  assert.equal(resolveLang(html, { search: "?lang=en&p=lagoon", pathname: "/nautica/es/", stored: "it", navigatorLanguage: "it" }), "en");

  assert.match(html, /path:"\/"\+slug\+"\/demo",title:"demo"/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /localStorage\.setItem\("skipgc","t"\)/);
  assert.doesNotMatch(html, /bolla_internal|interno/);
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
});
