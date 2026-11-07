import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = new URL("..", import.meta.url);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (name === "index.html") out.push(path);
  }
  return out;
}

function read(path) {
  return readFileSync(path, "utf8");
}

const files = walk(new URL(".", root).pathname).filter((path) => !path.includes("/node_modules/"));
const swiss = ["hotel-ch", "restaurant-ch", "zahnarzt-ch", "coiffeur-ch", "immobilien-ch", "physio-ch", "umzug-ch", "garage-ch", "optiker-ch", "tierarzt-ch"];
const neutral = ["hotel", "restaurant", "dentist", "hair-salon", "real-estate", "physio", "movers", "garage", "optician", "vet"];
const berlin = ["industrie-de", "tourismus-berlin", "charter-de"];
const auditedContent = new Set([
  ...swiss.flatMap((slug) => [`${slug}/de/index.html`, `${slug}/fr/index.html`, `${slug}/en/index.html`]),
  "tierarzt-ch/it/index.html",
  ...neutral.flatMap((slug) => [`${slug}/et/index.html`, `${slug}/ru/index.html`, `${slug}/en/index.html`]),
  ...berlin.flatMap((slug) => [`${slug}/de/index.html`, `${slug}/en/index.html`]),
  ...["es", "en", "it", "de", "fr"].map((lang) => `video/comunidad-argentina/${lang}/index.html`),
  ...["en", "de", "es", "it"].map((lang) => `concesionarios/${lang}/index.html`),
  "voz/schloss-wuelflingen/index.html",
  "voz/ambarra/index.html",
  "voz/lagoon42/index.html",
  "nautica/index.html",
  "nautica-cat/index.html",
  "ambarra/index.html",
  "coral-yachting/index.html",
]);

test("every demo page counts one visit and can record use, and redirects do not count twice", () => {
  const allow = new Set([new URL("index.html", root).pathname]);
  const missing = [];
  for (const path of files) {
    const html = read(path);
    const redirect = /location\.replace\(/.test(html) && !html.includes("bollastudio.goatcounter.com/count");
    if (allow.has(path)) {
      assert.doesNotMatch(html, /bollastudio\.goatcounter\.com\/count/);
      continue;
    }
    if (redirect) {
      assert.match(html, /location\.search/, path);
      assert.doesNotMatch(html, /gc\.zgo\.at\/count\.js/, path);
      continue;
    }
    if (!html.includes("bollastudio.goatcounter.com/count")) missing.push(path);
    const rel = path.slice(new URL(".", root).pathname.length);
    if (auditedContent.has(rel) && !html.includes("skipgc")) missing.push(path);
  }
  assert.equal(auditedContent.size, 83);
  assert.deepEqual(missing, []);
  const present = new Set(files.map((path) => path.slice(new URL(".", root).pathname.length)));
  assert.deepEqual([...auditedContent].filter((rel) => !present.has(rel)), []);
});

test("campaign usage is attached to the event and the question text is not the title", () => {
  const restaurant = read(new URL("restaurant/en/index.html", root));
  assert.match(restaurant, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
  assert.match(restaurant, /title:title\|\|sub,event:true/);
  assert.doesNotMatch(restaurant, /bsTrack\([^)]*input\.value/);
  assert.equal((restaurant.match(/path:BASE\+'\/'/g) || []).length, 1);
  assert.match(restaurant, /bsTrack\("\/chat\/" \+ r\.id, "example"\)/);
  const video = read(new URL("video/comunidad-argentina/es/index.html", root));
  assert.match(video, /bsTrack\('\/play','video-play'\)/);
  assert.match(video, /if\(played/);
  assert.doesNotMatch(video, /count\(\{[^}]*reel\.mp4/);
  assert.match(video, /data-keep-query/);
  const legacy = read(new URL("hotel-ch/de/index.html", root));
  assert.match(legacy, /Ein KI-Agent für WhatsApp/);
  assert.match(legacy, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
  const lagoon = read(new URL("voz/lagoon42/index.html", root));
  assert.match(lagoon, /agent-id="agent_PENDIENTE"/);
  assert.match(lagoon, /skipgc/);
  assert.match(lagoon, /if\(internal\) return/);
  const ambarraVoice = read(new URL("voz/ambarra/index.html", root));
  assert.match(ambarraVoice, /var ep=sub\+\(tag && sub\.indexOf\("\?p="\)<0 \? "\?p="\+tag : ""\)/);
  const schloss = read(new URL("voz/schloss-wuelflingen/index.html", root));
  assert.match(schloss, /schloss-wuelflingen\/voice'\+\(campaign\?'\?p='\+campaign:''\)/);
});

test("a synthetic counter payload is labeled and this test does not send it", () => {
  const payload = {
    p: "/bolla-metrics-audit/synthetic",
    t: "qa-synthetic",
    e: false,
  };
  assert.match(payload.p, /^\/bolla-metrics-audit\//);
  assert.equal(payload.t, "qa-synthetic");
  assert.equal(payload.e, false);
  assert.equal(process.env.METRICS_SYNTHETIC, undefined);
});
