// Contatori di uso (GoatCounter event:true via bsTrack) delle demo nuove: Serafino, Agliuledda, Tavernetta.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

const DEMOS = {
  "da-serafino-food-cost": {
    files: ["index.html", "app.js"],
    events: ["piatto/' + slug", "ricetta/modifica", "ricetta/impasto", "scrocchiarella/gusti", "magazzino/prezzo", "magazzino/nuovo", "impasto/modifica", "impasto/' + k", "csv/' + name", "cerca", "tab/magazzino", "tab/impasti", "impostazioni", "/da-serafino-food-cost/bolla-tel", "/da-serafino-food-cost/magazzino/fonte"],
  },
  "agliuledda-ovilo": {
    files: ["index.html"],
    events: ["/agliuledda-ovilo/book-request", "/agliuledda-ovilo/book-attempt", "/agliuledda-ovilo/calendar-pick", "/agliuledda-ovilo/hero-", "/agliuledda-ovilo/video-play", "/agliuledda-ovilo/hero-3d-look", "/agliuledda-ovilo/gallery-open", "/agliuledda-ovilo/panel-approve", "/agliuledda-ovilo/panel-decline", "/agliuledda-ovilo/panel-reset", "/agliuledda-ovilo/map-open", "/agliuledda-ovilo/bolla-tel", "/agliuledda-ovilo/cta-book"],
  },
  "la-tavernetta-porto-taverna": {
    files: ["index.html"],
    events: ["/la-tavernetta-porto-taverna/chat/", "/la-tavernetta-porto-taverna/chat-start", "/la-tavernetta-porto-taverna/chat-response", "/la-tavernetta-porto-taverna/request", "/la-tavernetta-porto-taverna/voice-start", "/la-tavernetta-porto-taverna/voice-click", "/la-tavernetta-porto-taverna/cta-whatsapp", "/la-tavernetta-porto-taverna/cta-voice", "/la-tavernetta-porto-taverna/tel-restaurant", "/la-tavernetta-porto-taverna/bolla-tel"],
  },
};

for (const [dir, cfg] of Object.entries(DEMOS)) {
  test(`${dir}: visita + uso con event:true, interno escluso, eventi d'uso presenti`, () => {
    const html = read(`${dir}/index.html`);
    const src = cfg.files.map((f) => read(`${dir}/${f}`)).join("\n");
    assert.match(html, /bollastudio\.goatcounter\.com\/count/);
    assert.match(html, /function bollaStore/);
    assert.match(html, /bmaudit-/);
    assert.match(html, /if\(internal\) return;/);
    assert.match(html, /event:true/);
    assert.match(html, /getAttribute\("data-track"\)/, "delegated data-track listener");
    for (const ev of cfg.events) assert.ok(src.includes(ev), `${dir}: manca evento ${ev}`);
    // mai testo digitato o dati del modulo negli eventi
    assert.doesNotMatch(src, /bsTrack\([^)\n]{0,200}\.value/);
    assert.doesNotMatch(src, /bsTrack\([^)\n]{0,200}\b(nm|ph|em|nt|text|txt)\b\s*[,)]/);
  });
}
