import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const langs = ["fr", "de", "en", "es", "it"];

function read(lang) {
  return readFileSync(new URL(`../concesionarios/${lang}/index.html`, import.meta.url), "utf8");
}

for (const lang of langs) {
  test(`concesionarios/${lang} does not link to another language`, () => {
    const html = read(lang);
    assert.doesNotMatch(html, /data-keep-query/);
    assert.doesNotMatch(html, /<nav class="langs"/);
    assert.doesNotMatch(html, /id="bolla-lang-links"/);
    for (const other of langs) {
      if (other === lang) continue;
      assert.doesNotMatch(html, new RegExp(`(?:href="\\.\\./|/concesionarios/)${other}/`), other);
    }
    assert.match(html, new RegExp(`__concPath\\(raw,"video-${lang}"\\)`));
    assert.match(html, /\[\?&\]p=/);
    assert.match(html, /https:\/\/bollastudio\.goatcounter\.com\/count/);
  });
}
