import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const port = 8765;
const outDir = "/tmp/ambarra-shots";
mkdirSync(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port)], {
  cwd: new URL("../../", import.meta.url).pathname,
  stdio: "ignore"
});
const chrome = spawn("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--remote-debugging-port=9222",
  "--user-data-dir=/tmp/ambarra-chrome",
  "--window-size=1280,900",
  "about:blank"
], { stdio: "ignore" });

let socket;
try {
  let version;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      version = await fetch("http://127.0.0.1:9222/json/version").then((r) => r.json());
      break;
    } catch (e) {
      await delay(300);
    }
  }
  if (!version) throw new Error("Chrome DevTools did not start");
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
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  });
  function send(method, params, sessionId) {
    id += 1;
    const call = id;
    socket.send(JSON.stringify({ id: call, method, params, sessionId }));
    return new Promise((resolve, reject) => pending.set(call, { resolve, reject }));
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
    const image = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    const file = outDir + "/" + name + ".png";
    await import("node:fs/promises").then((fs) => fs.writeFile(file, Buffer.from(image.data, "base64")));
    return file;
  }
  async function go(width, height) {
    await send("Emulation.setDeviceMetricsOverride", {
      width, height, deviceScaleFactor: 1, mobile: width < 700
    }, sessionId);
  }
  await go(1280, 900);
  await send("Page.navigate", { url: "http://127.0.0.1:" + port + "/ambarra/?internal=1" }, sessionId);
  await delay(1200);
  const loaded = await evaluate(`({
    h1: document.querySelector("h1") && document.querySelector("h1").textContent,
    lang: document.documentElement.lang,
    blocked: document.documentElement.dataset.analyticsBlocked,
    voice: document.documentElement.dataset.voice,
    widget: document.querySelector("elevenlabs-convai") ? "yes" : "no",
    agent: document.body.innerText.includes("agent_3101"),
    banner: document.getElementById("banner").textContent,
    errors: window.__errs || ""
  })`);
  if (!loaded.h1 || !loaded.h1.includes("Ambara Sardinian Lounge")) throw new Error("missing title " + JSON.stringify(loaded));
  if (loaded.lang !== "it") throw new Error("lang " + loaded.lang);
  if (loaded.blocked !== "true") throw new Error("analytics not blocked");
  if (loaded.voice !== "unavailable") throw new Error("voice " + loaded.voice);
  if (loaded.widget !== "no") throw new Error("widget mounted");
  if (loaded.agent) throw new Error("forbidden agent visible");
  if (!loaded.banner.includes("Demo")) throw new Error("banner");
  await evaluate(`document.querySelector("#prompts button").click()`);
  await delay(200);
  const hours = await evaluate(`document.getElementById("log").innerText`);
  if (!hours.includes("07:30–11:30") || !hours.includes("08:30–12:00") || !hours.includes("17:00–01:00")) {
    throw new Error("hours missing " + hours.slice(0, 400));
  }
  await evaluate(`(() => {
    document.getElementById("date").value = "2026-11-20";
    document.getElementById("time").value = "20:30";
    document.getElementById("party").value = "4";
    document.getElementById("allergy").value = "noci";
    document.getElementById("book").requestSubmit();
  })()`);
  await delay(200);
  const booked = await evaluate(`document.getElementById("book-result").innerText`);
  if (!booked.includes("DEMO — prenotazione simulata / simulated reservation")) throw new Error("mark " + booked);
  if (!booked.includes("Nessuna prenotazione effettuata")) throw new Error("confirm language " + booked);
  if (/prenotazione confermata|tavolo confermato/i.test(booked)) throw new Error("fake confirm");
  await shot("desktop-it");
  await evaluate(`document.querySelector('#langs button[data-lang="en"]').click()`);
  await delay(200);
  const english = await evaluate(`document.querySelector("h1").textContent + "\\n" + document.getElementById("lang-note").textContent`);
  if (!english.includes("Assistant for Ambara")) throw new Error(english);
  if (!english.toLowerCase().includes("not a list of languages")) throw new Error(english);
  await evaluate(`document.getElementById("tab-google").click()`);
  await delay(200);
  const google = await evaluate(`document.getElementById("google-panel").innerText`);
  if (!google.includes("31 July 2024")) throw new Error(google.slice(0, 300));
  if (!google.includes("Plateform")) throw new Error("plateform missing");
  await shot("desktop-google");
  await evaluate(`document.getElementById("tab-call").click()`);
  await delay(200);
  const voice = await evaluate(`document.getElementById("voice-panel").innerText`);
  if (!voice.includes("Voice unavailable")) throw new Error(voice.slice(0, 240));
  if (await evaluate(`document.querySelector("elevenlabs-convai") ? "yes" : "no"`) !== "no") throw new Error("widget");
  await shot("desktop-en-voice");
  await go(390, 844);
  await evaluate(`window.scrollTo(0, 0)`);
  await shot("mobile-en");
  await evaluate(`document.querySelector('#langs button[data-lang="es"]').click()`);
  await delay(200);
  const spanish = await evaluate(`document.getElementById("lang-note").textContent`);
  if (!spanish.toLowerCase().includes("capacidad")) throw new Error(spanish);
  const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth + 1`);
  if (overflow) throw new Error("horizontal overflow");
  await shot("mobile-es");
  console.log("browser checks passed");
  console.log(outDir);
} finally {
  if (socket) socket.close();
  chrome.kill("SIGTERM");
  server.kill("SIGTERM");
}
