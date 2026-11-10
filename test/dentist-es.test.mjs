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
  return { demo: sandbox.window.__sectorDemo, elements, listeners, tracks, document };
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
  vm.runInContext(counterScript(html), sandbox, { filename: "dentist/es/counter.js" });
  return { counts, scripts, localStorage, window: sandbox.window };
}

function flush(counter) {
  assert.equal(counter.scripts.length, 1);
  counter.window.goatcounter.count = (payload) => counter.counts.push(payload);
  counter.scripts[0].onload();
}

const html = read("dentist/es/index.html");
const pack = packOf(html);
const loaded = loadDemo(html, "dentist/es/index.html");
const demo = loaded.demo;

test("dentist/es uses the whole-word matcher and the dentist counter", () => {
  const script = sectorScript(html);
  assert.match(script, /function tokensOf\(raw\)/);
  assert.match(script, /\\p\{L\}/);
  assert.doesNotMatch(script, /indexOf\(nk\)/);
  assert.equal(demo.liveAI, false);
  assert.equal(demo.mode, "static-example");
  assert.equal(demo.lang, "es");
  assert.match(html, /<html lang="es"/);
  assert.match(html, /var BASE="\/bolla-demo-dentist\/es"/);
  assert.match(html, /title:"dentist demo es"/);
  assert.match(html, /s\.src="https:\/\/gc\.zgo\.at\/count\.js"/);
  assert.match(html, /data-goatcounter","https:\/\/bollastudio\.goatcounter\.com\/count"/);
  assert.match(html, /skipgc/);
  assert.match(html, /\[\?&#\]internal=\(\[01\]\)/);
  assert.match(html, /\[\?&\]p=\(\[\^&#\]\*\)/);
  assert.match(html, /path:BASE\+'\/'\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(html, /if\(internal\) return/);
  const calls = [...script.matchAll(/bsTrack\(([^)]*)\)/g)].map((item) => item[1]);
  assert.deepEqual(calls, ['"/chat/" + r.id, "example"', '"/request/confirm", "example"']);
  assert.doesNotMatch(html, /bsTrack\([^)]*input\.value/);
  assert.doesNotMatch(script, /getElementById\("nm"\)/);
  assert.doesNotMatch(script, /getElementById\("ph"\)/);
  const submit = script.match(/getElementById\("ask-form"\)\.addEventListener\("submit", function\(ev\)\{[\s\S]*?\n  \}\);/);
  assert.ok(submit);
  assert.doesNotMatch(submit[0], /bsTrack/);
  assert.match(submit[0], /preventDefault/);
  assert.match(submit[0], /answerFor\(q\)/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
  assert.doesNotMatch(html, /wa\.me|tel:|elevenlabs|openai/i);
  assert.match(html, /onsubmit="return false"/);
  assert.doesNotMatch(html, /method\s*=\s*["']post["']/i);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").button, undefined);
  assert.equal(pack.rules.find((rule) => rule.id === "emergency").priority, true);
  assert.deepEqual(pack.rules.filter((rule) => rule.button).map((rule) => rule.id), ["pain", "hours", "children", "afraid", "price"]);
});

test("dentist/es answerFor covers the script and refuses Spanish false friends", () => {
  const cases = [
    ["Tengo un dolor de muelas fuerte. ¿Qué hago?", "pain"],
    ["Me duelen las muelas", "pain"],
    ["me duele un diente", "pain"],
    ["Está dolorido", "pain"],
    ["Tengo un dolor", "pain"],
    ["¿A qué hora están abiertos?", "hours"],
    ["¿Cuál es el horario?", "hours"],
    ["horarios", "hours"],
    ["¿Abren el lunes?", "hours"],
    ["abiertos", "hours"],
    ["¿Atienden a niños?", "children"],
    ["¿Atienden a niñas?", "children"],
    ["Tengo un hijo", "children"],
    ["odontología infantil", "children"],
    ["Me da miedo el dentista.", "afraid"],
    ["Estoy nervioso", "afraid"],
    ["Tengo ansiedad", "afraid"],
    ["¿Cuánto cuesta un implante?", "price"],
    ["implantes", "price"],
    ["precios", "price"],
    ["¿Tienen un presupuesto?", "price"],
    ["¿Cuánto cuestan?", "price"],
    ["ahora", "fallback"],
    ["enhorabuena", "fallback"],
    ["Me llamo Dolores", "fallback"],
    ["Dolores de la clínica", "fallback"],
    ["Es indoloro", "fallback"],
    ["Tengo un pendiente", "fallback"],
    ["Aprecio su trabajo", "fallback"],
    ["desprecio", "fallback"],
    ["preciso un informe", "fallback"],
    ["precioso", "fallback"],
    ["Me cuesta dormir", "fallback"],
    ["La niñera viene", "fallback"],
    ["Es un remedio", "fallback"],
    ["Mi abuela viene", "fallback"],
    ["un juego", "fallback"],
    ["solicita la historia clínica", "fallback"],
    ["abiertamente", "fallback"],
    ["el camino", "fallback"],
    ["se me ha caído un empaste", "fallback"],
    ["se ha caído el empaste", "fallback"],
    ["al respirar", "fallback"],
    ["Tengo un nervio sensible", "fallback"],
    ["revisión", "fallback"],
    ["¿Puedo pagar con bizum?", "fallback"],
    ["¿Se puede filmar?", "fallback"],
    ["¿Es una buena inversión?", "fallback"],
    ["ajedrez", "fallback"],
    ["Japón", "fallback"],
    ["aparcamiento", "fallback"],
    ["adherida", "fallback"],
    ["incendiario", "fallback"],
    ["fuegos artificiales", "fallback"],
    ["sangría", "fallback"],
    ["Voy a golpear la puerta", "fallback"],
    ["accidentalmente", "fallback"],
    ["inflamación leve", "fallback"],
    ["solicita la historia otra vez", "fallback"],
    ["citación", "fallback"],
    ["limpio la casa", "fallback"],
    ["ortografía", "fallback"],
    ["finanzas", "fallback"],
    ["Seguro que sí", "fallback"],
    ["inseguro", "fallback"],
    ["cambio de domicilio", "fallback"],
    ["no respira", "emergency"],
    ["mi padre no respira", "emergency"],
    ["no respiro", "emergency"],
    ["sin respirar", "emergency"],
    ["hay un incendio", "emergency"],
    ["emergencia", "emergency"],
    ["hemorragia", "emergency"],
    ["se ha desmayado", "emergency"],
    ["se ha caído al suelo y no responde", "emergency"],
    ["inconsciente", "emergency"],
    ["infarto", "emergency"],
    ["llame al 112", "emergency"],
    ["fuego", "emergency"],
    ["herida grave", "emergency"],
    ["ambulancia", "emergency"],
    ["dolor y no respira", "emergency"],
    ["¿Cuánto cuesta el 112?", "emergency"],
    ["Tengo un sangrado fuerte", "emergency"],
    ["me sangra la encía", "emergency"],
    ["he tenido un accidente", "emergency"],
    ["me di un golpe", "emergency"],
    ["tengo un diente roto", "emergency"],
    ["inflamación fuerte", "emergency"],
    ["tengo fiebre", "emergency"],
    ["quiero pedir hora", "cita"],
    ["¿Puedo pedir una cita?", "cita"],
    ["limpieza", "limpieza"],
    ["higiene", "limpieza"],
    ["quiero cancelar la cita", "cancel"],
    ["cambiar la cita", "cancel"],
    ["ortodoncia", "ortodoncia"],
    ["brackets", "ortodoncia"],
    ["financiación", "financiacion"],
    ["pago a plazos", "financiacion"],
    ["mutua", "mutua"],
    ["seguro dental", "mutua"],
    ["duele al respirar", "pain"],
    ["   ", "empty"],
    ["¿¿¿", "empty"],
    ["", "empty"],
  ];
  for (const [question, id] of cases) assert.equal(demo.answerFor(question).id, id, question);

  const off = demo.answerFor("ajedrez");
  assert.match(off.text, /ejemplo escrito/);
  assert.match(off.text, /no un asistente en vivo/);
  assert.match(off.text, /no está entre las respuestas preparadas/);
  assert.match(off.text, /No reservo/);
  assert.match(off.text, /WhatsApp/);
  assert.doesNotMatch(off.text, /112|ortodoncia|alineador|euros/i);

  const emergency = demo.answerFor("Tengo un sangrado fuerte");
  assert.equal(emergency.id, "emergency");
  assert.match(emergency.text, /^Llame ya al 112/);
  assert.match(emergency.text, /urgencias/);
  assert.match(emergency.text, /número de emergencias de la Unión Europea/);
  assert.doesNotMatch(emergency.text, /enjuague|ibuprofeno|paracetamol|antibi[oó]tico|compresion|hielo|rcp|primeros auxilios|protocolo es|dosis|torniquete|gasa|empaste/i);
  assert.match(demo.answerFor("mi padre no respira").text, /^Llame ya al 112/);

  for (const id of ["cita", "limpieza", "cancel", "ortodoncia", "financiacion", "mutua"]) {
    const reply = pack.rules.find((rule) => rule.id === id);
    assert.equal(reply.button, undefined, id);
    assert.doesNotMatch(reply.text, /€|\d|%|sin intereses|gratis/i, id);
  }
  assert.match(demo.answerFor("limpieza").text, /no indica un precio|No indico un precio/i);
  assert.match(demo.answerFor("ortodoncia").text, /no indica un plan/);
  assert.match(demo.answerFor("financiación").text, /no indica cuotas/);
  assert.match(demo.answerFor("Seguro que sí").text, /no está entre las respuestas preparadas/);
  assert.match(demo.answerFor("sangría").text, /no está entre las respuestas preparadas/);

  const pain = demo.answerFor("dolor de muelas");
  assert.equal(pain.id, "pain");
  assert.match(pain.text, /no puede diagnosticar/);
  assert.match(pain.text, /llame al 112/i);
  assert.doesNotMatch(pain.text, /enjuague|ibuprofeno|paracetamol|antibi[oó]tico|compresion|hielo|dosis|gasa/i);

  const price = demo.answerFor("¿Cuánto cuesta un implante?");
  assert.match(price.text, /euros/);
  assert.doesNotMatch(price.text, /€|\d/);
  assert.match(price.text, /no indica ninguna cifra/);

  const hours = demo.answerFor("horario");
  assert.match(hours.text, /\+34 910 000 000/);
  assert.match(hours.text, /9:30/);
  assert.match(hours.text, /inventado/);
  assert.doesNotMatch(hours.text, /€/);
});

test("the counted path keeps a sanitised es- slug, skips internal=1, and omits typed text", () => {
  const tagged = runCounter("?p=es-clinicadentalomega", "");
  assert.equal(tagged.localStorage.getItem("skipgc"), null);
  assert.equal(tagged.scripts.length, 1);
  assert.equal(tagged.scripts[0].src, "https://gc.zgo.at/count.js");
  assert.equal(tagged.scripts[0]["data-goatcounter"], "https://bollastudio.goatcounter.com/count");
  tagged.window.bsTrack("/chat/children", "example");
  flush(tagged);
  assert.deepEqual(JSON.parse(JSON.stringify(tagged.counts)), [
    { path: "/bolla-demo-dentist/es/?p=es-clinicadentalomega", title: "dentist demo es" },
    { path: "/bolla-demo-dentist/es/chat/children?p=es-clinicadentalomega", title: "example", event: true },
  ]);

  const dirty = runCounter("?p=ES-clinicadentalomega!", "");
  flush(dirty);
  assert.equal(dirty.counts[0].path, "/bolla-demo-dentist/es/?p=es-clinicadentalomega");

  const upper = runCounter("?p=es-clinicadentalomega&otro=1", "");
  flush(upper);
  assert.equal(upper.counts[0].path, "/bolla-demo-dentist/es/?p=es-clinicadentalomega");

  const longTag = "es-" + "a".repeat(70);
  const clipped = runCounter("?p=" + longTag, "");
  flush(clipped);
  assert.equal(clipped.counts[0].path, "/bolla-demo-dentist/es/?p=" + ("es-" + "a".repeat(70)).slice(0, 60));

  const skipped = runCounter("?internal=1&p=es-clinicadentalomega", "");
  assert.equal(skipped.localStorage.getItem("skipgc"), "t");
  assert.equal(skipped.scripts.length, 0);
  assert.equal(skipped.window.goatcounter, undefined);
  skipped.window.bsTrack("/chat/pain", "example");
  skipped.window.bsTrack("/request/confirm", "PACIENTE-SECRETO-9912");
  assert.deepEqual(skipped.counts, []);

  const hashed = runCounter("?p=es-clinicadentalomega", "#internal=1");
  assert.equal(hashed.localStorage.getItem("skipgc"), "t");
  assert.equal(hashed.scripts.length, 0);

  const remembered = runCounter("", "", { skipgc: "t" });
  assert.equal(remembered.scripts.length, 0);
  assert.equal(remembered.localStorage.getItem("skipgc"), "t");

  const reset = runCounter("?internal=0&p=es-clinicadentalomega", "", { skipgc: "t" });
  assert.equal(reset.localStorage.getItem("skipgc"), null);
  flush(reset);
  assert.equal(reset.counts[0].path, "/bolla-demo-dentist/es/?p=es-clinicadentalomega");
  reset.window.bsTrack("/request/confirm", "example");
  assert.equal(reset.counts[1].path, "/bolla-demo-dentist/es/request/confirm?p=es-clinicadentalomega");
  assert.equal(reset.counts[1].title, "example");
  assert.equal(reset.counts[1].event, true);
  assert.doesNotMatch(JSON.stringify(reset.counts), /PACIENTE|secreto|muelas|implante/i);

  const secret = "PACIENTE-SECRETO-9912";
  const ask = loaded.document.getElementById("ask");
  ask.value = secret + " no respira y mi correo es secreto.9912@ejemplo.com";
  loaded.listeners["ask-form:submit"][0]({ preventDefault() {} });
  loaded.document.getElementById("nm").value = secret;
  loaded.document.getElementById("ph").value = "secreto.9912@ejemplo.com";
  loaded.listeners["cta:click"][0]();
  assert.equal(loaded.document.getElementById("ok").textContent, pack.pick);
  loaded.document.getElementById("slots").children[0].onclick();
  loaded.listeners["cta:click"][0]();
  loaded.document.getElementById("qr").children[0].onclick();
  assert.deepEqual(loaded.tracks.map((item) => item.sub), ["/request/confirm", "/chat/pain"]);
  assert.deepEqual(loaded.tracks.map((item) => item.title), ["example", "example"]);
  assert.doesNotMatch(JSON.stringify(loaded.tracks), /PACIENTE-SECRETO|secreto\.9912|no respira|dolor de muelas/i);
  assert.equal(ask.value, "");
});

test("Spanish redirect preserves the query and the sent dentist URLs stay in place", () => {
  function redirectTarget(search, languages) {
    const index = read("dentist/index.html");
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
  assert.equal(redirectTarget("", ["ca"]), "en/");
  assert.equal(redirectTarget("", ["es-ES", "es"]), "es/");
  assert.equal(redirectTarget("", ["es-MX"]), "es/");
  assert.equal(redirectTarget("", ["ca-ES", "es"]), "es/");
  assert.equal(redirectTarget("?lang=et", ["es-ES"]), "et/");
  assert.equal(redirectTarget("?lang=ru", ["es-ES"]), "ru/");
  assert.equal(redirectTarget("?lang=en", ["es-ES"]), "en/");
  assert.equal(redirectTarget("?lang=es", ["en-GB"]), "es/");
  assert.equal(redirectTarget("?lang=et&p=sakala", ["es-ES"]), "et/?p=sakala");
  assert.equal(redirectTarget("?p=es-clinicadentalomega&internal=1", ["es-ES"]), "es/?p=es-clinicadentalomega&internal=1");
  assert.match(read("dentist/index.html"), /supported=\["et","ru","en","es","de"\]/);
  assert.match(read("dentist/index.html"), /location\.search/);
  assert.doesNotMatch(read("dentist/index.html"), /gc\.zgo\.at\/count\.js/);

  for (const lang of ["et", "en", "ru"]) {
    const page = read(`dentist/${lang}/index.html`);
    assert.match(page, /href="\.\.\/es\/" hreflang="es" lang="es" data-keep-query>Español</);
    assert.match(page, /n\.indexOf\(nk\)/);
    assert.doesNotMatch(page, /function tokensOf/);
    assert.match(page, new RegExp(`var BASE="/bolla-demo-dentist/${lang}"`));
    assert.match(page, new RegExp(`title:"dentist demo ${lang}"`));
  }
  const et = read("dentist/et/index.html");
  const en = read("dentist/en/index.html");
  assert.match(et, /href="\.\/" hreflang="et"/);
  assert.match(et, /href="\.\.\/ru\/" hreflang="ru"/);
  assert.match(et, /href="\.\.\/en\/" hreflang="en"/);
  assert.match(et, /Näidishambaravi/);
  assert.match(en, /href="\.\.\/et\/" hreflang="et"/);
  assert.match(en, /href="\.\.\/ru\/" hreflang="ru"/);
  assert.match(en, /href="\.\/" hreflang="en"/);
  assert.match(en, /Example Dental/);

  const shown = visible(html);
  assert.match(shown, /Clínica Dental de Ejemplo/);
  assert.match(shown, /ejemplo escrito/);
  assert.match(shown, /no un asistente en vivo/);
  assert.match(shown, /no es personalización/);
  assert.match(shown, /No reproduce audio/);
  assert.match(shown, /ilustración estática/);
  assert.match(shown, /ficticia/);
  assert.match(shown, /\+34 910 000 000/);
  assert.match(shown, /euros/);
  assert.match(shown, /Escriba una pregunta en español/);
  assert.match(shown, /de usted/);
  assert.doesNotMatch(shown, /€|Vitaldent|Sanitas|Baviera|Hello|Example Dental|Scripted example|Send\b|toothache/i);
  assert.doesNotMatch(shown, /\b(puedes|tienes|quieres|pulsa|escribe|elige|vosotros|contigo|tú)\b/i);
  assert.match(pack.chat[0][1], /^Hola/);
  assert.match(pack.chat[1][1], /^Hola/);
  assert.match(pack.ok, /No se ha reservado ni enviado nada/);
  assert.equal(pack.lang, "es");
});
