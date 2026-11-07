import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const port = 8781;
const outDir = "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });
const root = new URL("..", import.meta.url).pathname;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=9344",
  "--user-data-dir=/tmp/estonia-extra-chrome",
  "about:blank",
], { stdio: "ignore" });

const shots = [
  ["barber/et/?p=ee-extra&internal=1", "ee-barber-et-375", "Näidisbarber", "Kas teete habet?", "habet"],
  ["charter/et/?p=ee-extra&internal=1", "ee-charter-et-375", "Näidispurje", "Kas on purjekursust?", "kursus"],
  ["charter/en/?p=ee-extra&internal=1", "ee-charter-en-375", "Example Sailing", "Is there a sailing course?", "enrolled"],
  ["marina-pirita/et/?p=ee-extra&internal=1", "ee-marina-pirita-et-375", "Näidissadam", "Kas see on hotell?", "Ei"],
];

let socket;
const blocked = [];
try {
  let version;
  for (let i = 0; i < 40 && !version; i += 1) {
    try {
      const body = await new Promise((resolve, reject) => {
        http.get("http://127.0.0.1:9344/json/version", (res) => {
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
  for (const [path, name, marker, question, expect] of shots) {
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/${path}` }, sessionId);
    await delay(900);
    await drain();
    const state = await evaluate(`(() => {
      var demo = window.__sectorDemo;
      var answer = demo.answerFor(${JSON.stringify(question)}).text;
      var link = document.querySelector('a[data-keep-query]');
      return {
        width: document.documentElement.clientWidth,
        marker: document.body.innerText.includes(${JSON.stringify(marker)}),
        answer: answer,
        live: demo.liveAI,
        href: link ? link.href : "",
        gc: !!document.querySelector('script[src*="gc.zgo.at"]')
      };
    })()`);
    if (state.width !== 375 || !state.marker || state.live !== false || state.gc || !String(state.answer).includes(expect)) {
      throw new Error(name + " " + JSON.stringify(state));
    }
    if (path.startsWith("barber/et") && !String(state.href).includes("p=ee-extra")) throw new Error("query dropped " + state.href);
    const image = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(image.data, "base64"));
    report.push({ name, width: state.width, answer: state.answer.slice(0, 80), blocked: blocked.length });
  }
  clearInterval(pump);
  await drain();
  if (blocked.length !== 0) throw new Error("counter requests " + blocked.join(" "));
  writeFileSync(`${outDir}/ee-extra-browser.json`, JSON.stringify({ ok: true, blocked: blocked.length, report }, null, 2));
  console.log(JSON.stringify({ ok: true, blocked: 0, pages: report.map((r) => r.name) }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (socket) socket.close();
  chrome.kill("SIGKILL");
  server.kill("SIGKILL");
}
