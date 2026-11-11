import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../hotel-intl/en/index.html", import.meta.url), "utf8");

test("the neutral English hotel page names no country and keeps the counter", () => {
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<title>Example chat for a hotel · BOLLA STUDIO<\/title>/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /interno=/);
  assert.match(html, /internal=/);
  assert.match(html, /bmaudit-/);
  assert.match(html, /bollastudio\.goatcounter\.com\/count/);
  assert.match(html, /\/hotel-intl\/en/);
  assert.match(html, /\[\?&\]p=/);
  assert.match(html, /BOLLA STUDIO/);
  assert.match(html, /Marcelo Bolla/);
  assert.match(html, /marcelo@bollastudio\.com/);
  assert.match(html, /scripted example, not a live assistant/);
  assert.doesNotMatch(html, /Eesti|Русский|Estonia|Tallinn|\+372|€/);
});
