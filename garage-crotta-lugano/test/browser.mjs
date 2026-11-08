import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import net from "node:net";
import path from "node:path";

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function waitJson(url) {
  const started = Date.now();
  let last = "no response";
  while (Date.now() - started < 10000) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      last = String(response.status);
    } catch (error) {
      last = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(last);
}

class Cdp {
  constructor(url) {
    this.url = url;
    this.pending = new Map();
    this.handlers = new Map();
    this.waiters = new Map();
    this.id = 0;
  }
  open() {
    this.ws = new WebSocket(this.url);
    return new Promise((resolve, reject) => {
      this.ws.addEventListener("open", () => resolve());
      this.ws.addEventListener("error", () => reject(new Error("cdp socket")));
      this.ws.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.id && this.pending.has(message.id)) {
          const pending = this.pending.get(message.id);
          this.pending.delete(message.id);
          if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
          else pending.resolve(message.result || {});
          return;
        }
        if (!message.method) return;
        for (const handler of this.handlers.get(message.method) || []) handler(message.params || {});
        for (const resolve of this.waiters.get(message.method) || []) resolve(message.params || {});
        this.waiters.set(message.method, []);
      });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, handler) {
    const list = this.handlers.get(method) || [];
    list.push(handler);
    this.handlers.set(method, list);
  }
  once(method) {
    return new Promise((resolve) => {
      const list = this.waiters.get(method) || [];
      list.push(resolve);
      this.waiters.set(method, list);
    });
  }
  close() {
    this.ws.close();
  }
}

export async function withChrome(options, run) {
  const port = await freePort();
  const dir = await mkdtemp(path.join(tmpdir(), "crotta-chrome-"));
  const stderr = [];
  const chrome = spawn("google-chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    ...(options.args || []),
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  chrome.stderr.on("data", (chunk) => stderr.push(chunk.toString()));
  try {
    const version = await waitJson(`http://127.0.0.1:${port}/json/version`);
    const browser = new Cdp(version.webSocketDebuggerUrl);
    await browser.open();
    const created = await browser.send("Target.createTarget", { url: "about:blank" });
    const targets = await waitJson(`http://127.0.0.1:${port}/json/list`);
    const target = targets.find((item) => item.id === created.targetId);
    const page = new Cdp(target.webSocketDebuggerUrl);
    await page.open();
    const attempted = [];
    page.on("Fetch.requestPaused", (params) => {
      attempted.push(params.request.url);
      page.send("Fetch.failRequest", { requestId: params.requestId, errorReason: "BlockedByClient" }).catch(() => {});
    });
    page.on("Network.requestWillBeSent", (params) => {
      if ((options.watch || []).some((pattern) => params.request.url.includes(pattern))) attempted.push(params.request.url);
    });
    await page.send("Network.enable");
    await page.send("Page.enable");
    if (options.fail && options.fail.length) {
      await page.send("Fetch.enable", { patterns: options.fail.map((urlPattern) => ({ urlPattern })) });
    }
    const loaded = page.once("Page.loadEventFired");
    await page.send("Page.navigate", { url: options.url });
    await Promise.race([
      loaded,
      new Promise((_, reject) => setTimeout(() => reject(new Error("load timeout")), 15000)),
    ]);
    await run(page, attempted);
    page.close();
    browser.close();
  } catch (error) {
    error.message += ` chrome: ${stderr.join("").slice(-500)}`;
    throw error;
  } finally {
    chrome.kill("SIGKILL");
    await new Promise((resolve) => {
      if (chrome.exitCode !== null || chrome.signalCode !== null) resolve();
      else chrome.once("exit", resolve);
    });
    await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(() => {});
  }
}

export async function evaluate(page, expression) {
  const result = await page.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result && result.result.value;
}
