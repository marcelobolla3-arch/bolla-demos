import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const html = readFileSync(new URL("../dentist/en/index.html", import.meta.url), "utf8");

function visible(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav class="langs"[\s\S]*?<\/nav>/g, " ");
}

test("the English dentist page names no country and keeps the language names", () => {
  const shown = visible(html);
  assert.doesNotMatch(shown, /Estonian and Russian examples are separate pages/);
  assert.doesNotMatch(shown, /Estonia|Estonian|Tallinn|Berlin|Deutschland|Germany|Swiss|Schweiz|France|Italia|Spain|España/i);
  assert.doesNotMatch(html, /zahnarzt-ch/);
  assert.match(html, /This page answers in English/);
  assert.match(html, /skipgc/);
  assert.match(html, /bolla_internal/);
  assert.match(html, /bmaudit-/);
  assert.doesNotMatch(html, /data-keep-query/);
  assert.doesNotMatch(html, /<nav class="langs"/);
  assert.match(html, /\/bolla-demo-dentist\/en/);
  assert.doesNotMatch(shown, /\+\d{1,3}\s+\d|€|CHF|\bEUR\b/);
});
