import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { COPY, LANGS, PROMPT_IDS, PROMPT_TEXT, flatKeys } from "../copy.js";
import {
  DEMO_MARK,
  FORBIDDEN_AGENT_IDS,
  RUNTIME_AGENT_ID,
  allItems,
  allowedLink,
  answer,
  attachVoice,
  displayPhone,
  groupMenu,
  reviewDraft,
  simulateBooking,
  voiceMountPlan
} from "../engine.js";
import { setupAnalytics } from "../analytics.js";

const kb = JSON.parse(readFileSync(new URL("../knowledge.json", import.meta.url), "utf8"));
const now = new Date("2026-11-05T12:00:00Z");
const root = new URL("../../", import.meta.url);

function text(lang, question, ctx) {
  return answer(kb, question, lang, Object.assign({ now }, ctx || {})).text;
}

test("knowledge is the verified Ambara archive", () => {
  assert.equal(kb.identity.name, "Ambara Sardinian Lounge");
  assert.equal(kb.identity.street_number, null);
  assert.match(kb.identity.address, /Via di Li Graniti, 07052 Monte Petrosu/);
  assert.equal(kb.official.chef, "Andrea Locci");
  assert.equal(kb.official.email, "info@ambaralounge.it");
  assert.equal(kb.official.reservation.url, "https://ambarasardinianlounge.plateform.app/r/ambarainstagram");
  assert.equal(kb.official.reservation.internal_system_or_API_verified, false);
  assert.equal(kb.menus.dinner.items.length, 31);
  assert.equal(kb.menus.dinner.cover_eur, 3);
  assert.equal(kb.menus.breakfast.cover_eur, 3);
  assert.equal(kb.menus.beverages.cover_eur, 2);
  assert.match(kb.third_party.opentable.booking_status, /Not available on OpenTable/);
});

test("phone display comes from the archive", () => {
  assert.equal(displayPhone(kb), "+39 340 199 1233");
});

test("language packs have the same keys", () => {
  const base = flatKeys(COPY.it);
  LANGS.forEach(function (lang) {
    assert.deepEqual(flatKeys(COPY[lang]), base);
  });
  PROMPT_IDS.forEach(function (id) {
    LANGS.forEach(function (lang) {
      assert.ok(PROMPT_TEXT[id][lang]);
      assert.ok(COPY[lang].prompts[id]);
    });
  });
});

test("hours keep both breakfast ranges and do not use third-party lunch", () => {
  LANGS.forEach(function (lang) {
    const reply = text(lang, PROMPT_TEXT.hours[lang]);
    assert.match(reply, /07:30–11:30/);
    assert.match(reply, /08:30–12:00/);
    assert.match(reply, /17:00–01:00/);
    assert.doesNotMatch(reply, /12:15|19:30–23:00|4\.7|4,7/);
  });
});

test("cover charge stays in conflict", () => {
  const reply = text("it", PROMPT_TEXT.cover.it);
  assert.match(reply, /€3/);
  assert.match(reply, /€2/);
  assert.match(reply, /unico/i);
});

test("pasta and place stay on the verified menu", () => {
  const reply = text("en", "Where are you, and do you serve Sardinian pasta?");
  assert.match(reply, /Via di Li Graniti/);
  assert.match(reply, /No house number/);
  assert.match(reply, /Culurgiones/);
  assert.match(reply, /€22/);
  assert.match(reply, /purpuza/);
  assert.match(reply, /Fregola/);
  assert.doesNotMatch(reply, /1 km|2 km/);
});

test("catch of the day is not quoted as a total", () => {
  const reply = text("it", "Quanto costa il pescato del giorno?");
  assert.match(reply, /Pescato del giorno/);
  assert.match(reply, /non do un prezzo totale/i);
  assert.doesNotMatch(reply, /€5/);
});

test("tasting price and vegan breakfast do not invent safety", () => {
  const tasting = text("it", "quanto costa la degustazione?");
  assert.match(tasting, /€55/);
  assert.match(tasting, /€3/);
  assert.match(tasting, /€2/);
  const vegan = text("en", PROMPT_TEXT.vegan.en);
  assert.match(vegan, /€12/);
  assert.match(vegan, /pea cream/i);
  assert.match(vegan, /does not guarantee/i);
  const allergy = text("it", PROMPT_TEXT.allergen.it);
  assert.match(allergy, /Non garantisco/i);
  assert.match(allergy, /1169\/2011/);
  assert.doesNotMatch(allergy, /privo di allergeni|allergen-free|cucina senza glutine/i);
});

test("accessibility, music, lunch and OpenTable stay inside the archive", () => {
  const access = text("en", PROMPT_TEXT.music.en);
  assert.match(access, /18:30/);
  assert.match(access, /wheelchair/i);
  assert.match(access, /not/i);
  assert.doesNotMatch(access, /is wheelchair accessible|step-free entrance is available/i);
  assert.match(text("it", "fate il pranzo?"), /non è confermato/i);
  assert.doesNotMatch(text("it", "fate il pranzo?"), /12:15/);
  assert.match(text("en", "Can I book on OpenTable?"), /not on the booking network/i);
});

test("booking is simulated and never confirmed", () => {
  const first = answer(kb, "Vorrei un tavolo per quattro venerdì alle 20:30", "it", { now });
  assert.match(first.text, /DEMO — prenotazione simulata/);
  assert.match(first.text, /20:30/);
  assert.match(first.text, /4/);
  assert.match(first.text, /data di calendario|non basta/i);
  assert.equal(first.pending.party, 4);
  const next = answer(kb, "Tomorrow", "en", { now, pending: { party: 2, time: "20:00" } });
  assert.match(next.text, /2026-11-06/);
  assert.match(next.text, /No reservation has been made/);
  assert.match(next.text, /plateform\.app/i);
  assert.doesNotMatch(next.text, /confirmed|confermata|reservation confirmed/i);
  const saved = simulateBooking(kb, {
    date: "2026-11-20",
    time: "20:30",
    party: "4",
    allergyNote: "noci"
  }, "it", now);
  assert.equal(saved.confirmed, false);
  assert.equal(saved.confirmationId, null);
  assert.equal(saved.liveAvailabilityChecked, false);
  assert.equal(saved.notifiedStaff, false);
  assert.equal(saved.apiVerified, false);
  assert.match(saved.text, new RegExp(DEMO_MARK));
  assert.match(saved.text, /Nessuna prenotazione effettuata/);
  assert.match(saved.text, /noci/);
  assert.match(saved.text, /Non è stata inviata/);
});

test("google is not described as a live chat", () => {
  LANGS.forEach(function (lang) {
    const reply = text(lang, "How does Google messaging work?");
    assert.match(reply, /31/);
    assert.match(reply, /2024/);
    assert.match(reply, /Plateform|plateform/);
    assert.doesNotMatch(reply, /Google Business Messages is live|chat Google attiva collegata/i);
  });
  const draft = reviewDraft(kb, "en", "A pleasant evening.");
  assert.equal(draft.posted, false);
  assert.equal(draft.verifiedRatingUsed, false);
  assert.match(draft.text, /not posted/i);
});

test("voice slot refuses the Schloss agent and stays unconfigured", () => {
  assert.equal(RUNTIME_AGENT_ID, null);
  assert.equal(voiceMountPlan(null).mount, false);
  assert.equal(voiceMountPlan(FORBIDDEN_AGENT_IDS[0]).reason, "forbidden");
  assert.equal(voiceMountPlan("agent_newambarademo01").mount, true);
  const calls = [];
  const blocked = attachVoice(voiceMountPlan(FORBIDDEN_AGENT_IDS[0]), fakeDoc(calls), () => calls.push("track"));
  assert.equal(blocked.mounted, false);
  assert.equal(calls.length, 0);
  const missing = attachVoice(voiceMountPlan(null), fakeDoc(calls), () => calls.push("track"));
  assert.equal(missing.mounted, false);
});

test("links that would message or book outside the allowlist are rejected", () => {
  assert.equal(allowedLink("https://wa.me/393401991233"), false);
  assert.equal(allowedLink("tel:+393401991233"), false);
  assert.equal(allowedLink("https://www.opentable.com/r/ambara-sardinian-lounge-monte-petrosu"), false);
  assert.equal(allowedLink(kb.official.reservation.url), true);
  assert.equal(allowedLink(kb.official.website), true);
});

test("answers do not leave placeholders or the other demo agent", () => {
  LANGS.forEach(function (lang) {
    PROMPT_IDS.forEach(function (id) {
      const reply = text(lang, PROMPT_TEXT[id][lang]);
      assert.doesNotMatch(reply, /\{[a-zA-Z]+\}/);
      assert.doesNotMatch(reply, /agent_3101/);
      assert.ok(reply.length > 40);
    });
  });
});

test("menu groups keep every dinner dish", () => {
  const groups = groupMenu(kb);
  const names = []
    .concat(groups.dinner.starter, groups.dinner.pasta, groups.dinner.main, groups.dinner.side, groups.dinner.tasting, groups.dinner.dessert)
    .map(function (item) { return item.name; });
  assert.deepEqual(names, kb.menus.dinner.items.map(function (item) { return item.name; }));
  assert.equal(allItems(kb).length, 31 + 27 + 6);
});

test("analytics skips internal QA and non-production hosts", () => {
  const memory = memoryStorage();
  const local = setupAnalytics({
    search: "?internal=1&p=QA_Visit",
    hash: "",
    hostname: "localhost",
    storage: memory,
    getGoat() { return null; },
    setGoat() {},
    loadScript() { throw new Error("script should not load"); }
  });
  assert.equal(local.blocked, true);
  assert.equal(local.internal, true);
  assert.equal(local.track("/chat/hours", "Chat"), false);
  assert.equal(memory.getItem("skipgc"), "t");

  const production = memoryStorage();
  let loaded = false;
  const counts = [];
  const goat = { count(payload) { counts.push(payload); } };
  const live = setupAnalytics({
    search: "?p=Ambara!",
    hash: "",
    hostname: "demo.bollastudio.com",
    storage: production,
    getGoat() { return goat; },
    setGoat() {},
    loadScript(opts) { loaded = true; opts.onload(); }
  });
  assert.equal(live.blocked, false);
  assert.equal(loaded, true);
  assert.equal(live.tag, "ambara");
  assert.equal(counts[0].path, "/ambarra/?p=ambara");
  assert.equal(live.track("/booking/simulate", "Simulated booking"), true);
  assert.equal(counts[1].event, true);
  assert.equal(counts[1].path, "/ambarra/booking/simulate");
});

test("the page does not embed the Schloss widget and other demos stay put", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const demo = readFileSync(new URL("../demo.js", import.meta.url), "utf8");
  const schloss = readFileSync(new URL("./voz/schloss-wuelflingen/index.html", root), "utf8");
  assert.match(schloss, /agent_3101m5z30nvbf06rvwp6def0k85b/);
  assert.match(schloss, /\/schloss-wuelflingen\/voice/);
  assert.doesNotMatch(html, /agent_3101|elevenlabs-convai|convai-widget-embed|wa\.me|tel:/);
  assert.doesNotMatch(demo, /agent_3101|wa\.me|tel:/);
  assert.match(html, /skipgc/);
  assert.match(html, /\/ambarra\//);
});

function fakeDoc(calls) {
  return {
    createElement() { calls.push("create"); return { setAttribute() {}, appendChild() {} }; },
    body: { appendChild() { calls.push("append"); } },
    addEventListener() { calls.push("listen"); }
  };
}

function memoryStorage(initial) {
  const data = Object.assign({}, initial);
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    removeItem(key) { delete data[key]; }
  };
}
