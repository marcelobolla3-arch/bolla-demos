import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const repo = new URL("..", import.meta.url);
const dir = new URL("concesionarios/", repo);

const banned = /Medina|Tigre|San Fernando|Canestrari|\+54|Argentin|video\.mp4|Schweiz|\+41|Italia|Olbia|Tallinn/;

function walk(path, out = []) {
  for (const name of readdirSync(path)) {
    const next = join(path, name);
    if (statSync(next).isDirectory()) walk(next, out);
    else out.push(next);
  }
  return out;
}

function read(rel) {
  return readFileSync(new URL(rel, repo), "utf8");
}

test("concesionarios files do not keep the nautical video or the banned place names", () => {
  const files = walk(dir.pathname);
  assert.ok(files.some((path) => path.endsWith("concesionarios/es/index.html")));
  assert.equal(files.filter((path) => path.endsWith("video.mp4")).length, 0);
  for (const path of files) {
    assert.doesNotMatch(readFileSync(path, "utf8"), banned, path);
  }
  for (const lang of ["es", "de", "en", "it"]) {
    const html = read(`concesionarios/${lang}/index.html`);
    assert.doesNotMatch(html, /<video\b|poster=|\.vtt|subtitle|webvtt/i);
    assert.doesNotMatch(html, /\$/);
    assert.match(html, /Ejemplo ilustrativo|anschauliches Beispiel|illustrative example|Esempio illustrativo/);
    assert.match(html, /skipgc/);
    assert.match(html, /internal=\(\[01\]\)/);
    assert.match(html, /m\[1\]==="1"/);
    assert.match(html, new RegExp(`var page=s\\?"/"\\+s\\+"/video-${lang}":"/video-${lang}"`));
    assert.match(html, /data-keep-query/);
    assert.match(html, /a\.href=u\.pathname\+location\.search\+location\.hash/);
    assert.match(html, /https:\/\/bollastudio\.goatcounter\.com\/count/);
  }
  const entry = read("concesionarios/index.html");
  assert.match(entry, /location\.search/);
  assert.doesNotMatch(entry, /gc\.zgo\.at\/count\.js/);
  for (const lang of ["en", "de"]) {
    const html = read(`concesionarios/${lang}/index.html`);
    assert.match(html, /bolla-p-redirect/);
    assert.match(html, /q\.get\('p'\)/);
    assert.match(html, /&internal=1/);
    assert.match(html, /"aktiv-hotel-spa-hannigalp":"\/hotel-ch\/de\/\?p=aktiv-hotel-spa-hannigalp"/);
  }
  for (const lang of ["es", "it"]) {
    assert.doesNotMatch(read(`concesionarios/${lang}/index.html`), /bolla-p-redirect/);
  }
});
