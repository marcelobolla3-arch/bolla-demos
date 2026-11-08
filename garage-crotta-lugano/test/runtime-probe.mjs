import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluate, withChrome } from "./browser.mjs";

if (process.env.CROTTa_RUNTIME !== "1") {
  console.error("Refusing a live provider session. Set CROTTa_RUNTIME=1 for one bounded probe.");
  process.exit(1);
}

const root = path.resolve(new URL("../../", import.meta.url).pathname);
const evidencePath = "/opt/cursor/artifacts/crotta-runtime-evidence.json";

function serve() {
  return new Promise((resolve) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url, "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (rel.endsWith("/")) rel += "index.html";
      const file = path.normalize(path.join(root, rel));
      if (path.relative(root, file).startsWith("..")) {
        response.writeHead(403);
        response.end();
        return;
      }
      try {
        const body = readFileSync(file);
        const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html; charset=utf-8";
        response.writeHead(200, { "content-type": type });
        response.end(body);
      } catch {
        response.writeHead(404);
        response.end("missing");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe(page, clickExpression) {
  await evaluate(page, clickExpression);
  const started = Date.now();
  let last = null;
  while (Date.now() - started < 20000) {
    last = await evaluate(page, "window.__crottaEvidence || null");
    const status = await evaluate(page, "document.querySelector('.status')?.getAttribute('data-runtime') || ''");
    const errored = last && last.events && last.events.some((item) => item.kind === "chat-error" || item.kind === "voice-error");
    if (errored || status === "error") break;
    if (last && last.replies >= 1 && last.conversationId && status === "connected") {
      if (clickExpression.includes("data-ask") && last.replies >= 2) break;
      if (!clickExpression.includes("data-ask")) break;
    }
    await sleep(500);
  }
  await evaluate(page, "document.getElementById('chat-end')?.click(); document.getElementById('voice-end')?.click();");
  await sleep(500);
  const finalEvidence = await evaluate(page, "window.__crottaEvidence || null");
  const status = await evaluate(page, "document.querySelector('.status')?.textContent || ''");
  return { evidence: finalEvidence, status };
}

const server = await serve();
const port = server.address().port;
const fail = ["*goatcounter.com*", "*zgo.at*"];
const watch = ["goatcounter", "zgo.at"];
const part = process.env.CROTTa_PART || "both";
const report = {
  originSpoofed: false,
  analyticsBlockedBeforeLoad: true,
  chat: part === "voice" ? { skipped: "not repeated; two failed handshakes were already recorded" } : null,
  voice: part === "chat" ? { skipped: "not requested" } : null,
};
async function shot(page, name) {
  const image = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`/opt/cursor/artifacts/${name}.png`, Buffer.from(image.data, "base64"));
}
try {
  if (part !== "voice") {
    await withChrome({
      url: `http://127.0.0.1:${port}/garage-crotta-lugano/chat/?internal=1`,
      fail,
      watch,
    }, async (page, attempted) => {
      if (attempted.some((url) => /goatcounter|zgo\.at/.test(url))) throw new Error("analytics request before chat probe");
      report.chat = await probe(page, "document.querySelector('[data-ask]').click()");
      await shot(page, "crotta-chat-runtime");
    });
  }
  if (part !== "chat") {
    await withChrome({
      url: `http://127.0.0.1:${port}/garage-crotta-lugano/voce/?internal=1`,
      fail,
      watch,
    }, async (page, attempted) => {
      if (attempted.some((url) => /goatcounter|zgo\.at/.test(url))) throw new Error("analytics request before voice probe");
      report.voice = await probe(page, "document.getElementById('voice-start').click()");
      await shot(page, "crotta-voce-runtime");
    });
  }
} finally {
  server.close();
}
mkdirSync(path.dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, JSON.stringify(report, null, 2));
const chatId = report.chat && report.chat.evidence ? report.chat.evidence.conversationId : "";
const voiceId = report.voice && report.voice.evidence ? report.voice.evidence.conversationId : "";
console.log(JSON.stringify({
  chatStatus: report.chat && report.chat.status,
  chatId: chatId || null,
  chatReplies: report.chat && report.chat.evidence ? report.chat.evidence.replies : 0,
  voiceStatus: report.voice && (report.voice.status || report.voice.skipped),
  voiceId: voiceId || null,
}));
