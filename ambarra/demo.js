import { COPY, LANGS, PROMPT_IDS, PROMPT_TEXT, SAMPLES } from "./copy.js";
import {
  DEMO_MARK,
  MAP_EMBED,
  RUNTIME_AGENT_ID,
  allowedLink,
  answer,
  attachVoice,
  displayPhone,
  formatEur,
  groupMenu,
  instagramHandle,
  reviewDraft,
  simulateBooking,
  stringsOf,
  timeRange,
  voiceMountPlan
} from "./engine.js";

const CHANNELS = ["whatsapp", "instagram", "google", "call"];
const state = {
  lang: "it",
  channel: "whatsapp",
  pending: null,
  kb: null,
  booking: null
};

const $ = (id) => document.getElementById(id);

function L() { return stringsOf(state.lang); }

function track(sub, title) {
  try { if (window.bsTrack) window.bsTrack(sub, title); } catch (e) { /* analytics must not break the demo */ }
}

function readStart() {
  const params = new URLSearchParams(location.search);
  const lang = params.get("lang");
  const channel = params.get("ch");
  if (LANGS.indexOf(lang) !== -1) state.lang = lang;
  if (CHANNELS.indexOf(channel) !== -1) state.channel = channel;
}

function remember(key, value) {
  const url = new URL(location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  history.replaceState(null, "", url);
}

function externalLink(href, label) {
  const link = document.createElement("a");
  if (!allowedLink(href)) return document.createTextNode(label);
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function paragraph(text) {
  const p = document.createElement("p");
  p.textContent = text;
  return p;
}

function applyChrome() {
  const copy = L();
  document.documentElement.lang = state.lang;
  document.title = copy.metaTitle;
  $("skip").textContent = copy.skip;
  $("banner").textContent = copy.banner;
  $("eyebrow").textContent = copy.eyebrow;
  $("title").textContent = copy.h1;
  $("lead").textContent = copy.lead;
  $("lang-note").textContent = state.lang === "it" || state.lang === "en" ? copy.primaryNote : copy.capabilityNote;
  $("kb-title").textContent = copy.kbTitle;
  $("one-base").textContent = copy.oneBase;
  $("footer-demo").textContent = copy.footerDemo;
  $("ask-label").textContent = copy.inputLabel;
  $("ask-input").placeholder = copy.inputPlaceholder;
  $("ask-send").textContent = copy.send;
  $("sample-btn").textContent = copy.scriptLabel;
  $("langs").setAttribute("aria-label", copy.langLabel);
  $("channels").setAttribute("aria-label", copy.channelsLabel);
  document.querySelectorAll("#langs button").forEach(function (button) {
    button.setAttribute("aria-pressed", button.dataset.lang === state.lang ? "true" : "false");
  });
  const notes = {
    whatsapp: copy.noteWhatsapp,
    instagram: copy.noteInstagram,
    google: copy.noteGoogle,
    call: copy.noteCall
  };
  $("channel-note").textContent = notes[state.channel];
  const channelLabels = {
    whatsapp: "chWhatsapp",
    instagram: "chInstagram",
    google: "chGoogle",
    call: "chCall"
  };
  document.querySelectorAll("#channels button").forEach(function (button) {
    const on = button.dataset.channel === state.channel;
    button.textContent = copy[channelLabels[button.dataset.channel]];
    button.setAttribute("aria-selected", on ? "true" : "false");
    button.tabIndex = on ? 0 : -1;
  });
  $("voice-panel").hidden = state.channel !== "call";
  $("google-panel").hidden = state.channel !== "google";
  $("chat-panel").hidden = false;
  renderPrompts();
  renderVoice();
  renderGoogle();
  renderFacts();
  renderFormLabels();
  renderContact();
  renderMenu();
  renderSources();
  renderTeam();
  relabelMessages();
  paintBooking();
}

function renderLanguages() {
  const host = $("langs");
  clear(host);
  LANGS.forEach(function (code) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.lang = code;
    button.textContent = code.toUpperCase();
    button.setAttribute("aria-pressed", code === state.lang ? "true" : "false");
    button.addEventListener("click", function () {
      state.lang = code;
      remember("lang", code === "it" ? "" : code);
      applyChrome();
      track("/lang/" + code, "Lang " + code);
    });
    host.appendChild(button);
  });
}

function renderChannels() {
  const host = $("channels");
  clear(host);
  const labels = {
    whatsapp: "chWhatsapp",
    instagram: "chInstagram",
    google: "chGoogle",
    call: "chCall"
  };
  CHANNELS.forEach(function (channel) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.channel = channel;
    button.id = "tab-" + channel;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "stage");
    button.textContent = L()[labels[channel]];
    button.addEventListener("click", function () { selectChannel(channel); });
    host.appendChild(button);
  });
  host.addEventListener("keydown", function (event) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (keys.indexOf(event.key) === -1) return;
    event.preventDefault();
    let index = CHANNELS.indexOf(state.channel);
    if (event.key === "ArrowRight") index = (index + 1) % CHANNELS.length;
    if (event.key === "ArrowLeft") index = (index - 1 + CHANNELS.length) % CHANNELS.length;
    if (event.key === "Home") index = 0;
    if (event.key === "End") index = CHANNELS.length - 1;
    selectChannel(CHANNELS[index]);
    $("tab-" + CHANNELS[index]).focus();
  });
}

function selectChannel(channel) {
  state.channel = channel;
  state.pending = null;
  remember("ch", channel === "whatsapp" ? "" : channel);
  applyChrome();
  clearLog();
  push("assistant", L().welcome);
  track("/channel/" + channel, "Channel " + channel);
}

function renderFacts() {
  const kb = state.kb;
  const copy = L();
  const host = $("facts");
  clear(host);
  const cards = [
    [copy.factAddress, kb.identity.address + " " + copy.noHouse],
    [copy.factChef, kb.official.chef],
    [copy.factBreakfast, timeRange(kb.official.hours.breakfast)],
    [copy.factAlt, timeRange(kb.official.hours.conflict)],
    [copy.factEvening, timeRange(kb.official.hours.evening)],
    [copy.factParking, copy.parkingShort],
    [copy.factBook, "Plateform"],
    [copy.factCover, copy.menuDinner + " €" + kb.menus.dinner.cover_eur + " · " + copy.menuBreakfast + " €" + kb.menus.breakfast.cover_eur + " · " + copy.menuDrinks + " €" + kb.menus.beverages.cover_eur]
  ];
  cards.forEach(function (card) {
    const box = document.createElement("article");
    box.className = "card";
    const k = document.createElement("span");
    k.className = "k";
    k.textContent = card[0];
    box.appendChild(k);
    box.appendChild(paragraph(card[1]));
    host.appendChild(box);
  });
}

function renderVoice() {
  const host = $("voice-panel");
  clear(host);
  const copy = L();
  const plan = voiceMountPlan(RUNTIME_AGENT_ID);
  const box = document.createElement("article");
  box.className = "card";
  const title = document.createElement("h2");
  title.textContent = plan.mount ? copy.voiceTitle : copy.voiceTitle;
  box.appendChild(title);
  if (!plan.mount) {
    box.appendChild(paragraph(copy.voiceBody));
    box.appendChild(paragraph(copy.voiceLanguages));
    box.dataset.mounted = "false";
    box.dataset.reason = plan.reason;
  } else if (!document.querySelector("elevenlabs-convai")) {
    const mounted = attachVoice(plan, document, track, copy.voiceWidget);
    box.dataset.mounted = String(mounted.mounted);
    box.dataset.reason = mounted.reason;
  } else {
    box.dataset.mounted = "true";
    box.dataset.reason = "ready";
  }
  const preview = document.createElement("h3");
  preview.textContent = copy.voicePreview;
  box.appendChild(preview);
  box.appendChild(paragraph(copy.voiceOpening));
  host.appendChild(box);
}

function renderGoogle() {
  const host = $("google-panel");
  clear(host);
  const copy = L();
  const kb = state.kb;
  const box = document.createElement("article");
  box.className = "card";
  const title = document.createElement("h2");
  title.textContent = copy.gTitle;
  box.appendChild(title);
  const list = document.createElement("ol");
  list.className = "steps";
  [
    copy.gNotLive,
    copy.gDiscovery,
    copy.gWebsite,
    copy.gBooking,
    copy.gReviews
  ].forEach(function (text, index) {
    const item = document.createElement("li");
    item.appendChild(paragraph(text));
    if (index === 2) item.appendChild(externalLink(kb.official.website, copy.gLinkSite));
    if (index === 3) item.appendChild(externalLink(kb.official.reservation.url, copy.gLinkBook));
    list.appendChild(item);
  });
  box.appendChild(list);
  const reviewTitle = document.createElement("h3");
  reviewTitle.textContent = copy.reviewTitle;
  box.appendChild(reviewTitle);
  box.appendChild(paragraph(copy.reviewHint));
  const form = document.createElement("form");
  form.className = "review";
  const label = document.createElement("label");
  label.setAttribute("for", "review-input");
  label.textContent = copy.reviewTitle;
  const area = document.createElement("textarea");
  area.id = "review-input";
  area.placeholder = copy.reviewPlaceholder;
  const button = document.createElement("button");
  button.className = "primary";
  button.type = "submit";
  button.textContent = copy.reviewButton;
  const result = document.createElement("div");
  result.className = "result";
  result.hidden = true;
  result.setAttribute("role", "status");
  form.appendChild(label);
  form.appendChild(area);
  form.appendChild(button);
  form.appendChild(result);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const draft = reviewDraft(kb, state.lang, area.value);
    result.hidden = false;
    result.textContent = draft.text;
    track("/review/draft", "Review draft");
  });
  box.appendChild(form);
  host.appendChild(box);
}

function renderPrompts() {
  const host = $("prompts");
  clear(host);
  const copy = L();
  PROMPT_IDS.forEach(function (id) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = copy.prompts[id];
    button.addEventListener("click", function () {
      ask(PROMPT_TEXT[id][state.lang]);
    });
    host.appendChild(button);
  });
}

function clearLog() {
  clear($("log"));
}

function relabelMessages() {
  const copy = L();
  document.querySelectorAll("#log .msg").forEach(function (msg) {
    const who = msg.querySelector(".who");
    if (!who) return;
    const role = msg.dataset.role;
    const label = role === "guest" ? copy.you : role === "system" ? copy.systemLabel : copy.assistant;
    who.textContent = "";
    who.appendChild(document.createTextNode(label + " "));
    if (role === "assistant") {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = copy.demoChip;
      who.appendChild(chip);
    }
  });
}

function push(role, text) {
  const copy = L();
  const msg = document.createElement("article");
  msg.className = "msg " + role;
  msg.dataset.role = role;
  const who = document.createElement("div");
  who.className = "who";
  const label = role === "guest" ? copy.you : role === "system" ? copy.systemLabel : copy.assistant;
  who.appendChild(document.createTextNode(label + " "));
  if (role === "assistant") {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = copy.demoChip;
  who.appendChild(chip);
  }
  const body = document.createElement("div");
  body.textContent = text;
  msg.appendChild(who);
  msg.appendChild(body);
  const log = $("log");
  log.appendChild(msg);
  msg.scrollIntoView({ block: "nearest" });
}

function ask(text) {
  const clean = String(text || "").trim();
  if (!clean) return;
  push("guest", clean);
  const result = answer(state.kb, clean, state.lang, { now: new Date(), pending: state.pending });
  state.pending = result.topic === "booking" || result.topic === "google" ? result.pending : null;
  push("assistant", result.text);
  track("/chat/" + result.topic, "Chat " + result.topic);
}

function renderFormLabels() {
  const copy = L();
  const form = $("book");
  if (!form.dataset.ready) {
    form.innerHTML = "";
    form.appendChild(el("h2", "", "book-title"));
    form.appendChild(el("p", "", "book-intro"));
    form.appendChild(field("service", "select"));
    form.appendChild(field("date", "date"));
    form.appendChild(field("time", "select"));
    form.appendChild(field("party", "number"));
    form.appendChild(field("name", "text"));
    form.appendChild(field("contact", "text"));
    form.appendChild(field("allergy", "text"));
    const button = document.createElement("button");
    button.className = "primary";
    button.type = "submit";
    button.id = "book-submit";
    form.appendChild(button);
    const result = document.createElement("div");
    result.id = "book-result";
    result.className = "result";
    result.hidden = true;
    result.setAttribute("role", "status");
    form.appendChild(result);
    const party = form.querySelector("#party");
    party.min = "1";
    party.max = "30";
    party.inputMode = "numeric";
    form.addEventListener("submit", onBook);
    form.dataset.ready = "true";
  }
  $("book-title").textContent = copy.formTitle;
  $("book-intro").textContent = copy.formIntro;
  labelText("service", copy.formService);
  labelText("date", copy.formDate);
  labelText("time", copy.formTime);
  labelText("party", copy.formParty);
  labelText("name", copy.formName);
  labelText("contact", copy.formContact);
  labelText("allergy", copy.formAllergy);
  $("book-submit").textContent = copy.formSubmit;
  const time = $("time");
  if (!time.options.length) {
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "—";
    time.appendChild(blank);
    ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00"].forEach(function (slot) {
      const option = document.createElement("option");
      option.value = slot;
      option.textContent = slot;
      time.appendChild(option);
    });
  }
  const select = $("service");
  const current = select.value || "dinner";
  clear(select);
  [["breakfast", copy.svcBreakfast], ["dinner", copy.svcDinner], ["aperitivo", copy.svcAperitivo]].forEach(function (option) {
    const node = document.createElement("option");
    node.value = option[0];
    node.textContent = option[1];
    select.appendChild(node);
  });
  select.value = current;
  form.setAttribute("aria-describedby", "book-intro");
}

function el(tag, className, id) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (id) node.id = id;
  return node;
}

function field(name, type) {
  const label = document.createElement("label");
  label.id = "label-" + name;
  label.setAttribute("for", name);
  const input = type === "select" ? document.createElement("select") : document.createElement("input");
  input.id = name;
  input.name = name;
  if (type !== "select") input.type = type;
  label.appendChild(document.createTextNode(""));
  label.appendChild(input);
  return label;
}

function labelText(name, text) {
  const label = $("label-" + name);
  const control = $(name);
  label.textContent = "";
  label.appendChild(document.createTextNode(text));
  label.appendChild(control);
}

function onBook(event) {
  event.preventDefault();
  const form = event.currentTarget;
  state.booking = {
    date: form.date.value,
    time: form.time.value,
    party: form.party.value,
    name: form.name.value.trim(),
    contact: form.contact.value.trim(),
    allergyNote: form.allergy.value.trim(),
    service: form.service.value
  };
  paintBooking(true);
}

function paintBooking(fromSubmit) {
  if (!state.booking) return;
  const service = $("service");
  let serviceLabel = state.booking.service;
  for (let i = 0; i < service.options.length; i += 1) {
    if (service.options[i].value === state.booking.service) serviceLabel = service.options[i].text;
  }
  const result = simulateBooking(state.kb, {
    date: state.booking.date,
    time: state.booking.time,
    party: state.booking.party,
    name: state.booking.name,
    contact: state.booking.contact,
    allergyNote: state.booking.allergyNote,
    service: serviceLabel
  }, state.lang, new Date());
  const box = $("book-result");
  box.hidden = false;
  box.textContent = result.text;
  ["date", "time", "party"].forEach(function (name) {
    const missing = result.missing.indexOf(name) !== -1;
    $(name).setAttribute("aria-invalid", missing ? "true" : "false");
  });
  if (fromSubmit && result.missing.length) $(result.missing[0]).focus();
  if (fromSubmit && !result.missing.length) track("/booking/simulate", "Simulated booking");
  if (result.text.indexOf(DEMO_MARK) === -1 && result.missing.length === 0) box.dataset.bad = "true";
}

function renderContact() {
  const copy = L();
  const kb = state.kb;
  const host = $("contact");
  clear(host);
  const title = document.createElement("h2");
  title.textContent = copy.contactTitle;
  host.appendChild(title);
  host.appendChild(paragraph(kb.identity.address));
  host.appendChild(paragraph(copy.noHouse));
  host.appendChild(paragraph(displayPhone(kb)));
  host.appendChild(paragraph(kb.official.email));
  const list = document.createElement("ul");
  list.className = "links";
  [
    [kb.official.website, kb.official.website.replace("https://", "")],
    [kb.official.instagram, instagramHandle(kb)],
    [kb.official.facebook, "Facebook"],
    [kb.official.reservation.url, copy.gLinkBook]
  ].forEach(function (item) {
    const li = document.createElement("li");
    li.appendChild(externalLink(item[0], item[1]));
    list.appendChild(li);
  });
  host.appendChild(list);
  const mapTitle = document.createElement("h3");
  mapTitle.textContent = copy.openMap;
  host.appendChild(mapTitle);
  const frame = document.createElement("iframe");
  frame.className = "map";
  frame.loading = "lazy";
  frame.referrerPolicy = "no-referrer-when-downgrade";
  frame.title = copy.gMapCaption;
  frame.src = MAP_EMBED;
  host.appendChild(frame);
  host.appendChild(paragraph(copy.gMapCaption));
}

function renderMenu() {
  const copy = L();
  const kb = state.kb;
  const host = $("menu-panel");
  const query = host.dataset.query || "";
  clear(host);
  const title = document.createElement("h2");
  title.textContent = copy.menuTitle;
  host.appendChild(title);
  host.appendChild(paragraph(copy.menuNote));
  const label = document.createElement("label");
  label.setAttribute("for", "menu-search");
  label.textContent = copy.menuSearch;
  const input = document.createElement("input");
  input.id = "menu-search";
  input.type = "search";
  input.value = query;
  input.addEventListener("input", function () {
    host.dataset.query = input.value;
    renderMenu();
    $("menu-search").focus();
  });
  label.appendChild(input);
  host.appendChild(label);
  const needle = query.trim().toLowerCase();
  const groups = groupMenu(kb);
  const covers = {
    coverDinner: groups.covers.dinner,
    coverBreakfast: groups.covers.breakfast,
    coverDrinks: groups.covers.drinks
  };
  const blocks = [
    [copy.menuDinner, [
      [copy.menuStarter, groups.dinner.starter],
      [copy.menuPasta, groups.dinner.pasta],
      [copy.menuMain, groups.dinner.main],
      [copy.menuSide, groups.dinner.side],
      [copy.menuTasting, groups.dinner.tasting],
      [copy.menuDessert, groups.dinner.dessert]
    ], fill(copy.menuCoverDinner, covers), false],
    [copy.menuBreakfast, [[copy.menuBreakfast, groups.breakfast]], fill(copy.menuCoverBreakfast, covers), false],
    [copy.menuDrinks, [[copy.menuDrinks, groups.drinks]], fill(copy.menuCoverDrinks, covers) + " " + fill(copy.menuCocktails, { sig: groups.cocktails.signature, classic: groups.cocktails.classic }), true]
  ];
  blocks.forEach(function (block) {
    const section = document.createElement("section");
    section.className = "menu-block";
    const heading = document.createElement("h3");
    heading.textContent = block[0];
    section.appendChild(heading);
    section.appendChild(paragraph(block[2]));
    block[1].forEach(function (group) {
      const visible = group[1].filter(function (item) {
        if (!needle) return true;
        return (item.name + " " + (item.description_it || "")).toLowerCase().includes(needle);
      });
      if (!visible.length) return;
      const sub = document.createElement("h4");
      sub.textContent = group[0];
      section.appendChild(sub);
      visible.forEach(function (item) {
        const row = document.createElement("div");
        row.className = "dish";
        const name = document.createElement("strong");
        name.textContent = item.name + " ";
        const price = document.createElement("span");
        price.className = "price";
        price.textContent = item.unit === "UNKNOWN"
          ? fill(copy.menuUnknown, { raw: String(item.price_eur) })
          : formatEur(item.price_eur) + (item.unit === "100 g" ? " / 100 g" : item.unit === "person" ? " " + copy.perPerson : "");
        row.appendChild(name);
        row.appendChild(price);
        if (item.unit !== "UNKNOWN" && item.description_it) row.appendChild(paragraph(item.description_it));
        if (block[3] && item.name.indexOf("Daura") !== 0 && item.name.indexOf("Ichnusa") !== 0 && item.name.indexOf("Warsteiner") !== 0) {
          row.appendChild(paragraph(copy.menuWineNote));
        }
        if (item.name.indexOf("Daura") === 0) row.appendChild(paragraph(fill(copy.glutenBeer, { beer: String(item.price_eur) })));
        section.appendChild(row);
      });
    });
    host.appendChild(section);
  });
  host.dataset.query = query;
}

function fill(template, map) {
  return String(template).replace(/\{([a-zA-Z0-9]+)\}/g, function (_, key) {
    return Object.prototype.hasOwnProperty.call(map, key) ? String(map[key]) : "";
  });
}

function renderSources() {
  const copy = L();
  const kb = state.kb;
  const host = $("sources");
  clear(host);
  const title = document.createElement("h2");
  title.textContent = copy.sourcesTitle;
  host.appendChild(title);
  const list = document.createElement("ul");
  list.className = "sources";
  [
    ["home", copy.srcHome],
    ["about", copy.srcAbout],
    ["location", copy.srcLocation],
    ["dinner", copy.srcDinner],
    ["breakfast", copy.srcBreakfast],
    ["beverages", copy.srcBeverages],
    ["privacy", copy.srcPrivacy],
    ["booking", copy.srcBooking]
  ].forEach(function (item) {
    const li = document.createElement("li");
    li.appendChild(externalLink(kb.sources[item[0]], item[1]));
    list.appendChild(li);
  });
  host.appendChild(list);
}

function renderTeam() {
  const copy = L();
  const host = $("team");
  clear(host);
  const summary = document.createElement("summary");
  summary.textContent = copy.teamTitle;
  host.appendChild(summary);
  [copy.teamEvents, copy.teamMaps, copy.teamApi, copy.teamVoice, copy.teamHours, copy.teamCover, copy.teamOpenTable, copy.teamLang, copy.teamSocial].forEach(function (text) {
    host.appendChild(paragraph(text));
  });
}

function playSample() {
  const sample = SAMPLES[state.lang] && SAMPLES[state.lang][state.channel];
  if (!sample) return;
  clearLog();
  push("system", L().scriptLabel);
  sample.forEach(function (line) { push(line.role, line.text); });
  track("/sample/" + state.channel, "Sample " + state.channel);
}

async function main() {
  readStart();
  $("boot").textContent = COPY.it.boot;
  let kb;
  try {
    kb = await fetch(new URL("./knowledge.json", import.meta.url)).then(function (response) {
      if (!response.ok) throw new Error("knowledge");
      return response.json();
    });
  } catch (e) {
    $("boot").textContent = COPY.it.bootError;
    return;
  }
  state.kb = kb;
  $("boot").hidden = true;
  renderLanguages();
  renderChannels();
  renderFormLabels();
  applyChrome();
  push("assistant", L().welcome);
  $("ask").addEventListener("submit", function (event) {
    event.preventDefault();
    ask($("ask-input").value);
    $("ask-input").value = "";
  });
  $("sample-btn").addEventListener("click", playSample);
  if (voiceMountPlan(RUNTIME_AGENT_ID).mount) {
    document.documentElement.dataset.voice = "configured";
  } else {
    document.documentElement.dataset.voice = "unavailable";
  }
}

main();
