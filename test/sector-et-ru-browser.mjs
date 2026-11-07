import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const port = 8773;
const outDir = "/tmp/sector-et-shots";
mkdirSync(outDir, { recursive: true });
const root = new URL("..", import.meta.url).pathname;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=9336",
  "--user-data-dir=/tmp/sector-et-chrome",
  "about:blank",
], { stdio: "ignore" });

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

const sectors = ["hotel", "restaurant", "dentist", "hair-salon", "real-estate", "physio", "movers", "garage", "optician", "vet"];
let socket;
try {
  let version;
  for (let i = 0; i < 40 && !version; i += 1) {
    try { version = JSON.parse((await httpGet("http://127.0.0.1:9336/json/version")).body || ""); }
    catch { await delay(250); }
  }
  if (!version) throw new Error("Chrome did not start");
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
  const statuses = {};
  for (const slug of sectors) {
    for (const lang of ["et", "ru", "en"]) {
      const response = await httpGet(`http://127.0.0.1:${port}/${slug}/${lang}/?internal=1`);
      statuses[`${slug}/${lang}`] = response.status;
      if (response.status !== 200) throw new Error(`${slug}/${lang} ${response.status}`);
    }
    const swiss = await httpGet(`http://127.0.0.1:${port}/${slug === "dentist" ? "zahnarzt-ch" : slug === "hair-salon" ? "coiffeur-ch" : slug === "real-estate" ? "immobilien-ch" : slug === "movers" ? "umzug-ch" : slug === "optician" ? "optiker-ch" : slug === "vet" ? "tierarzt-ch" : slug + "-ch"}/de/`);
    if (swiss.status !== 200) throw new Error("swiss de missing for " + slug);
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "Object.defineProperty(navigator,'languages',{get(){return ['et-EE','et'];}});Object.defineProperty(navigator,'language',{get(){return 'et-EE';}});",
  }, sessionId);
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/hotel/?p=tallinn&internal=1` }, sessionId);
  await delay(500);
  const localeUrl = await evaluate("location.pathname + location.search");
  if (!localeUrl.startsWith("/hotel/et/") || !localeUrl.includes("p=tallinn")) {
    throw new Error("locale redirect " + localeUrl);
  }
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/restaurant/?lang=ru&p=tallinn&internal=1` }, sessionId);
  await delay(400);
  const explicit = await evaluate("location.pathname + location.search");
  if (!explicit.startsWith("/restaurant/ru/") || explicit.includes("lang=") || !explicit.includes("p=tallinn")) {
    throw new Error("explicit lang " + explicit);
  }
  const flows = [
    ["hotel", "et", "Kas koerad on lubatud?", "Tere", "koerad"],
    ["hotel", "ru", "Можно с собакой?", "Здравствуйте", "собак"],
    ["hotel", "en", "Are dogs allowed?", "Hello", "dogs"],
    ["dentist", "et", "Kas võtate lapsi vastu?", "Tere", "lapsed"],
    ["restaurant", "ru", "Есть обеденное меню?", "Здравствуйте", "меню"],
  ];
  const reports = [];
  for (const [slug, lang, button, greet, expectReply] of flows) {
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/${slug}/${lang}/?p=preview&internal=1` }, sessionId);
    await delay(350);
    const loaded = await evaluate(`({
      h1: document.querySelector("h1").textContent,
      html: document.documentElement.lang,
      demo: document.body.getAttribute("data-demo"),
      live: window.__sectorDemo.liveAI,
      width: document.documentElement.clientWidth,
      steps: document.querySelectorAll(".steps li").length,
      greet: document.getElementById("chat").innerText.slice(0, 40),
      counter: !!document.querySelector('script[src*="gc.zgo.at"]'),
      font: getComputedStyle(document.body).font
    })`);
    if (loaded.html !== lang || loaded.demo !== "static-example" || loaded.live !== false || loaded.width !== 375 || loaded.steps !== 3) {
      throw new Error(slug + " " + lang + " " + JSON.stringify(loaded));
    }
    if (!loaded.greet.includes(greet)) throw new Error("greeting " + loaded.greet);
    if (loaded.counter) throw new Error("analytics loaded");
    const clicked = await evaluate(`(() => {
      const btn = [...document.querySelectorAll(".qr button")].find((b) => b.textContent === ${JSON.stringify(button)});
      if (!btn) return { error: "missing", buttons: [...document.querySelectorAll(".qr button")].map((b) => b.textContent) };
      btn.click();
      const input = document.getElementById("ask");
      input.value = ${JSON.stringify(button)};
      document.getElementById("ask-form").requestSubmit();
      document.querySelector("#slots button").click();
      document.getElementById("cta").click();
      return {
        chat: document.getElementById("chat").innerText,
        ok: document.getElementById("ok").textContent,
        cyr: document.createElement("canvas").getContext("2d").measureText("Здравствуйте").width
      };
    })()`);
    if (clicked.error) throw new Error(JSON.stringify(clicked));
    if (!clicked.chat.includes(expectReply)) throw new Error(slug + " reply " + clicked.chat.slice(-300));
    if (!/Midagi ei broneeritud|Ничего не забронировано|Nothing was booked/.test(clicked.ok)) {
      throw new Error("form " + clicked.ok);
    }
    const glyph = await evaluate(`(() => {
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.font = getComputedStyle(document.body).font;
      return { font: ctx.font, cyr: ctx.measureText("Здравствуйте").width, et: ctx.measureText("Tere, õhtusöök").width };
    })()`);
    if (glyph.cyr < 40 || glyph.et < 40) throw new Error("glyph " + JSON.stringify(glyph));
    const other = lang === "et" ? "ru" : lang === "ru" ? "en" : "et";
    const href = await evaluate(`document.querySelector('a[hreflang="${other}"]').href`);
    if (!href.includes(`/${slug}/${other}/`) || !href.includes("p=preview")) throw new Error("switch " + href);
    await shot(`${slug}-${lang}-375`);
    reports.push({ slug, lang, h1: loaded.h1, button, ok: clicked.ok.slice(0, 70), font: glyph.font });
  }
  console.log(JSON.stringify({ ok: true, localeUrl, explicit, statuses, reports }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill("SIGKILL");
  server.kill("SIGKILL");
}
