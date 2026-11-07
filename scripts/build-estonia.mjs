import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage } from "./sector-page.mjs";
import { LANGS, estoniaUi } from "./estonia-ui.mjs";
import { estoniaSectors } from "./estonia-sectors.mjs";
import { estoniaRest } from "./estonia-sectors-rest.mjs";
import { estoniaMore } from "./estonia-sectors-more.mjs";
import { estoniaLast } from "./estonia-sectors-last.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sectors = [...estoniaSectors, ...estoniaRest, ...estoniaMore, ...estoniaLast];

function langsFor(current) {
  return LANGS.map((lang) => ({
    href: lang.code === current ? "./" : `../${lang.code}/`,
    code: lang.code,
    label: lang.label,
    current: lang.code === current,
  }));
}

function indexHtml(sector) {
  return `<!doctype html>
<!-- Neutral example for Estonia prospecting. Language code et, not ee. Not the Swiss demo at /${sector.swiss}/. Tourism, industry and yachting are not this page. -->
<html lang="en" translate="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="google" content="notranslate">
<title>${sector.en.chatTitle} · BOLLA STUDIO</title>
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","DejaVu Sans",Arial,sans-serif;background:#f4f2ee;color:#1c1c1c}
main{max-width:36rem;margin:0 auto;padding:24px 16px}
.brand{font-weight:800;letter-spacing:.08em}
nav{display:flex;flex-direction:column;gap:8px;margin-top:16px}
nav a{display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:12px;background:#7a1f2b;color:#fff;font-weight:700;text-decoration:none;font-size:18px}
.by a{color:#7a1f2b}
</style>
<script>
(function(){
  var supported=["et","ru","en"];
  var q=new URLSearchParams(location.search);
  var requested=(q.get("lang")||"").toLowerCase();
  function browserLang(){
    var list=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||"en"];
    for(var i=0;i<list.length;i++){
      var code=String(list[i]||"").toLowerCase().split("-")[0];
      if(supported.indexOf(code)>=0) return code;
    }
    return "en";
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
    <a href="et/" lang="et" data-keep-query>Eesti</a>
    <a href="ru/" lang="ru" data-keep-query>Русский</a>
    <a href="en/" lang="en" data-keep-query>English</a>
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

for (const sector of sectors) {
  for (const code of ["et", "ru", "en"]) {
    const ui = estoniaUi[code];
    const copy = sector[code];
    const html = renderPage({
      ...ui,
      ...copy,
      lang: code,
      slug: sector.slug,
      avatar: sector.avatar,
      lead: sector.lead,
      feats: ui.feats,
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
      langs: langsFor(code),
      langNavLabel: ui.langNavLabel,
      trackBase: `/bolla-demo-${sector.slug}/${code}`,
      trackTitle: `${sector.slug} demo ${code}`,
      comment: `Neutral example. Language ${code}. Not the Swiss demo /${sector.swiss}/. Use et, not ee.`,
    });
    const dir = join(root, sector.slug, code);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  }
  writeFileSync(join(root, sector.slug, "index.html"), indexHtml(sector));
  console.log("wrote", sector.slug, "et ru en");
}

if (sectors.length !== 10) throw new Error("expected 10 sectors, got " + sectors.length);
