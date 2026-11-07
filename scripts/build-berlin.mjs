import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage } from "./sector-page.mjs";
import { berlinSectors, berlinUi } from "./berlin-de-content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const labels = { de: "Deutsch", en: "English" };

function langsFor(current) {
  return ["de", "en"].map((code) => ({
    href: code === current ? "./" : `../${code}/`,
    code,
    label: labels[code],
    current: code === current,
  }));
}

function indexHtml(sector) {
  return `<!doctype html>
<!-- Berlin static example. German is the primary page. Not an official operator site. Not Lagoon 42. -->
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${sector.de.chatTitle} · BOLLA STUDIO</title>
<script>location.replace("de/"+location.search+location.hash)</script>
</head>
<body>
<p>BOLLA STUDIO · Marcelo Bolla · <a href="https://bollastudio.com">bollastudio.com</a></p>
<p><a href="de/">Deutsch</a> · <a href="en/">English</a></p>
</body></html>
`;
}

for (const sector of berlinSectors) {
  for (const code of ["de", "en"]) {
    const ui = berlinUi[code];
    const copy = sector[code];
    const html = renderPage({
      ...ui,
      ...copy,
      lang: code,
      avatar: sector.avatar,
      lead: sector.lead,
      voice: copy.voice || ui.voice,
      feats: ui.feats,
      steps: ui.steps,
      notice: ui.notice,
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
      comment: sector.slug === "charter-de"
        ? `Static charter example ${code}. Not an operator website. Not the Lagoon 42 onboard manual.`
        : `Static Berlin example ${sector.slug} ${code}. Not an operator website.`,
    });
    const dir = join(root, sector.slug, code);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  }
  writeFileSync(join(root, sector.slug, "index.html"), indexHtml(sector));
  console.log("wrote", sector.slug);
}
