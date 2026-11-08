import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluate, withChrome } from "./browser.mjs";
import { VOICE_LISTEN_MS, voiceExchangeDone, wavCoversListenWindow } from "./voice-fixture.mjs";

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

function summarize(ev, started) {
  const users = (ev && ev.userTranscripts) || [];
  const agents = (ev && ev.assistantReplies) || [];
  const events = ((ev && ev.events) || []).map((item) => ({ kind: item.kind, path: item.path, title: item.title }));
  return {
    conversationId: (ev && ev.conversationId) || "",
    userTranscripts: users,
    assistantReplies: agents,
    audioChunks: (ev && ev.audioChunks) || 0,
    audioBytes: (ev && ev.audioBytes) || 0,
    audioPeak: (ev && ev.audioPeak) || 0,
    metricEvents: events,
    durationMs: Date.now() - started,
  };
}

async function probe(page, clickExpression, stop, maxMs) {
  const origin = await evaluate(page, "location.origin");
  const started = Date.now();
  await evaluate(page, clickExpression);
  let last = null;
  while (Date.now() - started < maxMs) {
    last = await evaluate(page, "({conversationId: window.__crottaEvidence && window.__crottaEvidence.conversationId, userTranscripts: (window.__crottaEvidence && window.__crottaEvidence.userTranscripts) || [], assistantReplies: (window.__crottaEvidence && window.__crottaEvidence.assistantReplies) || [], audioChunks: window.__crottaEvidence && window.__crottaEvidence.audioChunks, audioBytes: window.__crottaEvidence && window.__crottaEvidence.audioBytes, audioPeak: window.__crottaEvidence && window.__crottaEvidence.audioPeak, events: (window.__crottaEvidence && window.__crottaEvidence.events) || []})");
    const status = await evaluate(page, "document.querySelector('.status')?.getAttribute('data-runtime') || ''");
    const errored = last && last.events && last.events.some((item) => item.kind === "chat-error" || item.kind === "voice-error");
    if (errored || status === "error") break;
    if (stop(last)) break;
    await sleep(400);
  }
  await evaluate(page, "document.getElementById('chat-end')?.click(); document.getElementById('voice-end')?.click();");
  await sleep(600);
  const finalEvidence = await evaluate(page, "window.__crottaEvidence || null");
  const status = await evaluate(page, "document.querySelector('.status')?.textContent || ''");
  return { origin, status, ...summarize(finalEvidence, started) };
}

const server = await serve();
const port = server.address().port;
const fail = ["*goatcounter.com*", "*zgo.at*"];
const watch = ["goatcounter", "zgo.at"];
const part = process.env.CROTTa_PART || "both";
const wav = process.env.CROTTa_WAV || "";
const report = {
  originSpoofed: false,
  analyticsBlockedBeforeLoad: true,
  allowlistVersion: "agtvrsn_8901m6wx51bten59rk9q48wbzvsj",
  chat: null,
  voice: null,
};
async function shot(page, name) {
  const image = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`/opt/cursor/artifacts/${name}.png`, Buffer.from(image.data, "base64"));
}
const lang = process.env.CROTTa_LANG || "it";
const HEARD = {
  it: { hours: /orari/i, brands: /march/i },
  de: { hours: /öffnungs|offnungs|zeiten/i, brands: /marken/i },
  en: { hours: /opening|hours/i, brands: /brand/i },
  fr: { hours: /horaire/i, brands: /marque/i },
};
const HOURS = /07:30|7:30|13:30|montag|monday|lundi|samstag|saturday|samedi|sonntag|sunday|dimanche|domenica/i;
const BRANDS = /vespa|guzzi|aprilia|piaggio/i;

function chatReady(ev) {
  const users = (ev && ev.userTranscripts) || [];
  const agents = (ev && ev.assistantReplies) || [];
  return users.some((text) => HEARD[lang].hours.test(text)) && agents.some((text) => HOURS.test(text));
}

const expectMonday = process.env.CROTTa_VOICE_EXPECT === "monday";

function voiceReady(ev) {
  const users = (ev && ev.userTranscripts) || [];
  const agents = (ev && ev.assistantReplies) || [];
  const audio = (ev && ev.audioBytes) > 800 && (ev && ev.audioPeak) > 80;
  if (expectMonday) {
    const heard = users.some((text) => /monday|open|time/i.test(text));
    const answered = agents.some((text) => /monday|07:30|7:30|13:30/i.test(text));
    return heard && answered && audio;
  }
  const heard = users.some((text) => HEARD[lang].brands.test(text));
  const answered = agents.some((text) => BRANDS.test(text));
  return heard && answered && audio;
}

function voiceStop(ev) {
  return voiceExchangeDone(ev) || voiceReady(ev);
}

function wavDurationSeconds(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Number(String(out).trim());
}

async function chooseLanguage(page) {
  const selected = await evaluate(page, `window.CrottaRuntime.setLanguage(${JSON.stringify(lang)}) && window.__crottaLanguage`);
  return selected;
}

try {
  if (part !== "voice") {
    try {
    await withChrome({
      url: `http://127.0.0.1:${port}/garage-crotta-lugano/chat/?internal=1`,
      fail,
      watch,
    }, async (page, attempted) => {
      report.language = await chooseLanguage(page);
      report.chat = await probe(page, "document.querySelector('[data-ask]').click()", chatReady, 20000);
      report.chat.analyticsAttempts = attempted.filter((url) => /goatcounter|zgo\.at/.test(url));
      report.chat.twoWay = chatReady(report.chat);
      await shot(page, "crotta-chat-runtime");
    });
    } catch (error) {
      report.chat = { error: String(error && error.message || error), repeated: false };
    }
  }
  if (part !== "chat") {
    try {
    let wavOk = true;
    if (wav) {
      const seconds = wavDurationSeconds(wav);
      report.wavSeconds = seconds;
      if (!wavCoversListenWindow(seconds)) {
        wavOk = false;
        report.voice = { skipped: "synthetic clip is shorter than the listen window, so Chromium would repeat it; voice session was not started", wavSeconds: seconds };
      }
    }
    if (wavOk) await withChrome({
      url: `http://127.0.0.1:${port}/garage-crotta-lugano/voce/?internal=1`,
      fail,
      watch,
      args: wav ? [`--use-file-for-fake-audio-capture=${wav}`] : [],
    }, async (page, attempted) => {
      report.language = await chooseLanguage(page);
      const mic = await evaluate(page, `new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia({audio:true}).then((stream) => {
          const ctx = new AudioContext();
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          src.connect(analyser);
          const data = new Uint8Array(analyser.fftSize);
          let peak = 0;
          const timer = setInterval(() => {
            analyser.getByteTimeDomainData(data);
            for (const value of data) peak = Math.max(peak, Math.abs(value - 128));
          }, 100);
          setTimeout(() => { clearInterval(timer); stream.getTracks().forEach((track) => track.stop()); resolve({peak}); }, 2500);
        }).catch((error) => resolve({error: String(error)}));
      })`);
      report.voiceMic = mic;
      if (!mic || mic.error || !mic.peak || mic.peak < 2) {
        report.voice = { skipped: "fake microphone produced no audible samples; voice session was not started", mic };
        return;
      }
      report.voice = await probe(page, "document.getElementById('voice-start').click()", voiceStop, VOICE_LISTEN_MS);
      report.voice.analyticsAttempts = attempted.filter((url) => /goatcounter|zgo\.at/.test(url));
      report.voice.twoWay = voiceReady(report.voice);
      report.voice.userTurns = (report.voice.userTranscripts || []).length;
      report.voice.greetingOnly = !report.voice.twoWay && ((report.voice.assistantReplies || []).length > 0) && (report.voice.userTurns === 0);
      await shot(page, "crotta-voce-runtime");
    });
    } catch (error) {
      report.voice = { error: String(error && error.message || error), repeated: false };
    }
  }
} finally {
  server.close();
}
mkdirSync(path.dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  chatId: report.chat && report.chat.conversationId || null,
  chatTwoWay: report.chat && report.chat.twoWay || false,
  chatMetrics: report.chat && report.chat.metricEvents || [],
  voiceId: report.voice && report.voice.conversationId || null,
  voiceTwoWay: report.voice && report.voice.twoWay || false,
  voiceSkipped: report.voice && report.voice.skipped || null,
  voiceMetrics: report.voice && report.voice.metricEvents || [],
  analyticsChat: report.chat && report.chat.analyticsAttempts || [],
  analyticsVoice: report.voice && report.voice.analyticsAttempts || [],
}));
