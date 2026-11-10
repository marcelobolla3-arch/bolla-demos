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

function counterScript(html) {
  const match = html.match(/<script>\s*(\(function\(\)\{\s*var BASE=[\s\S]*?\}\)\(\);)\s*<\/script>/);
  assert.ok(match, "counter script missing");
  return match[1];
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

function loadDemo(html, filename) {
  const packJson = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/)[1];
  const script = sectorScript(html);
  const listeners = {};
  function makeEl(id) {
    return {
      id,
      textContent: id === "demo-pack" ? packJson : "",
      value: "",
      hidden: false,
      min: "",
      type: "",
      className: "",
      children: [],
      style: {},
      classList: { add() {}, remove() {} },
      setAttribute() {},
      appendChild(child) { this.children.push(child); return child; },
      remove() {},
      addEventListener(type, fn) {
        const key = id + ":" + type;
        listeners[key] = listeners[key] || [];
        listeners[key].push(fn);
      },
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
  const tracks = [];
  const sandbox = {
    document,
    window: {
      matchMedia() { return { matches: true }; },
      bsTrack(sub, title) { tracks.push({ sub, title }); },
    },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename });
  return { demo: sandbox.window.__sectorDemo, listeners, tracks, document };
}

function runCounter(search, hash, storage) {
  const counts = [];
  const scripts = [];
  const localStorage = {
    data: { ...(storage || {}) },
    getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; },
    setItem(key, value) { this.data[key] = String(value); },
    removeItem(key) { delete this.data[key]; },
  };
  const sandbox = {
    location: { search, hash: hash || "" },
    localStorage,
    document: {
      head: { appendChild(el) { scripts.push(el); } },
      createElement() {
        return { setAttribute(name, value) { this[name] = value; } };
      },
    },
    window: {},
    decodeURIComponent,
  };
  vm.createContext(sandbox);
  vm.runInContext(counterScript(html), sandbox, { filename: "vet/es/counter.js" });
  return { counts, scripts, localStorage, window: sandbox.window };
}

function flush(counter) {
  assert.equal(counter.scripts.length, 1);
  counter.window.goatcounter.count = (payload) => counter.counts.push(payload);
  counter.scripts[0].onload();
}

const html = read("vet/es/index.html");
const pack = packOf(html);
const loaded = loadDemo(html, "vet/es/index.html");
const demo = loaded.demo;
const protocol = /v[oó]mito|carb[oó]n|oxigenada|per[oó]xido|jeringa|venda|compresion|suero|ml\b|mg\b|provocar el/i;

test("vet/es uses the whole-word matcher and the vet counter", () => {
  const script = sectorScript(html);
  assert.match(script, /function tokensOf\(raw\)/);
  assert.match(script, /\\p\{L\}/);
  assert.doesNotMatch(script, /indexOf\(nk\)/);
  assert.equal(demo.liveAI, false);
  assert.equal(demo.mode, "static-example");
  assert.equal(demo.lang, "es");
  assert.match(html, /<html lang="es"/);
  assert.match(html, /var BASE="\/bolla-demo-vet\/es"/);
  assert.match(html, /title:"vet demo es"/);
  assert.match(html, /s\.src="https:\/\/gc\.zgo\.at\/count\.js"/);
  assert.match(html, /skipgc/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);
  assert.match(html, /path:BASE\+'\/'\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
  const calls = [...script.matchAll(/bsTrack\(([^)]*)\)/g)].map((item) => item[1]);
  assert.deepEqual(calls, ['"/chat/" + r.id, "example"', '"/request/confirm", "example"']);
  assert.doesNotMatch(html, /bsTrack\([^)]*input\.value/);
  assert.doesNotMatch(script, /getElementById\("nm"\)/);
  assert.doesNotMatch(script, /getElementById\("ph"\)/);
  const submit = script.match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
  assert.ok(submit);
  assert.doesNotMatch(submit[0], /bsTrack/);
  assert.match(submit[0], /answerFor\(q\)/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.doesNotMatch(html, /wa\.me|tel:|elevenlabs|openai/i);
  assert.match(html, /onsubmit="return false"/);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").priority, true);
  assert.deepEqual(pack.rules.filter((rule) => rule.button).map((rule) => rule.id), ["poison", "hours", "rabbit", "food"]);
});

test("vet/es answerFor covers the script and refuses Spanish false friends", () => {
  const cases = [
    ["¡Mi perro ha comido algo venenoso!", "poison"],
    ["ha comido veneno", "poison"],
    ["está intoxicado", "poison"],
    ["intoxicación", "poison"],
    ["envenenamiento", "poison"],
    ["¿A qué hora están abiertos?", "hours"],
    ["horario", "hours"],
    ["¿Abren el lunes?", "hours"],
    ["¿Tratan conejos?", "rabbit"],
    ["una coneja", "rabbit"],
    ["conejillo de indias", "rabbit"],
    ["¿Puedo recoger la comida?", "food"],
    ["recoger el pienso", "food"],
    ["pienso para el perro", "food"],
    ["alimento", "food"],
    ["ahora", "fallback"],
    ["enhorabuena", "fallback"],
    ["Pienso que sí", "fallback"],
    ["ha comido chocolate", "fallback"],
    ["comido", "fallback"],
    ["comidilla", "fallback"],
    ["aconsejo", "fallback"],
    ["toxicomanía", "fallback"],
    ["abiertamente", "fallback"],
    ["urgentemente", "fallback"],
    ["adherida", "fallback"],
    ["un juego", "fallback"],
    ["mi perro", "fallback"],
    ["ortodoncia", "fallback"],
    ["ajedrez", "fallback"],
    ["Japón", "fallback"],
    ["¿Se puede filmar?", "fallback"],
    ["sangría", "fallback"],
    ["no comer", "fallback"],
    ["no como carne", "fallback"],
    ["no comezón", "fallback"],
    ["vacuno", "fallback"],
    ["evacuación", "fallback"],
    ["estéril", "fallback"],
    ["castrense", "fallback"],
    ["parasol", "fallback"],
    ["solo el pelo", "fallback"],
    ["exotismo", "fallback"],
    ["viajo en tren", "fallback"],
    ["viajero", "fallback"],
    ["no respira", "emergency"],
    ["el gato no respira", "emergency"],
    ["incendio", "emergency"],
    ["hemorragia", "emergency"],
    ["se ha desmayado", "emergency"],
    ["inconsciente", "emergency"],
    ["urgencias", "emergency"],
    ["llame al 112", "emergency"],
    ["veneno y no respira", "emergency"],
    ["Mi perro ha sido atropellado", "emergency"],
    ["ha sido atropellada", "emergency"],
    ["un atropello", "emergency"],
    ["el perro sangra", "emergency"],
    ["tiene una convulsión", "emergency"],
    ["no come y no respira", "emergency"],
    ["mi gato no come", "apetito"],
    ["no comen", "apetito"],
    ["vacuna", "vacuna"],
    ["vacunación", "vacuna"],
    ["castración", "castracion"],
    ["esterilización", "castracion"],
    ["desparasitación", "desparasitacion"],
    ["parásitos", "desparasitacion"],
    ["peluquería", "peluqueria"],
    ["corte de pelo", "peluqueria"],
    ["animales exóticos", "exotico"],
    ["un reptil", "exotico"],
    ["pasaporte", "viaje"],
    ["quiero viajar", "viaje"],
    ["viajamos", "viaje"],
    ["viajar con el perro", "viaje"],
    ["viajar con el gato", "viaje"],
    ["   ", "empty"],
    ["¿¿¿", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);

  const off = demo.answerFor("ajedrez");
  assert.match(off.text, /ejemplo escrito/);
  assert.match(off.text, /no un asistente en vivo/);
  assert.match(off.text, /no está entre las respuestas preparadas/);
  assert.match(off.text, /No reservo/);
  assert.doesNotMatch(off.text, /112|dosis|euros/);

  const hit = demo.answerFor("Mi perro ha sido atropellado");
  assert.equal(hit.id, "emergency");
  assert.match(hit.text, /^Llame ya al 112/);
  assert.match(hit.text, /veterinario de urgencias/);
  assert.doesNotMatch(hit.text, protocol);

  const appetite = demo.answerFor("mi gato no come");
  assert.equal(appetite.id, "apetito");
  assert.match(appetite.text, /no puede valorar la causa/);
  assert.match(appetite.text, /Avise a la clínica/);
  assert.doesNotMatch(appetite.text, /^Llame ya al 112/);
  assert.doesNotMatch(appetite.text, protocol);
  assert.equal(demo.answerFor("no come y no respira").id, "emergency");

  for (const id of ["vacuna", "castracion", "desparasitacion", "peluqueria", "exotico", "viaje"]) {
    const reply = pack.rules.find((rule) => rule.id === id);
    assert.equal(reply.button, undefined, id);
    assert.doesNotMatch(reply.text, /€|\d|%|gratis/i, id);
  }
  assert.match(demo.answerFor("vacuna").text, /no indica un precio/);
  assert.equal(demo.answerFor("viajamos").id, "viaje");
  assert.equal(demo.answerFor("viajar con el perro").id, "viaje");
  assert.equal(demo.answerFor("viajar con el gato").id, "viaje");
  assert.match(demo.answerFor("viajar con el perro").text, /no indica un precio/);
  assert.match(demo.answerFor("viajero").text, /no está entre las respuestas preparadas/);
  assert.match(demo.answerFor("sangría").text, /no está entre las respuestas preparadas/);
  assert.match(demo.answerFor("no comer").text, /no está entre las respuestas preparadas/);

  const emergency = demo.answerFor("el gato no respira");
  assert.match(emergency.text, /^Llame ya al 112/);
  assert.match(emergency.text, /veterinario de urgencias/);
  assert.match(emergency.text, /Unión Europea/);
  assert.doesNotMatch(emergency.text, protocol);

  const poison = demo.answerFor("veneno");
  assert.equal(poison.id, "poison");
  assert.match(poison.text, /112/);
  assert.match(poison.text, /veterinario de urgencias/);
  assert.match(poison.text, /no diagnostica/);
  assert.match(poison.text, /no indica una dosis/);
  assert.doesNotMatch(poison.text, protocol);

  const food = demo.answerFor("comida");
  assert.match(food.text, /euros/);
  assert.doesNotMatch(food.text, /€|\d/);
  const hours = demo.answerFor("horario");
  assert.match(hours.text, /\+34 910 000 200/);
  assert.match(hours.text, /inventado/);
});

test("the counted path keeps a sanitised es- slug, skips internal=1, and omits typed text", () => {
  const tagged = runCounter("?p=es-veterinarioomega", "");
  assert.equal(tagged.scripts.length, 1);
  assert.equal(tagged.scripts[0].src, "https://gc.zgo.at/count.js");
  tagged.window.bsTrack("/chat/rabbit", "example");
  flush(tagged);
  assert.deepEqual(JSON.parse(JSON.stringify(tagged.counts)), [
    { path: "/bolla-demo-vet/es/?p=es-veterinarioomega", title: "vet demo es" },
    { path: "/bolla-demo-vet/es/chat/rabbit?p=es-veterinarioomega", title: "example", event: true },
  ]);

  const dirty = runCounter("?p=ES-veterinarioomega!", "");
  flush(dirty);
  assert.equal(dirty.counts[0].path, "/bolla-demo-vet/es/?p=es-veterinarioomega");

  const skipped = runCounter("?internal=1&p=es-veterinarioomega", "");
  assert.equal(skipped.localStorage.getItem("skipgc"), "t");
  assert.equal(skipped.scripts.length, 0);
  assert.equal(skipped.window.goatcounter, undefined);
  skipped.window.bsTrack("/chat/poison", "ANIMAL-SECRETO-9912");
  assert.deepEqual(skipped.counts, []);

  const hashed = runCounter("?p=es-veterinarioomega", "#internal=1");
  assert.equal(hashed.scripts.length, 0);
  assert.equal(hashed.localStorage.getItem("skipgc"), "t");

  const remembered = runCounter("", "", { skipgc: "t" });
  assert.equal(remembered.scripts.length, 0);

  const reset = runCounter("?internal=0&p=es-veterinarioomega", "", { skipgc: "t" });
  assert.equal(reset.localStorage.getItem("skipgc"), null);
  flush(reset);
  reset.window.bsTrack("/request/confirm", "example");
  assert.equal(reset.counts[1].path, "/bolla-demo-vet/es/request/confirm?p=es-veterinarioomega");
  assert.equal(reset.counts[1].title, "example");
  assert.equal(reset.counts[1].event, true);

  const secret = "ANIMAL-SECRETO-9912";
  const ask = loaded.document.getElementById("ask");
  ask.value = secret + " no respira y correo secreto.9912@ejemplo.com";
  loaded.listeners["ask-form:submit"][0]({ preventDefault() {} });
  loaded.document.getElementById("nm").value = secret;
  loaded.document.getElementById("ph").value = "secreto.9912@ejemplo.com";
  loaded.listeners["cta:click"][0]();
  assert.equal(loaded.document.getElementById("ok").textContent, pack.pick);
  loaded.document.getElementById("slots").children[0].onclick();
  loaded.listeners["cta:click"][0]();
  loaded.document.getElementById("qr").children[0].onclick();
  assert.deepEqual(loaded.tracks.map((item) => item.sub), ["/request/confirm", "/chat/poison"]);
  assert.deepEqual(loaded.tracks.map((item) => item.title), ["example", "example"]);
  assert.doesNotMatch(JSON.stringify(loaded.tracks), /ANIMAL-SECRETO|secreto\.9912|no respira|venenoso/i);
  assert.equal(ask.value, "");
});

test("Spanish redirect preserves the query and the sent vet URLs stay in place", () => {
  function redirectTarget(search, languages) {
    const index = read("vet/index.html");
    const match = index.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/);
    assert.ok(match, "redirect script missing");
    let replaced = "";
    const sandbox = {
      location: { search, hash: "", replace(url) { replaced = url; } },
      navigator: { languages, language: languages[0] || "en" },
      URLSearchParams,
    };
    vm.createContext(sandbox);
    vm.runInContext(match[1], sandbox);
    return replaced;
  }

  assert.equal(redirectTarget("", ["et-EE", "et"]), "et/");
  assert.equal(redirectTarget("", ["ru-RU"]), "ru/");
  assert.equal(redirectTarget("", ["en-GB", "en"]), "en/");
  assert.equal(redirectTarget("", ["en", "es"]), "en/");
  assert.equal(redirectTarget("", ["fr-FR"]), "en/");
  assert.equal(redirectTarget("", ["es-ES", "es"]), "es/");
  assert.equal(redirectTarget("?lang=et&p=sakala", ["es-ES"]), "et/?p=sakala");
  assert.equal(redirectTarget("?p=es-veterinarioomega&internal=1", ["es-ES"]), "es/?p=es-veterinarioomega&internal=1");
  assert.match(read("vet/index.html"), /supported=\["et","ru","en","es"\]/);
  assert.match(read("vet/index.html"), /location\.search/);
  assert.doesNotMatch(read("vet/index.html"), /gc\.zgo\.at\/count\.js/);

  for (const lang of ["et", "en", "ru"]) {
    const page = read(`vet/${lang}/index.html`);
    assert.match(page, /href="\.\.\/es\/" hreflang="es" lang="es" data-keep-query>Español</);
    assert.match(page, /n\.indexOf\(nk\)/);
    assert.doesNotMatch(page, /function tokensOf/);
    assert.match(page, new RegExp(`var BASE="/bolla-demo-vet/${lang}"`));
  }
  assert.match(read("vet/et/index.html"), /Näidisloomaarst/);
  assert.match(read("vet/et/index.html"), /href="\.\/" hreflang="et"/);
  assert.match(read("vet/en/index.html"), /Example Vet/);
  assert.match(read("vet/en/index.html"), /href="\.\/" hreflang="en"/);

  const shown = visible(html);
  assert.match(shown, /Veterinario de Ejemplo/);
  assert.match(shown, /ejemplo escrito/);
  assert.match(shown, /no un asistente en vivo/);
  assert.match(shown, /no es personalización/);
  assert.match(shown, /No reproduce audio/);
  assert.match(shown, /ilustración estática/);
  assert.match(shown, /ficticio/);
  assert.match(shown, /\+34 910 000 200/);
  assert.match(shown, /euros/);
  assert.match(shown, /de usted/);
  assert.doesNotMatch(shown, /€|Hello|Example Vet|Scripted example|Send\b/i);
  assert.doesNotMatch(shown, /\b(puedes|tienes|quieres|pulsa|escribe|elige|vosotros|contigo|tú)\b/i);
  assert.match(pack.chat[0][1], /^Hola/);
  assert.match(pack.chat[1][1], /^Hola/);
  assert.match(pack.ok, /No se ha reservado ni enviado nada/);
});
