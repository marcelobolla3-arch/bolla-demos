import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../restaurant/es/index.html", import.meta.url), "utf8");

function packOf(source) {
  return JSON.parse(source.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1]);
}

function loadDemo(source) {
  const packJson = source.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = source.match(/<script id="sector-demo">([\s\S]*?)<\/script>/)[1];
  const elements = {};
  function makeEl(id) {
    return { id, textContent: id === "demo-pack" ? packJson : "", value: "", hidden: false, className: "", children: [], style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild(child) { this.children.push(child); return child; }, remove() {}, addEventListener() {}, scrollTop: 0, scrollHeight: 0 };
  }
  const document = {
    getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
    createElement() { return makeEl("node"); },
    querySelectorAll() { return []; },
  };
  const sandbox = { document, window: { matchMedia() { return { matches: true }; } }, console };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename: "restaurant-es.js" });
  return sandbox.window.__sectorDemo;
}

function shown(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav class="langs"[\s\S]*?<\/nav>/g, " ");
}

test("the Spanish restaurant example is neutral and has no prices", () => {
  const demo = loadDemo(html);
  const prose = shown(html) + " " + JSON.stringify(packOf(html));
  assert.equal(demo.lang, "es");
  assert.equal(demo.liveAI, false);
  assert.match(html, /lang="es"/);
  assert.match(html, /de usted/);
  assert.match(html, /Escriba/);
  assert.doesNotMatch(prose, /\b(vos|tenés|tenes|podés|podes|querés|queres)\b/i);
  assert.doesNotMatch(prose, /Estonia|Eesti|Tallinn|Tallin|Berlin|Italia|France|Suisse|Schweiz|€|EUR|CHF|\+\d/);
  assert.doesNotMatch(prose, /\d+\s*€|\$\d/);
  assert.match(html, /sin precios|No se muestra ningún precio/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /data-keep-query/);
  assert.match(html, /\/bolla-demo-restaurant\/es/);
  const cases = [
    ["¿Qué día están cerrados?", "closed"],
    ["¿Hay menú del mediodía?", "lunch"],
    ["¿Podemos sentarnos en la terraza?", "terrace"],
    ["¿Hay aparcamiento?", "parking"],
    ["¿El plato es sin frutos secos?", "allergy"],
    ["¿Cuánto cuesta el menú?", "fallback"],
    ["   ", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);
  assert.doesNotMatch(demo.answerFor("¿Hay menú del mediodía?").text, /\d|€/);
});
