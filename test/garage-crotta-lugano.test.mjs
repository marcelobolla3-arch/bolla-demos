import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import { evaluate, withChrome } from "../garage-crotta-lugano/test/browser.mjs";

const root = new URL("..", import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), "utf8");
const chatHtml = read("garage-crotta-lugano/chat/index.html");
const voiceHtml = read("garage-crotta-lugano/voce/index.html");
const runtimeSrc = read("garage-crotta-lugano/runtime/crotta-runtime.js");
const legacy = read("garage-crotta-lugano/index.html");
const notice = "Demo non ufficiale realizzata da BOLLA STUDIO; nessuna prenotazione o richiesta viene inviata al garage.";
const privacy = "Demo non ufficiale BOLLA STUDIO. Non inserire dati personali. La conversazione è elaborata da ElevenLabs; la registrazione audio è disattivata. I dati tecnici possono essere trasmessi ai servizi collegati di BOLLA STUDIO.";

function loadRuntime() {
  const sandbox = {
    console,
    document: { getElementById() { return null; }, readyState: "complete" },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(runtimeSrc, sandbox, { filename: "crotta-runtime.js" });
  return sandbox.CrottaRuntime;
}

const api = loadRuntime();

function metric(record) {
  return JSON.parse(JSON.stringify(record));
}

test("only the dedicated Crotta agent can start", () => {
  assert.equal(api.AGENT_ID, "agent_5901m6wvp21efkrrgna504217pjg");
  assert.equal(api.assertAgent(api.AGENT_ID), api.AGENT_ID);
  assert.throws(() => api.assertAgent("agent_6201m6q47bszfaz93zk0zaxrvbdb"), /agent-forbidden/);
  assert.throws(() => api.assertAgent("agent_3101m5z30nvbf06rvwp6def0k85b"), /agent-forbidden/);
  assert.throws(() => api.assertAgent("agent_other"), /agent-rejected/);
  assert.match(api.SDK_URL, /@elevenlabs\/client@1\.35\.0/);
  assert.doesNotMatch(runtimeSrc, /xi-api-key|ELEVENLABS_API_KEY|demo\.bollastudio\.com/);
  assert.match(runtimeSrc, /textOnly: true/);
  assert.match(runtimeSrc, /connectionType: "webrtc"/);
  assert.match(runtimeSrc, /connectionType: "websocket"/);
  assert.match(runtimeSrc, /if \(!options \|\| options\.origin\) throw new Error\("origin-override"\)/);
});

test("a send or a start click is not a completed reply or a connected call", () => {
  const chat = api.createMeter("chat");
  const voice = api.createMeter("voice");
  assert.deepEqual(metric(chat.observe({ type: "user-send" })), []);
  assert.deepEqual(metric(chat.observe({ type: "message", payload: { role: "user", message: "orari", event_id: 1 } })), []);
  assert.deepEqual(metric(chat.observe({ type: "part", part: { type: "delta", text: "Lun", response_id: "r1" } })), []);
  assert.deepEqual(metric(chat.observe({ type: "message", payload: { role: "agent", message: "   ", event_id: 2 } })), []);
  assert.deepEqual(metric(voice.observe({ type: "start-click" })), []);
  assert.deepEqual(metric(voice.observe({ type: "end-click" })), []);
  assert.deepEqual(metric(voice.observe({ type: "status", status: "connecting" })), []);
  assert.deepEqual(metric(voice.observe({ type: "status", status: "disconnected" })), []);
  assert.deepEqual(metric(voice.observe({ type: "message", payload: { role: "agent", message: "Buongiorno", response_id: "v1" } })), []);
});

test("a completed assistant reply is counted once and the text stays out of the metric", () => {
  const chat = api.createMeter("chat");
  const full = "Lunedì venerdì 07:30-12:00.";
  const first = chat.observe({ type: "part", part: { type: "stop", response_id: "r1", event_id: 4 } });
  const second = chat.observe({ type: "message", payload: { role: "agent", source: "ai", message: full, response_id: "r1", event_id: 5 } });
  assert.deepEqual(metric(first), [{ kind: "chat-response", path: "/response", title: "chat-response" }]);
  assert.deepEqual(metric(second), []);
  assert.equal(JSON.stringify(first).includes(full), false);
  assert.equal(JSON.stringify(metric(first[0])).includes("message"), false);
  const next = api.createMeter("chat");
  next.observe({ type: "user-send" });
  const onlyMessage = next.observe({ type: "message", payload: { role: "agent", message: full, event_id: 9 } });
  assert.equal(onlyMessage[0].title, "chat-response");
  assert.deepEqual(metric(next.observe({ type: "message", payload: { role: "agent", message: full, event_id: 9 } })), []);
});

test("voice connection, end and error come from session callbacks", () => {
  const voice = api.createMeter("voice");
  assert.deepEqual(metric(voice.observe({ type: "connect" })), []);
  assert.deepEqual(metric(voice.observe({ type: "status", status: "connected" })), []);
  assert.deepEqual(metric(voice.observe({ type: "metadata" })), []);
  assert.deepEqual(metric(voice.observe({ type: "disconnect" })), []);
  assert.deepEqual(metric(voice.observe({ type: "assistant-live" })), [{ kind: "voice-connected", path: "/connected", title: "voice-connected" }]);
  assert.deepEqual(metric(voice.observe({ type: "assistant-live" })), []);
  assert.deepEqual(metric(voice.observe({ type: "disconnect" })), [{ kind: "voice-ended", path: "/ended", title: "voice-ended" }]);
  assert.deepEqual(metric(voice.observe({ type: "status", status: "disconnected" })), []);
  const failed = api.createMeter("voice");
  assert.deepEqual(metric(failed.observe({ type: "error" })), [{ kind: "voice-error", path: "/error", title: "voice-error" }]);
  assert.deepEqual(metric(failed.observe({ type: "client-error" })), []);
  failed.observe({ type: "start-click" });
  assert.equal(failed.observe({ type: "error" })[0].title, "voice-error");
});

test("the chat controller does not count the click, and an agent message does", async () => {
  const metrics = [];
  let handlers = null;
  let started = 0;
  const controller = api.createChatController({
    startSession(options) {
      started += 1;
      assert.equal(options.agentId, api.AGENT_ID);
      assert.equal(options.textOnly, true);
      assert.equal(options.connectionType, "websocket");
      assert.equal(options.origin, undefined);
      handlers = options;
      return {
        sendUserMessage() {},
        endSession() { options.onDisconnect(); },
      };
    },
    onMetric(record) { metrics.push(record); },
  });
  assert.equal(started, 0);
  await controller.send("Quali sono gli orari di apertura?");
  assert.equal(started, 1);
  assert.deepEqual(metrics, []);
  handlers.onMessage({ role: "agent", message: "Lun–ven 07:30–12:00.", response_id: "r9", event_id: 3 });
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].title, "chat-response");
  assert.equal(JSON.stringify(metrics).includes("07:30"), false);
  await controller.end();
  assert.equal(metrics.length, 1);
});

test("a rejected voice start is an error and not a connection", async () => {
  const metrics = [];
  const voice = api.createVoiceController({
    startSession(options) {
      assert.equal(options.connectionType, "webrtc");
      assert.equal(options.textOnly, undefined);
      options.onError("origin rejected");
      options.onStatusChange({ status: "disconnected" });
      throw new Error("origin rejected");
    },
    onMetric(record) { metrics.push(record); },
  });
  const result = await voice.start();
  assert.equal(result.error, true);
  assert.deepEqual(metrics.map((item) => item.title), ["voice-error"]);
  assert.equal(voice.getState().status, "error");
  assert.equal(voice.getState().conversationId, "");
});

test("voice callbacks connect once and a later disconnect ends once", async () => {
  const metrics = [];
  let handlers = null;
  const voice = api.createVoiceController({
    startSession(options) {
      handlers = options;
      options.onStatusChange({ status: "connected" });
      options.onConnect({ conversationId: "conv_test" });
      options.onConversationMetadata({ conversation_id: "conv_test" });
      return { endSession() { options.onStatusChange({ status: "disconnected" }); options.onDisconnect({ reason: "user" }); } };
    },
    onMetric(record) { metrics.push(record); },
  });
  await voice.start();
  assert.deepEqual(metrics.map((item) => item.kind), []);
  assert.equal(voice.getState().conversationId, "conv_test");
  handlers.onMessage({ role: "user", message: "orari", event_id: 1 });
  handlers.onModeChange({ mode: "speaking" });
  assert.deepEqual(metrics.map((item) => item.kind), ["voice-connected"]);
  await voice.end();
  assert.deepEqual(metrics.map((item) => item.kind), ["voice-connected", "voice-ended"]);
});

test("a transport id that closes before the assistant speaks is an error", async () => {
  const metrics = [];
  const voice = api.createVoiceController({
    startSession(options) {
      options.onConnect({ conversationId: "conv_denied" });
      options.onConversationMetadata({ conversation_id: "conv_denied" });
      options.onDisconnect({ reason: "agent", context: { reason: "room disconnected" } });
      return { endSession() {} };
    },
    onMetric(record) { metrics.push(record); },
  });
  await voice.start();
  assert.deepEqual(metrics.map((item) => item.kind), ["voice-error"]);
  assert.equal(voice.getState().status, "error");
});

function metricsSource(html) {
  const match = html.match(/<script id="bolla-metrics">([\s\S]*?)<\/script>/);
  assert.ok(match, "metrics script");
  return match[1];
}

function runMetrics(source, href, store = new Map()) {
  const created = [];
  const element = { setAttribute() {} };
  const document = {
    documentElement: { setAttribute(name, value) { this[name] = value; } },
    createElement() { return element; },
    head: { appendChild(node) { created.push(node); } },
  };
  const url = new URL(href);
  const location = { search: url.search, hash: url.hash };
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
  };
  const context = { window: {}, document, location, localStorage, decodeURIComponent };
  context.window = context;
  vm.runInNewContext(source, context);
  return { created, element, document, window: context.window, store };
}

test("internal traffic never installs the counter and a link tag is not a person", () => {
  for (const html of [chatHtml, voiceHtml]) {
    const source = metricsSource(html);
    assert.match(html, /skipgc/);
    assert.match(html, /bollastudio\.goatcounter\.com\/count/);
    assert.match(html, /window\.bsTrack=function/);
    assert.match(html, /event:true/);
    assert.ok(source.indexOf("if(internal)return") < source.indexOf("appendChild"));
    const blocked = runMetrics(source, "http://local.test/page/?internal=1");
    assert.equal(blocked.created.length, 0);
    assert.equal(blocked.document.documentElement["data-crotta-metrics"], "off");
    blocked.window.bsTrack("/response", "chat-response");
    assert.equal(blocked.created.length, 0);
  }
  const source = metricsSource(chatHtml);
  const store = new Map();
  runMetrics(source, "http://local.test/page/?internal=1", store);
  const still = runMetrics(source, "http://local.test/page/", store);
  assert.equal(still.created.length, 0);
  const cleared = runMetrics(source, "http://local.test/page/?internal=0", store);
  assert.equal(cleared.created.length, 1);
  assert.equal(cleared.element.src, "https://gc.zgo.at/count.js");
  cleared.window.bsTrack("/response", "chat-response");
  const hits = [];
  cleared.window.goatcounter.count = (row) => hits.push(row);
  cleared.element.onload();
  assert.equal(hits[0].event, undefined);
  assert.equal(hits[0].title, "crotta-chat");
  assert.equal(hits[0].path, "/bolla-garage-crotta-lugano/chat/");
  assert.equal(hits[1].event, true);
  assert.equal(hits[1].title, "chat-response");
  assert.equal(hits[1].path, "/bolla-garage-crotta-lugano/chat/response");
  assert.equal(JSON.stringify(hits).includes("?"), false);
  const tagged = runMetrics(source, "http://local.test/page/?link_id=Link-9&p=Mario%20Rossi");
  const taggedHits = [];
  tagged.window.goatcounter = { count(row) { taggedHits.push(row); } };
  tagged.element.onload();
  assert.equal(taggedHits[0].path, "/bolla-garage-crotta-lugano/chat/?p=mariorossi");
  const onlyLink = runMetrics(source, "http://local.test/page/?link_id=camp-1");
  const linkHits = [];
  onlyLink.window.goatcounter = { count(row) { linkHits.push(row); } };
  onlyLink.element.onload();
  assert.equal(linkHits[0].path, "/bolla-garage-crotta-lugano/chat/?p=camp-1");
});

test("pages state only source-backed facts and do not collect personal details", () => {
  for (const html of [chatHtml, voiceHtml]) {
    assert.match(html, new RegExp(notice.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(privacy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /non una cancellazione globale/);
    assert.match(html, /può ancora includere la trascrizione/);
    assert.match(html, /Via al Campanile 1, Lugano/);
    assert.match(html, /6900/);
    assert.match(html, /6962/);
    assert.match(html, /non mostra una posizione su mappa/);
    assert.match(html, /Vespa, Moto Guzzi, Aprilia/);
    assert.match(html, /non sono trattate qui come concessionari ufficiali/);
    assert.match(html, /091 972 18 28/);
    assert.doesNotMatch(html, /076\s*505|0765051232|noleggio|Boscioro|prezzo|finanziamento|<form/i);
    assert.doesNotMatch(html, /agent_6201|agent_3101|agent_5901/);
    assert.doesNotMatch(html, /mailto:|tel:/);
  }
  assert.match(chatHtml, /textOnly|Conversazione libera, solo testo/);
  assert.match(voiceHtml, /non significa che la linea sia connessa/);
  assert.match(legacy, /Luca Rossi/);
  assert.doesNotMatch(legacy, /agent_5901|elevenlabs|textOnly/);
});

function serve(dir) {
  return new Promise((resolve) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (rel.endsWith("/")) rel += "index.html";
      const file = path.normalize(path.join(dir, rel));
      if (path.relative(dir, file).startsWith("..")) {
        response.writeHead(403);
        response.end();
        return;
      }
      try {
        const body = readFileSync(file);
        const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html; charset=utf-8";
        response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
        response.end(body);
      } catch {
        response.writeHead(404);
        response.end("missing");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

test("page load with internal=1 does not request the counter or the provider", { timeout: 60000 }, async (t) => {
  try {
    await access("/usr/bin/google-chrome");
  } catch {
    t.skip("chrome is not installed");
    return;
  }
  const server = await serve(new URL(".", root).pathname);
  const port = server.address().port;
  const shots = "/opt/cursor/artifacts";
  try {
    await mkdir(shots, { recursive: true });
  } catch { /* screenshots are optional for the assertion */ }
  const fail = ["*goatcounter.com*", "*zgo.at*", "*elevenlabs.io*", "*jsdelivr.net*"];
  const watch = ["goatcounter", "zgo.at", "elevenlabs", "jsdelivr"];
  try {
    for (const [name, route] of [["chat", "/garage-crotta-lugano/chat/"], ["voce", "/garage-crotta-lugano/voce/"]]) {
      const url = `http://127.0.0.1:${port}${route}?internal=1`;
      try {
      await withChrome({ url, fail, watch }, async (page, attempted) => {
        assert.deepEqual(attempted, []);
        assert.equal(await evaluate(page, "document.documentElement.getAttribute('data-crotta-metrics')"), "off");
        assert.equal(await evaluate(page, "document.querySelectorAll('script[src*=\"zgo.at\"],script[src*=\"goatcounter\"]').length"), 0);
        const text = await evaluate(page, "document.body.innerText");
        assert.match(text, /Demo non ufficiale realizzata da BOLLA STUDIO/);
        assert.match(text, /Non connesso/);
        for (const [label, width, height] of [["375", 375, 1400], ["desktop", 1280, 1400]]) {
          await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
          const shot = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
          await writeFile(path.join(shots, `crotta-${name}-${label}.png`), Buffer.from(shot.data, "base64"));
        }
      });
      } catch (error) {
        if (/fetch failed|chrome-debug|cdp socket|load timeout/.test(String(error && error.message))) {
          t.skip("chrome did not open a debug port");
          return;
        }
        throw error;
      }
    }
  } finally {
    server.close();
  }
});
