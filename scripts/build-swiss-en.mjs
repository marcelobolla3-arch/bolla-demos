import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage } from "./sector-page.mjs";
import { swissEnPages } from "./swiss-en-content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const LABELS = { de: "Deutsch", en: "English", fr: "Français", it: "Italiano" };
const ARIA = { de: "Sprache", fr: "Langue", it: "Lingua", en: "Language" };

function langsFor(slug, current) {
  const codes = ["de", "en", "fr"];
  if (slug === "tierarzt-ch") codes.push("it");
  return codes.map((code) => ({
    href: code === current ? "./" : `../${code}/`,
    code,
    label: LABELS[code],
    current: code === current,
  }));
}

for (const page of swissEnPages) {
  const html = renderPage({ ...page, langs: langsFor(page.slug, "en"), langNavLabel: "Language" });
  const dir = join(root, page.slug, "en");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  console.log("wrote", page.slug + "/en/index.html");
}

const CSS = ".top .lang{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:8px}.top .lang a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:8px 14px;background:#243640;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none}";
const LANG_SCRIPT = `<script id="bolla-lang-links">
document.querySelectorAll("[data-keep-query]").forEach(function(a){
  try{var u=new URL(a.getAttribute("href"),location.href);a.href=u.pathname+location.search+location.hash;}catch(e){}
});
</script>
`;

function nav(slug, current) {
  return `<nav class="lang" aria-label="${ARIA[current]}">${langsFor(slug, current)
    .map((l) => `<a href="${l.href}" hreflang="${l.code}" lang="${l.code}" data-keep-query${l.current ? ' aria-current="page"' : ""}>${l.label}</a>`)
    .join("")}</nav>`;
}

for (const page of swissEnPages) {
  const codes = ["de", "fr"];
  if (page.slug === "tierarzt-ch") codes.push("it");
  for (const code of codes) {
    const file = join(root, page.slug, code, "index.html");
    let html = readFileSync(file, "utf8");
    if (!html.includes(".top .lang{")) {
      html = html.replace(".top a{color:#fff}", ".top a{color:#fff}" + CSS);
    }
    if (!html.includes('class="lang"')) {
      const needle = "</div>\n<header>";
      if (!html.includes(needle)) throw new Error("top/header marker missing in " + file);
      html = html.replace(needle, "\n" + nav(page.slug, code) + "</div>\n<header>");
    }
    if (!html.includes('id="bolla-lang-links"')) {
      if (!html.includes("</body></html>")) throw new Error("body close missing in " + file);
      html = html.replace("</body></html>", LANG_SCRIPT + "</body></html>");
    }
    writeFileSync(file, html);
    console.log("linked", page.slug + "/" + code);
  }
  const indexFile = join(root, page.slug, "index.html");
  let index = readFileSync(indexFile, "utf8");
  if (!index.includes('href="en/"')) {
    index = index.replace('<a href="de/">Deutsch</a> · <a href="fr/">Français</a>', '<a href="de/">Deutsch</a> · <a href="en/">English</a> · <a href="fr/">Français</a>');
  }
  if (!index.includes('location.replace("de/"+location.search)')) {
    throw new Error("root redirect changed unexpectedly: " + page.slug);
  }
  writeFileSync(indexFile, index);
  console.log("root", page.slug);
}
