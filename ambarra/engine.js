import { COPY, LANGS } from "./copy.js";

export const FORBIDDEN_AGENT_IDS = ["agent_3101m5z30nvbf06rvwp6def0k85b"];
export const RUNTIME_AGENT_ID = null;
export const DEMO_MARK = "DEMO — prenotazione simulata / simulated reservation";
export const VOICE_SCRIPT = "https://unpkg.com/@elevenlabs/convai-widget-embed";
export const MAP_EMBED = "https://maps.google.com/maps?q=Via%20di%20Li%20Graniti%2C%2007052%20Monte%20Petrosu%20SS&t=m&z=10&output=embed&iwloc=near";

const DINNER_RANGES = [
  ["starter", 0, 7],
  ["pasta", 7, 11],
  ["main", 11, 20],
  ["side", 20, 25],
  ["tasting", 25, 26],
  ["dessert", 26, 31]
];

const BEER_NAMES = new Set([
  "Ichnusa non filtrata 0,33",
  "Daura Gluten Free 0,33",
  "Warsteiner Alcohol Free 0,33"
]);

const DESC_EN = {
  "battuta di tonno": "buffalo cream, candied lemon, caper powder",
  "cozze patate e asparagi": "potato cream, mussels, asparagus, Vernaccia vinegar, orange oil",
  "carpaccio scottato": "beef, smoked aubergine, sweet-and-sour sauce, cucumbers",
  "tris di tartare di manzo": "buffalo buttermilk, caramelised onions, Nuoro ricotta and sun-dried tomatoes",
  "polpo alla piastra": "carasau bread and tomato sauce, basil oil",
  "rana catalana": "monkfish with beetroot, tomatoes, red onion, black lemon",
  "hummus di ceci": "seaweed and spicy guttiau bread",
  "gnocchi e polpo": "octopus ragù, broad beans, mint, dried tuna",
  "culurgiones": "with purpuza and saffron, buffalo cream",
  "linguine alle seppie": "thyme, lemon, bottarga",
  "fregola": "arrabbiata, mussels and guanciale",
  "la rana pescatrice all ambara": "bread millefeuille, monkfish, lemon-thyme gremolata",
  "tagliatelle di calamari": "squid and fried peppers, tartare sauce",
  "bavetta di manzo": "Angus beef, purple cabbage with Cannonau vinegar, sun-dried tomato chimichurri",
  "ambara degustazione griglia": "60-day-aged rib steak, Black Angus picanha, scottona cuberol, Sardinian citrus-marinated chicken",
  "la sebada tradizionale": "traditional seada with wildflower honey",
  "tiramisu": "savoiardi, coffee, mascarpone",
  "cremoso al cioccolato bianco": "salted caramel and bitter cocoa",
  "cheese cake": "baked, red-fruit sauce",
  "coscia di pollo disossata marinata agli agrumi": "boneless chicken thigh marinated with citrus"
};

const PARTY_WORDS = {
  un: 1, uno: 1, una: 1, one: 1, ein: 1, eine: 1, une: 1,
  due: 2, two: 2, dos: 2, deux: 2, zwei: 2,
  tre: 3, three: 3, tres: 3, trois: 3, drei: 3,
  quattro: 4, four: 4, cuatro: 4, quatre: 4, vier: 4,
  cinque: 5, five: 5, cinco: 5, cinq: 5, funf: 5,
  sei: 6, six: 6, seis: 6, sechs: 6,
  sette: 7, seven: 7, siete: 7, sept: 7, sieben: 7,
  otto: 8, eight: 8, ocho: 8, huit: 8, acht: 8,
  nove: 9, nine: 9, nueve: 9, neuf: 9, neun: 9,
  dieci: 10, ten: 10, diez: 10, dix: 10, zehn: 10
};

const WEEKDAYS = ["lunedi", "monday", "lunes", "montag", "lundi", "martedi", "tuesday", "martes", "dienstag", "mardi", "mercoledi", "wednesday", "miercoles", "mittwoch", "mercredi", "giovedi", "thursday", "jueves", "donnerstag", "jeudi", "venerdi", "friday", "viernes", "freitag", "vendredi", "sabato", "saturday", "sabado", "samstag", "samedi", "domenica", "sunday", "domingo", "sonntag", "dimanche"];

export function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function stringsOf(lang) {
  return COPY[LANGS.indexOf(lang) >= 0 ? lang : "it"];
}

export function displayPhone(kb) {
  const digits = String(kb.official.phone || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.indexOf("39") === 0) {
    return "+39 " + digits.slice(2, 5) + " " + digits.slice(5, 8) + " " + digits.slice(8);
  }
  return kb.official.phone;
}

export function instagramHandle(kb) {
  const match = String(kb.official.instagram || "").match(/instagram\.com\/([^/?#]+)/i);
  return match ? "@" + match[1] : kb.official.instagram;
}

export function formatEur(amount) {
  const number = Number(amount);
  if (!Number.isFinite(number)) return "";
  if (Number.isInteger(number)) return "€" + String(number);
  return "€" + number.toFixed(2);
}

export function timeRange(value) {
  const match = String(value || "").match(/\d{2}:\d{2}–\d{2}:\d{2}/);
  return match ? match[0] : "";
}

export function romeDate(now, plusDays) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const today = fmt.format(now instanceof Date ? now : new Date());
  const utc = new Date(today + "T12:00:00Z");
  utc.setUTCDate(utc.getUTCDate() + (plusDays || 0));
  return utc.toISOString().slice(0, 10);
}

export function allItems(kb) {
  const dinner = kb.menus.dinner.items.map(function (item, index) {
    return Object.assign({ menu: "dinner", section: sectionAt(index) }, item);
  });
  const breakfast = kb.menus.breakfast.items.map(function (item) {
    return Object.assign({ menu: "breakfast", section: "breakfast" }, item);
  });
  const drinks = kb.menus.beverages.examples.map(function (item) {
    return Object.assign({ menu: "drink", section: "drink" }, item);
  });
  return dinner.concat(breakfast, drinks);
}

function sectionAt(index) {
  for (let i = 0; i < DINNER_RANGES.length; i += 1) {
    const range = DINNER_RANGES[i];
    if (index >= range[1] && index < range[2]) return range[0];
  }
  return "main";
}

export function groupMenu(kb) {
  const items = kb.menus.dinner.items;
  const dinner = {};
  DINNER_RANGES.forEach(function (range) {
    dinner[range[0]] = items.slice(range[1], range[2]);
  });
  return {
    dinner: dinner,
    breakfast: kb.menus.breakfast.items,
    drinks: kb.menus.beverages.examples,
    covers: {
      dinner: kb.menus.dinner.cover_eur,
      breakfast: kb.menus.breakfast.cover_eur,
      drinks: kb.menus.beverages.cover_eur
    },
    cocktails: {
      signature: kb.menus.beverages.signature_cocktails_eur,
      classic: kb.menus.beverages.classic_cocktails_eur
    }
  };
}

export function voiceMountPlan(agentId) {
  if (!agentId) return { mount: false, reason: "missing" };
  if (FORBIDDEN_AGENT_IDS.indexOf(agentId) !== -1) return { mount: false, reason: "forbidden" };
  if (!/^agent_[a-z0-9]+$/.test(agentId)) return { mount: false, reason: "invalid" };
  return { mount: true, reason: "ready", agentId: agentId, script: VOICE_SCRIPT };
}

export function attachVoice(plan, doc, track, labels) {
  if (!plan || !plan.mount) return { mounted: false, reason: plan ? plan.reason : "missing" };
  if (FORBIDDEN_AGENT_IDS.indexOf(plan.agentId) !== -1) return { mounted: false, reason: "forbidden" };
  const widget = doc.createElement("elevenlabs-convai");
  widget.setAttribute("agent-id", plan.agentId);
  widget.setAttribute("placement", "bottom-right");
  if (labels) widget.setAttribute("text-contents", JSON.stringify(labels));
  const script = doc.createElement("script");
  script.src = plan.script;
  script.async = true;
  script.type = "text/javascript";
  doc.body.appendChild(widget);
  doc.body.appendChild(script);
  let last = 0;
  doc.addEventListener("elevenlabs-convai:call", function () {
    const now = Date.now();
    if (now - last < 4000) return;
    last = now;
    if (typeof track === "function") track("/voice-start", "Voice demo started");
  }, true);
  return { mounted: true, reason: "ready" };
}

function fill(template, map) {
  return String(template).replace(/\{([a-zA-Z0-9]+)\}/g, function (_, key) {
    return Object.prototype.hasOwnProperty.call(map, key) ? String(map[key]) : "{" + key + "}";
  });
}

function baseMap(kb) {
  return {
    phone: displayPhone(kb),
    email: kb.official.email,
    site: kb.official.website,
    book: kb.official.reservation.url,
    address: kb.identity.address,
    chef: kb.official.chef,
    instagram: instagramHandle(kb),
    facebook: kb.official.facebook,
    name: kb.identity.name,
    bfast: timeRange(kb.official.hours.breakfast),
    bfastAlt: timeRange(kb.official.hours.conflict),
    evening: timeRange(kb.official.hours.evening),
    coverDinner: kb.menus.dinner.cover_eur,
    coverBreakfast: kb.menus.breakfast.cover_eur,
    coverDrinks: kb.menus.beverages.cover_eur,
    sig: kb.menus.beverages.signature_cocktails_eur,
    classic: kb.menus.beverages.classic_cocktails_eur
  };
}

function dauraPrice(kb) {
  const beer = kb.menus.beverages.examples.find(function (item) {
    return item.name.indexOf("Daura") === 0;
  });
  return beer ? formatEur(beer.price_eur) : "";
}

function say(topic, text, extra) {
  return Object.assign({ topic: topic, text: text, simulated: topic === "booking", pending: null }, extra || {});
}

function has(text, pattern) {
  return pattern.test(text);
}

function findDishes(kb, text) {
  const hits = [];
  const queryWords = new Set(text.split(" ").filter(Boolean));
  const ignore = new Set(["ambara", "sardinian", "lounge", "sarda", "sarde", "sardes"]);
  allItems(kb).forEach(function (item) {
    const name = norm(item.name);
    if (!name) return;
    if (text.includes(name)) {
      hits.push(item);
      return;
    }
    const strong = name.split(" ").filter(function (token) {
      return token.length >= 5 && queryWords.has(token) && !ignore.has(token);
    });
    if (strong.length) hits.push(item);
  });
  return hits.slice(0, 5);
}

function descriptionFor(item, lang) {
  if (item.unit === "UNKNOWN") return "";
  if (lang === "en") {
    const gloss = DESC_EN[norm(item.name)];
    if (gloss) return gloss;
  }
  return item.description_it || "";
}

export function formatDish(kb, item, lang) {
  const L = stringsOf(lang);
  if (item.unit === "UNKNOWN") {
    const lines = [fill(L.unknownUnit, { name: item.name, raw: String(item.price_eur) })];
    if (item.published_allergen_codes && item.published_allergen_codes.length) {
      lines.push(fill(L.codesLine, { codes: item.published_allergen_codes.join(", ") }));
    }
    lines.push(L.reconfirm);
    return lines.join("\n");
  }
  let price = formatEur(item.price_eur);
  if (item.unit === "100 g") price += " " + L.per100;
  if (item.unit === "person") price += " " + L.perPerson;
  const lines = [item.name + " — " + price];
  const description = descriptionFor(item, lang);
  if (description) lines.push(L.publishedDesc + ": " + description);
  if (norm(item.name) === "crostone vegano") lines.push(L.veganNote);
  if (item.published_allergen_codes && item.published_allergen_codes.length) {
    lines.push(fill(L.codesLine, { codes: item.published_allergen_codes.join(", ") }));
  } else if (item.menu !== "drink") {
    lines.push(L.noCodes);
  }
  if (BEER_NAMES.has(item.name) === false && item.menu === "drink") lines.push(L.wineNote);
  if (item.name.indexOf("Daura") === 0) lines.push(fill(L.glutenBeer, { beer: formatEur(item.price_eur).replace("€", "") }));
  lines.push(L.reconfirm);
  if (norm(item.name).includes("degustazione")) lines.push(fill(L.cover, baseMap(kb)));
  return lines.join("\n");
}

function listDishes(kb, items, lang, intro) {
  const L = stringsOf(lang);
  return [intro].concat(items.map(function (item) { return formatDish(kb, item, lang); })).join("\n\n");
}

function extractTime(raw) {
  const clock = String(raw).match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (clock) return String(clock[1]).padStart(2, "0") + ":" + clock[2];
  const ampm = String(raw).match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (ampm) {
    let hour = Number(ampm[1]);
    const marker = ampm[2].toLowerCase();
    if (marker === "pm" && hour < 12) hour += 12;
    if (marker === "am" && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23) return String(hour).padStart(2, "0") + ":00";
  }
  return null;
}

function extractParty(text) {
  const numbered = text.match(/\b(?:per|for|para|pour|fur)\s+(\d{1,2})\b/);
  if (numbered) {
    const size = Number(numbered[1]);
    const rest = text.slice(numbered.index + numbered[0].length);
    if (!/^\s*(am|pm)\b/.test(rest) && size >= 1 && size <= 30) return size;
  }
  const phrase = text.match(/\b(?:per|for|para|pour|fur)\s+([a-z]+)\b/);
  if (phrase && PARTY_WORDS[phrase[1]]) return PARTY_WORDS[phrase[1]];
  const found = [];
  text.split(" ").forEach(function (word) {
    if (!PARTY_WORDS[word]) return;
    if (["un", "uno", "una", "une", "ein", "eine"].indexOf(word) !== -1) return;
    found.push(PARTY_WORDS[word]);
  });
  return found.length ? found[found.length - 1] : null;
}

function extractCalendarDate(raw, now) {
  const iso = String(raw).match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  const dmy = String(raw).match(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/);
  if (dmy) {
    const day = String(dmy[1]).padStart(2, "0");
    const month = String(dmy[2]).padStart(2, "0");
    return dmy[3] + "-" + month + "-" + day;
  }
  if (/\b(domani|tomorrow|manana|morgen|demain)\b/.test(norm(raw))) return romeDate(now || new Date(), 1);
  if (/\b(oggi|today|hoy|heute|aujourdhui)\b/.test(norm(raw))) return romeDate(now || new Date(), 0);
  return null;
}

function hasWeekday(text) {
  return WEEKDAYS.some(function (day) { return text.includes(day); });
}

function wantsBooking(text) {
  return has(text, /\b(prenot|reserv|book|tavolo|table|mesa|tisch|buchen|reservar|reserver)\b/);
}

function bookingState(raw, now, pending) {
  const text = norm(raw);
  const next = {
    party: extractParty(text) || (pending && pending.party) || null,
    time: extractTime(raw) || (pending && pending.time) || null,
    date: extractCalendarDate(raw, now) || null,
    weekday: hasWeekday(text) || (pending && pending.weekday) || false
  };
  if (!next.date && pending && pending.date && !hasWeekday(text)) next.date = pending.date;
  return next;
}

function bookingReply(kb, lang, state) {
  const L = stringsOf(lang);
  const map = baseMap(kb);
  const missing = [];
  if (!state.date) missing.push(L.missingDate);
  if (!state.time) missing.push(L.missingTime);
  if (!state.party) missing.push(L.missingParty);
  const noted = [];
  if (state.party) noted.push(String(state.party));
  if (state.time) noted.push(state.time);
  if (state.date) noted.push(state.date);
  let text;
  if (!state.party && !state.time && !state.date && !state.weekday) text = fill(L.bookingNeed, map);
  else if (state.weekday && !state.date) text = fill(L.bookingPartial, { missing: missing.join(", "), noted: noted.join(", ") || L.notedNothing }) + "\n" + L.bookingDateStill;
  else if (missing.length) text = fill(L.bookingPartial, { missing: missing.join(", "), noted: noted.join(", ") || L.notedNothing });
  else {
    text = fill(L.bookingFull, Object.assign({}, map, {
      party: state.party,
      time: state.time,
      date: fill(L.dateToConfirm, { date: state.date })
    }));
  }
  if (text.indexOf(DEMO_MARK) !== 0) text = DEMO_MARK + "\n" + text;
  return say("booking", text, { pending: state, simulated: true });
}

export function simulateBooking(kb, input, lang, now) {
  const L = stringsOf(lang);
  const map = baseMap(kb);
  const date = input && input.date ? String(input.date) : "";
  const time = input && input.time ? String(input.time).slice(0, 5) : "";
  const party = input && input.party ? Number(input.party) : 0;
  const missing = [];
  if (!date) missing.push("date");
  if (!time) missing.push("time");
  if (!party) missing.push("party");
  const today = romeDate(now || new Date(), 0);
  const past = Boolean(date) && date < today;
  const allergy = input && input.allergyNote ? String(input.allergyNote).trim() : "";
  let text = DEMO_MARK + "\n" + fill(L.formNeed, map);
  if (!missing.length) {
    text = DEMO_MARK + "\n" + fill(L.bookingFull, Object.assign({}, map, {
      party: party,
      time: time,
      date: fill(L.dateToConfirm, { date: date })
    }));
    if (input.service) text += "\n" + input.service;
    if (input.name) text += "\n" + input.name;
    if (input.contact) text += "\n" + input.contact;
    if (allergy) text += "\n" + fill(L.allergyEcho, { note: allergy });
    if (past) text += "\n" + L.pastDate;
    text += "\n" + L.notSent;
  }
  return {
    confirmed: false,
    simulated: true,
    liveAvailabilityChecked: false,
    reservationSystemConnected: false,
    confirmationId: null,
    notifiedStaff: false,
    providerName: "Plateform",
    providerUrl: kb.official.reservation.url,
    apiVerified: kb.official.reservation.internal_system_or_API_verified === true,
    missing: missing,
    past: past,
    text: text
  };
}

function sectionFrom(text) {
  if (has(text, /\b(antipast|starter|vorspeise|entrante|entrees)\b/)) return "starter";
  if (has(text, /\b(pasta|pate|pates|primi)\b/)) return "pasta";
  if (has(text, /\b(grigli|grill|secondi|hauptgang|parrilla)\b/)) return "main";
  if (has(text, /\b(contorn|side|beilage|guarnicion|accompagn)/)) return "side";
  if (has(text, /\b(dolc|dessert|postre|nachspeise)\b/)) return "dessert";
  if (has(text, /\b(colazion|breakfast|desayuno|fruhstuck|petit dejeuner)\b/)) return "breakfast";
  if (has(text, /\b(cocktail|vino|wine|birra|beer|cerveza|wein|boisson|getrank)\b/)) return "drink";
  return "";
}

export function answer(kb, raw, lang, ctx) {
  const L = stringsOf(lang);
  const text = norm(raw);
  const context = ctx || {};
  const map = baseMap(kb);
  map.beer = dauraPrice(kb).replace("€", "");
  if (!text) return say("empty", "");
  const short = text.split(" ").length <= 4;
  if (short && has(text, /^(ciao|salve|buongiorno|buonasera|hello|hi|hola|buenas|hallo|bonjour|bonsoir)\b/)) {
    return say("greeting", L.greeting);
  }
  if (has(text, /\b(etimolog|etymolog|significato del nome|meaning of the name|bedeutung des namens|significado del nombre|sens du nom)\b/)) {
    return say("etymology", L.etymology);
  }
  if (has(text, /\bopentable\b|\bopen table\b/)) return say("opentable", L.opentable);

  const dishes = findDishes(kb, text);
  const booking = wantsBooking(text);
  const google = has(text, /\bgoogle\b|\bmaps\b|\brecension|\breview\b|\bbewert|\bresena\b|\bavis\b/);
  const access = has(text, /\b(wheelchair|rollstuhl|fauteuil|silla de ruedas|sedia a rotelle|accessib|barriere|disabil|step free)\b/);
  const allergen = /allerg|intoller|celiac|celia|gluten|glutine|laktose|lactose|frutos secos/.test(text);
  const vegan = has(text, /\bvegan/);
  const hours = has(text, /\b(orari|orario|aperto|chius|hours|open|horario|horarios|geoffn|ouvert|horaire|horaires|zeiten|uhrzeit|apertura|che ora|what time|a que hora|quelle heure|wie viel)\b/);
  const music = has(text, /\b(music|musica|musik|musique|dj\b|karaoke|jazz)\b/);
  const locating = has(text, /\b(dove|where|indirizzo|address|direccion|wo seid|ou etes)\b/);

  if (access && music) return say("music", L.music + "\n\n" + fill(L.accessibility, map));
  if (access) return say("accessibility", fill(L.accessibility, map));
  if (google && booking) {
    const state = bookingState(raw, context.now, context.pending);
    const book = bookingReply(kb, lang, state);
    return say("google", fill(L.googleBook, map) + "\n\n" + book.text, { pending: book.pending, simulated: true });
  }
  if (google && has(text, /\b(recension|review|bewert|resena|avis)\b/)) return say("review", L.reviewChat);
  if (google && !dishes.length) return say("google", fill(L.googleShort, map));
  if (vegan && !dishes.length) {
    const crostone = allItems(kb).find(function (item) { return norm(item.name) === "crostone vegano"; });
    return say("vegan", (crostone ? formatDish(kb, crostone, lang) + "\n\n" : "") + L.veganNote);
  }
  if (allergen && !dishes.length) {
    let extra = "";
    if (has(text, /\b(gluten|glutine|glut)\b/)) extra = "\n\n" + fill(L.glutenBeer, map);
    return say("allergen", fill(L.allergens, map) + extra);
  }
  if (booking || (context.pending && has(text, /\b(domani|tomorrow|manana|morgen|demain|oggi|today|hoy|heute|venerdi|friday|viernes|freitag|vendredi|lunedi|martedi|mercoledi|giovedi|sabato|domenica)\b/))) {
    return bookingReply(kb, lang, bookingState(raw, context.now, context.pending));
  }
  if (has(text, /\b(coperto|cover charge|cubierto|gedeck|couvert)\b/)) return say("cover", fill(L.cover, map));
  if (hours && !dishes.length) return say("hours", fill(L.hours, map));
  if (music) return say("music", L.music);
  if (has(text, /\b(asporto|takeaway|take away|para llevar|abholen|emporter|delivery|consegna|domicilio|lieferung)\b/)) {
    return say("takeaway", fill(L.takeaway, map));
  }
  if (has(text, /\b(pranzo|lunch|almuerzo|mittag|dejeuner)\b/)) return say("lunch", fill(L.lunch, map));
  if (has(text, /\b(cane|cani|dog|dogs|perro|hund|chien|bambin|child|kinder|enfant|seggiolon|high chair|trona|hochstuhl|deposito|deposit|anzahlung|acompte|cancell|disdet|storno|annul|no show|ritardo|late arrival|privat|grupo|group|gruppo|gruppe)\b/)) {
    return say("policies", fill(L.policies, map));
  }
  if (has(text, /\b(km\b|kilometr|chilometr|spiagg|beach|playa|strand|plage|distanza|distance|entfernung)\b/)) {
    return say("where", fill(L.where, map));
  }
  if (has(text, /\b(parchegg|parking|aparcamiento|parkplatz)\b/)) {
    return say("parking", fill(L.where, map));
  }
  if (has(text, /\b(chef|cuoco|andrea|locci)\b/)) return say("chef", fill(L.chef, map));
  if (has(text, /\b(contatt|telefono|whatsapp|instagram|email|e mail|phone|correo|telefon|courriel)\b/) && !dishes.length) {
    return say("contact", fill(L.contact, map));
  }
  if (has(text, /\b(cocktail|signature)\b/)) return say("drinks", fill(L.cocktailLine, map));
  const section = sectionFrom(text);
  if (section === "pasta" && !dishes.length) {
    const pasta = allItems(kb).filter(function (item) { return item.section === "pasta"; });
    const body = listDishes(kb, pasta, lang, L.pastaIntro);
    if (locating) return say("where", fill(L.where, map) + "\n\n" + body);
    return say("pasta", body);
  }
  if (section === "drink" && !dishes.length) {
    const drinks = allItems(kb).filter(function (item) { return item.section === "drink"; });
    return say("drinks", fill(L.cocktailLine, map) + "\n\n" + listDishes(kb, drinks, lang, fill(L.sectionIntro, { section: L.sections.drink })));
  }
  if (section && !dishes.length && section !== "breakfast") {
    const group = allItems(kb).filter(function (item) { return item.section === section; });
    if (group.length) return say(section, listDishes(kb, group, lang, fill(L.sectionIntro, { section: L.sections[section] })));
  }
  if (section === "breakfast" && !dishes.length && !hours) {
    const group = allItems(kb).filter(function (item) { return item.section === "breakfast"; });
    return say("breakfast", fill(L.hours, map) + "\n\n" + listDishes(kb, group.slice(0, 8), lang, fill(L.sectionIntro, { section: L.sections.breakfast })));
  }
  if (dishes.length > 4) {
    return say("menu", L.tooMany + "\n" + dishes.map(function (item) { return item.name; }).join("\n"));
  }
  if (dishes.length) {
    const whereToo = has(text, /\b(dove|where|direccion|adresse|indirizzo|address|ubicacion)\b/);
    const body = dishes.map(function (item) { return formatDish(kb, item, lang); }).join("\n\n");
    if (whereToo) return say("where", fill(L.where, map) + "\n\n" + body);
    return say("dish", body);
  }
  if (has(text, /\b(dove|where are|dove siete|indirizzo|address|direccion|wo seid|ou etes)\b/)) {
    return say("where", fill(L.where, map));
  }
  if (has(text, /\b(chi siete|what are you|concepto|concept|american bar|lounge)\b/)) return say("concept", L.concept);
  if (hours) return say("hours", fill(L.hours, map));
  return say("unknown", fill(L.notCovered, map));
}

export function reviewDraft(kb, lang, exercise) {
  const L = stringsOf(lang);
  const note = String(exercise || "").trim();
  if (!note) return { posted: false, text: L.reviewEmpty };
  return {
    posted: false,
    verifiedRatingUsed: false,
    text: L.reviewDraft + "\n\n" + note
  };
}

export function allowedLink(url) {
  if (url === MAP_EMBED) return true;
  if (url === "https://ambaralounge.it/") return true;
  if (typeof url === "string" && url.indexOf("https://ambaralounge.it/") === 0) return true;
  if (url === "https://www.instagram.com/ambarasardinianlounge/") return true;
  if (url === "https://www.facebook.com/ambaralounge") return true;
  if (url === "https://ambarasardinianlounge.plateform.app/r/ambarainstagram") return true;
  if (url === "https://bollastudio.com" || url === "https://bollastudio.com/") return true;
  return false;
}
