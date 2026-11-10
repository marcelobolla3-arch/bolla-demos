import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const html = readFileSync(new URL("peccadille/index.html", root), "utf8");
const CHAT = "https://demo.bollastudio.com/restaurant-ch/de/?p=de-ber-32-peccadille";
const VOICE = "https://elevenlabs.io/app/talk-to?agent_id=agent_9701m72qec37f23r4wryyfqn0vpr";

function source(id) {
  const match = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));
  assert.ok(match, id);
  return match[1];
}

function visible(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const metricsSource = source("bolla-metrics");
const linksSource = source("peccadille-links");
const shown = visible(html);

function boot(href, store = new Map()) {
  const records = {
    "chat-link": {
      href: CHAT,
      attrs: { "data-track": "/chat", "data-title": "chat" },
    },
    "voice-link": {
      href: VOICE,
      attrs: { "data-track": "/voice", "data-title": "voice" },
    },
  };
  const listeners = [];
  function wrap(id) {
    const record = records[id];
    return {
      get href() { return record.href; },
      set href(value) { record.href = value; },
      getAttribute(name) { return record.attrs[name] || null; },
      addEventListener(type, fn) { listeners.push({ id, type, fn }); },
    };
  }
  const created = [];
  const element = { setAttribute() {} };
  const url = new URL(href);
  const document = {
    documentElement: { setAttribute(name, value) { this[name] = value; } },
    createElement() { return element; },
    head: { appendChild(node) { created.push(node); } },
    getElementById(id) { return records[id] ? wrap(id) : null; },
    querySelectorAll(selector) {
      assert.equal(selector, "[data-track]");
      return ["chat-link", "voice-link"].map(wrap);
    },
  };
  const location = { search: url.search, hash: url.hash };
  const localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
  };
  const context = { window: {}, document, location, localStorage, decodeURIComponent };
  context.window = context;
  vm.runInNewContext(metricsSource, context, { filename: "bolla-metrics.js" });
  vm.runInNewContext(linksSource, context, { filename: "peccadille-links.js" });
  return { created, element, document, window: context.window, records, listeners, store };
}

function fire(page, id) {
  const row = page.listeners.find((item) => item.id === id && item.type === "click");
  assert.ok(row, id);
  row.fn();
}

test("the landing says these are working BOLLA demos, in German, with Du", () => {
  assert.match(shown, /funktionsfähige Demos/);
  assert.match(shown, /BOLLA STUDIO/);
  assert.match(shown, /Marcelo Bolla/);
  assert.match(shown, /Kein offizieller Kanal des Restaurants/);
  assert.match(shown, /keine echte Reservierung/i);
  assert.match(shown, /Hier kannst du zwei funktionsfähige Demos/);
  assert.match(shown, /Wenn du den Chat oder die Sprachdemo öffnest/);
  assert.match(shown, /Ein Aufruf heißt nicht, dass du zugehört oder die Demo abgeschlossen hast/);
  assert.match(shown, /Restaurant Lindenhof/);
  assert.match(shown, /kein echtes WhatsApp/);
  assert.match(shown, /nicht auf La Peccadille zugeschnitten/);
  assert.match(shown, /WhatsApp-Stil/);
  assert.match(shown, /öffentlichen Angaben von La Peccadille/);
  assert.match(shown, /Zenchef/);
  assert.match(shown, /Telefonanlage/);
  assert.match(shown, /Hauptcomputer des Restaurants oder vom Handy/);
  assert.match(shown, /jederzeit selbst eingreifen/);
  assert.match(shown, /Besuchskennzeichen für BOLLA STUDIO/);
  assert.match(shown, /keine Personalisierung/);
  assert.match(html, /lang="de"/);
  assert.doesNotMatch(shown, /\b(Sie|Ihre|Ihnen|Ihrem|Ihren|Ihrer)\b/);
  assert.doesNotMatch(shown, /ElevenLabs (interpretiert|liest|beachtet) internal|internal=1 wird an ElevenLabs/i);
});

test("the two buttons use the exact destinations and do not track by pixel", () => {
  assert.match(html, new RegExp(`id="chat-link"[^>]*href="${CHAT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(html, new RegExp(`id="voice-link"[^>]*href="${VOICE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.equal((html.match(/agent_9701m72qec37f23r4wryyfqn0vpr/g) || []).length, 1);
  assert.doesNotMatch(html, /width=["']1["']|height=["']1["']|tracking pixel|email-pixel/i);
  assert.doesNotMatch(html, /<img\b/i);
  assert.match(html, /bollastudio\.goatcounter\.com\/count/);
  assert.match(html, /skipgc/);
  assert.match(html, /window\.bsTrack=function/);
  assert.match(html, /event:true/);
  assert.equal((metricsSource.match(/path:BASE\+'\/'/g) || []).length, 1);
  assert.ok(metricsSource.indexOf("if(internal) return;") < metricsSource.indexOf("appendChild"));
  assert.match(metricsSource, /\.replace\(\/\[\^a-z0-9-\]\/g,""\)\.slice\(0,60\)/);
  assert.match(linksSource, /\.replace\(\/\[\^a-z0-9-\]\/g,""\)\.slice\(0,60\)/);
  assert.doesNotMatch(linksSource, /elevenlabs|voice-link/);
});

test("one visit and separate chat and voice events keep p, and internal=1 sends nothing", () => {
  const tagged = boot("http://127.0.0.1/peccadille/?p=de-ber-32-peccadille");
  assert.equal(tagged.created.length, 1);
  assert.equal(tagged.element.src, "https://gc.zgo.at/count.js");
  assert.equal(tagged.document.documentElement["data-peccadille-metrics"], "on");
  assert.equal(tagged.records["chat-link"].href, CHAT);
  assert.equal(tagged.records["voice-link"].href, VOICE);
  const hits = [];
  tagged.window.goatcounter.count = (row) => hits.push(row);
  tagged.element.onload();
  fire(tagged, "chat-link");
  fire(tagged, "voice-link");
  assert.deepEqual(hits.map((hit) => ({ path: hit.path, title: hit.title, event: hit.event })), [
    { path: "/bolla-demo-peccadille/?p=de-ber-32-peccadille", title: "peccadille", event: undefined },
    { path: "/bolla-demo-peccadille/chat?p=de-ber-32-peccadille", title: "chat", event: true },
    { path: "/bolla-demo-peccadille/voice?p=de-ber-32-peccadille", title: "voice", event: true },
  ]);
  const queued = boot("http://127.0.0.1/peccadille/?p=de-ber-32-peccadille");
  fire(queued, "chat-link");
  const queuedHits = [];
  queued.window.goatcounter.count = (row) => queuedHits.push(row);
  queued.element.onload();
  assert.deepEqual(queuedHits.map((hit) => hit.path), [
    "/bolla-demo-peccadille/?p=de-ber-32-peccadille",
    "/bolla-demo-peccadille/chat?p=de-ber-32-peccadille",
  ]);
  assert.equal(queuedHits[1].event, true);
  assert.equal(queuedHits[1].title, "chat");
  assert.doesNotMatch(JSON.stringify(hits), /WhatsApp|Sprachdemo|Lindenhof|öffnen/);

  const dirty = boot("http://127.0.0.1/peccadille/?p=De-BER_32%20Peccadille!!extra");
  const dirtyHits = [];
  dirty.window.goatcounter.count = (row) => dirtyHits.push(row);
  dirty.element.onload();
  assert.equal(dirtyHits[0].path, "/bolla-demo-peccadille/?p=de-ber32peccadilleextra");
  assert.equal(dirty.records["chat-link"].href, "https://demo.bollastudio.com/restaurant-ch/de/?p=de-ber32peccadilleextra");
  assert.equal(dirty.records["voice-link"].href, VOICE);

  const longTag = "a".repeat(80);
  const longPage = boot(`http://127.0.0.1/peccadille/?p=${longTag}`);
  const longHits = [];
  longPage.window.goatcounter.count = (row) => longHits.push(row);
  longPage.element.onload();
  assert.equal(longHits[0].path, `/bolla-demo-peccadille/?p=${"a".repeat(60)}`);

  const blocked = boot("http://127.0.0.1/peccadille/?p=de-ber-32-peccadille&internal=1");
  assert.equal(blocked.created.length, 0);
  assert.equal(blocked.element.src, undefined);
  assert.equal(blocked.document.documentElement["data-peccadille-metrics"], "off");
  assert.equal(blocked.store.get("skipgc"), "t");
  assert.equal(blocked.records["chat-link"].href, `${CHAT}&internal=1`);
  assert.equal(blocked.records["voice-link"].href, VOICE);
  blocked.window.goatcounter = { count() { throw new Error("counted while internal"); } };
  fire(blocked, "chat-link");
  fire(blocked, "voice-link");
  assert.equal(blocked.created.length, 0);

  const hashed = boot("http://127.0.0.1/peccadille/?p=de-ber-32-peccadille#internal=1");
  assert.equal(hashed.created.length, 0);
  assert.equal(hashed.records["chat-link"].href, `${CHAT}&internal=1`);
  assert.equal(hashed.records["voice-link"].href, VOICE);

  const store = new Map();
  boot("http://127.0.0.1/peccadille/?internal=1", store);
  const remembered = boot("http://127.0.0.1/peccadille/?p=camp-2", store);
  assert.equal(remembered.created.length, 0);
  assert.equal(remembered.records["chat-link"].href, "https://demo.bollastudio.com/restaurant-ch/de/?p=camp-2&internal=1");
  const cleared = boot("http://127.0.0.1/peccadille/?p=camp-2&internal=0", store);
  assert.equal(cleared.created.length, 1);
  assert.equal(store.has("skipgc"), false);
  assert.equal(cleared.records["chat-link"].href, "https://demo.bollastudio.com/restaurant-ch/de/?p=camp-2");
  assert.equal(cleared.records["voice-link"].href, VOICE);

  const plain = boot("http://127.0.0.1/peccadille/");
  assert.equal(plain.records["chat-link"].href, CHAT);
  const plainHits = [];
  plain.window.goatcounter.count = (row) => plainHits.push(row);
  plain.element.onload();
  fire(plain, "chat-link");
  assert.equal(plainHits[0].path, "/bolla-demo-peccadille/");
  assert.equal(plainHits[0].event, undefined);
  assert.equal(plainHits[1].path, "/bolla-demo-peccadille/chat");
  assert.equal(plainHits[1].event, true);
  assert.equal(plainHits[1].title, "chat");
});

function serve(dir) {
  return new Promise((resolve) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (rel.endsWith("/")) rel += "index.html";
      const file = `${dir}/${rel}`.replace(/\/+/g, "/");
      if (!file.startsWith(dir)) {
        response.writeHead(403);
        response.end();
        return;
      }
      try {
        const body = readFileSync(file);
        response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        response.end(body);
      } catch {
        response.writeHead(404);
        response.end("missing");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

test("playwright renders 375 and desktop with internal=1 and never reaches GoatCounter", { timeout: 90000 }, async (t) => {
  if (!process.env.PECCADILLE_PLAYWRIGHT) {
    t.skip("playwright is not installed in CI; set PECCADILLE_PLAYWRIGHT to the module path");
    return;
  }
  const imported = await import(process.env.PECCADILLE_PLAYWRIGHT);
  const chromium = imported.chromium || imported.default?.chromium;
  if (!chromium) throw new Error("playwright module has no chromium export");
  const server = await serve(new URL(".", root).pathname);
  const port = server.address().port;
  const blocked = [];
  const voiceRequests = [];
  const chatResponses = [];
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const context = await browser.newContext();
    await context.route(/goatcounter\.com|zgo\.at/i, (route) => {
      blocked.push(route.request().url());
      return route.abort();
    });
    await context.route(/elevenlabs\.io/i, (route) => {
      voiceRequests.push(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: "<!doctype html><title>voice-intercept</title><p>intercepted before any session</p>",
      });
    });
    context.on("response", (response) => {
      if (response.url().includes("demo.bollastudio.com/restaurant-ch/de/")) chatResponses.push({ url: response.url(), status: response.status() });
    });
    const shots = "/opt/cursor/artifacts";
    await mkdir(shots, { recursive: true });
    const landing = `http://127.0.0.1:${port}/peccadille/?p=de-ber-32-peccadille&internal=1`;
    const viewports = [
      { name: "peccadille-375", width: 375, height: 812 },
      { name: "peccadille-desktop", width: 1280, height: 800 },
    ];
    const checks = [];
    for (const viewport of viewports) {
      const page = await context.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const external = [];
      page.on("request", (request) => {
        if (!request.url().startsWith(`http://127.0.0.1:${port}/`)) external.push(request.url());
      });
      await page.goto(landing, { waitUntil: "networkidle" });
      const state = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        metrics: document.documentElement.getAttribute("data-peccadille-metrics"),
        scripts: document.querySelectorAll('script[src*="zgo.at"],script[src*="goatcounter"]').length,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        chat: document.getElementById("chat-link").href,
        voice: document.getElementById("voice-link").href,
        text: document.body.innerText,
      }));
      assert.equal(state.lang, "de");
      assert.equal(state.metrics, "off");
      assert.equal(state.scripts, 0);
      assert.equal(state.clientWidth, viewport.width);
      assert.ok(state.scrollWidth <= state.clientWidth, JSON.stringify(state));
      assert.ok(state.bodyWidth <= state.clientWidth, JSON.stringify(state));
      assert.equal(state.chat, `${CHAT}&internal=1`);
      assert.equal(state.voice, VOICE);
      assert.match(state.text, /funktionsfähige Demos/);
      assert.match(state.text, /kannst du/);
      assert.deepEqual(external, []);
      for (const id of ["#chat-link", "#voice-link"]) {
        const box = await page.locator(id).boundingBox();
        assert.ok(box, id);
        assert.ok(box.width >= 48 && box.height >= 48, JSON.stringify(box));
        assert.ok(box.x >= -1 && box.x + box.width <= viewport.width + 1, JSON.stringify(box));
        assert.ok(box.y >= -1 && box.y + box.height <= viewport.height + 1, JSON.stringify({ id, box, viewport }));
        await page.locator(id).click({ trial: true });
      }
      await page.screenshot({ path: `${shots}/${viewport.name}.png`, fullPage: true });
      checks.push({ viewport: viewport.name, chat: state.chat, voice: state.voice, overflow: false });
      if (viewport.width === 375) {
        const chatPopupPromise = page.waitForEvent("popup");
        await page.locator("#chat-link").click();
        const chatPopup = await chatPopupPromise;
        await chatPopup.waitForLoadState("domcontentloaded");
        assert.equal(chatPopup.url(), `${CHAT}&internal=1`);
        const chatState = await chatPopup.evaluate(() => ({
          lindenhof: document.body.innerText.includes("Restaurant Lindenhof"),
          skip: localStorage.getItem("skipgc"),
          scripts: document.querySelectorAll('script[src*="zgo.at"],script[src*="goatcounter"]').length,
        }));
        assert.equal(chatState.lindenhof, true);
        assert.equal(chatState.skip, "t");
        assert.equal(chatState.scripts, 0);
        await chatPopup.close();
        const voicePopupPromise = page.waitForEvent("popup");
        await page.locator("#voice-link").click();
        const voicePopup = await voicePopupPromise;
        await voicePopup.waitForLoadState("domcontentloaded");
        assert.equal(voicePopup.url().split("#")[0], VOICE);
        assert.match(await voicePopup.locator("body").innerText(), /intercepted before any session/);
        await voicePopup.close();
      }
      await page.close();
    }
    const voiceLive = await fetch(VOICE, { redirect: "follow" });
    assert.equal(voiceLive.status, 200);
    assert.deepEqual(blocked, []);
    assert.ok(voiceRequests.includes(VOICE));
    assert.ok(chatResponses.some((item) => item.status === 200 && item.url.includes("internal=1") && item.url.includes("p=de-ber-32-peccadille")));
    const report = {
      ok: true,
      landing,
      viewports: checks,
      chatLoaded: chatResponses,
      voiceLiveStatus: voiceLive.status,
      voiceBrowser: "intercepted; no session",
      goatcounterRequests: blocked,
      conteo: "conteo no demostrado",
    };
    await writeFile(`${shots}/peccadille-qa.json`, JSON.stringify(report, null, 2));
  } finally {
    await browser?.close();
    server.close();
  }
});
