import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("..", import.meta.url);
const sectors = [
  ["hotel", "hotel-ch"],
  ["restaurant", "restaurant-ch"],
  ["dentist", "zahnarzt-ch"],
  ["hair-salon", "coiffeur-ch"],
  ["real-estate", "immobilien-ch"],
  ["physio", "physio-ch"],
  ["movers", "umzug-ch"],
  ["garage", "garage-ch"],
  ["optician", "optiker-ch"],
  ["vet", "tierarzt-ch"],
];
const greet = { et: "Tere", ru: "Здравствуйте", en: "Hello" };

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}
function packOf(html) {
  const m = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/);
  assert.ok(m, "demo-pack missing");
  return JSON.parse(m[1]);
}
function visible(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<nav class="langs"[\s\S]*?<\/nav>/g, "")
    .replace(/<[^>]+>/g, " ");
}
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function answerFor(pack, raw) {
  const n = norm(raw);
  let best = null;
  let bestLen = 0;
  for (const rule of pack.rules) {
    for (const key of rule.keys || []) {
      const nk = norm(key);
      if (nk.length < 3) continue;
      if (n.includes(nk) && nk.length > bestLen) {
        best = rule;
        bestLen = nk.length;
      }
    }
  }
  return best ? best.text : pack.fallback;
}

test("neutral et/ru/en pages stay off the Swiss demos and answer in one language", () => {
  assert.equal(existsSync(new URL("ee", root)), false);
  for (const [slug, swiss] of sectors) {
    const buttons = {};
    for (const lang of ["et", "ru", "en"]) {
      const html = read(`${slug}/${lang}/index.html`);
      const text = visible(html);
      assert.match(html, new RegExp(`<html lang="${lang}" translate="no">`));
      assert.match(html, /data-demo="static-example"/);
      assert.match(html, /Marcelo Bolla/);
      assert.match(html, /https:\/\/bollastudio\.com/);
      assert.match(html, /does not play audio|Heli ei mängita|Звук не воспроизводится/);
      assert.match(html, /is not personalization|isikupärastamine|не персонализация/);
      assert.doesNotMatch(html, /personalized for|personalised for|isikupärastatud teile|персонализирован/i);
      assert.match(html, /<ol class="steps">/);
      assert.match(html, /hreflang="et"/);
      assert.match(html, /hreflang="ru"/);
      assert.match(html, /hreflang="en"/);
      assert.doesNotMatch(text, /Switzerland|Swiss|Schweiz|Šveits|Швейцар|CHF|MFK|Krankenkasse|Betreibung|\+41|3\.5-room|3\.5-Zimmer/);
      assert.doesNotMatch(html, /elevenlabs|wa\.me|openai/i);
      assert.doesNotMatch(html, /href="[^"]*\/ee\//);
      const client = html.split('id="sector-demo">')[1].split("</script>")[0];
      new Function(client);
      assert.doesNotMatch(client, /\bfetch\s*\(|WebSocket|XMLHttpRequest|elevenlabs/i);
      assert.match(client, /liveAI:\s*false/);
      const pack = packOf(html);
      assert.equal(pack.lang, lang);
      assert.ok(pack.chat[0][1].startsWith(greet[lang]), slug + " " + lang);
      assert.ok(pack.chat[1][1].startsWith(greet[lang]), slug + " " + lang + " reply");
      const button = pack.rules[0].button;
      const reply = answerFor(pack, button);
      assert.equal(reply, pack.rules[0].text);
      if (lang === "et") assert.doesNotMatch(text, /[\u0400-\u04FF]/);
      if (lang === "ru") assert.match(text, /[\u0400-\u04FF]/);
      if (lang === "en") assert.doesNotMatch(text, /[\u0400-\u04FF]/);
      buttons[lang] = pack.rules.map((rule) => rule.button).join("|");
      const index = read(`${slug}/index.html`);
      if (slug === "hotel") assert.match(index, /supported=\["et","ru","en","es"\]/);
      else if (slug === "dentist") assert.match(index, /supported=\["et","ru","en","de"\]/);
      else assert.match(index, /supported=\["et","ru","en"\]/);
      assert.match(index, new RegExp(`Not the Swiss demo at /${swiss}/`));
      assert.doesNotMatch(index, /\/ee\//);
    }
    assert.notEqual(buttons.et, buttons.ru);
    assert.notEqual(buttons.en, buttons.et);
    const swissEn = read(`${swiss}/en/index.html`);
    assert.match(swissEn, /Switzerland/);
    assert.doesNotMatch(swissEn, new RegExp(`href="[^"]*/${slug}/`));
  }
  const hotelEt = visible(read("hotel/et/index.html"));
  const hotelRu = visible(read("hotel/ru/index.html"));
  const hotelEn = visible(read("hotel/en/index.html"));
  assert.match(hotelEt, /ei ole turismibüroo/);
  assert.match(hotelEt, /ega jaht/);
  assert.match(hotelRu, /не яхта/);
  assert.match(hotelEn, /yacht charter/);
  assert.match(visible(read("restaurant/en/index.html")), /yacht charter/);
  const map = read("concesionarios/en/index.html");
  assert.match(map, /"aktiv-hotel-spa-hannigalp":"\/hotel-ch\/de\/\?p=aktiv-hotel-spa-hannigalp"/);
});
