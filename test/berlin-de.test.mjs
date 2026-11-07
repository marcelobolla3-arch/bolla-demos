import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("..", import.meta.url);
const slugs = ["industrie-de", "tourismus-berlin", "charter-de"];

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}
function packOf(html) {
  const match = html.match(/<script type="application\/json" id="demo-pack">([\s\S]*?)<\/script>/);
  assert.ok(match, "demo-pack missing");
  return JSON.parse(match[1]);
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

const cases = [
  { id: "I1", slug: "industrie-de", kind: "derived", q: "Fertigen Sie Bauteile nach unseren Zeichnungen?", must: ["kst-berlin.de/fertigung", "7. November 2026", "Fachteam prüfen", "nicht KST"], mustNot: ["jonas-redmann", "Wir fertigen"] },
  { id: "I2", slug: "industrie-de", kind: "derived", q: "Bieten Sie auch zerstörungsfreie Werkstoffprüfungen an?", must: ["kst-berlin.de/fertigung", "zerstörungsfreie", "Fachteam", "kein Zertifikat"], mustNot: ["jonas-redmann", "Zertifikat Nr"] },
  { id: "I3", slug: "industrie-de", kind: "derived", q: "Gibt es einen Service für Ersatz- und Verschleißteile?", must: ["jonas-redmann.com", "7. November 2026", "Service prüfen"], mustNot: ["kst-berlin.de/fertigung", "auf Lager"] },
  { id: "T1", slug: "tourismus-berlin", kind: "faq", q: "Können wir Route und Themen selbst bestimmen?", must: ["berlinonbike.de", "7. November 2026", "noch nicht vor"], mustNot: ["berliner-unterwelten.de", "Guide ist bestätigt"] },
  { id: "T2", slug: "tourismus-berlin", kind: "faq", q: "Wie lange dauert eine private Fahrradtour durch Berlin?", must: ["berlinonbike.de", "3,5 Stunden"], mustNot: ["verbindlich gebucht", "€"] },
  { id: "T3", slug: "tourismus-berlin", kind: "derived", q: "Ist mein angefragter Termin für die Gruppenführung schon verbindlich?", must: ["berliner-unterwelten.de", "nicht verbindlich", "Angebot"], mustNot: ["3,5 Stunden", "Guide ist bestätigt"] },
  { id: "N1", slug: "charter-de", kind: "faq", q: "Wie kann ich ein Angebot anfordern?", must: ["solarwaterworld.de/charter/faqs", "keinen Preis", "Reederei Riedel"], mustNot: ["Getränke", "Lagoon", "€"] },
  { id: "N2", slug: "charter-de", kind: "faq", q: "Darf ich eigene Getränke mitbringen?", must: ["solarwaterworld.de", "abgesprochen", "Reederei Riedel"], mustNot: ["reederei-riedel.de/faqs", "€", "Aufpreis von"] },
  { id: "N3", slug: "charter-de", kind: "faq", q: "Wie kann ich Tickets buchen?", must: ["reederei-riedel.de/faqs", "verkauft keine Tickets", "Solarwaterworld"], mustNot: ["Getränke", "Platz ist frei", "Lagoon"] },
  { id: "N4", slug: "charter-de", kind: "faq", q: "In welchen Sprachen wird moderiert?", must: ["reederei-riedel.de/faqs", "Deutsch und Englisch", "nicht die Sprachfähigkeit"], mustNot: ["solarwaterworld", "wir sprechen auch"] },
];

test("ten sourced German cases stay static and keep operators apart", () => {
  const packs = Object.fromEntries(slugs.map((slug) => [slug, packOf(read(`${slug}/de/index.html`))]));
  const counts = { derived: 0, faq: 0 };
  for (const item of cases) {
    counts[item.kind] += 1;
    const text = answerFor(packs[item.slug], item.q);
    assert.notEqual(text, packs[item.slug].fallback, item.id + " fell through");
    if (item.kind === "faq") assert.match(text, /Veröffentlichte FAQ/);
    if (item.kind === "derived") assert.match(text, /Abgeleitetes Beispiel, keine veröffentlichte FAQ-Frage/);
    assert.match(text, /Das muss das Team prüfen/);
    assert.match(text, /erneut gelesen am 7\. November 2026/);
    assert.match(text, /Beispiel – keine Anfrage gesendet|sendet keine Anfrage|sendet nichts|verkauft keine Tickets/);
    for (const needle of item.must) assert.match(text, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), item.id + " missing " + needle);
    for (const needle of item.mustNot) assert.doesNotMatch(text, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), item.id + " unexpected " + needle);
  }
  assert.equal(counts.faq, 6);
  assert.equal(counts.derived, 4);

  const industry = packs["industrie-de"];
  const fit = answerFor(industry, "Ist das Teil lieferbar und kompatibel?");
  assert.match(fit, /Das muss das Team prüfen/);
  assert.match(fit, /weder Kompatibilität noch Lagerbestand|weder Kompatibilität/);
  assert.doesNotMatch(fit, /ist lieferbar|ist kompatibel|auf Lager: ja/i);
  const tolerance = answerFor(industry, "Können Sie die Toleranz 0,01 mm freigeben?");
  assert.match(tolerance, /keine Toleranz/);
  assert.match(tolerance, /keine Maschinenanweisung/);

  const tours = packs["tourismus-berlin"];
  assert.match(answerFor(tours, "Ist der Guide am Samstag um 10 Uhr bestätigt?"), /keine Bestätigung/);
  assert.doesNotMatch(answerFor(tours, "Ist der Guide am Samstag um 10 Uhr bestätigt?"), /ist bestätigt/);

  const charter = packs["charter-de"];
  assert.match(answerFor(charter, "Was kostet die Fahrt am Samstag?"), /nennt keinen Preis/);
  assert.match(answerFor(charter, "Ist noch ein Platz frei?"), /bestätigt keinen Platz/);
  assert.doesNotMatch(answerFor(charter, "Was kostet die Fahrt am Samstag?"), /€|Euro \d/);
});

test("German pages are the primary static demos and English is only a second view", () => {
  for (const slug of slugs) {
    const de = read(`${slug}/de/index.html`);
    const en = read(`${slug}/en/index.html`);
    const index = read(`${slug}/index.html`);
    assert.match(de, /lang="de"/);
    assert.match(de, /data-demo="static-example"/);
    assert.match(de, /Statisches FAQ-Skript/);
    assert.match(de, /keine freie KI/);
    assert.match(de, /Marcelo Bolla/);
    assert.match(de, /https:\/\/bollastudio\.com/);
    assert.match(de, /<ol class="steps">/);
    assert.match(de, /min-height:48px/);
    assert.match(de, /Beispiel – keine Anfrage gesendet/);
    assert.match(de, /keine Personalisierung/);
    assert.doesNotMatch(de, /\bfetch\s*\(|elevenlabs|wa\.me|agent_/i);
    assert.match(en, /Static FAQ script/);
    assert.match(en, /not free-form AI/);
    assert.match(index, /location\.replace\("de\/"\+location\.search\+location\.hash\)/);
    assert.match(index, /href="de\/">Deutsch/);
    assert.match(index, /href="en\/">English/);
    const client = de.split('id="sector-demo">')[1].split("</script>")[0];
    new Function(client);
    assert.match(client, /liveAI:\s*false/);
    assert.doesNotMatch(client, /getElementById\("nm"\)|getElementById\("ph"\)/);
  }
  const visible = (html) => html.replace(/<!--[\s\S]*?-->/g, "");
  assert.doesNotMatch(visible(read("industrie-de/de/index.html")), /Lagoon|lagoon42/);
  assert.doesNotMatch(visible(read("tourismus-berlin/de/index.html")), /Lagoon|lagoon42|Solarwaterworld|Reederei Riedel/);
  const charter = read("charter-de/de/index.html");
  assert.match(charter, /Nicht das Bordhandbuch einer Lagoon 42/);
  assert.doesNotMatch(charter, /voz\/lagoon42|agent_PENDIENTE|12 V|Gasflaschen/);
  assert.match(read("nautica/index.html"), /LANGS=\["it","en","es"\]/);
  assert.match(read("voz/lagoon42/index.html"), /agent_PENDIENTE/);
});

test("old Swiss routes still say KI and the new Berlin script does not inherit that claim", () => {
  const oldDe = read("hotel-ch/de/index.html");
  const oldFr = read("hotel-ch/fr/index.html");
  assert.match(oldDe, /Ein KI-Agent für WhatsApp/);
  assert.doesNotMatch(oldDe, /Statisches FAQ-Skript|erneut gelesen am 7\. November 2026/);
  assert.match(oldFr, /Un agent IA sur WhatsApp/);
  const neu = read("industrie-de/de/index.html");
  assert.match(neu, /Statisches FAQ-Skript · keine freie KI/);
  assert.match(neu, /erneut gelesen am 7\. November 2026/);
  assert.doesNotMatch(neu, /Ein KI-Agent für WhatsApp/);
});
