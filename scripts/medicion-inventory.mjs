/**
 * Inventory of demo pages and the GoatCounter paths they send.
 * `node scripts/medicion-inventory.mjs` rewrites docs/medicion.md.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function walkIndex(root) {
  const out = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (name.startsWith(".") || name === "node_modules") continue;
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name === "index.html") out.push(path);
    }
  }
  walk(root);
  return out.sort();
}

function relative(root, file) {
  return file.slice(root.length).replace(/^\/+/, "");
}

function publicPath(rel) {
  if (rel === "index.html") return "/";
  return `/${rel.slice(0, -"index.html".length)}`;
}

function calls(html) {
  const out = [];
  const re = /bsTrack\s*\(/g;
  let match;
  while ((match = re.exec(html))) {
    const before = html.slice(Math.max(0, match.index - 40), match.index);
    if (/function\s*$/.test(before) || /=\s*$/.test(before)) continue;
    let i = match.index + match[0].length;
    let depth = 1;
    let buf = "";
    while (i < html.length && depth) {
      const ch = html[i++];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      if (depth) buf += ch;
    }
    out.push(buf.trim());
  }
  return out;
}

function splitArgs(buf) {
  const args = [];
  let depth = 0;
  let cur = "";
  for (const ch of buf) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

function normPath(expr) {
  const source = expr.trim();
  const literal = source.match(/^(['"])([\s\S]*)\1$/);
  if (literal) return literal[2];
  const rules = [
    [/["']\/chat\/["']\s*\+\s*r\.id\b/, "/chat/{id}"],
    [/["']\/chat\/["']\s*\+\s*i\b/, "/chat/{id}"],
    [/["']\/chat\/["']\s*\+\s*lang\s*\+\s*["']\/["']\s*\+/, "/chat/{lang}/{button}"],
    [/["']\/chat\/["']\s*\+\s*(?:q|x\[0\])\.toLowerCase\(\)/, "/chat/{button}"],
    [/["']\/scene\/["']\s*\+\s*[A-Za-z]\b/, "/scene/{id}"],
    [/["']\/tab\/["']\s*\+/, "/tab/{id}"],
    [/["']\/flow\/["']\s*\+\s*f\b/, "/flow/{id}"],
    [/["']\/step\/["']\s*\+\s*o\[2\]/, "/step/{id}"],
    [/["']\/informe\/["']\s*\+/, "/informe/{id}"],
    [/["']\/lang-auto\/["']\s*\+/, "/lang-auto/{id}"],
    [/["']\/lang\/["']\s*\+/, "/lang/{id}"],
    [/["']\/ask\/["']\s*\+/, "/ask/{lang}/{id}"],
    [/["']\/scenario\/["']\s*\+/, "/scenario/{lang}/{n}"],
    [/window\.BS\.slug\s*\+\s*["']\/q-["']/, "/{p}/q-{topic}"],
    [/["']\/ambarra\/voice-lang-["']\s*\+/, "/ambarra/voice-lang-{lang}"],
    [/page\s*\+\s*["']-play["']/, "{visit}-play"],
    [/["']\/["']\s*\+\s*id\b/, "/{section}"],
    [/getAttribute\(\s*["']data-track["']\s*\)/, "{data-track}"],
  ];
  for (const [pattern, label] of rules) {
    if (pattern.test(source)) return label;
  }
  return source;
}

function normTitle(expr) {
  const source = (expr || "").trim();
  const literal = source.match(/^(['"])([\s\S]*)\1$/);
  if (literal) return literal[2];
  const prefixed = source.match(/^(['"])([^'"]*)\1\s*\+/);
  if (prefixed) return `${prefixed[2]}{…}`;
  if (/data-title/.test(source)) return "{data-title}";
  if (/b\.id/.test(source)) return "Booking request {id}";
  if (source === "o[0]") return "{button}";
  return source.length < 48 ? source : "etiqueta fija";
}

function dataTracks(html) {
  const paths = [...html.matchAll(/data-track="([^"]+)"/g)].map((match) => match[1]);
  const titles = [...html.matchAll(/data-title="([^"]+)"/g)].map((match) => match[1]);
  return paths.map((path, index) => `${path} · ${titles[index] || "example"}`);
}

function sectionIds(html) {
  return [...html.matchAll(/go\('([a-z0-9-]+)'/g)].map((match) => `/${match[1]} · section`);
}

function visitBase(visit) {
  const first = visit.split(" | ")[0];
  return first.replace(/\?p=\{p\}$/, "").replace(/\/$/, "");
}

function crottaEvents(html) {
  if (!html.includes("crotta-runtime.js")) return [];
  if (html.includes('id="crotta-chat"')) {
    return [
      ["/response/{lang}", "chat-response"],
      ["/error/{lang}", "chat-error"],
    ];
  }
  return [
    ["/connected/{lang}", "voice-connected"],
    ["/ended/{lang}", "voice-ended"],
    ["/error/{lang}", "voice-error"],
  ];
}

export function eventsOf(html, visit = "") {
  const pairs = [];
  for (const call of calls(html)) {
    const [pathExpr, titleExpr] = splitArgs(call);
    const path = normPath(pathExpr || "");
    if (path === "{data-track}") {
      for (const row of dataTracks(html)) {
        const split = row.split(" · ");
        pairs.push([split[0], split.slice(1).join(" · ")]);
      }
      continue;
    }
    if (path === "/{section}") {
      const sections = sectionIds(html);
      for (const row of sections.length ? sections : ["/{section} · section"]) {
        const split = row.split(" · ");
        pairs.push([split[0], split.slice(1).join(" · ")]);
      }
      continue;
    }
    pairs.push([path, normTitle(titleExpr)]);
  }
  for (const pair of crottaEvents(html)) pairs.push(pair);
  const base = visitBase(visit);
  const join = /(?:BASE|PREFIX)\+sub/.test(html);
  const queryStyle = visit.includes("?p=");
  return [...new Set(pairs.map(([path, title]) => {
    if (path === "{visit}-play") {
      const alts = visit.split(" | ").map((item) => `${item}-play`);
      return `${alts.join(" | ")} · ${title}`;
    }
    let full = path;
    if (join && base && full.startsWith("/") && !full.startsWith(`${base}/`) && full !== base) full = base + full;
    if (queryStyle && !full.includes("?p=")) full += "?p={p}";
    return `${full} · ${title}`;
  }))];
}

function quoted(html, name) {
  const match = html.match(new RegExp(`var ${name}=(['"])([^'"]+)\\1`));
  return match ? match[2] : "";
}

export function visitOf(html, rel) {
  if (rel === "nautica/index.html") return "/{p|lagoon42}/demo";
  if (rel === "nautica-cat/index.html") return "/{p|cat42}/demo";
  if (rel === "es/index.html") return "/demo-es-general | /{p}/demo-es-general";
  const video = html.match(/var page=s\?"\/"\+s\+"\/(video-[a-z]+)"/);
  if (video) return `/${video[1]} | /{p}/${video[1]}`;
  if (html.includes("'/schloss-wuelflingen/voice'")) return "/schloss-wuelflingen/voice?p={p}";
  if (html.includes('"/PROSPECTO/voice"')) return "/PROSPECTO/voice?p={p}";
  const base = quoted(html, "BASE");
  if (base) return `${base}/?p={p}`;
  const prefix = quoted(html, "PREFIX");
  if (prefix) return `${prefix}/?p={p}`;
  return "";
}

export function isRedirect(html) {
  return /location\.replace\(/.test(html) && !html.includes("bollastudio.goatcounter.com/count");
}

export function inventory(root) {
  return walkIndex(root).map((file) => {
    const rel = relative(root, file);
    const html = readFileSync(file, "utf8");
    const route = publicPath(rel);
    if (rel === "index.html") {
      return { route, rel, kind: "portada", visit: "", events: [] };
    }
    if (isRedirect(html)) {
      return { route, rel, kind: "redireccion", visit: "", events: [] };
    }
    const visit = visitOf(html, rel);
    return { route, rel, kind: "demo", visit, events: eventsOf(html, visit) };
  });
}

function cell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function renderDoc(root) {
  const rows = inventory(root);
  const demos = rows.filter((row) => row.kind === "demo");
  const redirects = rows.filter((row) => row.kind === "redireccion");
  const withUse = demos.filter((row) => row.events.length);
  const visitOnly = demos.filter((row) => !row.events.length);
  const missingVisit = demos.filter((row) => !row.visit);
  if (missingVisit.length) {
    throw new Error(`sin visita: ${missingVisit.map((row) => row.rel).join(", ")}`);
  }
  const table = [
    "| Ruta | Visita | Uso |",
    "| --- | --- | --- |",
    ...demos.map((row) => `| ${cell(row.route)} | ${cell(row.visit)} | ${cell(row.events.length ? row.events.join("; ") : "solo visita")} |`),
  ].join("\n");
  const redirectList = redirects.map((row) => `\`${row.route}\``).join(", ");
  return `# Medición

Cada visita a una demo queda en una de tres clases:

- **Prospecto.** La dirección trae un \`?p=\` real. El valor se pasa a minúsculas y se dejan solo \`a-z\`, \`0-9\` y el guion, con un máximo de 60 caracteres. Si después de eso queda texto y no empieza por \`bmaudit-\`, la visita y los usos llevan \`?p=\` con ese valor.
- **Interno.** El navegador está marcado, o \`p\` (o, si no hay \`p\`, \`link_id\`) empieza por \`bmaudit-\`. No se envía nada al contador.
- **Desconocido.** No hay marca interna y no hay \`p\` usable. Se cuenta la visita sin \`?p=\`. No se inventa una persona.

La misma URL que ya se envió a un prospecto sigue contando igual cuando \`p\` ya era \`a-z\`, \`0-9\` y guion. Un \`p\` con mayúsculas, espacios u otros signos se agrupa en la forma saneada, que es la que los usos ya usaban.

## El interno no entra en las métricas externas

Una visita interna no carga \`https://gc.zgo.at/count.js\` y no llama a \`count\`. No se anota bajo \`/_internal/\` ni bajo otro prefijo.

Un prefijo seguiría en el mismo GoatCounter. Un total, un export o un listado de todas las rutas lo sumaría si alguien no filtra. No cargar el script no puede mezclarse con las visitas externas. Las pruebas del repositorio ya exigen que \`?internal=1\` no inserte el script. Las URL ya enviadas no cambian: sin la marca, \`?p=\` sigue contando.

GoatCounter no recibe la visita. La clase «interno» vive solo en ese navegador.

## Cómo marcar un dispositivo

Abrir cualquier demo, una sola vez, con \`?internal=1\` o \`?interno=1\` (también vale en el hash, \`#internal=1\` o \`#interno=1\`).

Eso guarda dos cosas, las dos de primera parte, en el propio sitio:

- \`localStorage\` clave \`skipgc\`, valor \`t\`
- cookie \`bolla_internal=1\`, \`Path=/\`, \`SameSite=Lax\`, \`Max-Age=34560000\` (400 días), \`Secure\` solo si la página es \`https:\`. Sin \`Domain\`, así que el host es el de la página. En \`demo.bollastudio.com\` vale para todas las demos de ese host. No hay cookie de terceros.

Si solo queda una de las dos, la siguiente visita repone la otra. Para quitar la marca: \`?internal=0\` o \`?interno=0\`. Si los dos parámetros vienen juntos, gana el que aparece más tarde en la dirección.

Un \`p\` o un \`link_id\` que, ya saneado, empieza por \`bmaudit-\` también es interno y deja la marca. Sirve para las pruebas de auditoría. No hay que mandar ese prefijo a un prospecto: el navegador que lo abra deja de contarse hasta que alguien pase \`?internal=0\` o \`?interno=0\`. Si la misma dirección trae el apagado (\`internal=0\` o \`interno=0\`) y además \`bmaudit-\`, esa visita no se envía, pero la marca persistente sí se borra.

Las entradas que solo redirigen (\`/hotel/\`, \`/charter/\`, …) reenvían la búsqueda y el hash. La marca la graba la página de destino. La portada \`/\` no es una demo y no cuenta.

Si el navegador bloquea \`localStorage\` y cookies, la marca no sobrevive: solo esa visita con el parámetro queda fuera.

## Visita y uso

El contador sigue siendo el que ya estaba: \`https://bollastudio.goatcounter.com/count\`, cargado desde \`https://gc.zgo.at/count.js\`. No se añade otro servicio. No hay huella del dispositivo. Esta web no lee ni guarda direcciones IP. La geografía gruesa, si aparece, es la de GoatCounter.

- **Visita:** una sola llamada al abrir, sin \`event: true\`. La ruta es la de la tabla. Si hay \`p\` saneado, se añade \`?p=\`. En las páginas que antes reescribían la ruta del navegador, la visita queda en esa ruta canónica: un \`index.html\` o un parámetro extra (\`utm\`, etc.) ya no abre otra ruta.
- **Uso:** otra llamada, con \`event: true\`, solo después de un gesto: pulsar una pregunta preparada, confirmar la nota de ejemplo, iniciar la voz, reproducir el video, cambiar de pestaña o de escena en las demos que ya lo contaban. Abrir la página no es uso. La reproducción automática del guion no es uso.
- El texto escrito en el campo libre no sale del navegador. Ese envío no es un evento: no hay un id estable y el texto no debe viajar. El botón de tema preparado sí cuenta, con el id o con el slug del botón fijo, nunca con lo que la persona haya tecleado. No se envía audio ni transcripción.
- En Garage Crotta el chat cuenta \`/response/{lang}\` cuando llega la respuesta a un mensaje ya enviado, no al pulsar. La voz cuenta \`/connected/{lang}\` cuando el asistente está en línea, no al pulsar Iniciar. \`{lang}\` es \`it\`, \`de\`, \`en\` o \`fr\`.
- En algunas demos antiguas el título del evento es la frase del botón fijo (por ejemplo \`Chat …\` o \`script-option\`). No es texto tecleado. Las páginas de sector nuevas usan el título \`example\`.

Náutica, náutica-cat, \`/es/\` y concesionarios siguen metiendo \`p\` como tramo de la ruta (\`/{p}/demo\`, \`/{p}/demo-es-general\`, \`/{p}/video-es\`, …). Cambiarlo a \`?p=\` partiría el histórico. Sin \`p\`, náutica cuenta \`/lagoon42/demo\` y náutica-cat \`/cat42/demo\`: es el slug por defecto de siempre, no un prospecto distinto. En el panel, esa ruta sin \`?p=\` en la visita es la clase desconocido de esa familia. \`/es/\` sin \`p\` es \`/demo-es-general\`. Concesionarios sin \`p\` es \`/video-<idioma>\`.

\`count.js\` puede seguir mandando \`location.search\` en su campo \`q\`. Este repositorio no sustituye ese script. La ruta que agrupamos es la de la tabla, ya recortada. Una URL no debería llevar nombre ni correo.

## Inventario

${demos.length} demos cuentan. ${withUse.length} tienen al menos un uso. ${visitOnly.length} solo tienen la visita. ${redirects.length} redirecciones no cargan el contador. La portada tampoco.

En la columna Visita, \`{p}\` es la etiqueta saneada y solo se añade cuando existe. \`|\` separa la ruta sin etiqueta y la ruta con etiqueta cuando \`p\` es un tramo, no una búsqueda.

${table}

## Páginas que no cuentan

La portada \`/\` es el letrero del servidor.

Redirecciones (${redirects.length}), conservan la búsqueda y el hash, y no cargan el contador: ${redirectList}.
`;
}

const isMain = process.argv[1] && process.argv[1].endsWith("medicion-inventory.mjs");
if (isMain) {
  const root = new URL("..", import.meta.url).pathname;
  const doc = renderDoc(root);
  writeFileSync(new URL("../docs/medicion.md", import.meta.url), doc);
  console.log(`docs/medicion.md ${doc.length} chars`);
}
