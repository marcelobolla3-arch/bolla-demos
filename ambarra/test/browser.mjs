import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const port = 8766;
const outDir = "/tmp/ambarra-pr1-shots";
mkdirSync(outDir, { recursive: true });
const root = new URL("../../", import.meta.url).pathname;
const server = spawn("python3", ["-m", "http.server", String(port)], { cwd: root, stdio: "ignore" });
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=9333",
  "--user-data-dir=/tmp/ambarra-pr1-chrome",
  "about:blank"
], { stdio: "ignore" });

let socket;
try {
  let version;
  for (let i = 0; i < 25 && !version; i += 1) {
    try { version = await fetch("http://127.0.0.1:9333/json/version").then((r) => r.json()); }
    catch (e) { await delay(300); }
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
    const image = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    const fs = await import("node:fs/promises");
    await fs.writeFile(outDir + "/" + name + ".png", Buffer.from(image.data, "base64"));
  }
  async function go(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 }, sessionId);
  }
  await go(1280, 900);
  await send("Page.navigate", { url: "http://127.0.0.1:" + port + "/ambarra/?internal=1" }, sessionId);
  await delay(1600);
  const loaded = await evaluate(`({
    h1: document.querySelector("h1").textContent,
    top: document.querySelector(".top").textContent,
    skip: localStorage.getItem("skipgc"),
    counter: !!document.querySelector('script[src*="gc.zgo.at"]'),
    widget: !!document.querySelector("elevenlabs-convai")
  })`);
  if (!loaded.h1.includes("italiano")) throw new Error("h1 " + loaded.h1);
  if (!loaded.top.includes("Ambàra")) throw new Error("top " + loaded.top);
  if (loaded.skip !== "t") throw new Error("skipgc " + loaded.skip);
  if (loaded.counter) throw new Error("counter loaded during internal QA");
  if (loaded.widget) throw new Error("widget on the channel page");
  await evaluate(`Array.from(document.querySelectorAll("#chips button")).find(b => b.textContent === "Orari").click()`);
  await delay(900);
  const hours = await evaluate(`document.getElementById("msgs").innerText`);
  if (!hours.includes("07:30–11:30") || !hours.includes("08:30–12:00") || !hours.includes("17:00–01:00")) {
    throw new Error("hours " + hours.slice(0, 500));
  }
  await evaluate(`document.getElementById("inp").value = "Qual è il vostro Instagram?"; document.getElementById("send").click();`);
  await delay(900);
  const ig = await evaluate(`document.getElementById("msgs").innerText`);
  if (!ig.includes("@ambarasardinianlounge")) throw new Error("ig " + ig.slice(-400));
  if (!ig.includes("non invia")) throw new Error("ig connected? " + ig.slice(-400));
  await evaluate(`Array.from(document.querySelectorAll("#slots button")).find(b => b.textContent === "20:30").click(); document.getElementById("cta").click();`);
  await delay(200);
  const booked = await evaluate(`document.getElementById("ok").innerText`);
  if (!booked.includes("DEMO — prenotazione simulata / simulated reservation")) throw new Error(booked);
  if (!booked.includes("Nessuna prenotazione effettuata")) throw new Error(booked);
  if (!booked.includes("Plateform")) throw new Error(booked);
  await shot("desktop-it");
  await evaluate(`document.querySelector('#langs button[data-l="en"]').click()`);
  await delay(500);
  await evaluate(`document.querySelector('#tabs button[data-tab="google"]').click()`);
  await delay(200);
  const google = await evaluate(`document.getElementById("pane-google").innerText`);
  if (!google.includes("31 July 2024")) throw new Error(google.slice(0, 400));
  if (!google.includes("Plateform")) throw new Error("plateform missing");
  if (!google.includes("@ambarasardinianlounge")) throw new Error("ig missing on google card");
  await shot("desktop-google");
  await evaluate(`document.querySelector('#tabs button[data-tab="voice"]').click()`);
  await delay(200);
  await shot("desktop-voice-link");
  await send("Page.navigate", { url: "http://127.0.0.1:" + port + "/voz/ambarra/?internal=1" }, sessionId);
  await delay(700);
  const voice = await evaluate(`({
    hidden: document.getElementById("voiceHold").hidden,
    text: document.getElementById("voiceHold").innerText,
    widget: !!document.querySelector("elevenlabs-convai"),
    agent: document.body.innerText.includes("agent_3101")
  })`);
  if (voice.hidden) throw new Error("hold hidden");
  if (voice.widget) throw new Error("voice widget mounted");
  if (voice.agent) throw new Error("agent id visible");
  if (!voice.text.toLowerCase().includes("non è configurato") && !voice.text.toLowerCase().includes("not configured")) {
    throw new Error(voice.text);
  }
  await shot("voice-hold");
  await go(390, 844);
  await send("Page.navigate", { url: "http://127.0.0.1:" + port + "/ambarra/?internal=1&lang=en" }, sessionId);
  await delay(800);
  const overflow = await evaluate(`document.documentElement.scrollWidth > document.documentElement.clientWidth + 1`);
  if (overflow) throw new Error("horizontal overflow");
  await evaluate(`document.querySelector('#langs button[data-l="en"]').click()`);
  await delay(400);
  await shot("mobile-en");
  console.log("browser checks passed");
  console.log(outDir);
} finally {
  if (socket) socket.close();
  chrome.kill("SIGTERM");
  server.kill("SIGTERM");
}
