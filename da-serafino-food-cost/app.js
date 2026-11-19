/* Da Serafino · Food cost · UI (vanilla JS). Demo BOLLA STUDIO. */
(function () {
  'use strict';
  var D = window.SF_DATA, C = window.SFCalc, KEY = 'sf-foodcost-v1';
  var LS = load();
  var lang = (location.search.match(/[?&]lang=(it|es)/) || [])[1] || LS.lang || 'it';
  var T = {
    it: {
      studio: 'Demo creata da BOLLA STUDIO per Da Serafino · prezzi indicativi', notice: '<b>Demo – prezzi indicativi.</b> Costi stimati da listini pubblici HoReCa (IVA esclusa) o stime dichiarate: non sono i costi reali della pizzeria. Ricette = esempi da personalizzare.',
      tMenu: 'Menu', tStock: 'Magazzino', tDough: 'Impasti', tMore: 'Altro',
      heroT: 'Quanto costa ogni piatto?', heroS: 'Tocca una pizza: vedi ogni grammo, dalla farina al sale.',
      search: 'Cerca un piatto… (es. margherita)', all: 'Tutti', pizze: 'Pizze', burger: 'Burger', contorni: 'Contorni', dolci: 'Dolci',
      cost: 'Costo', fc: 'Food cost', margin: 'Margine', price: 'Prezzo menu', net: 'netto IVA', gross: 'IVA incl.',
      dough: 'Impasto', ball: 'panetto', seeDough: 'Vedi farine e ingredienti', hideDough: 'Nascondi dettaglio impasto',
      onFlour: 'su farina', spolvero: 'Semola per spolvero', waste: 'Scarto / sfrido', energy: 'Energia forno/cucina', box: 'Cartone asporto',
      total: 'Costo totale', add: '+ Aggiungi ingrediente', reset: 'Ripristina ricetta', example: 'Ricetta di esempio – da personalizzare.',
      optWaste: 'Scarto %', optWasteS: 'Sfrido, assaggi, errori (tutti i piatti)', optEnergy: 'Conta energia', optEnergyS: 'Costo per piatto modificabile nel Magazzino', optTake: 'Asporto', optTakeS: 'Aggiunge il cartone pizza',
      perKg: '€/kg', perG: '€/g', perL: '€/L', perMl: '€/ml', perPz: '€/pz', format: 'Formato', usedIn: 'Usato in', dishes: 'piatti',
      srcL: 'Listino', srcS: 'Shop online', srcE: 'Stima', srcU: 'Tuo', source: 'Fonte', checked: 'verificato il',
      stockS: 'Cerca ingrediente…', edited: 'Modificati', restore: 'Ripristina prezzo', updated: 'Prezzo aggiornato · ricalcolati', newIng: '+ Nuovo ingrediente',
      priceFmt: 'Prezzo del formato (€, IVA escl.)', qtyHere: 'Quantità in questa ricetta', remove: 'Togli da questa ricetta', close: 'Chiudi',
      doughLab: 'Laboratorio impasti', doughLabS: 'Cambia la miscela di farine: tutte le pizze si ricalcolano.', perKgDough: '€/kg impasto', perBall: '€/panetto', hydr: 'Idratazione', ballsPer10: 'panetti ogni 10 kg farina',
      flours: 'Farine (miscela %)', others: 'Altri ingredienti (% sul peso farina)', addFlour: '+ Aggiungi farina', sumPct: 'Totale farine', ballW: 'Peso panetto', resetDough: 'Ripristina impasto', normal: 'non è 100%: le percentuali vengono proporzionate.',
      ballDetail: 'Un panetto, ingrediente per ingrediente',
      settings: 'Impostazioni', netT: 'Food cost sul prezzo netto', netS: 'Prezzo menu senza IVA (consigliato)', vat: 'IVA ristorazione %', spolveroG: 'Spolvero per pizza (g)',
      export: 'Esporta', csvMenu: 'Food cost di tutto il menu (CSV)', csvRec: 'Ricette dettagliate (CSV)', csvStock: 'Magazzino prezzi (CSV)', resetAll: 'Ripristina tutti i dati', resetQ: 'Cancellare tutte le modifiche (prezzi, ricette, impasti)?',
      about: 'Come funziona', saved: 'Salvato su questo telefono', pick: 'Scegli ingrediente', name: 'Nome', cat: 'Categoria', unit: 'Unità', qtyFmt: 'Quantità del formato', save: 'Salva',
      half: 'Metà', taste: 'Gusto', factor: 'Farcitura per metà (× pizza intera)', notCovered: 'Non calcolati (ricetta da inserire): antipasti, secondi, insalate e bevande.',
      covered: 'piatti calcolati', menuFrom: 'Menu dal menu digitale pubblico di daserafino.it (19/11/2026).',
      aboutTxt: 'Ogni ingrediente sta nel <b>Magazzino</b> con marca/qualità, formato d\'acquisto, prezzo e prezzo al kg/litro/pezzo (anche al grammo e al ml). Le ricette prendono i costi da lì: cambi un prezzo una volta e tutto il menu si ricalcola. Le modifiche restano salvate su questo telefono.',
      srcTxt: 'Fonti: listini HoReCa online (Royal Distribuzione, CIFO Cash & Carry – farine Le 5 Stagioni) e shop di produttori sardi. Dove non esiste un prezzo pubblico il valore è marcato <b>Stima</b>.',
      forMaestro: 'Pensata per il Maestro Giuseppe Lapolla', lapolla: 'Quattro volte campione del mondo (dal sito daserafino.it). Questa demo è un punto di partenza: con i listini veri dei vostri fornitori i costi diventano esatti.',
      noRes: 'Nessun risultato', none: '—', lines: 'righe', qtyU: 'Qtà', costLine: 'Costo', pctCost: '% costo'
    },
    es: {
      studio: 'Demo creada por BOLLA STUDIO para Da Serafino · precios indicativos', notice: '<b>Demo – precios indicativos.</b> Costos estimados con listas públicas HoReCa (sin IVA) o estimaciones declaradas: no son los costos reales de la pizzería. Recetas = ejemplos para personalizar.',
      tMenu: 'Menú', tStock: 'Almacén', tDough: 'Masas', tMore: 'Más',
      heroT: '¿Cuánto cuesta cada plato?', heroS: 'Toca una pizza: ves cada gramo, de la harina a la sal.',
      search: 'Busca un plato… (ej. margherita)', all: 'Todos', pizze: 'Pizzas', burger: 'Burgers', contorni: 'Guarniciones', dolci: 'Postres',
      cost: 'Costo', fc: 'Food cost', margin: 'Margen', price: 'Precio carta', net: 'sin IVA', gross: 'IVA incl.',
      dough: 'Masa', ball: 'bollo', seeDough: 'Ver harinas e ingredientes', hideDough: 'Ocultar detalle de la masa',
      onFlour: 'sobre harina', spolvero: 'Sémola para estirar', waste: 'Merma', energy: 'Energía horno/cocina', box: 'Caja para llevar',
      total: 'Costo total', add: '+ Añadir ingrediente', reset: 'Restaurar receta', example: 'Receta de ejemplo – para personalizar.',
      optWaste: 'Merma %', optWasteS: 'Pérdidas, pruebas, errores (todos los platos)', optEnergy: 'Contar energía', optEnergyS: 'Costo por plato editable en el Almacén', optTake: 'Para llevar', optTakeS: 'Suma la caja de pizza',
      perKg: '€/kg', perG: '€/g', perL: '€/L', perMl: '€/ml', perPz: '€/u', format: 'Formato', usedIn: 'Usado en', dishes: 'platos',
      srcL: 'Lista', srcS: 'Tienda online', srcE: 'Estimación', srcU: 'Tuyo', source: 'Fuente', checked: 'verificado el',
      stockS: 'Busca ingrediente…', edited: 'Modificados', restore: 'Restaurar precio', updated: 'Precio actualizado · recalculados', newIng: '+ Nuevo ingrediente',
      priceFmt: 'Precio del formato (€, sin IVA)', qtyHere: 'Cantidad en esta receta', remove: 'Quitar de esta receta', close: 'Cerrar',
      doughLab: 'Laboratorio de masas', doughLabS: 'Cambia la mezcla de harinas: todas las pizzas se recalculan.', perKgDough: '€/kg masa', perBall: '€/bollo', hydr: 'Hidratación', ballsPer10: 'bollos cada 10 kg de harina',
      flours: 'Harinas (mezcla %)', others: 'Otros ingredientes (% sobre la harina)', addFlour: '+ Añadir harina', sumPct: 'Total harinas', ballW: 'Peso del bollo', resetDough: 'Restaurar masa', normal: 'no es 100%: los porcentajes se proporcionan.',
      ballDetail: 'Un bollo, ingrediente por ingrediente',
      settings: 'Ajustes', netT: 'Food cost sobre precio sin IVA', netS: 'Precio de carta sin IVA (recomendado)', vat: 'IVA restauración %', spolveroG: 'Sémola por pizza (g)',
      export: 'Exportar', csvMenu: 'Food cost de toda la carta (CSV)', csvRec: 'Recetas detalladas (CSV)', csvStock: 'Almacén de precios (CSV)', resetAll: 'Restaurar todos los datos', resetQ: '¿Borrar todos los cambios (precios, recetas, masas)?',
      about: 'Cómo funciona', saved: 'Guardado en este teléfono', pick: 'Elige ingrediente', name: 'Nombre', cat: 'Categoría', unit: 'Unidad', qtyFmt: 'Cantidad del formato', save: 'Guardar',
      half: 'Mitad', taste: 'Sabor', factor: 'Ingredientes por mitad (× pizza entera)', notCovered: 'Sin calcular (receta por cargar): entrantes, segundos, ensaladas y bebidas.',
      covered: 'platos calculados', menuFrom: 'Carta tomada del menú digital público de daserafino.it (19/11/2026).',
      aboutTxt: 'Cada ingrediente está en el <b>Almacén</b> con marca/calidad, formato de compra, precio y precio por kg/litro/unidad (también por gramo y por ml). Las recetas toman los costos de ahí: cambias un precio una vez y se recalcula toda la carta. Los cambios quedan guardados en este teléfono.',
      srcTxt: 'Fuentes: listas HoReCa online (Royal Distribuzione, CIFO Cash & Carry – harinas Le 5 Stagioni) y tiendas de productores sardos. Donde no hay precio público el valor está marcado como <b>Estimación</b>.',
      forMaestro: 'Pensada para el Maestro Giuseppe Lapolla', lapolla: 'Cuatro veces campeón del mundo (según daserafino.it). Esta demo es un punto de partida: con las listas reales de sus proveedores los costos son exactos.',
      noRes: 'Sin resultados', none: '—', lines: 'líneas', qtyU: 'Cant.', costLine: 'Costo', pctCost: '% costo'
    }
  };
  function t(k) { return (T[lang] && T[lang][k]) || T.it[k] || k; }

  // ---------- stato ----------
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { LS.lang = lang; try { localStorage.setItem(KEY, JSON.stringify(LS)); } catch (e) {} }
  ['p', 'r', 'd', 'ds', 'ball', 'combo', 's'].forEach(function (k) { if (!LS[k] || typeof LS[k] !== 'object') LS[k] = {}; });
  if (!Array.isArray(LS.custom)) LS.custom = [];
  var BASE = {}; D.ings.forEach(function (i) { BASE[i.id] = i; });
  var ITEMS = {}; D.items.forEach(function (i) { ITEMS[i.slug] = i; });
  var CATS = []; D.ings.forEach(function (i) { if (CATS.indexOf(i.c) < 0) CATS.push(i.c); });
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function state() {
    var ings = {};
    D.ings.concat(LS.custom).forEach(function (i) { var x = Object.assign({}, i); x.nIt = i.n; if (lang === 'es' && i.es) { Object.assign(x, i.es); x.src = srcL(i.src); } if (LS.p[i.id] != null) x.p = +LS.p[i.id]; ings[x.id] = x; });
    var doughs = {};
    Object.keys(D.doughs).forEach(function (k) { doughs[k] = Object.assign({}, D.doughs[k], lang === 'es' && D.doughs[k].es ? D.doughs[k].es : {}, LS.d[k] || {}); });
    var items = {};
    D.items.forEach(function (i) {
      var x = Object.assign({}, i);
      if (lang === 'es' && i.noteEs) x.note = i.noteEs;
      x.sub = subL(i.sub);
      if (LS.r[i.slug]) x.r = LS.r[i.slug];
      if (LS.ds[i.slug]) x.dough = LS.ds[i.slug];
      if (LS.ball[i.slug]) x.ball = +LS.ball[i.slug];
      if (LS.combo[i.slug]) { x.combo = LS.combo[i.slug].combo || x.combo; if (LS.combo[i.slug].f != null) x.comboFactor = +LS.combo[i.slug].f; }
      items[i.slug] = x;
    });
    return { ings: ings, doughs: doughs, items: items, s: Object.assign({}, D.defaults, LS.s) };
  }
  var SRC_ES = { 'CIFO Cash & Carry (listino online, IVA esclusa)': 'CIFO Cash & Carry (lista online, sin IVA)', 'Mozzalat (distributore, prezzo HT = IVA esclusa)': 'Mozzalat (distribuidor, precio HT = sin IVA)', 'Stima BOLLA STUDIO': 'Estimación BOLLA STUDIO', 'Royal Distribuzione (listino HoReCa online, IVA esclusa)': 'Royal Distribuzione (lista HoReCa online, sin IVA)', 'Allevatori Sulcitani (shop online)': 'Allevatori Sulcitani (tienda online)', 'Spesati.it (Olbia, prezzo al kg)': 'Spesati.it (Olbia, precio por kg)', 'Sibiriu Petza Bella (shop online)': 'Sibiriu Petza Bella (tienda online)', 'La Sardegna dei Sapori (shop online)': 'La Sardegna dei Sapori (tienda online)' };
  function srcL(s) { return (lang === 'es' && SRC_ES[s]) || s; }
  var SUB_ES = { 'Pizze Carpe Diem': 'Pizzas Carpe Diem', 'I Sette Peccati Capitali': 'Los siete pecados capitales', 'Pizze Stellate': 'Pizzas estrella', 'Le Nostre Pizze': 'Nuestras pizzas', 'Contorni': 'Guarniciones', 'Dolci': 'Postres' };
  function subL(s) { return (lang === 'es' && SUB_ES[s]) || s; }
  function catL(c) { return (lang === 'es' && D.catEs && D.catEs[c]) || c; }
  var ST = state();
  function refresh() { ST = state(); }

  // ---------- formattazione ----------
  function nf(v, d) { return (+v || 0).toLocaleString(lang === 'es' ? 'es-ES' : 'it-IT', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function eur(v, d) { return nf(v, d == null ? 2 : d) + ' €'; }
  function eurS(v) { var a = Math.abs(v); return eur(v, a >= 0.1 || a === 0 ? 2 : a >= 0.01 ? 3 : 4); }
  function unitOf(ing) { return ing.u === 'kg' ? 'g' : ing.u === 'l' ? 'ml' : (lang === 'es' ? 'u' : 'pz'); }
  function q(v) { var a = Math.abs(v); return nf(v, a >= 100 || Math.round(a) === a ? 0 : a >= 10 ? 1 : 2); }
  function upLabel(ing) {
    var up = C.unitPrice(ing);
    if (ing.u === 'kg') return eur(up, 2) + '/kg · ' + eur(up / 1000, up / 1000 >= 0.01 ? 4 : 5) + '/g';
    if (ing.u === 'l') return eur(up, 2) + '/L · ' + eur(up / 1000, up / 1000 >= 0.01 ? 4 : 5) + '/ml';
    return eur(up, up < 1 ? 3 : 2) + '/' + unitOf(ing);
  }
  function fcClass(fc) { return fc == null ? 'mid' : fc < 25 ? 'ok' : fc < 32 ? 'mid' : 'hi'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var toastT;
  function toast(msg) { var el = $('#toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, 1900); }
  function track(ev) { try { window.bsTrack && window.bsTrack('/da-serafino-food-cost/' + ev, ev); } catch (e) {} }
  function usedCount(id) {
    var n = 0;
    Object.keys(ST.items).forEach(function (s) { var it = ST.items[s]; if ((it.r || []).some(function (x) { return x[0] === id; })) n++; });
    var dn = 0; Object.keys(ST.doughs).forEach(function (k) { var d = ST.doughs[k]; if ((d.flours || []).concat(d.parts || []).some(function (x) { return x[0] === id; })) dn++; });
    if (dn) Object.keys(ST.items).forEach(function (s) { var it = ST.items[s]; if (it.kind === 'pizza' || it.kind === 'scrocchiarella') { var d = ST.doughs[it.dough]; if (d && (d.flours.concat(d.parts)).some(function (x) { return x[0] === id; }) && !(it.r || []).some(function (x) { return x[0] === id; })) n++; } });
    if (id === 'f_spolvero') n = Object.keys(ST.items).filter(function (s) { var k = ST.items[s].kind; return k === 'pizza' || k === 'scrocchiarella'; }).length;
    return n;
  }
  function srcBadge(ing) { var tt = ing.t || 'U'; return '<span class="src ' + tt + '">' + t('src' + tt) + '</span>'; }

  // ---------- i18n statico ----------
  function applyLang() {
    document.documentElement.lang = lang;
    $('#back').setAttribute('aria-label', lang === 'es' ? 'Atrás' : 'Indietro');
    $('#sheetX').setAttribute('aria-label', t('close'));
    $$('[data-t]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-t')); });
    $$('#langs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === lang); });
  }
  $$('#langs button').forEach(function (b) { b.addEventListener('click', function () { lang = b.getAttribute('data-l'); save(); refresh(); applyLang(); render(); track('lang-' + lang); }); });

  // ---------- router ----------
  var view = $('#view'), ui = { cat: 'all', q: '', sc: 'all', sq: '', open: {} };
  function setHeader(title, sub, back) {
    $('#title').innerHTML = esc(title) + '<small>' + esc(sub) + '</small>';
    $('#top').classList.toggle('has-back', !!back);
  }
  $('#back').addEventListener('click', function () { if (history.length > 1) history.back(); else location.hash = '#/menu'; });
  function route() { var h = location.hash.replace(/^#\/?/, '').split('/'); return { name: h[0] || 'menu', arg: decodeURIComponent(h[1] || '') }; }
  var lastRoute = '';
  function render() {
    var r = route(), key = r.name + '/' + r.arg;
    $$('nav.tabs a').forEach(function (a) { var tb = a.getAttribute('data-tab'); a.classList.toggle('on', tb === r.name || (tb === 'menu' && r.name === 'p') || (tb === 'impasti' && r.name === 'impasto')); });
    if (r.name === 'p' && ST.items[r.arg]) viewItem(r.arg);
    else if (r.name === 'magazzino') viewStock();
    else if (r.name === 'impasti') viewDoughs();
    else if (r.name === 'impasto' && ST.doughs[r.arg]) viewLab(r.arg);
    else if (r.name === 'altro') viewMore();
    else viewMenu();
    if (key !== lastRoute) { window.scrollTo(0, 0); lastRoute = key; }
  }
  window.addEventListener('hashchange', function () { closeSheet(); render(); });

  // ---------- MENU ----------
  function viewMenu() {
    setHeader('Food Cost', 'Da Serafino · Cannigione', false);
    var cats = ['all', 'pizze', 'burger', 'contorni', 'dolci'];
    view.innerHTML = '<div class="hero"><div><b>' + t('heroT') + '</b><span>' + t('heroS') + '</span></div></div>' +
      '<div class="search"><input id="q" type="search" inputmode="search" autocomplete="off" placeholder="' + esc(t('search')) + '" value="' + esc(ui.q) + '"></div>' +
      '<div class="chips" id="cats">' + cats.map(function (c) { return '<button class="chip' + (ui.cat === c ? ' on' : '') + '" data-c="' + c + '">' + t(c) + '</button>'; }).join('') + '</div>' +
      '<div id="mlist"></div><p class="foot">' + D.items.length + ' ' + t('covered') + ' · ' + t('notCovered') + '<br>' + t('menuFrom') + '</p>';
    $('#q').addEventListener('input', function (e) { ui.q = e.target.value; menuList(); });
    $$('#cats .chip').forEach(function (b) { b.addEventListener('click', function () { ui.cat = b.getAttribute('data-c'); $$('#cats .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); menuList(); }); });
    menuList();
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function menuList() {
    var qq = norm(ui.q).trim(), html = '', lastSub = '';
    var list = D.items.filter(function (i) { return (ui.cat === 'all' || i.cat === ui.cat) && (!qq || norm(i.n + ' ' + i.desc).indexOf(qq) >= 0); });
    list.forEach(function (i) {
      var it = ST.items[i.slug], c = C.item(it, ST);
      if (!qq && i.sub !== lastSub) { html += (lastSub ? '</div>' : '') + '<h3 class="sec">' + esc(subL(i.sub)) + '</h3><div class="list">'; lastSub = i.sub; }
      else if (qq && !lastSub) { html += '<div class="list">'; lastSub = '1'; }
      html += '<button class="card" data-s="' + i.slug + '"><div class="tx"><div class="nm">' + esc(i.n) + '</div><div class="ds">' + esc(i.desc || t(i.cat)) + '</div>' +
        '<div class="pr">' + t('cost') + ' <b>' + eur(c.total) + '</b> · ' + t('price') + ' ' + eur(i.price) + '</div></div>' +
        '<div class="badge ' + fcClass(c.fc) + '">' + (c.fc == null ? '—' : nf(c.fc, 0) + '%') + '<small>' + t('fc') + '</small></div></button>';
    });
    if (lastSub) html += '</div>';
    $('#mlist').innerHTML = html || '<p class="empty">' + t('noRes') + '</p>';
    $$('#mlist .card').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#/p/' + b.getAttribute('data-s'); }); });
  }

  // ---------- DETTAGLIO PIATTO ----------
  function curRecipe(slug) { return clone(ST.items[slug].r || []); }
  function setRecipe(slug, r) { LS.r[slug] = r; save(); refresh(); }
  function stepFor(ing, v) { if (ing.u === 'pz') return v < 1 ? 0.1 : 0.5; return v >= 100 ? 10 : v >= 20 ? 5 : v >= 5 ? 1 : 0.5; }
  function viewItem(slug) {
    var it = ST.items[slug], c = C.item(it, ST), base = ITEMS[slug];
    setHeader(it.n, norm(t(it.cat)) === norm(it.sub) ? it.sub : t(it.cat) + ' · ' + it.sub, true);
    var isPizza = it.kind === 'pizza' || it.kind === 'scrocchiarella';
    var h = '<div class="dhead"><div style="flex:1;min-width:0"><h2>' + esc(it.n) + '</h2><p>' + esc(it.desc) + '</p></div>' +
      '<div class="price-tag">' + eur(it.price) + '<small>' + t('price') + '</small></div></div>';
    h += '<div class="kpis"><div class="kpi main"><b id="kCost">' + eur(c.total) + '</b><span>' + t('cost') + '</span></div>' +
      '<div class="kpi fc ' + (fcClass(c.fc) === 'ok' ? 'okk' : fcClass(c.fc) === 'mid' ? 'midd' : '') + '"><b>' + (c.fc == null ? '—' : nf(c.fc, 1) + '%') + '</b><span>' + t('fc') + '</span></div>' +
      '<div class="kpi"><b>' + eur(c.margin) + '</b><span>' + t('margin') + ' (' + (ST.s.net === false ? t('gross') : t('net')) + ')</span></div></div>';
    if (it.kind === 'pizza') {
      h += '<div class="seg" id="dseg">' + ['classico', 'multicereali', 'integrale', 'senza_glutine'].map(function (k) { return '<button data-d="' + k + '" class="' + (it.dough === k ? 'on' : '') + '">' + esc(ST.doughs[k].n) + '</button>'; }).join('') + '</div>';
    }
    if (it.kind === 'scrocchiarella') {
      var opts = D.items.filter(function (x) { return x.cat === 'pizze' && x.kind === 'pizza' && ['mediterranea', 'frutti-di-mare-1'].indexOf(x.slug) < 0; });
      h += '<div class="combo">' + [0, 1].map(function (k) {
        return '<label>' + t('half') + ' ' + (k + 1) + ' · ' + t('taste') + '<select data-h="' + k + '">' + opts.map(function (o) { return '<option value="' + o.slug + '"' + (it.combo[k] === o.slug ? ' selected' : '') + '>' + esc(o.n) + '</option>'; }).join('') + '</select></label>';
      }).join('') + '<div class="opt"><label>' + t('factor') + '</label><button class="step" data-f="-1">−</button><input id="cf" style="width:70px;height:40px;border-radius:10px;border:2px solid var(--line);text-align:center;font-weight:600" inputmode="decimal" value="' + nf(it.comboFactor != null ? it.comboFactor : 1, 2) + '"><button class="step" data-f="1">+</button></div></div>';
    }
    h += '<div class="tbl" id="tbl">';
    var tot = c.total || 1;
    function bar(v) { return '<span class="bar" style="width:' + Math.max(0, Math.min(100, v / tot * 100)).toFixed(1) + '%"></span>'; }
    c.lines.forEach(function (l, idx) {
      if (l.id === '__dough') {
        var dc = c.dough.calc, dn = ST.doughs[c.dough.id];
        var open = !!ui.open[slug];
        h += '<div class="row dough"><div class="nm">' + t('dough') + ' ' + esc(dn.n) + '<small>' + t('ball') + ' ' + q(dc.ballWeight) + ' g · ' + eur(dc.costPerKg, 3) + '/kg · ' + t('hydr').toLowerCase() + ' ' + nf(dc.hydration, 0) + '%</small>' +
          '<button class="toggle-d" id="tgD">' + (open ? '▴ ' + t('hideDough') : '▾ ' + t('seeDough')) + '</button></div><div class="cost">' + eurS(l.cost) + '<small>' + nf(l.cost / tot * 100, 0) + '%</small></div>' +
          '<div class="qty"><button class="step" data-ball="-10">−</button><input id="ballIn" inputmode="decimal" value="' + q(dc.ballWeight) + '"><span class="u">g</span><button class="step" data-ball="10">+</button><span class="up">' + t('ballW') + '</span></div>' + bar(l.cost) + '</div>';
        if (open) dc.lines.forEach(function (dl) {
          var ing = ST.ings[dl.id]; if (!ing) return;
          var qtxt = ing.u === 'l' ? q(dl.g) + ' g = ' + q(dl.q) + ' ml' : q(dl.g) + ' g';
          h += '<div class="row sub"><div class="nm">' + esc(ing.n) + '<small>' + qtxt + ' · ' + (dl.flour ? nf(dl.pct, 1) + '% ' + (lang === 'es' ? 'de la mezcla' : 'della miscela') : nf(dl.pct, dl.pct < 1 ? 2 : 1) + '% ' + t('onFlour')) + ' · ' + upLabel(ing) + '</small></div><div class="cost">' + eur(dl.cost, 4) + '</div></div>';
        });
        return;
      }
      var ing = ST.ings[l.id]; if (!ing) return;
      if (l.auto) { h += '<div class="row extra"><div class="nm">' + t('spolvero') + '<small>' + q(l.q) + ' g · ' + upLabel(ing) + '</small></div><div class="cost">' + eurS(l.cost) + '</div>' + bar(l.cost) + '</div>'; return; }
      var ri = idx - (isPizza ? (c.lines[1] && c.lines[1].auto ? 2 : 1) : 0);
      h += '<div class="row" data-i="' + ri + '"><button class="nm" data-ing="' + ing.id + '">' + esc(ing.n) + '<small>' + esc(ing.q) + '</small></button><div class="cost">' + eurS(l.cost) + '<small>' + nf(l.cost / tot * 100, 0) + '%</small></div>' +
        '<div class="qty"><button class="step" data-d="-1">−</button><input inputmode="decimal" value="' + q(l.q) + '"><span class="u">' + unitOf(ing) + '</span><button class="step" data-d="1">+</button><span class="up">' + upLabel(ing).replace(' · ', '<br>') + '</span></div>' + bar(l.cost) + '</div>';
    });
    c.groups.forEach(function (gp) {
      var src = ST.items[gp.slug];
      h += '<div class="row dough"><div class="nm">' + t('half') + ' ' + (gp.half + 1) + ': ' + esc(src.n) + '<small>× ' + nf(gp.factor, 2) + '</small></div><div class="cost">' + eurS(gp.cost) + '</div>' + bar(gp.cost) + '</div>';
      gp.lines.forEach(function (l) { var ing = ST.ings[l.id]; if (!ing) return; h += '<div class="row sub"><div class="nm">' + esc(ing.n) + '<small>' + q(l.q) + ' ' + unitOf(ing) + ' · ' + upLabel(ing) + '</small></div><div class="cost">' + eurS(l.cost) + '</div></div>'; });
    });
    if (c.waste) h += '<div class="row extra"><div class="nm">' + t('waste') + ' ' + nf(ST.s.waste, 0) + '%</div><div class="cost">' + eurS(c.waste) + '</div></div>';
    if (c.energy) h += '<div class="row extra"><div class="nm">' + t('energy') + '<small>' + t('srcE') + '</small></div><div class="cost">' + eurS(c.energy) + '</div></div>';
    if (c.box) h += '<div class="row extra"><div class="nm">' + t('box') + '</div><div class="cost">' + eurS(c.box) + '</div></div>';
    h += '<div class="row tot"><div class="nm">' + t('total') + '</div><div class="cost">' + eur(c.total) + '<small>' + t('fc') + ' ' + (c.fc == null ? '—' : nf(c.fc, 1) + '%') + ' · ' + t('price') + ' ' + eur(c.priceBase) + ' ' + (ST.s.net === false ? t('gross') : t('net')) + '</small></div></div></div>';
    h += '<div class="btns"><button class="btn" id="addIng">' + t('add') + '</button>' + (LS.r[slug] || LS.ds[slug] || LS.ball[slug] || LS.combo[slug] ? '<button class="btn ghost" id="resetR">' + t('reset') + '</button>' : '') + '</div>';
    h += '<div class="note"><b>' + t('example') + '</b>' + (it.note ? ' ' + esc(it.note) : '') + '</div>';
    h += '<div class="opts">' + optRow('waste', t('optWaste'), t('optWasteS'), 'num') + optRow('energy', t('optEnergy'), t('optEnergyS'), 'sw') + (isPizza ? optRow('takeaway', t('optTake'), t('optTakeS'), 'sw') : '') + '</div>';
    view.innerHTML = h;
    bindItem(slug);
  }
  function optRow(k, lab, sub, type) {
    var v = ST.s[k];
    if (type === 'sw') return '<div class="opt"><label for="o_' + k + '">' + lab + '<small>' + sub + '</small></label><span class="sw"><input type="checkbox" id="o_' + k + '" data-o="' + k + '"' + (v ? ' checked' : '') + '><span></span></span></div>';
    return '<div class="opt"><label>' + lab + '<small>' + sub + '</small></label><button class="step" data-on="' + k + '" data-v="-1">−</button><input data-o="' + k + '" style="width:64px;height:40px;border-radius:10px;border:2px solid var(--line);text-align:center;font-weight:600" inputmode="decimal" value="' + nf(v, 0) + '"><button class="step" data-on="' + k + '" data-v="1">+</button></div>';
  }
  function bindOpts(after) {
    $$('[data-o]').forEach(function (el) {
      el.addEventListener('change', function () { var k = el.getAttribute('data-o'); LS.s[k] = el.type === 'checkbox' ? el.checked : Math.max(0, pnum(el.value)); save(); refresh(); after(); });
    });
    $$('[data-on]').forEach(function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-on'); LS.s[k] = Math.max(0, (+ST.s[k] || 0) + (+b.getAttribute('data-v'))); save(); refresh(); after(); }); });
  }
  function pnum(v) { var n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function bindItem(slug) {
    var it = ST.items[slug], rr = function () { var y = window.scrollY; render(); window.scrollTo(0, y); };
    $$('#dseg button').forEach(function (b) { b.addEventListener('click', function () { var d = b.getAttribute('data-d'); if (d === ITEMS[slug].dough) delete LS.ds[slug]; else LS.ds[slug] = d; save(); refresh(); rr(); }); });
    $$('.combo select').forEach(function (s) { s.addEventListener('change', function () { var cb = (LS.combo[slug] = LS.combo[slug] || {}); cb.combo = (cb.combo || it.combo.slice()); cb.combo[+s.getAttribute('data-h')] = s.value; save(); refresh(); rr(); }); });
    var cf = $('#cf');
    if (cf) {
      var setF = function (v) { var cb = (LS.combo[slug] = LS.combo[slug] || {}); cb.f = Math.max(0.1, Math.round(v * 100) / 100); save(); refresh(); rr(); };
      cf.addEventListener('change', function () { setF(pnum(cf.value)); });
      $$('[data-f]').forEach(function (b) { b.addEventListener('click', function () { setF((it.comboFactor != null ? it.comboFactor : 1) + 0.1 * (+b.getAttribute('data-f'))); }); });
    }
    var tg = $('#tgD'); if (tg) tg.addEventListener('click', function () { ui.open[slug] = !ui.open[slug]; rr(); });
    var bi = $('#ballIn');
    if (bi) {
      var setB = function (v) { v = Math.max(50, Math.round(v)); LS.ball[slug] = v; save(); refresh(); rr(); };
      bi.addEventListener('change', function () { setB(pnum(bi.value)); });
      $$('[data-ball]').forEach(function (b) { b.addEventListener('click', function () { setB(C.item(ST.items[slug], ST).dough.calc.ballWeight + (+b.getAttribute('data-ball'))); }); });
    }
    $$('#tbl .row[data-i]').forEach(function (row) {
      var i = +row.getAttribute('data-i'), inp = $('input', row);
      var set = function (v) { var r = curRecipe(slug); if (!r[i]) return; r[i][1] = Math.max(0, Math.round(v * 100) / 100); setRecipe(slug, r); rr(); };
      inp.addEventListener('change', function () { set(pnum(inp.value)); });
      $$('[data-d]', row).forEach(function (b) { b.addEventListener('click', function () { var r = curRecipe(slug), ing = ST.ings[r[i][0]], v = +r[i][1]; set(v + stepFor(ing, v + (+b.getAttribute('data-d') < 0 ? -0.0001 : 0)) * (+b.getAttribute('data-d'))); }); });
      $('.nm', row).addEventListener('click', function () { ingSheet(row.querySelector('.nm').getAttribute('data-ing'), slug, i); });
    });
    $('#addIng').addEventListener('click', function () { pickSheet(function (id) { var r = curRecipe(slug), ing = ST.ings[id]; r.push([id, ing.u === 'pz' ? 1 : 20]); setRecipe(slug, r); closeSheet(); rr(); }); });
    var rs = $('#resetR'); if (rs) rs.addEventListener('click', function () { delete LS.r[slug]; delete LS.ds[slug]; delete LS.ball[slug]; delete LS.combo[slug]; save(); refresh(); rr(); toast('✓ ' + t('reset')); });
    bindOpts(rr);
    track('piatto/' + slug);
  }

  // ---------- SHEETS ----------
  function openSheet(html) { $('#sheetBody').innerHTML = html; $('#sheet').classList.add('open'); $('#sheetBg').classList.add('open'); }
  function closeSheet() { $('#sheet').classList.remove('open'); $('#sheetBg').classList.remove('open'); }
  $('#sheetBg').addEventListener('click', closeSheet);
  $('#sheetX').addEventListener('click', closeSheet);
  function ingCardHTML(ing) {
    var edited = LS.p[ing.id] != null;
    return '<div class="ing' + (edited ? ' edited' : '') + '" data-id="' + ing.id + '"><div class="h"><div class="t"><div class="nm">' + esc(ing.n) + '</div><div class="q">' + esc(ing.q) + '</div></div>' + srcBadge(ing) + '</div>' +
      '<div class="pp"><input inputmode="decimal" value="' + nf(ing.p, 2) + '" aria-label="' + esc(t('priceFmt')) + '"><span class="fmt">€ · ' + esc(ing.f) + '</span></div>' +
      '<div class="unit"><span><b>' + upLabel(ing).split(' · ')[0] + '</b></span>' + (upLabel(ing).split(' · ')[1] ? '<span>' + upLabel(ing).split(' · ')[1] + '</span>' : '') + '<span>' + t('usedIn') + ' ' + usedCount(ing.id) + ' ' + t('dishes') + '</span></div>' +
      '<div class="meta">' + (ing.url ? t('source') + ': <a href="' + esc(ing.url) + '" target="_blank" rel="noopener">' + esc(ing.src || 'link') + ' ↗</a>' : esc(ing.src || '')) + (ing.d ? ' · ' + t('checked') + ' ' + esc(ing.d) : '') + (ing.iva ? ' · IVA ' + ing.iva + '%' : '') + (ing.nota ? '<br>' + esc(ing.nota) : '') +
      (edited ? '<br><button class="toggle-d" data-restore="' + ing.id + '">↺ ' + t('restore') + ' (' + eur(BASE[ing.id] ? BASE[ing.id].p : ing.p) + ')</button>' : '') + '</div></div>';
  }
  function bindIngCard(card, after) {
    var id = card.getAttribute('data-id'), inp = $('.pp input', card);
    inp.addEventListener('change', function () {
      var v = pnum(inp.value); if (!(v > 0)) { inp.value = nf(ST.ings[id].p, 2); return; }
      var cu = LS.custom.filter(function (x) { return x.id === id; })[0];
      if (cu) cu.p = v; else if (BASE[id] && Math.abs(BASE[id].p - v) < 1e-9) delete LS.p[id]; else LS.p[id] = v;
      save(); refresh(); toast(t('updated') + ' ' + usedCount(id) + ' ' + t('dishes')); track('magazzino/prezzo'); after();
    });
    var rb = $('[data-restore]', card); if (rb) rb.addEventListener('click', function () { delete LS.p[id]; save(); refresh(); toast('↺ ' + t('restore')); after(); });
  }
  function ingSheet(id, slug, idx) {
    var ing = ST.ings[id];
    var r = slug != null ? curRecipe(slug) : null;
    var h = '<h3>' + esc(ing.n) + '</h3>' + ingCardHTML(ing);
    if (r && r[idx]) h += '<div class="btns"><button class="btn red" id="rmIng">✕ ' + t('remove') + '</button><button class="btn ghost" id="clS">' + t('close') + '</button></div>';
    else h += '<div class="btns"><button class="btn ghost" id="clS">' + t('close') + '</button></div>';
    openSheet(h);
    var again = function () { var y = window.scrollY; render(); window.scrollTo(0, y); ingSheet(id, slug, idx); };
    bindIngCard($('#sheet .ing'), again);
    $('#clS').addEventListener('click', closeSheet);
    var rm = $('#rmIng'); if (rm) rm.addEventListener('click', function () { var rr = curRecipe(slug); rr.splice(idx, 1); setRecipe(slug, rr); closeSheet(); var y = window.scrollY; render(); window.scrollTo(0, y); });
  }
  function pickSheet(cb, filterCat) {
    openSheet('<h3>' + t('pick') + '</h3><div class="search"><input id="pq" type="search" autocomplete="off" placeholder="' + esc(t('stockS')) + '"></div><div class="pick" id="plist"></div>');
    var draw = function () {
      var qq = norm($('#pq').value).trim();
      var arr = Object.keys(ST.ings).map(function (k) { return ST.ings[k]; }).filter(function (i) { return (!filterCat || i.c === filterCat) && i.c !== 'Costi extra' && (!qq || norm(i.n + ' ' + i.nIt + ' ' + i.q).indexOf(qq) >= 0); });
      $('#plist').innerHTML = arr.slice(0, 80).map(function (i) { return '<button data-id="' + i.id + '"><b>' + esc(i.n) + '</b><small>' + esc(i.q) + ' · ' + upLabel(i) + '</small></button>'; }).join('') || '<p class="empty">' + t('noRes') + '</p>';
      $$('#plist button').forEach(function (b) { b.addEventListener('click', function () { cb(b.getAttribute('data-id')); }); });
    };
    $('#pq').addEventListener('input', draw); draw();
  }

  // ---------- MAGAZZINO ----------
  function viewStock() {
    setHeader(t('tStock'), lang === 'es' ? 'Materias primas · precios' : 'Materie prime · prezzi', false);
    var chips = ['all', 'edited'].concat(CATS);
    view.innerHTML = '<div class="search"><input id="sq" type="search" autocomplete="off" placeholder="' + esc(t('stockS')) + '" value="' + esc(ui.sq) + '"></div>' +
      '<div class="chips" id="scats">' + chips.map(function (c) { return '<button class="chip' + (ui.sc === c ? ' on' : '') + '" data-c="' + esc(c) + '">' + (c === 'all' ? t('all') : c === 'edited' ? '✎ ' + t('edited') : esc(catL(c))) + '</button>'; }).join('') + '</div>' +
      '<div class="note">' + t('aboutTxt') + '</div><div id="slist" class="list"></div><div class="btns"><button class="btn" id="newIng">' + t('newIng') + '</button></div>';
    $('#sq').addEventListener('input', function (e) { ui.sq = e.target.value; stockList(); });
    $$('#scats .chip').forEach(function (b) { b.addEventListener('click', function () { ui.sc = b.getAttribute('data-c'); $$('#scats .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); stockList(); }); });
    $('#newIng').addEventListener('click', newIngSheet);
    stockList();
  }
  function stockList() {
    var qq = norm(ui.sq).trim();
    var arr = Object.keys(ST.ings).map(function (k) { return ST.ings[k]; }).filter(function (i) {
      if (ui.sc === 'edited') { if (LS.p[i.id] == null && !(i.t === 'U')) return false; } else if (ui.sc !== 'all' && i.c !== ui.sc) return false;
      return !qq || norm(i.n + ' ' + i.nIt + ' ' + i.q + ' ' + i.c + ' ' + catL(i.c)).indexOf(qq) >= 0;
    });
    $('#slist').innerHTML = arr.map(ingCardHTML).join('') || '<p class="empty">' + t('noRes') + '</p>';
    $$('#slist .ing').forEach(function (card) { bindIngCard(card, function () { var y = window.scrollY; stockList(); window.scrollTo(0, y); }); });
  }
  function newIngSheet() {
    openSheet('<h3>' + t('newIng').replace('+ ', '') + '</h3><div class="opts">' +
      '<div class="opt"><label>' + t('name') + '</label><input id="nn" style="flex:2;height:44px;border-radius:10px;border:2px solid var(--line);padding:0 10px"></div>' +
      '<div class="opt"><label>' + t('cat') + '</label><select id="nc" style="flex:2;height:44px;border-radius:10px;border:2px solid var(--line)">' + CATS.map(function (c) { return '<option value="' + esc(c) + '">' + esc(catL(c)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="opt"><label>' + t('qtyFmt') + '</label><input id="nq" inputmode="decimal" value="1" style="width:80px;height:44px;border-radius:10px;border:2px solid var(--line);text-align:center"><select id="nu" style="height:44px;border-radius:10px;border:2px solid var(--line)"><option value="kg">kg</option><option value="l">L</option><option value="pz">' + (lang === 'es' ? 'u' : 'pz') + '</option></select></div>' +
      '<div class="opt"><label>' + t('priceFmt') + '</label><input id="np" inputmode="decimal" style="width:100px;height:44px;border-radius:10px;border:2px solid var(--line);text-align:right;padding:0 8px"></div>' +
      '</div><div class="btns"><button class="btn red" id="ns">' + t('save') + '</button><button class="btn ghost" id="clS">' + t('close') + '</button></div>');
    $('#clS').addEventListener('click', closeSheet);
    $('#ns').addEventListener('click', function () {
      var n = $('#nn').value.trim(), fq = pnum($('#nq').value), p = pnum($('#np').value), u = $('#nu').value;
      if (!n || !(fq > 0) || !(p > 0)) { toast('⚠ ' + t('name') + ' / ' + t('priceFmt')); return; }
      LS.custom.push({ id: 'c_' + Date.now().toString(36), n: n, c: $('#nc').value, q: t('srcU'), f: nf(fq, fq % 1 ? 2 : 0) + ' ' + (u === 'l' ? 'L' : u), fq: fq, u: u, p: p, iva: 0, t: 'U', url: '', src: t('srcU'), d: new Date().toLocaleDateString('it-IT'), nota: '', dens: 1 });
      save(); refresh(); closeSheet(); ui.sc = 'edited'; render(); toast('✓ ' + n);
    });
  }

  // ---------- IMPASTI ----------
  function viewDoughs() {
    setHeader(t('tDough'), t('doughLab'), false);
    var h = '<div class="note">' + t('doughLabS') + ' <b>' + t('example') + '</b></div><div class="list">';
    Object.keys(ST.doughs).forEach(function (k) {
      var d = ST.doughs[k], dc = C.dough(d, ST.ings);
      h += '<button class="card" data-k="' + k + '"><div class="tx"><div class="nm">' + esc(d.n) + '</div><div class="ds">' + esc(d.d) + '</div><div class="pr">' + d.flours.length + ' ' + (lang === 'es' ? 'harinas' : 'farine') + ' · ' + t('hydr') + ' ' + nf(dc.hydration, 0) + '% · ' + t('ball') + ' ' + q(dc.ballWeight) + ' g</div></div>' +
        '<div class="badge ok" style="background:var(--ink)">' + eur(dc.ballCost, 3) + '<small>' + t('perBall') + '</small></div></button>';
    });
    view.innerHTML = h + '</div>';
    $$('#view .card').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#/impasto/' + b.getAttribute('data-k'); }); });
  }
  function curDough(k) { var d = ST.doughs[k]; return { flours: clone(d.flours), parts: clone(d.parts), ball: d.ball }; }
  function setDough(k, d) { LS.d[k] = d; save(); refresh(); }
  function viewLab(k) {
    var d = ST.doughs[k], dc = C.dough(d, ST.ings);
    setHeader(t('dough') + ' ' + d.n, t('doughLab'), true);
    var sumOk = Math.abs(dc.flourSum - 100) < 0.01;
    var h = '<div class="lab-res"><div class="kpi main"><b>' + eur(dc.costPerKg, 3) + '</b><span>' + t('perKgDough') + '</span></div><div class="kpi"><b>' + eur(dc.ballCost, 3) + '</b><span>' + t('perBall') + ' (' + q(dc.ballWeight) + ' g)</span></div>' +
      '<div class="kpi"><b>' + nf(dc.hydration, 0) + '%</b><span>' + t('hydr') + '</span></div><div class="kpi"><b>' + nf(dc.ballsPerKgFlour * 10, 0) + '</b><span>' + t('ballsPer10') + '</span></div></div>';
    h += '<h3 class="sec">' + t('flours') + ' · ' + t('sumPct') + ': <span class="' + (sumOk ? 'pct-ok' : 'pct-bad') + '">' + nf(dc.flourSum, 1) + '%</span></h3>' + (sumOk ? '' : '<div class="note">' + t('sumPct') + ' ' + t('normal') + '</div>');
    h += '<div class="tbl">' + d.flours.map(function (f, i) {
      var ing = ST.ings[f[0]] || { n: f[0], q: '' }, line = dc.batchLines[i];
      return '<div class="row" data-fi="' + i + '"><button class="nm" data-pick="' + i + '">' + esc(ing.n) + '<small>' + esc(ing.q) + ' · ' + (ST.ings[f[0]] ? upLabel(ing) : '') + '</small></button><div class="cost">' + eur(line.cost, 3) + '<small>/ kg ' + (lang === 'es' ? 'harina' : 'farina') + '</small></div>' +
        '<div class="qty"><button class="step" data-p="-5">−</button><input inputmode="decimal" value="' + nf(f[1], f[1] % 1 ? 1 : 0) + '"><span class="u">%</span><button class="step" data-p="5">+</button><span class="up"><button class="toggle-d" data-rm="' + i + '" style="margin:0;background:var(--red)">✕</button></span></div></div>';
    }).join('') + '</div><div class="btns"><button class="btn ghost" id="addF">' + t('addFlour') + '</button></div>';
    h += '<h3 class="sec">' + t('others') + '</h3><div class="tbl">' + d.parts.map(function (p, i) {
      var ing = ST.ings[p[0]], line = dc.batchLines[d.flours.length + i];
      return '<div class="row" data-pi="' + i + '"><button class="nm" data-ing="' + p[0] + '">' + esc(ing.n) + '<small>' + upLabel(ing) + '</small></button><div class="cost">' + eur(line.cost, 4) + '<small>/ kg ' + (lang === 'es' ? 'harina' : 'farina') + '</small></div>' +
        '<div class="qty"><button class="step" data-p="-1">−</button><input inputmode="decimal" value="' + nf(p[1], p[1] % 1 ? (p[1] < 1 ? 2 : 1) : 0) + '"><span class="u">%</span><button class="step" data-p="1">+</button><span class="up">' + q(line.g) + ' g' + (ing.u === 'l' ? ' = ' + q(line.q) + ' ml' : '') + '<br>' + (lang === 'es' ? 'por 1 kg harina' : 'per 1 kg farina') + '</span></div></div>';
    }).join('') + '<div class="row"><div class="nm">' + t('ballW') + '</div><div class="cost">' + eur(dc.ballCost, 3) + '</div><div class="qty"><button class="step" data-b="-10">−</button><input id="lbw" inputmode="decimal" value="' + q(d.ball) + '"><span class="u">g</span><button class="step" data-b="10">+</button></div></div></div>';
    h += '<h3 class="sec">' + t('ballDetail') + ' (' + q(dc.ballWeight) + ' g)</h3><div class="tbl">' + dc.lines.map(function (l) {
      var ing = ST.ings[l.id]; if (!ing) return '';
      return '<div class="row sub"><div class="nm">' + esc(ing.n) + '<small>' + q(l.g) + ' g' + (ing.u === 'l' ? ' = ' + q(l.q) + ' ml' : '') + '</small></div><div class="cost">' + eur(l.cost, 4) + '<small>' + nf(dc.ballCost ? l.cost / dc.ballCost * 100 : 0, 1) + '%</small></div></div>';
    }).join('') + '<div class="row tot"><div class="nm">' + t('total') + '</div><div class="cost">' + eur(dc.ballCost, 4) + '</div></div></div>';
    h += '<div class="note"><b>' + t('example') + '</b> ' + esc(d.d) + '</div>' + (LS.d[k] ? '<div class="btns"><button class="btn ghost" id="rsD">' + t('resetDough') + '</button></div>' : '');
    view.innerHTML = h;
    var rr = function () { var y = window.scrollY; render(); window.scrollTo(0, y); };
    $$('[data-fi]').forEach(function (row) {
      var i = +row.getAttribute('data-fi'), inp = $('input', row);
      var set = function (v) { var dd = curDough(k); dd.flours[i][1] = Math.max(0, Math.round(v * 10) / 10); setDough(k, dd); rr(); };
      inp.addEventListener('change', function () { set(pnum(inp.value)); });
      $$('[data-p]', row).forEach(function (b) { b.addEventListener('click', function () { set(+curDough(k).flours[i][1] + (+b.getAttribute('data-p'))); }); });
      $('[data-rm]', row).addEventListener('click', function () { var dd = curDough(k); if (dd.flours.length < 2) return; dd.flours.splice(i, 1); setDough(k, dd); rr(); });
      $('[data-pick]', row).addEventListener('click', function () { pickSheet(function (id) { var dd = curDough(k); dd.flours[i][0] = id; setDough(k, dd); closeSheet(); rr(); }, 'Farine e impasto'); });
    });
    $$('[data-pi]').forEach(function (row) {
      var i = +row.getAttribute('data-pi'), inp = $('input', row);
      var set = function (v) { var dd = curDough(k); dd.parts[i][1] = Math.max(0, Math.round(v * 100) / 100); setDough(k, dd); rr(); };
      inp.addEventListener('change', function () { set(pnum(inp.value)); });
      $$('[data-p]', row).forEach(function (b) { b.addEventListener('click', function () { var v = +curDough(k).parts[i][1], st = v < 1 ? 0.05 : v < 5 ? 0.1 : 1; set(v + st * (+b.getAttribute('data-p'))); }); });
      $('.nm', row).addEventListener('click', function () { ingSheet(row.querySelector('.nm').getAttribute('data-ing')); });
    });
    var bw = $('#lbw'), setBW = function (v) { var dd = curDough(k); dd.ball = Math.max(50, Math.round(v)); setDough(k, dd); rr(); };
    bw.addEventListener('change', function () { setBW(pnum(bw.value)); });
    $$('[data-b]').forEach(function (b) { b.addEventListener('click', function () { setBW(ST.doughs[k].ball + (+b.getAttribute('data-b'))); }); });
    $('#addF').addEventListener('click', function () { pickSheet(function (id) { var dd = curDough(k); dd.flours.push([id, 5]); setDough(k, dd); closeSheet(); rr(); }, 'Farine e impasto'); });
    var rs = $('#rsD'); if (rs) rs.addEventListener('click', function () { delete LS.d[k]; save(); refresh(); rr(); });
    track('impasto/' + k);
  }

  // ---------- ALTRO ----------
  function viewMore() {
    setHeader(t('tMore'), t('settings'), false);
    var cnt = { L: 0, S: 0, E: 0 }; D.ings.forEach(function (i) { cnt[i.t]++; });
    var h = '<h3 class="sec">' + t('settings') + '</h3><div class="opts">' + optRow('net', t('netT'), t('netS'), 'sw') + optRow('vat', t('vat'), '', 'num') + optRow('waste', t('optWaste'), t('optWasteS'), 'num') + optRow('spolvero', t('spolveroG'), t('spolvero'), 'num') + optRow('energy', t('optEnergy'), t('optEnergyS'), 'sw') + optRow('takeaway', t('optTake'), t('optTakeS'), 'sw') + '</div>';
    h += '<h3 class="sec">' + t('export') + '</h3><div class="btns"><button class="btn" data-csv="menu">⬇ ' + t('csvMenu') + '</button><button class="btn ghost" data-csv="rec">⬇ ' + t('csvRec') + '</button><button class="btn ghost" data-csv="stock">⬇ ' + t('csvStock') + '</button></div>';
    h += '<h3 class="sec">' + t('about') + '</h3><div class="note about">' + t('aboutTxt') + '<br><br>' + t('srcTxt') + '<br>' + t('srcL') + ': ' + cnt.L + ' · ' + t('srcS') + ': ' + cnt.S + ' · ' + t('srcE') + ': ' + cnt.E + '<br><br>' + t('menuFrom') + ' ' + D.items.length + ' ' + t('covered') + '. ' + t('notCovered') + '</div>';
    h += '<div class="note about"><b>' + t('forMaestro') + '</b><img src="img/grid-lapolla.webp" alt="Giuseppe Lapolla" loading="lazy" width="600" height="400">' + t('lapolla') + '</div>';
    h += '<div class="btns"><button class="btn red" id="rsAll">↺ ' + t('resetAll') + '</button></div>';
    h += '<p class="foot">Demo · <a href="https://bollastudio.com" target="_blank" rel="noopener">BOLLA STUDIO</a> · Marcelo Bolla · <a href="tel:+393445240254">+39 344 524 0254</a><br>' + (lang === 'es' ? 'No es una app oficial de Da Serafino.' : 'Non è un\'app ufficiale di Da Serafino.') + '</p>';
    view.innerHTML = h;
    bindOpts(function () { var y = window.scrollY; render(); window.scrollTo(0, y); toast('✓ ' + t('saved')); });
    $$('[data-csv]').forEach(function (b) { b.addEventListener('click', function () { exportCSV(b.getAttribute('data-csv')); }); });
    $('#rsAll').addEventListener('click', function () { if (!confirm(t('resetQ'))) return; LS = { lang: lang, p: {}, r: {}, d: {}, ds: {}, ball: {}, combo: {}, s: {}, custom: [] }; save(); refresh(); render(); toast('↺ OK'); });
  }
  function csvCell(v) { if (typeof v === 'number') v = String(Math.round(v * 10000) / 10000).replace('.', ','); v = String(v == null ? '' : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function download(name, rows) {
    var txt = '\ufeff' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('⬇ ' + name); track('csv/' + name);
  }
  function exportCSV(kind) {
    var rows = [], es = lang === 'es';
    if (kind === 'stock') {
      rows.push(es ? ['Categoría', 'Ingrediente', 'Marca/calidad', 'Formato', 'Precio formato € (sin IVA)', 'Unidad', '€/kg-L-u', '€/g-ml', 'Tipo de fuente', 'Fuente', 'URL', 'Fecha', 'Nota'] : ['Categoria', 'Ingrediente', 'Marca/qualità', 'Formato', 'Prezzo formato € (IVA escl.)', 'Unità', '€/kg-L-pz', '€/g-ml', 'Tipo fonte', 'Fonte', 'URL', 'Data', 'Nota']);
      Object.keys(ST.ings).forEach(function (k) { var i = ST.ings[k], up = C.unitPrice(i); rows.push([catL(i.c), i.n, i.q, i.f, i.p, i.u, up, i.u === 'pz' ? '' : up / 1000, t('src' + (i.t || 'U')), i.src, i.url, i.d, i.nota]); });
      return download('serafino-magazzino.csv', rows);
    }
    if (kind === 'menu') {
      rows.push(es ? ['Categoría', 'Plato', 'Masa', 'Precio carta €', 'Precio base de cálculo €', 'Costo €', 'Food cost %', 'Margen €'] : ['Categoria', 'Piatto', 'Impasto', 'Prezzo menu €', 'Prezzo base calcolo €', 'Costo €', 'Food cost %', 'Margine €']);
      D.items.forEach(function (b) { var it = ST.items[b.slug], c = C.item(it, ST); rows.push([it.sub, it.n, it.dough ? ST.doughs[it.dough].n : '', it.price, c.priceBase, c.total, c.fc, c.margin]); });
      return download('serafino-food-cost-menu.csv', rows);
    }
    rows.push(es ? ['Plato', 'Partida', 'Ingrediente', 'Cantidad', 'Unidad', '€/unidad (kg-L-u)', 'Costo €'] : ['Piatto', 'Voce', 'Ingrediente', 'Quantità', 'Unità', '€/unità (kg-L-pz)', 'Costo €']);
    D.items.forEach(function (b) {
      var it = ST.items[b.slug], c = C.item(it, ST);
      c.lines.forEach(function (l) {
        if (l.id === '__dough') { c.dough.calc.lines.forEach(function (dl) { var ing = ST.ings[dl.id]; rows.push([it.n, t('dough') + ' ' + ST.doughs[c.dough.id].n, ing.n, dl.q, unitOf(ing), C.unitPrice(ing), dl.cost]); }); return; }
        var ing = ST.ings[l.id]; rows.push([it.n, l.auto ? t('spolvero') : (es ? 'Ingrediente' : 'Farcitura'), ing.n, l.q, unitOf(ing), C.unitPrice(ing), l.cost]);
      });
      c.groups.forEach(function (gp) { gp.lines.forEach(function (l) { var ing = ST.ings[l.id]; rows.push([it.n, t('half') + ' ' + (gp.half + 1) + ': ' + ST.items[gp.slug].n, ing.n, l.q, unitOf(ing), C.unitPrice(ing), l.cost]); }); });
      if (c.waste) rows.push([it.n, 'Extra', t('waste') + ' ' + ST.s.waste + '%', '', '', '', c.waste]);
      if (c.energy) rows.push([it.n, 'Extra', t('energy'), 1, 'pz', c.energy, c.energy]);
      if (c.box) rows.push([it.n, 'Extra', t('box'), 1, 'pz', c.box, c.box]);
      rows.push([it.n, es ? 'TOTAL' : 'TOTALE', '', '', '', '', c.total]);
    });
    download('serafino-ricette-dettaglio.csv', rows);
  }

  applyLang();
  if (!location.hash) history.replaceState(null, '', location.pathname + location.search + '#/menu');
  render();
})();
