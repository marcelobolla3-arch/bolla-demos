import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const port = 8782;
const outDir = "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });
const root = new URL("..", import.meta.url).pathname;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=9345",
  "--user-data-dir=/tmp/estonia-extra-chrome",
  "about:blank",
], { stdio: "ignore" });

const pages = [
  { path: "barber/et/", shot: null, lang: "et", marker: "Näidisbarber", button: "Kas teete habet?", expect: "habet", other: "/barber/en/" },
  { path: "barber/en/", shot: "ee-barber-en-375", lang: "en", marker: "Example Barber", button: "Do you do beards?", expect: "beard", other: "/barber/et/" },
  { path: "charter/et/", shot: null, lang: "et", marker: "Näidispurje", button: "Kas on purjekursust?", expect: "kursus", other: "/charter/en/" },
  { path: "charter/en/", shot: "ee-charter-en-375", lang: "en", marker: "Example Sailing", button: "What if the weather is bad?", expect: "departure time", other: "/charter/et/" },
  { path: "marina-pirita/et/", shot: null, lang: "et", marker: "Näidissadam", button: "Kas see on hotell?", expect: "Ei", other: null },
];
const entries = [
  ["barber/?lang=en&p=qa-ee-5&internal=1", "/barber/en/", "qa-ee-5"],
  ["charter/?lang=et&p=qa-ee-5&internal=1", "/charter/et/", "qa-ee-5"],
  ["marina-pirita/?p=qa-ee-5&internal=1", "/marina-pirita/et/", "qa-ee-5"],
];

let socket;
const blocked = [];
try {
  let version;
  for (let i = 0; i < 40 && !version; i += 1) {
    try {
      const body = await new Promise((resolve, reject) => {
        http.get("http://127.0.0.1:9345/json/version", (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        }).on("error", reject);
      });
      version = JSON.parse(body);
    } catch { await delay(250); }
  }
  if (!version) throw new Error("Chrome did not start");
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve);
    socket.addEventListener("error", reject);
  });
  let seq = 0;
  const pending = new Map();
  const paused = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Fetch.requestPaused") paused.push(message.params);
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
    }
  });
  function send(method, params, sessionId) {
    seq += 1;
    socket.send(JSON.stringify({ id: seq, method, params, sessionId }));
    return new Promise((resolve, reject) => pending.set(seq, { resolve, reject }));
  }
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Fetch.enable", { patterns: [
    { urlPattern: "*goatcounter.com*", requestStage: "Request" },
    { urlPattern: "*gc.zgo.at*", requestStage: "Request" },
  ] }, sessionId);
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  async function drain() {
    while (paused.length) {
      const item = paused.shift();
      blocked.push(item.request.url);
      await send("Fetch.failRequest", { requestId: item.requestId, errorReason: "BlockedByClient" }, sessionId);
    }
  }
  const pump = setInterval(() => { drain().catch(() => {}); }, 30);
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  const report = [];
  for (const page of pages) {
    const url = `http://127.0.0.1:${port}/${page.path}?p=qa-ee-5&internal=1`;
    await send("Page.navigate", { url }, sessionId);
    await delay(800);
    await drain();
    await evaluate(`(() => {
      var buttons = Array.from(document.querySelectorAll("#qr button"));
      var b = buttons.find((x) => x.textContent.indexOf(${JSON.stringify(page.button)}) >= 0);
      if (!b) throw new Error("missing button");
      b.click();
    })()`);
    await delay(200);
    const state = await evaluate(`(() => {
      var text = document.body.innerText;
      var chat = document.getElementById("chat").innerText;
      var other = ${page.other ? JSON.stringify(page.other) : "null"};
      var link = other ? Array.from(document.querySelectorAll("a[data-keep-query]")).find((a) => a.pathname === other) : null;
      return {
        width: document.documentElement.clientWidth,
        lang: document.documentElement.lang,
        marker: text.includes(${JSON.stringify(page.marker)}),
        bolla: text.includes("BOLLA STUDIO"),
        scripted: text.includes("Kirjutatud näidis") || text.includes("Scripted example"),
        plain: text.includes("isikupärastamine") || text.includes("not personalization"),
        unsent: text.includes("ei saadeta") || text.includes("Nothing is sent"),
        chat: chat,
        live: window.__sectorDemo.liveAI,
        href: link ? link.href : "",
        gc: !!document.querySelector('script[src*="gc.zgo.at"]')
      };
    })()`);
    const variants = {
      health: state.width === 375 && state.lang === page.lang && !state.gc,
      belonging: state.marker && state.bolla,
      click: String(state.chat).includes(page.expect) && state.live === false,
      transparency: state.scripted && state.plain,
      noBooking: state.unsent && (!page.other || (state.href.includes("p=qa-ee-5") && state.href.includes("internal=1"))),
    };
    if (Object.values(variants).some((ok) => !ok)) throw new Error(page.path + " " + JSON.stringify({ variants, state }));
    if (page.shot) {
      const image = await send("Page.captureScreenshot", { format: "png" }, sessionId);
      writeFileSync(`${outDir}/${page.shot}.png`, Buffer.from(image.data, "base64"));
    }
    report.push({ path: page.path, variants, chat: state.chat.slice(0, 120) });
  }
  for (const [path, landed, tag] of entries) {
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/${path}` }, sessionId);
    await delay(700);
    await drain();
    const where = await evaluate("location.pathname + location.search");
    if (!String(where).startsWith(landed) || !String(where).includes("p=" + tag) || !String(where).includes("internal=1")) {
      throw new Error("entry " + path + " -> " + where);
    }
    report.push({ entry: path, landed: where });
  }
  clearInterval(pump);
  await drain();
  if (blocked.length !== 0) throw new Error("counter requests " + blocked.join(" "));
  writeFileSync(`${outDir}/ee-extra-browser.json`, JSON.stringify({ ok: true, blocked: blocked.length, report }, null, 2));
  console.log(JSON.stringify({ ok: true, blocked: 0, rows: report.map((r) => r.path || r.entry) }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (socket) socket.close();
  chrome.kill("SIGKILL");
  server.kill("SIGKILL");
}
