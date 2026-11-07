import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
  });
}

const port = 8772;
const outDir = "/tmp/sector-en-shots";
mkdirSync(outDir, { recursive: true });
const root = new URL("..", import.meta.url).pathname;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9335",
  "--user-data-dir=/tmp/sector-en-chrome2",
  "about:blank",
], { stdio: "ignore" });

const slugs = ["hotel-ch", "restaurant-ch", "zahnarzt-ch", "coiffeur-ch", "immobilien-ch", "physio-ch", "umzug-ch", "garage-ch", "optiker-ch", "tierarzt-ch"];
const shots = [
  ["hotel-ch", "Are dogs allowed?", "What time is check-in?", "3:00 p.m.", "Ask about availability"],
  ["zahnarzt-ch", "Do you see children?", "I have a bad toothache. What should I do?", "cannot diagnose", "Ask for an appointment"],
  ["restaurant-ch", "Is there a lunch menu?", "Is the dish without nuts?", "kitchen", "Ask for a table"],
];

let socket;
try {
  let version;
  for (let i = 0; i < 40 && !version; i += 1) {
    try { version = JSON.parse((await httpGet("http://127.0.0.1:9335/json/version")).body); }
    catch { await delay(250); }
  }
  if (!version) throw new Error("Chrome did not start");
  console.error("chrome", version.Browser);
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve);
    socket.addEventListener("error", reject);
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
    }
  });
  function send(method, params, sessionId) {
    id += 1;
    socket.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function shot(name) {
    const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
    const fs = await import("node:fs/promises");
    await fs.writeFile(`${outDir}/${name}.png`, Buffer.from(image.data, "base64"));
  }
  async function go(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true }, sessionId);
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  }
  const statuses = {};
  for (const slug of slugs) {
    for (const lang of ["en", "de", "fr"]) {
      const response = await httpGet(`http://127.0.0.1:${port}/${slug}/${lang}/?p=machine&internal=1`);
      statuses[`${slug}/${lang}`] = response.status;
      if (response.status !== 200) throw new Error(`${slug}/${lang} ${response.status}`);
    }
  }
  const missing = await httpGet(`http://127.0.0.1:${port}/hotel-ch/en-missing/`);
  if (missing.status !== 404) throw new Error("expected 404 for missing path, got " + missing.status);
  const preserved = await httpGet(`http://127.0.0.1:${port}/ambarra/`);
  const schloss = await httpGet(`http://127.0.0.1:${port}/voz/schloss-wuelflingen/`);
  const coral = await httpGet(`http://127.0.0.1:${port}/coral-yachting/`);
  if (preserved.status !== 200 || schloss.status !== 200 || coral.status !== 200) {
    throw new Error("prospect pages not reachable");
  }

  console.error("routes", Object.keys(statuses).length);
  await go(375, 812);
  const reports = [];
  for (const [slug, button, typed, expectReply, cta] of shots) {
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/${slug}/en/?p=preview-en&internal=1` }, sessionId);
    await delay(400);
    const loaded = await evaluate(`({
      h1: document.querySelector("h1").textContent,
      demo: document.body.getAttribute("data-demo"),
      live: window.__sectorDemo && window.__sectorDemo.liveAI,
      mode: window.__sectorDemo && window.__sectorDemo.mode,
      brand: document.body.innerText.includes("BOLLA STUDIO") && document.body.innerText.includes("Marcelo Bolla") && document.body.innerText.includes("bollastudio.com"),
      steps: document.querySelectorAll(".steps li").length,
      width: document.documentElement.clientWidth,
      counter: !!document.querySelector('script[src*="gc.zgo.at"]'),
      skip: localStorage.getItem("skipgc"),
      voice: document.querySelector(".voice").textContent,
      buttons: document.querySelectorAll(".qr button").length,
      links: [...document.querySelectorAll("a")].map(a => a.getAttribute("href"))
    })`);
    if (loaded.demo !== "static-example" || loaded.live !== false || loaded.mode !== "static-example") {
      throw new Error(slug + " not marked static " + JSON.stringify(loaded));
    }
    if (!loaded.brand || loaded.steps < 3 || loaded.width !== 375) throw new Error(slug + " layout " + JSON.stringify(loaded));
    if (loaded.counter) throw new Error(slug + " loaded analytics despite internal=1");
    if (loaded.skip !== "t") throw new Error(slug + " skipgc");
    if (!/does not play audio/.test(loaded.voice)) throw new Error(slug + " voice label");
    for (const href of loaded.links) {
      if (!href || href.startsWith("mailto:") || href.startsWith("https://bollastudio.com")) continue;
      const url = new URL(href, `http://127.0.0.1:${port}/${slug}/en/`);
      if (url.origin !== `http://127.0.0.1:${port}`) throw new Error(slug + " unexpected link " + href);
      const linked = await httpGet(url);
      if (linked.status !== 200) throw new Error(slug + " broken " + url.pathname + " " + linked.status);
    }
    const clicked = await evaluate(`(() => {
      const btn = [...document.querySelectorAll(".qr button")].find(b => b.textContent === ${JSON.stringify(button)});
      if (!btn) return "missing button";
      btn.click();
      return document.getElementById("chat").innerText;
    })()`);
    if (!clicked.includes(button)) throw new Error(slug + " click failed " + clicked.slice(0, 200));
    const typedResult = await evaluate(`(() => {
      const input = document.getElementById("ask");
      input.value = ${JSON.stringify(typed)};
      document.getElementById("ask-form").requestSubmit();
      const direct = window.__sectorDemo.answerFor(${JSON.stringify(typed)});
      return { chat: document.getElementById("chat").innerText, direct: direct.text, id: direct.id };
    })()`);
    if (!typedResult.chat.includes(expectReply) || !typedResult.direct.includes(expectReply)) {
      throw new Error(slug + " reply " + JSON.stringify(typedResult).slice(0, 500));
    }
    if (/Grüezi|willkommen|Bitte zuerst/.test(typedResult.direct)) throw new Error(slug + " german reply");
    const form = await evaluate(`(() => {
      const slot = document.querySelector("#slots button");
      slot.click();
      document.getElementById("cta").click();
      return document.getElementById("ok").textContent;
    })()`);
    if (!/Nothing was booked and nothing was sent/.test(form)) throw new Error(slug + " form " + form);
    await shot(`${slug}-en-375`);
    const switched = await evaluate(`(() => {
      const a = document.querySelector('a[hreflang="de"]');
      return a.href;
    })()`);
    if (!switched.includes(`/${slug}/de/`) || !switched.includes("p=preview-en") || !switched.includes("internal=1")) {
      throw new Error(slug + " lang href " + switched);
    }
    await send("Page.navigate", { url: switched }, sessionId);
    await delay(300);
    const german = await evaluate(`({
      h1: document.querySelector("h1").textContent,
      en: !!document.querySelector('a[hreflang="en"]'),
      back: document.querySelector('a[hreflang="en"]') && document.querySelector('a[hreflang="en"]').href
    })`);
    if (!german.en || !german.back.includes(`/${slug}/en/`)) throw new Error(slug + " back " + JSON.stringify(german));
    reports.push({ slug, h1: loaded.h1, button, typed, reply: expectReply, form: form.slice(0, 80), deH1: german.h1, width: loaded.width });
  }
  const fs = await import("node:fs/promises");
  await fs.writeFile(`${outDir}/report.json`, JSON.stringify({ statuses, reports }, null, 2));
  console.log(JSON.stringify({ ok: true, statuses, reports }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill("SIGKILL");
  server.kill("SIGKILL");
}
