import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import { setTimeout as delay } from "node:timers/promises";

const port = 8776;
const debugPort = 9341;
const outDir = "/opt/cursor/artifacts";
mkdirSync(outDir, { recursive: true });
const root = new URL("..", import.meta.url).pathname;
const tag = "qa-browser-8319";
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=" + debugPort,
  "--user-data-dir=/tmp/metrics-browser-chrome",
  "about:blank",
], { stdio: "ignore" });

const stub = `(function(){
  var g = window.goatcounter = window.goatcounter || {};
  window.__qaHits = window.__qaHits || [];
  g.count = function(vars){
    vars = vars || {};
    var path = vars.path !== undefined ? vars.path : g.path;
    var title = vars.title !== undefined ? vars.title : document.title;
    if (typeof path === "function") path = path(location.pathname + location.search);
    if (typeof title === "function") title = title(document.title);
    window.__qaHits.push({
      p: path == null ? "" : String(path),
      t: title == null ? "" : String(title),
      e: !!(vars.event || g.event),
      q: location.search
    });
  };
  if (!g.no_onload) g.count();
})();`;

function leak(hit) {
  const blob = hit.p + " " + hit.t + " " + hit.q;
  return /@|whatsapp|marcelo@|\+34|\+41|name=|email/i.test(blob);
}

let socket;
const report = { tag, transport: "intercepted; zero requests completed to the count endpoint", scenarios: [], leaks: [] };
try {
  let version;
  for (let i = 0; i < 40 && !version; i += 1) {
    try {
      const body = await new Promise((resolve, reject) => {
        http.get("http://127.0.0.1:" + debugPort + "/json/version", (res) => {
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
    { urlPattern: "*elevenlabs*", requestStage: "Request" },
    { urlPattern: "*unpkg.com*", requestStage: "Request" },
  ] }, sessionId);
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  const realCount = [];
  async function drain() {
    while (paused.length) {
      const item = paused.shift();
      const url = item.request.url;
      if (url.includes("gc.zgo.at/count.js")) {
        await send("Fetch.fulfillRequest", {
          requestId: item.requestId,
          responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "application/javascript" }],
          body: Buffer.from(stub).toString("base64"),
        }, sessionId);
      } else {
        if (url.includes("bollastudio.goatcounter.com/count")) realCount.push(url);
        await send("Fetch.failRequest", { requestId: item.requestId, errorReason: "BlockedByClient" }, sessionId);
      }
    }
  }
  const pump = setInterval(() => { drain().catch((error) => { report.drainError = String(error); }); }, 30);
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails.exception || result.exceptionDetails));
    return result.result.value;
  }
  async function shot(name) {
    const image = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(outDir + "/" + name + ".png", Buffer.from(image.data, "base64"));
  }
  async function open(path) {
    await send("Page.navigate", { url: "http://127.0.0.1:" + port + path }, sessionId);
    await delay(700);
    await drain();
  }
  async function hits() {
    await drain();
    return (await evaluate("window.__qaHits || []")) || [];
  }
  async function clickPlay(selector) {
    const box = await evaluate("(() => { var el=document.querySelector(" + JSON.stringify(selector) + "); var r=el.getBoundingClientRect(); return {x:r.x+Math.min(r.width/2,120), y:r.y+20}; })()");
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 }, sessionId);
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 }, sessionId);
    await evaluate("(function(){ var v=document.querySelector(" + JSON.stringify(selector) + "); v.muted=true; return v.play(); })()");
  }
  async function run(name, fn) {
    const attempts = [];
    for (let n = 1; n <= 2; n += 1) {
      try {
        const value = await fn();
        attempts.push({ n, ok: true });
        report.scenarios.push({ name, ok: true, attempts, ...value });
        return;
      } catch (error) {
        attempts.push({ n, ok: false, error: String(error.message || error).slice(0, 500) });
        if (n === 2) report.scenarios.push({ name, ok: false, attempts });
      }
    }
  }

  await run("legacy-hicar", async () => {
    await open("/hicar/?p=" + tag + "&internal=0");
    const before = await hits();
    if (before.length !== 1 || before[0].e !== false) throw new Error("visit " + JSON.stringify(before));
    if (!before[0].p.includes("?p=" + tag)) throw new Error("campaign " + before[0].p);
    await delay(1200);
    if ((await hits()).length !== 1) throw new Error("scene counted on open");
    await evaluate("document.querySelector('.sc').click()");
    await delay(300);
    const after = await hits();
    if (after.length !== 2 || after[1].e !== true || !after[1].p.includes("/scene/")) throw new Error("use " + JSON.stringify(after));
    await shot("qa-hicar-375");
    return { hits: after.map(({ p, t, e }) => ({ p, t, e })) };
  });

  await run("sector-de", async () => {
    await open("/hotel-ch/de/?p=" + tag + "&internal=0");
    const before = await hits();
    if (before.length !== 1 || before[0].e !== false || !before[0].p.endsWith("/?p=" + tag)) throw new Error("visit " + JSON.stringify(before));
    await delay(900);
    if ((await hits()).length !== 1) throw new Error("script counted on open");
    const kept = await evaluate("var a=document.querySelector('a[hreflang=fr]'); a ? a.getAttribute('href') : ''");
    if (!String(kept).includes("p=" + tag)) throw new Error("lang href " + kept);
    await evaluate("document.querySelector('#qr button').click()");
    await delay(200);
    const after = await hits();
    if (after.length !== 2 || after[1].e !== true || after[1].t !== "script-option") throw new Error("use " + JSON.stringify(after));
    await shot("qa-hotel-ch-de-375");
    return { hits: after.map(({ p, t, e }) => ({ p, t, e })), langHref: kept };
  });

  await run("sector-et", async () => {
    await open("/hotel/et/?p=" + tag + "&internal=0");
    const before = await hits();
    if (before.length !== 1 || before[0].e !== false || !before[0].p.includes("?p=" + tag)) throw new Error("visit " + JSON.stringify(before));
    const kept = await evaluate("var a=document.querySelector('a[hreflang=ru]'); a ? a.href : ''");
    if (!String(kept).includes("p=" + tag) || !String(kept).includes("/hotel/ru/")) throw new Error("lang " + kept);
    await evaluate("document.querySelector('#qr button').click()");
    await delay(200);
    const after = await hits();
    if (after.length !== 2 || after[1].e !== true || after[1].t !== "example") throw new Error("use " + JSON.stringify(after));
    await shot("qa-hotel-et-375");
    return { hits: after.map(({ p, t, e }) => ({ p, t, e })), langHref: kept };
  });

  await run("video", async () => {
    await open("/video/comunidad-argentina/es/?p=" + tag + "&internal=0");
    const before = await hits();
    if (before.length !== 1 || before[0].e !== false) throw new Error("visit " + JSON.stringify(before));
    await clickPlay("video");
    await delay(400);
    const after = await hits();
    if (after.length !== 2 || after[1].e !== true || after[1].t !== "video-play") throw new Error("play " + JSON.stringify(after));
    if (after[1].p.includes("reel.mp4")) throw new Error("file path counted");
    await shot("qa-video-es-375");
    return { hits: after.map(({ p, t, e }) => ({ p, t, e })) };
  });

  await run("chat-restaurant-en", async () => {
    await open("/restaurant/en/?p=" + tag + "&internal=0");
    await delay(400);
    const before = await hits();
    if (before.length !== 1 || before[0].e !== false) throw new Error("visit " + JSON.stringify(before));
    await evaluate("document.querySelector('#qr button').click()");
    await delay(200);
    const after = await hits();
    if (after.length !== 2 || after[1].e !== true || !after[1].p.includes("/chat/")) throw new Error("use " + JSON.stringify(after));
    return { hits: after.map(({ p, t, e }) => ({ p, t, e })) };
  });

  await run("dealer-video", async () => {
    await open("/concesionarios/en/?p=" + tag + "&internal=0");
    const text = await evaluate("document.body.innerText");
    if (!/illustrative example of how the assistant replies/i.test(text) || /answers your dealership/i.test(text)) throw new Error("copy");
    if (await evaluate("!!document.querySelector('video')")) throw new Error("video still present");
    const before = await hits();
    if (before.length !== 1 || before[0].e !== false || !before[0].p.includes("/" + tag + "/video-en")) throw new Error("visit " + JSON.stringify(before));
    await shot("qa-concesionarios-en-375");
    return { hits: before.map(({ p, t, e }) => ({ p, t, e })), width: await evaluate("document.documentElement.clientWidth") };
  });

  await run("redirect-once", async () => {
    await open("/hotel-ch/?p=" + tag + "&internal=0");
    await delay(500);
    const url = await evaluate("location.pathname + location.search");
    const seen = await hits();
    const views = seen.filter((hit) => hit.e === false);
    if (!String(url).includes("/hotel-ch/de/") || !String(url).includes("p=" + tag)) throw new Error("landed " + url);
    if (views.length !== 1) throw new Error("views " + JSON.stringify(seen));
    return { url, hits: seen.map(({ p, t, e }) => ({ p, t, e })) };
  });

  await run("internal-zero", async () => {
    const beforeBlocked = realCount.length;
    await open("/hotel-ch/de/?p=" + tag + "&internal=1");
    await delay(600);
    const seen = await hits();
    if (seen.length !== 0) throw new Error("internal counted " + JSON.stringify(seen));
    if (realCount.length !== beforeBlocked) throw new Error("real count url");
    return { hits: [], realCountUrls: realCount.length };
  });

  await run("voice-not-started", async () => {
    await open("/voz/schloss-wuelflingen/?p=" + tag + "&internal=0");
    const seen = await hits();
    const widget = await evaluate("!!document.querySelector('elevenlabs-convai')");
    const started = seen.filter((hit) => hit.e && /voice-start/.test(hit.p));
    if (seen.filter((hit) => !hit.e).length !== 1 || started.length !== 0 || !widget) throw new Error(JSON.stringify({ seen, widget }));
    return { hits: seen.map(({ p, t, e }) => ({ p, t, e })), callStarted: false };
  });

  await run("visit-only-brochure", async () => {
    await open("/bar-barcelona-meridiana/?p=" + tag + "&internal=0");
    await evaluate("var n=document.querySelector('nav.ov'); if(n) n.click()");
    await delay(200);
    const seen = await hits();
    if (seen.length !== 1 || seen[0].e !== false) throw new Error(JSON.stringify(seen));
    return { hits: seen.map(({ p, t, e }) => ({ p, t, e })), usage: "n/a" };
  });

  await run("budokan-use-after-click", async () => {
    await open("/budokan-zuerich-web/?p=" + tag + "&internal=0");
    const before = await hits();
    if (before.length !== 1 || before[0].e !== false) throw new Error("visit " + JSON.stringify(before));
    await evaluate("document.querySelector('#waBtn').click(); document.querySelector('[data-q]').click()");
    await delay(200);
    const after = await hits();
    if (after.length !== 2 || after[1].e !== true || after[1].t !== "script-option") throw new Error("use " + JSON.stringify(after));
    if (/Was kostet|Mitgliedschaft/.test(after[1].t)) throw new Error("question text in title");
    return { hits: after.map(({ p, t, e }) => ({ p, t, e })) };
  });

  for (const scenario of report.scenarios) {
    for (const hit of scenario.hits || []) if (leak(hit)) report.leaks.push({ scenario: scenario.name, hit });
  }
  clearInterval(pump);
  await drain();
  report.realCountRequests = realCount;
  report.ok = report.scenarios.every((scenario) => scenario.ok) && report.leaks.length === 0 && realCount.length === 0;
  writeFileSync(outDir + "/qa-metrics-browser.json", JSON.stringify(report, null, 2));
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ ok: true, scenarios: report.scenarios.map((s) => s.name), realCount: 0 }, null, 2));
  }
} catch (error) {
  report.fatal = String(error.stack || error);
  writeFileSync(outDir + "/qa-metrics-browser.json", JSON.stringify(report, null, 2));
  console.error(report.fatal);
  process.exitCode = 1;
} finally {
  if (socket) socket.close();
  chrome.kill("SIGKILL");
  server.kill("SIGKILL");
}
