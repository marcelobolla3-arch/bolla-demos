import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import { execSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = 8775;
const outDir = "/tmp/qa-mobile-all";
mkdirSync(outDir, { recursive: true });
const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const root = new URL("..", import.meta.url).pathname;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=9338",
  "--user-data-dir=/tmp/qa-mobile-chrome",
  "about:blank",
], { stdio: "ignore" });

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", reject);
  });
}

const swiss = ["hotel-ch", "restaurant-ch", "zahnarzt-ch", "coiffeur-ch", "immobilien-ch", "physio-ch", "umzug-ch", "garage-ch", "optiker-ch", "tierarzt-ch"];
const neutral = ["hotel", "restaurant", "dentist", "hair-salon", "real-estate", "physio", "movers", "garage", "optician", "vet"];
const berlin = ["industrie-de", "tourismus-berlin", "charter-de"];
const pages = [];
for (const slug of swiss) {
  for (const lang of ["de", "fr", "en"]) pages.push(`${slug}/${lang}`);
  if (slug === "tierarzt-ch") pages.push(`${slug}/it`);
}
for (const slug of neutral) for (const lang of ["et", "ru", "en"]) pages.push(`${slug}/${lang}`);
for (const slug of berlin) for (const lang of ["de", "en"]) pages.push(`${slug}/${lang}`);
const shots = new Set([
  "hotel-ch/de", "hotel-ch/fr", "hotel-ch/en", "tierarzt-ch/it",
  "zahnarzt-ch/de", "restaurant-ch/en",
  "hotel/et", "hotel/ru", "hotel/en", "dentist/et", "restaurant/ru", "vet/en",
  "industrie-de/de", "tourismus-berlin/de", "charter-de/de", "charter-de/en",
]);

let socket;
try {
  let version;
  for (let i = 0; i < 40 && !version; i += 1) {
    try {
      const body = await new Promise((resolve, reject) => {
        http.get("http://127.0.0.1:9338/json/version", (res) => {
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
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  const rows = [];
  for (const page of pages) {
    const status = await httpGet(`http://127.0.0.1:${port}/${page}/?p=qa-link&internal=1`);
    if (status !== 200) throw new Error(`${page} HTTP ${status}`);
    await send("Page.navigate", { url: `http://127.0.0.1:${port}/${page}/?p=qa-link&internal=1` }, sessionId);
    await delay(180);
    const info = await evaluate(`(() => {
      const text = document.body.innerText;
      const links = [...document.querySelectorAll("a[data-keep-query], nav a")].map((a) => a.href);
      return {
        lang: document.documentElement.lang,
        width: document.documentElement.clientWidth,
        demo: document.body.getAttribute("data-demo"),
        live: window.__sectorDemo ? window.__sectorDemo.liveAI : null,
        steps: document.querySelectorAll(".steps li").length,
        brand: text.includes("BOLLA STUDIO") && text.includes("Marcelo Bolla"),
        counter: !!document.querySelector('script[src*="gc.zgo.at"]'),
        personal: /personalized for|personalisiert für|персонализирован для|isikupärastatud teile/i.test(text),
        links
      };
    })()`);
    if (info.width !== 375) throw new Error(`${page} width ${info.width}`);
    if (!info.brand) throw new Error(`${page} missing brand`);
    if (info.counter) throw new Error(`${page} loaded analytics`);
    if (info.personal) throw new Error(`${page} claims personalization`);
    const bad = info.links.filter((href) => !href.includes("p=qa-link") && !href.includes("bollastudio.com") && !href.startsWith("mailto:"));
    if (bad.length) throw new Error(`${page} query dropped ${bad.join(" ")}`);
    if (info.demo === "static-example") {
      if (info.live !== false) throw new Error(`${page} liveAI`);
      if (info.steps < 3) throw new Error(`${page} steps`);
    }
    if (page.endsWith("/de") && page.includes("-ch/")) {
      const legacy = await evaluate("document.body.innerText.includes('KI-Agent') || document.body.innerText.includes('KI‑Agent')");
      if (!legacy) throw new Error(`${page} lost legacy KI wording`);
      if (info.demo === "static-example") throw new Error(`${page} was relabelled as the new static script`);
    }
    if (shots.has(page)) {
      const image = await send("Page.captureScreenshot", { format: "png" }, sessionId);
      const fs = await import("node:fs/promises");
      await fs.writeFile(`${outDir}/${page.replaceAll("/", "-")}.png`, Buffer.from(image.data, "base64"));
    }
    rows.push({ page, lang: info.lang, demo: info.demo, width: info.width });
  }
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/hotel-ch/?p=qa-link` }, sessionId);
  await delay(250);
  const swissEntry = await evaluate("location.pathname + location.search");
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/industrie-de/?p=qa-link` }, sessionId);
  await delay(250);
  const berlinEntry = await evaluate("location.pathname + location.search");
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/hotel/?lang=ru&p=qa-link` }, sessionId);
  await delay(250);
  const neutralEntry = await evaluate("location.pathname + location.search");
  if (swissEntry !== "/hotel-ch/de/?p=qa-link") throw new Error("swiss entry " + swissEntry);
  if (berlinEntry !== "/industrie-de/de/?p=qa-link") throw new Error("berlin entry " + berlinEntry);
  if (neutralEntry !== "/hotel/ru/?p=qa-link") throw new Error("neutral entry " + neutralEntry);
  const report = { sha, pages: rows.length, swissEntry, berlinEntry, neutralEntry, rows };
  writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, sha, pages: rows.length, swissEntry, berlinEntry, neutralEntry }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill("SIGKILL");
  server.kill("SIGKILL");
}
