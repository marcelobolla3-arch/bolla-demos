import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const voice = readFileSync(new URL("../../voz/ambarra/index.html", import.meta.url), "utf8");
const schloss = readFileSync(new URL("../../voz/schloss-wuelflingen/index.html", import.meta.url), "utf8");

test("the main script parses", () => {
  const parts = page.split("<script>");
  const main = parts[parts.length - 1].replace(/<\/script>[\s\S]*$/, "");
  new Function(main);
});

test("the voice script parses and loads only Ambàra's agent", () => {
  const parts = voice.split("<script>");
  const main = parts[parts.length - 1].replace(/<\/script>[\s\S]*$/, "");
  new Function(main);
  assert.match(voice, /var AGENT_ID = "agent_6201m6q47bszfaz93zk0zaxrvbdb";/);
  assert.doesNotMatch(voice, /agent-id="agent_/);
  assert.match(voice, /FORBIDDEN_AGENT/);
  assert.match(voice, /agent_3101m5z30nvbf06rvwp6def0k85b/);
  assert.equal((voice.match(/agent_6201m6q47bszfaz93zk0zaxrvbdb/g) || []).length, 1);
});

test("Instagram and Plateform are named, and the API stays unverified", () => {
  assert.match(page, /https:\/\/www\.instagram\.com\/ambarasardinianlounge\//);
  assert.match(page, /@ambarasardinianlounge/);
  assert.match(page, /https:\/\/ambarasardinianlounge\.plateform\.app\/r\/ambarainstagram/);
  assert.match(page, /API non è verificata/);
  assert.match(page, /API is not verified/);
  assert.match(page, /non è sul network/);
  assert.match(page, /not on the booking network/);
  assert.doesNotMatch(page, /none was verified|non risulta verificato su queste pagine|Booking software is not named/);
  assert.doesNotMatch(page, /wa\.me/);
  assert.doesNotMatch(page, /tel:\+393401991233/);
  assert.doesNotMatch(page, /href="tel:[^"]*340/);
});

test("studio credit is visible and the restaurant phone is not a link", () => {
  for (const html of [page, voice]) {
    assert.match(html, /href="tel:\+393445240254"/);
    assert.match(html, /Marcelo Bolla/);
    assert.match(html, /https:\/\/bollastudio\.com/);
    assert.match(html, /Non è il sito ufficiale di Ambàra/);
    assert.match(html, /\+39 340 199 1233/);
    assert.doesNotMatch(html, /wa\.me/);
    assert.doesNotMatch(html, /tel:\+393401991233/);
  }
  assert.match(page, /Come usare \(telefono\)/);
  assert.match(page, /Tocca «Invia»/);
  assert.match(voice, /<ol class="steps">/);
  assert.match(voice, /Tocca qui in basso a destra/);
  assert.match(voice, /«Inizia la conversazione»/);
  assert.match(voice, /«Termina»/);
  assert.match(voice, /permesso del microfono/);
  assert.doesNotMatch(voice, /agent-id="agent_/);
  assert.doesNotMatch(page, /DEMO — prenotazione simulata/);
  assert.doesNotMatch(page, /simulated reservation/);
  assert.match(page, /Ho preso nota della richiesta; lo staff di Ambàra la conferma/);
  assert.match(page, /I\\'ve noted the request; the Ambàra staff will confirm it/);
  assert.match(page, /nulla viene inviato a Plateform/);
  assert.match(page, /nothing is sent to Plateform/);
});

test("hours and cover keep the published conflict and drop unverified lunch", () => {
  assert.match(page, /07:30–11:30/);
  assert.match(page, /08:30–12:00/);
  assert.match(page, /17:00–01:00/);
  assert.match(page, /carta bevande indica 2 €/);
  assert.match(page, /drinks page says €2/);
  assert.doesNotMatch(page, /7:30–13:00|12:00–14:30|17:00–2:00|17:00–02:00/);
});

test("parking is the published free area, allergies are not guaranteed", () => {
  assert.match(page, /ampio parcheggio gratuito/);
  assert.match(page, /large free parking/);
  assert.match(page, /non garantisco/i);
  assert.doesNotMatch(page, /allergen-free|cucina senza glutine/);
});

test("analytics skip and Schloss stay intact", () => {
  assert.match(page, /skipgc/);
  assert.match(page, /internal=/);
  assert.match(schloss, /agent_3101m5z30nvbf06rvwp6def0k85b/);
  assert.doesNotMatch(page, /agent_3101m5z30nvbf06rvwp6def0k85b/);
  assert.doesNotMatch(page, /elevenlabs-convai/);
});
