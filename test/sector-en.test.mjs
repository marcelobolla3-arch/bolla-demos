import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("..", import.meta.url);
const slugs = [
  "hotel-ch",
  "restaurant-ch",
  "zahnarzt-ch",
  "coiffeur-ch",
  "immobilien-ch",
  "physio-ch",
  "umzug-ch",
  "garage-ch",
  "optiker-ch",
  "tierarzt-ch",
];

const deMarker = {
  "hotel-ch": "Ihre Rezeption, auch um 23 Uhr und auf Französisch",
  "restaurant-ch": "Ihre Tischreservationen, auch mitten im Service",
  "zahnarzt-ch": "Terminanfragen aufgenommen, auch wenn das Telefon besetzt ist",
  "coiffeur-ch": "Termine gebucht, während Sie die Schere in der Hand haben",
  "immobilien-ch": "Objektanfragen sortiert, bevor Sie das Postfach öffnen",
  "physio-ch": "Neue Patienten aufgenommen, während Sie behandeln",
  "umzug-ch": "Offertanfragen vollständig, bevor Sie zurückrufen",
  "garage-ch": "Werkstatt-Termine aufgenommen, während Sie unter dem Auto liegen",
  "optiker-ch": "Sehtest-Termine gebucht, während Sie beraten",
  "tierarzt-ch": "Terminanfragen von Tierhaltern aufgenommen",
};

const probes = {
  "hotel-ch": ["Are dogs allowed?", "well-behaved dogs", "What time is check-in?", "3:00 p.m."],
  "restaurant-ch": ["Is there a lunch menu?", "vegetarian", "Is the dish without nuts?", "kitchen"],
  "zahnarzt-ch": ["I have a bad toothache. What should I do?", "cannot diagnose", "Do you see children?", "children are welcome"],
  "coiffeur-ch": ["Do you cut men’s hair?", "men’s", "Can you do a bridal trial?", "Weddings"],
  "immobilien-ch": ["Which documents do I need?", "debt-enforcement", "Can we negotiate the rent?", "does not name a figure"],
  "physio-ch": ["Do I need a referral?", "basic insurance", "Should I use heat or cold for this pain?", "no advice"],
  "umzug-ch": ["Do you have a furniture lift?", "furniture lift", "What does it cost, roughly?", "no figure"],
  "garage-ch": ["Do you prepare cars for the MFK?", "MFK", "My engine warning light is on.", "no diagnosis"],
  "optiker-ch": ["When are you open?", "9:00 a.m.", "I suddenly see flashes in one eye.", "eye doctor"],
  "tierarzt-ch": ["Do you treat rabbits?", "rabbits", "My dog ate something poisonous!", "emergency"],
};

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
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
  if (!n) return pack.empty;
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

test("ten English pages are static examples and ten German pages stay German", () => {
  for (const slug of slugs) {
    const en = read(`${slug}/en/index.html`);
    const de = read(`${slug}/de/index.html`);
    const fr = read(`${slug}/fr/index.html`);
    const rootIndex = read(`${slug}/index.html`);
    assert.match(en, /<html lang="en" translate="no">/);
    assert.match(en, /data-demo="static-example"/);
    assert.match(en, /Switzerland/);
    assert.match(en, /Marcelo Bolla/);
    assert.match(en, /https:\/\/bollastudio\.com/);
    assert.match(en, /mailto:marcelo@bollastudio\.com/);
    assert.match(en, /BOLLA STUDIO/);
    assert.match(en, /scripted example/i);
    assert.match(en, /Nothing was booked and nothing was sent/);
    assert.match(en, /not a live assistant/i);
    assert.match(en, /does not play audio/);
    assert.match(en, /is not personalization/);
    assert.match(en, /<ol class="steps">/);
    assert.match(en, /min-height:48px/);
    assert.match(en, /aria-label="Language"/);
    assert.match(en, /href="\.\.\/de\/"/);
    assert.match(en, /href="\.\.\/fr\/"/);
    assert.doesNotMatch(en, /personalized for|personalised for|personalisiert/i);
    assert.doesNotMatch(en, /elevenlabs|agent_|openai|wa\.me/i);
    assert.doesNotMatch(en, /Estonia|Eesti|Таллин/i);
    assert.match(de, new RegExp(deMarker[slug].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(de, /href="\.\.\/en\/"/);
    assert.match(de, /Beispiel-Demo/);
    assert.match(fr, /Démo d'exemple/);
    assert.match(fr, /href="\.\.\/en\/"/);
    assert.match(rootIndex, /location\.replace\("de\/"\+location\.search\)/);
    assert.match(rootIndex, /href="en\/">English/);
    const client = en.split('id="sector-demo">')[1].split("</script>")[0];
    new Function(client);
    assert.doesNotMatch(client, /\bfetch\s*\(|WebSocket|XMLHttpRequest|EventSource|elevenlabs|openai/i);
    assert.doesNotMatch(client, /getElementById\("nm"\)|getElementById\("ph"\)/);
    assert.match(client, /liveAI:\s*false/);
    assert.match(client, /mode:\s*"static-example"/);
    const pack = packOf(en);
    assert.equal(pack.lang, "en");
    assert.ok(pack.chat.some((row) => row[0] === "in" && row[1].startsWith("Hello")));
    assert.ok(pack.rules.every((rule) => rule.button && rule.text && !/Grüezi|Bitte |Öffnungszeit/.test(rule.text)));
    const [button, reply, typed, typedReply] = probes[slug];
    assert.match(answerFor(pack, button), new RegExp(reply, "i"));
    assert.match(answerFor(pack, typed), new RegExp(typedReply, "i"));
    const german = answerFor(pack, "Sind Hunde erlaubt? Bitte auf Deutsch");
    assert.doesNotMatch(german, /Grüezi|willkommen|Bitte zuerst|Öffnungszeit/);
    assert.match(german, /example|English|scripted|page/i);
    const text = visible(en)
      .replace(/Hotel Bergsonne|Restaurant Lindenhof|Zahnarztpraxis am Seeweg|Salon Rosmarin|Muster Immobilien|Physio Lindenhof|Zügelteam Bergwind|Garage Talblick|Optik Klarblick|Kleintierpraxis Sonnenhalde|Deutsch|Français|Italiano|Bühler/g, "");
    assert.doesNotMatch(text, /Grüezi|Beispiel-Demo|keine echten Buchungen|Öffnungszeiten|Vormittag|Demo-Anfrage|fiktiver Beispielbetrieb/);
  }
});

test("veterinary English keeps Italian, and prospect redirects still point at German", () => {
  const en = read("tierarzt-ch/en/index.html");
  const it = read("tierarzt-ch/it/index.html");
  assert.match(en, /href="\.\.\/it\/"/);
  assert.match(it, /href="\.\.\/en\/"/);
  assert.match(it, /Demo di esempio/);
  const map = read("concesionarios/en/index.html");
  assert.match(map, /id="bolla-p-redirect"/);
  const dest = JSON.parse(map.match(/var DEST=(\{.*?\});/)[1]);
  assert.equal(dest.fcad07227666865f, "/hotel-ch/de/");
  assert.equal(dest.d26d1440d5da6449, "/immobilien-ch/de/");
});

test("English replies do not call a live model and the fallback stays English", () => {
  const pack = packOf(read("hotel-ch/en/index.html"));
  const unknown = answerFor(pack, "Please book the royal suite and charge my card");
  assert.match(unknown, /scripted example, not a live assistant/);
  assert.match(unknown, /do not book/);
  assert.equal(answerFor(pack, "   "), pack.empty);
  assert.match(answerFor(pack, "Are dogs allowed?"), /well-behaved dogs/);
  assert.doesNotMatch(answerFor(pack, "Are dogs allowed?"), /Hund/);
});
