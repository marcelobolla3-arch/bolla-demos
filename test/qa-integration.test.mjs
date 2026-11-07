import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { test } from "node:test";

const root = new URL("..", import.meta.url);
const swiss = ["hotel-ch", "restaurant-ch", "zahnarzt-ch", "coiffeur-ch", "immobilien-ch", "physio-ch", "umzug-ch", "garage-ch", "optiker-ch", "tierarzt-ch"];
const neutral = ["hotel", "restaurant", "dentist", "hair-salon", "real-estate", "physio", "movers", "garage", "optician", "vet"];
const berlin = ["industrie-de", "tourismus-berlin", "charter-de"];

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}
function visible(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
}

test("joint tree keeps old KI pages distinct from the new static scripts", () => {
  for (const slug of swiss) {
    const de = read(`${slug}/de/index.html`);
    const en = read(`${slug}/en/index.html`);
    assert.match(de, /Ein KI-Agent|KI-Agent/);
    assert.doesNotMatch(de, /data-demo="static-example"|Statisches FAQ-Skript/);
    assert.match(en, /data-demo="static-example"/);
    assert.match(en, /scripted example/i);
    assert.match(en, /is not personalization/);
    assert.doesNotMatch(visible(en), /personalized for|personalisiert für/i);
    assert.match(en, /href="\.\.\/de\/"/);
    assert.match(read(`${slug}/index.html`), /location\.replace\("de\/"\+location\.search\)/);
  }
  assert.match(read("tierarzt-ch/it/index.html"), /agente IA|Un agente|agente/);
  assert.doesNotMatch(read("tierarzt-ch/it/index.html"), /data-demo="static-example"/);

  for (const slug of neutral) {
    for (const lang of ["et", "ru", "en"]) {
      const html = read(`${slug}/${lang}/index.html`);
      assert.match(html, new RegExp(`lang="${lang}"`));
      assert.match(html, /data-demo="static-example"/);
      assert.match(html, /liveAI:\s*false/);
      assert.match(html, /isikupärastamine|не персонализация|is not personalization/);
      assert.doesNotMatch(visible(html), /personalized for|personalisiert für|персонализирован для/i);
    }
    assert.match(read(`${slug}/index.html`), /supported=\["et","ru","en"\]/);
  }

  for (const slug of berlin) {
    const de = read(`${slug}/de/index.html`);
    assert.match(de, /Statisches FAQ-Skript · keine freie KI/);
    assert.match(de, /erneut gelesen am 7\. November 2026/);
    assert.match(de, /Beispiel – keine Anfrage gesendet/);
    assert.doesNotMatch(de, /Ein KI-Agent für WhatsApp/);
    assert.match(read(`${slug}/index.html`), /location\.replace\("de\/"\+location\.search\+location\.hash\)/);
  }
  assert.doesNotMatch(visible(read("industrie-de/de/index.html")), /Lagoon/);
  assert.match(visible(read("charter-de/de/index.html")), /Nicht das Bordhandbuch einer Lagoon 42/);
});

test("sector-page.mjs in this tree matches the two pull-request copies", () => {
  const here = execSync("git hash-object scripts/sector-page.mjs", { encoding: "utf8" }).trim();
  const en = execSync("git rev-parse cursor/sector-en-pages-8319:scripts/sector-page.mjs", { encoding: "utf8" }).trim();
  const berlin = execSync("git rev-parse cursor/berlin-de-sectors-8319:scripts/sector-page.mjs", { encoding: "utf8" }).trim();
  assert.equal(here, en);
  assert.equal(here, berlin);
});
