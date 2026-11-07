import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const port = 8774;
const outDir = "/tmp/berlin-de-shots";
mkdirSync(outDir, { recursive: true });
const root = new URL("..", import.meta.url).pathname;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=9337",
  "--user-data-dir=/tmp/berlin-de-chrome",
  "about:blank",
], { stdio: "ignore" });

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode }));
    });
    req.on("error", reject);
  });
}

const flows = [
  ["industrie-de", "Abgeleitet · Fertigen Sie Bauteile nach unseren Zeichnungen?", "Fachteam", "Randfall · Können Sie die Toleranz 0,01 mm freigeben?", "keine Toleranz"],
  ["tourismus-berlin", "FAQ · Können wir Route und Themen selbst bestimmen?", "noch nicht vor", "FAQ · Wie lange dauert eine private Fahrradtour durch Berlin?", "3,5 Stunden"],
  ["charter-de", "FAQ · Wie kann ich ein Angebot anfordern?", "keinen Preis", "Randfall · Ist noch ein Platz frei?", "bestätigt keinen Platz"],
];

let socket;
try {
  let version;
  for (let i = 0; i < 40 && !version; i += 1) {
    try {
      const body = await new Promise((resolve, reject) => {
        http.get("http://127.0.0.1:9337/json/version", (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
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
  for (const slug of ["industrie-de", "tourismus-berlin", "charter-de"]) {
    for (const lang of ["de", "en"]) {
      const response = await httpGet(`http://127.0.0.1:${port}/${slug}/${lang}/?internal=1`);
      if (response.status !== 200) throw new Error(`${slug}/${lang} ${response.status}`);
    }
  }
  const lagoon = await httpGet(`http://127.0.0.1:${port}/voz/lagoon42/`);
  const nautica = await httpGet(`http://127.0.0.1:${port}/nautica/`);
  if (lagoon.status !== 200 || nautica.status !== 200) throw new Error("existing nautical pages missing");
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }, sessionId);
  const reports = [];
  for (const [slug, button, expectA, edge, expectB] of flows) {
    await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/${slug}/?p=berlin&internal=1` }, sessionId);
    await delay(400);
    const landed = await evaluate("location.pathname + location.search");
    if (!landed.startsWith(`/${slug}/de/`) || !landed.includes("p=berlin")) throw new Error("redirect " + landed);
    const loaded = await evaluate(`({
      lang: document.documentElement.lang,
      demo: document.body.getAttribute("data-demo"),
      live: window.__sectorDemo.liveAI,
      width: document.documentElement.clientWidth,
      steps: document.querySelectorAll(".steps li").length,
      brand: document.body.innerText.includes("BOLLA STUDIO") && document.body.innerText.includes("Marcelo Bolla"),
      sent: document.body.innerText.includes("Beispiel – keine Anfrage gesendet"),
      staticLabel: document.body.innerText.includes("Statisches FAQ-Skript")
    })`);
    if (loaded.lang !== "de" || loaded.demo !== "static-example" || loaded.live !== false || loaded.width !== 375 || loaded.steps !== 3 || !loaded.brand || !loaded.sent || !loaded.staticLabel) {
      throw new Error(slug + " " + JSON.stringify(loaded));
    }
    const result = await evaluate(`(() => {
      const click = (label) => {
        const btn = [...document.querySelectorAll(".qr button")].find((b) => b.textContent === label);
        if (!btn) return "missing " + label;
        btn.click();
        return "ok";
      };
      const a = click(${JSON.stringify(button)});
      const b = click(${JSON.stringify(edge)});
      document.querySelector("#slots button").click();
      document.getElementById("cta").click();
      return { a, b, chat: document.getElementById("chat").innerText, ok: document.getElementById("ok").textContent };
    })()`);
    if (result.a !== "ok" || result.b !== "ok") throw new Error(JSON.stringify(result).slice(0, 400));
    if (!result.chat.includes(expectA) || !result.chat.includes(expectB)) throw new Error(slug + " chat " + result.chat.slice(-400));
    if (!result.ok.includes("Beispiel – keine Anfrage gesendet")) throw new Error(result.ok);
    await shot(`${slug}-de-375`);
    reports.push({ slug, landed, button, edge, ok: result.ok.slice(0, 80) });
  }
  console.log(JSON.stringify({ ok: true, reports }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill("SIGKILL");
  server.kill("SIGKILL");
}
