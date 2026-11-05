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

test("the voice script parses and stays unconfigured", () => {
  const parts = voice.split("<script>");
  const main = parts[parts.length - 1].replace(/<\/script>[\s\S]*$/, "");
  new Function(main);
  assert.match(voice, /var AGENT_ID = "";/);
  assert.doesNotMatch(voice, /agent-id="agent_/);
  assert.match(voice, /agent_3101m5z30nvbf06rvwp6def0k85b/);
  assert.match(voice, /FORBIDDEN_AGENT/);
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
  assert.doesNotMatch(page, /wa\.me|tel:/);
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
