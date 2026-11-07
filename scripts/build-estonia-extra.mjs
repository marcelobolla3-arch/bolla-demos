import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage } from "./sector-page.mjs";
import { estoniaUi } from "./estonia-ui.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dayEn = ["Morning", "Afternoon", "Evening"];
const dayEt = ["Hommik", "Pärastlõuna", "Õhtu"];

function langsFor(codes, current) {
  const labels = { et: "Eesti", en: "English" };
  return codes.map((code) => ({
    href: code === current ? "./" : `../${code}/`,
    code,
    label: labels[code],
    current: code === current,
  }));
}

function withCampaign(html) {
  const from = "if(window.goatcounter&&window.goatcounter.count) window.goatcounter.count({path:BASE+sub,title:title||sub,event:true}); else q.push([BASE+sub,title||sub]);";
  const to = "var ep=BASE+sub+(tag?'?p='+tag:'');if(window.goatcounter&&window.goatcounter.count) window.goatcounter.count({path:ep,title:title||sub,event:true}); else q.push([ep,title||sub]);";
  if (html.includes(to)) return html;
  if (!html.includes(from)) throw new Error("event line missing");
  return html.replace(from, to);
}

function indexHtml({ title, codes, fallback }) {
  const links = codes
    .map((code) => `<a href="${code}/" lang="${code}" data-keep-query>${code === "et" ? "Eesti" : "English"}</a>`)
    .join("\n    ");
  return `<!doctype html>
<!-- Estonia example entry. Not a business website. ?p= is kept and is not personalization. -->
<html lang="et" translate="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="google" content="notranslate">
<title>${title}</title>
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","DejaVu Sans",Arial,sans-serif;background:#f4f2ee;color:#1c1c1c}
main{max-width:36rem;margin:0 auto;padding:24px 16px}
.brand{font-weight:800;letter-spacing:.08em}
nav{display:flex;flex-direction:column;gap:8px;margin-top:16px}
nav a{display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:12px;background:#1d2a33;color:#fff;font-weight:700;text-decoration:none;font-size:18px}
.by a{color:#1d2a33}
</style>
<script>
(function(){
  var supported=${JSON.stringify(codes)};
  var q=new URLSearchParams(location.search);
  var requested=(q.get("lang")||"").toLowerCase();
  function browserLang(){
    var list=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||"et"];
    for(var i=0;i<list.length;i++){
      var code=String(list[i]||"").toLowerCase().split("-")[0];
      if(supported.indexOf(code)>=0) return code;
    }
    return ${JSON.stringify(fallback)};
  }
  var lang=supported.indexOf(requested)>=0?requested:browserLang();
  q.delete("lang");
  var rest=q.toString();
  location.replace(lang+"/"+(rest?"?"+rest:"")+location.hash);
})();
</script>
</head>
<body>
<main>
  <p class="brand">BOLLA STUDIO</p>
  <p class="by">Marcelo Bolla · <a href="https://bollastudio.com">bollastudio.com</a></p>
  <nav aria-label="Language">
    ${links}
  </nav>
</main>
<script>
document.querySelectorAll("[data-keep-query]").forEach(function(a){
  try{var u=new URL(a.getAttribute("href"),location.href);a.href=u.pathname+location.search+location.hash;}catch(e){}
});
</script>
</body></html>
`;
}

const pages = [
  {
    slug: "barber",
    codes: ["et", "en"],
    fallback: "et",
    comment: "Masculine barber example. Not /hair-salon/. Not a real shop. Language",
    et: {
      title: "Näidisvestlus meestejuuksurile · BOLLA STUDIO",
      bannerBefore: "Näidisvestlus meestejuuksurile. Selle koostas",
      bannerAfter: "«Näidisbarber» on väljamõeldud, mitte päris pood. Päris aegu ei anta. See vestlus on kirjutatud näidis, mitte reaalajas abiline.",
      tag: "Näidisbarber, väljamõeldud meestejuuksur",
      h1: "Näidis: lõikus, habe ja raseerimine",
      intro: "See kirjutatud vestlus näitab meestejuuksuri küsimusi: lõikus, habe, raseerimine, lahtiolekuajad ning aja muutmine või tühistamine. Soov pannakse näitena kirja. Meeskond kinnitaks aja. See leht ei kinnita.",
      chatTitle: "Näidisbarber · näidisvastuvõtt",
      askPlaceholder: "Näiteks: Kas teete ka habet?",
      formTitle: "Ajasoov näitena",
      formNote: "Nii saab vestlus soovi kirja panna. Meeskond kinnitaks või muudaks aja. See leht ei kinnita.",
      itemLabel: "Teenus",
      items: ["Juukselõikus", "Habe", "Lõikus ja habe", "Raseerimine"],
      slotLabel: "Kellaaeg",
      slots: dayEt,
      cta: "Pane soov näitena kirja",
      leftTitle: "Mida see näidisvestlus näitab",
      leftItems: ["Lõikus, habe ja raseerimine", "Lahtiolekuajad näidistundidena", "Soov kuupäeva ja kellaajaga", "Muutmine või tühistamine märkusena"],
      rightTitle: "Mis jääb meeskonnale",
      rightItems: ["Täpse aja kinnitamine", "Muutmine ja tühistamine", "Hind konkreetsele inimesele", "WhatsApp, veeb või telefon, kui pood ise neid kasutab"],
      footerNote: "«Näidisbarber» on väljamõeldud, mitte päris meestejuuksur. Ükski hind ega aeg ei ole päris. Midagi ei broneerita, ei salvestata ega saadeta.",
      chat: [
        ["in", "Tere, kas homme pärast tööd on aega lõikuseks ja habeme ajamiseks?"],
        ["out", "Tere. Võin selle näitena kirja panna: homme, lõikus ja habe.\nSee leht ei helista ega ava WhatsAppi."],
        ["in", "Näidiskülaline. Kui ma ei saa tulla, kas saan aega muuta?"],
        ["out", "Aitäh. Ainult näidis: homme, lõikus ja habe. Muutmise või tühistamise kinnitaks meeskond. Sellelt lehelt ei saadetud midagi."],
      ],
      rules: [
        { id: "cut", button: "Kas teete juukselõikust?", keys: ["lõikus", "juukse"], text: "Jah. Selles näites on meeste juukselõikus üks teenus. Päris pood kasutaks enda nimekirja. Siin ei anta aega." },
        { id: "beard", button: "Kas teete habet?", keys: ["habe", "habeme"], text: "Jah. Selles näites saab habet kujundada koos lõikusega või eraldi. Täpse aja kinnitaks meeskond. Siin ei broneerita midagi." },
        { id: "shave", button: "Kas teete raseerimist?", keys: ["raseeri"], text: "Jah. Selles näites on raseerimine eraldi teenus. See leht ei kirjelda, kuidas seda tehakse, ega anna aega." },
        { id: "hours", button: "Mis kell olete avatud?", keys: ["avatud", "lahti", "kell"], text: "See näidis on avatud teisipäevast reedeni kell 10.00–19.00 ja laupäeval kell 10.00–15.00. Need on näidistunnid, mitte päris kalender." },
        { id: "change", button: "Tahan aega muuta või tühistada.", keys: ["muuta", "tühista", "tühistada"], hand: true, text: "Muutmise või tühistamise võtaks meeskond. See näidis ei kinnita vaba aega ega tühista midagi. Midagi ei saadetud." },
      ],
    },
    en: {
      title: "Example chat for a men’s barber · BOLLA STUDIO",
      bannerBefore: "Example chat for a men’s barber, prepared by",
      bannerAfter: "“Example Barber” is fictional, not a real shop. No real appointments. This chat is a scripted example, not a live assistant.",
      tag: "Example Barber, a fictional men’s barber",
      h1: "Example: cut, beard and shave",
      intro: "This scripted chat shows questions for a men’s barber: a cut, a beard, a shave, opening hours, and changing or cancelling a time. The wish is noted as an example. The team would confirm the time. This page does not.",
      chatTitle: "Example Barber · example desk",
      askPlaceholder: "For example: Do you do beards?",
      formTitle: "Time request, shown as an example",
      formNote: "This is how a chat can note a wish. The team would confirm or change the time. This page does not.",
      itemLabel: "Service",
      items: ["Haircut", "Beard", "Cut and beard", "Shave"],
      slotLabel: "Time of day",
      slots: dayEn,
      cta: "Note the wish as an example",
      leftTitle: "What this example chat shows",
      leftItems: ["A cut, a beard and a shave", "Opening hours as sample hours", "A wish with a date and a time of day", "A change or a cancellation as a note"],
      rightTitle: "What stays with the team",
      rightItems: ["Confirming the exact time", "Changes and cancellations", "A price for a particular person", "WhatsApp, the website or the phone, if the shop uses them"],
      footerNote: "“Example Barber” is fictional, not a real men’s barber. No price or time is real. Nothing is booked, stored, or sent.",
      chat: [
        ["in", "Hello, do you have time tomorrow after work for a cut and a beard?"],
        ["out", "Hello. I can note tomorrow, a cut and a beard, as an example.\nThis page does not place a call and does not open WhatsApp."],
        ["in", "Sample Guest. If I cannot come, can I change the time?"],
        ["out", "Thank you. Example note only: tomorrow, cut and beard. The team would confirm a change or a cancellation. Nothing was sent from this page."],
      ],
      rules: [
        { id: "cut", button: "Do you cut hair?", keys: ["cut", "haircut"], text: "Yes. In this example a men’s haircut is one service. A real shop would use its own list. Nothing here is booked." },
        { id: "beard", button: "Do you do beards?", keys: ["beard"], text: "Yes. In this example a beard can be shaped with a cut or on its own. The team would confirm the time. Nothing here is booked." },
        { id: "shave", button: "Do you shave?", keys: ["shave"], text: "Yes. In this example a shave is a separate service. This page does not describe the method and does not give a time." },
        { id: "hours", button: "When are you open?", keys: ["open", "hours"], text: "This example is open Tuesday to Friday, 10:00 a.m. to 7:00 p.m., and Saturday, 10:00 a.m. to 3:00 p.m. These are sample hours, not a live calendar." },
        { id: "change", button: "I want to change or cancel.", keys: ["change", "cancel"], hand: true, text: "The team would handle a change or a cancellation. This example does not confirm a free time and does not cancel anything. Nothing was sent." },
      ],
    },
  },
  {
    slug: "charter",
    codes: ["et", "en"],
    fallback: "et",
    comment: "Tallinn sailing example. Not /charter-de/. Not an operator site. Language",
    et: {
      title: "Näidisvestlus purjetamise kohta Tallinnas · BOLLA STUDIO",
      bannerBefore: "Näidisvestlus purjetamise ja jahtide laenutuse kohta Tallinnas. Selle koostas",
      bannerAfter: "«Näidispurje» on väljamõeldud, mitte päris operaator. Päris väljumist ei kinnitata. See vestlus on kirjutatud näidis, mitte reaalajas abiline.",
      tag: "Näidispurje, väljamõeldud näide Tallinnas",
      h1: "Näidis: jaht, katamaraan või purjekursus",
      intro: "See kirjutatud vestlus näitab Tallinna näidist: päevane laenutus, purjekursus, kuupäev ja inimeste arv. Ilm on ainult see, mida ettevõte ise ütleks. See leht ei garanteeri ilma ega kellaaega. Meeskond kinnitaks, kas sõit on võimalik. See leht ei kinnita.",
      chatTitle: "Näidispurje · näidispäring",
      askPlaceholder: "Näiteks: Kas on purjekursust?",
      formTitle: "Päring näitena",
      formNote: "Nii saab vestlus kuupäeva ja seltskonna kirja panna. Meeskond ütleks, kas see on võimalik. See leht ei kinnita väljumist.",
      itemLabel: "Soov",
      items: ["Päevane laenutus", "Purjekursus", "Katamaraani päring"],
      slotLabel: "Kellaaeg näitena",
      slots: dayEt,
      cta: "Pane päring näitena kirja",
      leftTitle: "Mida see näidisvestlus näitab",
      leftItems: ["Jaht või katamaraan päringuna", "Purjekursus päringuna", "Kuupäev ja inimeste arv", "Ilm ettevõtte infona, ilma garantiita"],
      rightTitle: "Mis jääb meeskonnale",
      rightItems: ["Kas sõit on võimalik", "Muutmine ja tühistamine", "Hind ja kohtade arv", "Ohutusreeglid, mida see näidis välja ei mõtle"],
      footerNote: "«Näidispurje» on väljamõeldud, mitte päris prahtija ega kool. Ükski hind, koht ega väljumisaeg ei ole päris. Midagi ei broneerita, ei salvestata ega saadeta. See ei ole leht /charter-de/.",
      chat: [
        ["in", "Tere, kas laupäeval on vaba katamaraan neljale inimesele?"],
        ["out", "Tere. Võin selle näitena kirja panna: laupäev, neli inimest, katamaraan.\nSee leht ei kinnita vaba kohta ega kellaaega."],
        ["in", "Näidiskülaline. Mis saab siis, kui ilm on halb?"],
        ["out", "Aitäh. Ilma ütleks ettevõte ise. See näidis ei garanteeri sõitu ega kellaaega. Meeskond ütleks, kas plaan jääb või muutub. Sellelt lehelt ei saadetud midagi."],
      ],
      rules: [
        { id: "yacht", button: "Kas saab küsida jahti või katamaraani?", keys: ["jaht", "katamaraan"], text: "Jah. Selles näites saab küsida päevast laenutust jahile või katamaraanile. Vaba kohta ja hinda see leht ei tea. Meeskond vastaks." },
        { id: "course", button: "Kas on purjekursust?", keys: ["kursus", "purje"], text: "Selles näites saab purjekursuse kohta küsida. Kuupäeva ja taseme kinnitaks meeskond. Siin ei panda kedagi kursusele kirja." },
        { id: "party", button: "Meid on neli. Kas kuupäev sobib?", keys: ["neli", "kuupäev", "inimest"], text: "Inimeste arvu ja kuupäeva saab näitena kirja panna. Kas see päev sobib, ütleks meeskond. See leht ei kinnita." },
        { id: "weather", button: "Mis saab halva ilma korral?", keys: ["ilm", "tuul", "vihm"], hand: true, text: "Ilma vaataks ettevõte ise. See näidis ei garanteeri ilma, väljumist ega kellaaega. Otsuse ütleks meeskond. Midagi ei saadetud." },
        { id: "safety", button: "Kuidas on ohutus ja varustus?", keys: ["ohutus", "vest", "varustus"], hand: true, text: "Ohutuse ja varustuse selgitaks meeskond oma reeglite järgi. See näidis ei anna tehnilist ega ohutusjuhendit. Midagi ei saadetud." },
      ],
    },
    en: {
      title: "Example chat for sailing in Tallinn · BOLLA STUDIO",
      bannerBefore: "Example chat for sailing and boat hire in Tallinn, prepared by",
      bannerAfter: "“Example Sailing” is fictional, not a real operator. No departure is confirmed. This chat is a scripted example, not a live assistant.",
      tag: "Example Sailing, a fictional Tallinn example",
      h1: "Example: a yacht, a catamaran or a sailing course",
      intro: "This scripted chat shows a Tallinn example: a day hire, a sailing course, a date and the number of people. Weather is only what the company itself would say. This page does not guarantee the weather or a departure time. The team would say whether a trip is possible. This page does not.",
      chatTitle: "Example Sailing · example enquiry",
      askPlaceholder: "For example: Is there a sailing course?",
      formTitle: "Enquiry, shown as an example",
      formNote: "This is how a chat can note a date and a party. The team would say whether it is possible. This page does not confirm a departure.",
      itemLabel: "Request",
      items: ["Day hire", "Sailing course", "Catamaran enquiry"],
      slotLabel: "Time of day, as an example",
      slots: dayEn,
      cta: "Note the enquiry as an example",
      leftTitle: "What this example chat shows",
      leftItems: ["A yacht or catamaran as an enquiry", "A sailing course as an enquiry", "A date and the number of people", "Weather as company information, with no guarantee"],
      rightTitle: "What stays with the team",
      rightItems: ["Whether a trip is possible", "Changes and cancellations", "Price and how many places", "Safety rules, which this example does not invent"],
      footerNote: "“Example Sailing” is fictional, not a real charter company or school. No price, place or departure time is real. Nothing is booked, stored, or sent. This is not the page /charter-de/.",
      chat: [
        ["in", "Hello, is a catamaran free on Saturday for four people?"],
        ["out", "Hello. I can note Saturday, four people, a catamaran, as an example.\nThis page does not confirm a free place or a departure time."],
        ["in", "Sample Guest. What if the weather is bad?"],
        ["out", "Thank you. The company would speak about the weather. This example does not guarantee the trip or a departure time. The team would say whether the plan stays or changes. Nothing was sent from this page."],
      ],
      rules: [
        { id: "yacht", button: "Can we ask about a yacht or a catamaran?", keys: ["yacht", "catamaran"], text: "Yes. In this example you can ask about a day hire of a yacht or a catamaran. This page does not know if a place is free or what it costs. The team would answer." },
        { id: "course", button: "Is there a sailing course?", keys: ["course", "sailing"], text: "In this example you can ask about a sailing course. The team would confirm the date and the level. Nobody is enrolled from this page." },
        { id: "party", button: "There are four of us. Does the date work?", keys: ["four", "date", "people"], text: "The number of people and the date can be noted as an example. The team would say whether that day works. This page does not confirm it." },
        { id: "weather", button: "What if the weather is bad?", keys: ["weather", "wind", "rain"], hand: true, text: "The company would look at the weather. This example does not guarantee the weather or a departure time. The team would decide. Nothing was sent." },
        { id: "safety", button: "What about safety and equipment?", keys: ["safety", "lifejacket", "equipment"], hand: true, text: "The team would explain safety and equipment under their own rules. This example does not give a technical or safety manual. Nothing was sent." },
      ],
    },
  },
  {
    slug: "marina-pirita",
    codes: ["et"],
    fallback: "et",
    comment: "Generic marina example for an Estonian conversation. Not a hotel. Not an official marina website. Language",
    et: {
      title: "Näidisvestlus jahisadama kohta · BOLLA STUDIO",
      bannerBefore: "Jagatav näidisvestlus jahisadama kohta. Selle koostas",
      bannerAfter: "«Näidissadam» on väljamõeldud. See ei ole Pirita sadama ega ühegi teise sadama ametlik leht. See ei ole hotell. Päris kohta ei anta.",
      tag: "Näidissadam, väljamõeldud jahisadam",
      h1: "Näidis: külaliskoht jahisadamas",
      intro: "See kirjutatud vestlus on üldine näide sadamapäringust. Seda võib näidata vestluses Pirita kandi sadama kohta. Siin ei ole ühegi ettevõtte hindu, kohanumbreid ega muid päris andmeid. Meeskond kinnitaks, kas külaliskoht on võimalik. See leht ei kinnita. See ei ole hotell.",
      chatTitle: "Näidissadam · näidispäring",
      askPlaceholder: "Näiteks: Kas külaliskohta saab küsida?",
      formTitle: "Külaliskoha soov näitena",
      formNote: "Nii saab vestluse soovi kirja panna. Sadama meeskond ütleks, kas koht on võimalik. See leht ei anna kohta.",
      itemLabel: "Soov",
      items: ["Külaliskoht", "Küsimus meeskonnale"],
      slotLabel: "Kellaaeg näitena",
      slots: dayEt,
      cta: "Pane soov näitena kirja",
      leftTitle: "Mida see näidisvestlus näitab",
      leftItems: ["Külaliskoha päring", "Kuupäev märkusena", "Elekter, dušš ja kütus küsimusena meeskonnale", "Vastus, et see ei ole hotell"],
      rightTitle: "Mis jääb meeskonnale",
      rightItems: ["Kas koht on vaba", "Hind ja tingimused", "Elekter, vesi, dušš ja kütus", "Iga tehniline küsimus, mida see näidis välja ei mõtle"],
      footerNote: "«Näidissadam» on väljamõeldud. See ei ole Pirita sadama ametlik leht ega hotell. Ükski koht, hind ega kellaaeg ei ole päris. Midagi ei broneerita, ei salvestata ega saadeta.",
      chat: [
        ["in", "Tere, kas reedeks saab küsida külaliskohta?"],
        ["out", "Tere. Võin selle näitena kirja panna: reede, külaliskoht.\nSee leht ei tea, kas koht on vaba, ega ütle hinda."],
        ["in", "Näidiskülaline. Kas sadamas on elekter ja dušš?"],
        ["out", "Aitäh. Elektri, duši ja kütuse kohta vastaks meeskond. See näidis ei anna numbreid ega juhendit. See ei ole hotell. Sellelt lehelt ei saadetud midagi."],
      ],
      rules: [
        { id: "berth", button: "Kas külaliskohta saab küsida?", keys: ["külalis", "koht", "kai"], text: "Jah. Selles näites saab külaliskohta küsida. Kas see on vaba, ütleks meeskond. Siin ei anta kohta ega hinda." },
        { id: "services", button: "Kas on elekter, dušš või kütus?", keys: ["elekter", "dušš", "kütus"], hand: true, text: "Elektri, vee, duši ja kütuse kohta vastaks meeskond. See näidis ei ütle, kas need on olemas, ega anna hinda ega juhendit. Midagi ei saadetud." },
        { id: "hotel", button: "Kas see on hotell?", keys: ["hotell", "tuba"], text: "Ei. See näidis on jahisadama vestlus, mitte hotell ja mitte tuba. Majutuse näidis on eraldi lehel /hotel/." },
        { id: "hours", button: "Mis kell kontor on avatud?", keys: ["avatud", "kell", "kontor"], text: "Lahtiolekuaega see näidis ei tea. Meeskond ütleks oma aja. Siin ei ole näidistundi, mida saaks pidada päris graafikuks." },
        { id: "change", button: "Tahan soovi muuta.", keys: ["muuta", "tühista"], hand: true, text: "Muutmise võtaks meeskond. See näidis ei kinnita kohta ega tühista midagi. Midagi ei saadetud." },
      ],
    },
  },
];

const feats = {
  et: [
    { t: "Eesti keel sellel lehel", d: "See leht vastab eesti keeles. Kui inglise näidis on olemas, on see eraldi lehel. Siin ei ole reaalajas tõlki ega hääleassistenti." },
    { t: "Ainult näidisfaktid", d: "Vastused on väljamõeldud näidis. Need ei ole päris ettevõtte hinnad, kohad ega reeglid." },
    { t: "Meeskond otsustaks", d: "Tellitud vestluses antaks andmed meeskonnale. See nupp ei saada neid, ei helista ega broneeri midagi." },
  ],
  en: [
    { t: "English on this page", d: "This page answers in English. The Estonian example is a separate page. There is no live interpreter and no voice assistant here." },
    { t: "Sample facts only", d: "Answers are a fictional example. They are not a real business’s prices, places or rules." },
    { t: "The team would decide", d: "In a commissioned chat, the details would be handed to the team. This button does not send them, does not call, and does not book." },
  ],
};

for (const page of pages) {
  for (const code of page.codes) {
    const ui = estoniaUi[code];
    const copy = page[code];
    const html = withCampaign(renderPage({
      ...ui,
      ...copy,
      lang: code,
      slug: page.slug,
      avatar: code === "et" ? "N" : "E",
      lead: 2,
      feats: page.slug === "marina-pirita" ? [
        { t: "Eesti keel sellel lehel", d: "See leht on ainult eesti keeles. Siin ei ole reaalajas tõlki ega hääleassistenti." },
        { t: "Ainult näidisfaktid", d: "Vastused on väljamõeldud näidis. Need ei ole päris sadama hinnad, kohad ega reeglid." },
        { t: "Meeskond otsustaks", d: "Tellitud vestluses antaks andmed meeskonnale. See nupp ei saada neid, ei helista ega broneeri midagi." },
      ] : feats[code],
      steps: ui.steps,
      notice: ui.notice,
      voice: ui.voice,
      fallback: ui.fallback,
      empty: ui.empty,
      pick: ui.pick,
      ok: ui.ok,
      footerNote: `${copy.footerNote} ${ui.notWebsite}`,
      months: ui.months,
      dateStyle: ui.dateStyle,
      fields: {
        nameLabel: ui.nameLabel,
        namePh: ui.namePh,
        contactLabel: ui.contactLabel,
        contactPh: ui.contactPh,
        localOnly: ui.localOnly,
        dateLabel: ui.dateLabel,
        itemLabel: copy.itemLabel,
        items: copy.items,
        slotLabel: copy.slotLabel,
        slots: copy.slots,
        cta: copy.cta,
      },
      columns: {
        leftTitle: copy.leftTitle,
        leftItems: copy.leftItems,
        rightTitle: copy.rightTitle,
        rightItems: copy.rightItems,
      },
      langs: langsFor(page.codes, code),
      langNavLabel: ui.langNavLabel,
      trackBase: `/bolla-demo-${page.slug}/${code}`,
      trackTitle: `${page.slug} demo ${code}`,
      comment: `${page.comment} ${code}. Use et, not ee. ?p= is not personalization.`,
    }));
    const dir = join(root, page.slug, code);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  }
  writeFileSync(join(root, page.slug, "index.html"), indexHtml({
    title: page.et.title,
    codes: page.codes,
    fallback: page.fallback,
  }));
  console.log("wrote", page.slug, page.codes.join(" "));
}
