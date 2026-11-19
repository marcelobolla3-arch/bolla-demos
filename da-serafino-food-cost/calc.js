/* Da Serafino · Food cost · motore di calcolo (puro, testabile in Node). BOLLA STUDIO demo. */
(function (g) {
  'use strict';
  // € per unità base: €/kg, €/L oppure €/pz
  function unitPrice(ing) { return ing && ing.fq > 0 ? ing.p / ing.fq : 0; }
  // costo di una quantità: g (kg), ml (L) o pezzi (pz)
  function lineCost(ing, qty) {
    if (!ing || !(qty > 0)) return 0;
    var up = unitPrice(ing);
    return ing.u === 'pz' ? up * qty : up * qty / 1000;
  }
  // grammi -> ml per i liquidi (olio, acqua, latte)
  function gToMl(ing, grams) { return ing && ing.u === 'l' ? grams / (ing.dens || 1) : grams; }

  // Impasto: percentuali farine (somma normalizzata a 100) + altri ingredienti in % sul peso farina
  function dough(d, ings, ballWeight) {
    var fl = d.flours || [], parts = d.parts || [];
    var sum = fl.reduce(function (a, f) { return a + (+f[1] || 0); }, 0);
    var lines = [], weight = 0, cost = 0, flourG = 1000;
    fl.forEach(function (f) {
      var ing = ings[f[0]], gr = sum > 0 ? (+f[1] || 0) / sum * flourG : 0;
      var c = lineCost(ing, gr);
      lines.push({ id: f[0], g: gr, q: gr, pct: sum > 0 ? (+f[1] || 0) / sum * 100 : 0, flour: true, cost: c });
      weight += gr; cost += c;
    });
    parts.forEach(function (p) {
      var ing = ings[p[0]], gr = (+p[1] || 0) / 100 * flourG, q = gToMl(ing, gr);
      var c = lineCost(ing, q);
      lines.push({ id: p[0], g: gr, q: q, pct: +p[1] || 0, flour: false, cost: c });
      weight += gr; cost += c;
    });
    var bw = ballWeight > 0 ? ballWeight : (d.ball || 0);
    var f = weight > 0 ? bw / weight : 0;
    var water = parts.filter(function (p) { return p[0] === 'acqua'; }).reduce(function (a, p) { return a + (+p[1] || 0); }, 0);
    return {
      flourSum: sum, batchFlour: flourG, batchWeight: weight, batchCost: cost,
      costPerKg: weight > 0 ? cost / weight * 1000 : 0,
      ballWeight: bw, ballCost: cost * f, hydration: water,
      ballsPerKgFlour: bw > 0 ? weight / bw : 0,
      lines: lines.map(function (l) { return { id: l.id, g: l.g * f, q: l.q * f, pct: l.pct, flour: l.flour, cost: l.cost * f }; }),
      batchLines: lines
    };
  }

  function recipeLines(r, ings, factor) {
    return (r || []).map(function (x) {
      var ing = ings[x[0]], q = (+x[1] || 0) * (factor || 1);
      return { id: x[0], q: q, cost: lineCost(ing, q) };
    });
  }

  // Costo completo di un piatto
  // st = { ings:{id:ing}, doughs:{id:dough}, items:{slug:item}, s:settings }
  function item(it, st) {
    var s = st.s || {}, ings = st.ings, out = { slug: it.slug, groups: [], lines: [] };
    var sub = 0, isPizza = it.kind === 'pizza' || it.kind === 'scrocchiarella';
    if (isPizza) {
      var did = it.dough || 'classico', d = st.doughs[did];
      var dc = dough(d, ings, it.ball || d.ball);
      out.dough = { id: did, calc: dc };
      out.lines.push({ id: '__dough', dough: did, q: dc.ballWeight, cost: dc.ballCost });
      sub += dc.ballCost;
      var sp = s.spolvero != null ? +s.spolvero : 8;
      if (sp > 0) { var spc = lineCost(ings.f_spolvero, sp); out.lines.push({ id: 'f_spolvero', q: sp, cost: spc, auto: true }); sub += spc; }
    }
    if (it.kind === 'scrocchiarella') {
      var fac = it.comboFactor != null ? +it.comboFactor : 1;
      (it.combo || []).forEach(function (slug, i) {
        var src = st.items[slug];
        if (!src) return;
        var ls = recipeLines(src.r, ings, fac), c = ls.reduce(function (a, l) { return a + l.cost; }, 0);
        out.groups.push({ slug: slug, half: i, factor: fac, lines: ls, cost: c });
        sub += c;
      });
    }
    recipeLines(it.r, ings, 1).forEach(function (l) { out.lines.push(l); sub += l.cost; });
    var waste = sub * (+s.waste || 0) / 100;
    var energy = (s.energy && it.kind !== 'dessert' && ings.energia) ? lineCost(ings.energia, 1) : 0;
    var box = (s.takeaway && isPizza && ings.box_pizza) ? lineCost(ings.box_pizza, 1) : 0;
    var total = sub + waste + energy + box;
    var vat = s.vat != null ? +s.vat : 10;
    var price = +it.price || 0, net = s.net === false ? price : price / (1 + vat / 100);
    out.subtotal = sub; out.waste = waste; out.energy = energy; out.box = box; out.total = total;
    out.price = price; out.priceBase = net;
    out.fc = net > 0 ? total / net * 100 : null;
    out.margin = net - total;
    return out;
  }

  var API = { unitPrice: unitPrice, lineCost: lineCost, gToMl: gToMl, dough: dough, item: item, recipeLines: recipeLines };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else g.SFCalc = API;
})(this);
