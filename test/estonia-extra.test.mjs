import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("..", import.meta.url);

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
    .replace(/<[^>]+>/g, " ");
}
function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0400-\u04ff]+/g, " ").replace(/\s+/g, " ").trim();
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

const prepared = ["restaurant/et/", "hotel/en/", "dentist/et/", "physio/et/", "restaurant/en/"];

test("new Estonia examples stay generic and keep the six prepared routes unchanged", () => {
  for (const path of prepared) {
    const html = read(path + "index.html");
    assert.match(html, /data-demo="static-example"/);
    assert.doesNotMatch(html, /Näidisbarber|Example Barber|Näidispurje|Example Sailing|Näidissadam|marina-pirita/);
  }
  const shared = read("restaurant/en/index.html");
  assert.match(shared, /is not personalization/);
});

test("the men’s barber is not the hair salon and the charter is not the Berlin page", () => {
  const et = read("barber/et/index.html");
  const en = read("barber/en/index.html");
  assert.match(et, /meestejuuksur/);
  assert.match(et, /Habe/);
  assert.match(et, /Raseerimine/);
  assert.match(packOf(et).chat[0][1], /^Tere/);
  assert.doesNotMatch(visible(et), /Näidisjuuksur|Balayage/);
  assert.match(en, /men’s barber|men&#39;s barber|Example Barber/);
  assert.match(en, /does not place a call/);
  assert.doesNotMatch(visible(et) + visible(en), /wa\.me|api\.whatsapp|tel:/);
  const charterEt = read("charter/et/index.html");
  const charterEn = read("charter/en/index.html");
  assert.match(charterEt, /Tallinn/);
  assert.match(charterEt, /ei garanteeri/);
  assert.match(charterEn, /does not guarantee the weather or a departure time/);
  assert.doesNotMatch(charterEn, /clock time/);
  assert.match(charterEn, /not the page \/charter-de\//);
  assert.doesNotMatch(charterEt + charterEn, /Lagoon|Berlin|kst-berlin|Unterwelten/);
  assert.doesNotMatch(visible(charterEt) + visible(charterEn), /lifejacket drill|ohutusjuhend on järgmine|departure is at/);
});

test("the Pirita page is a generic marina example, not a hotel and not a company record", () => {
  const html = read("marina-pirita/et/index.html");
  const text = visible(html);
  assert.match(html, /jahisadam/);
  assert.match(html, /ei ole hotell/i);
  assert.match(html, /ametlik leht/);
  assert.match(packOf(html).chat[0][1], /^Tere/);
  assert.doesNotMatch(html, /hreflang="ru"|hreflang="en"/);
  assert.doesNotMatch(text, /€|EUR|CHF|\d+ kohta|\d+ berth|Pirita Marina OÜ|hotel\/et/);
  const pack = packOf(html);
  assert.match(answerFor(pack, "Kas see on hotell?"), /Ei/);
  assert.match(answerFor(pack, "elekter ja dušš"), /ei anna numbreid|ei ütle, kas/);
});

test("prepared replies stay in one language and the note is not sent", () => {
  const samples = [
    ["barber/et/index.html", "Kas teete habet?", "habe", "et"],
    ["barber/en/index.html", "Do you do beards?", "beard", "en"],
    ["charter/et/index.html", "Kas on purjekursust?", "kursus", "et"],
    ["charter/en/index.html", "Is there a sailing course?", "course", "en"],
    ["marina-pirita/et/index.html", "Kas külaliskohta saab küsida?", "külalis", "et"],
  ];
  for (const [path, question, expect, lang] of samples) {
    const html = read(path);
    const pack = packOf(html);
    const answer = answerFor(pack, question);
    assert.match(norm(answer), new RegExp(norm(expect)));
    assert.equal(pack.lang, lang);
    assert.match(html, /data-demo="static-example"/);
    assert.match(html, /Marcelo Bolla/);
    assert.match(html, /isikupärastamine|is not personalization/);
    assert.match(html, /Heli ei mängita|does not play audio/);
    assert.doesNotMatch(html, /bsTrack\([^)]*input\.value|bsTrack\([^)]*\$\('#nm'\)/);
  }
});

test("visits and use follow the campaign label, and entries do not count twice", () => {
  for (const path of ["barber/et/index.html", "barber/en/index.html", "charter/et/index.html", "charter/en/index.html"]) {
    const html = read(path);
    assert.match(html, /skipgc/);
    assert.match(html, /no_onload:true/);
    assert.equal((html.match(/path:BASE\+'\/'/g) || []).length, 1);
    assert.match(html, /var ep=BASE\+sub\+\(tag\?'\?p='\+tag:''\)/);
    assert.match(html, /title:title\|\|sub,event:true/);
    assert.match(html, /bsTrack\("\/chat\/" \+ r\.id, "example"\)/);
    assert.doesNotMatch(html, /data-keep-query/);
  }
  {
    const html = read("marina-pirita/et/index.html");
    assert.match(html, /skipgc/);
    assert.match(html, /data-keep-query/);
  }
  for (const path of ["barber/index.html", "charter/index.html", "marina-pirita/index.html"]) {
    const html = read(path);
    assert.match(html, /location\.search|q\.toString\(\)/);
    assert.doesNotMatch(html, /gc\.zgo\.at\/count\.js|bollastudio\.goatcounter\.com\/count/);
  }
  assert.match(read("barber/index.html"), /return "et"/);
  assert.match(read("marina-pirita/index.html"), /\["et"\]/);
});
