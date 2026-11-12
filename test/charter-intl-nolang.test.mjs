import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const langs = ["en", "es", "fr", "it", "de"];

function read(lang) {
  return readFileSync(new URL(`../charter-intl/${lang}/index.html`, import.meta.url), "utf8");
}

for (const lang of langs) {
  test(`charter-intl/${lang} does not link to another language`, () => {
    const html = read(lang);
    assert.doesNotMatch(html, /data-keep-query/);
    assert.doesNotMatch(html, /<nav class="langs"/);
    assert.doesNotMatch(html, /id="bolla-lang-links"/);
    for (const other of langs) {
      if (other === lang) continue;
      assert.doesNotMatch(html, new RegExp(`(?:href="\\.\\./|/charter-intl/)${other}/`), other);
    }
    assert.match(html, new RegExp(`/bolla-demo-charter-intl/${lang}`));
    assert.match(html, /\[\?&\]p=/);
    assert.match(html, /skipgc/);
  });
}
