// Food cost demo (Da Serafino): verifica dei calcoli.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../da-serafino-food-cost/calc.js');
const D = require('../da-serafino-food-cost/data.js');
const ings = Object.fromEntries(D.ings.map(i => [i.id, i]));
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} != ${b}`);
const st = (s) => ({ ings, doughs: D.doughs, items: Object.fromEntries(D.items.map(i => [i.slug, i])), s });

test('prezzo unitario e costo di 1 ml / 1 g', () => {
  near(C.unitPrice(ings.f_superiore), ings.f_superiore.p / 25, 1e-12);
  near(C.lineCost(ings.olio_evo, 1), ings.olio_evo.p / 5 / 1000, 1e-12);
  near(C.lineCost(ings.uova, 2), 2 * ings.uova.p / 180, 1e-12);
  assert.equal(C.lineCost(ings.sale, 0), 0);
});

test('impasto: somma grammi = peso panetto, costo coerente', () => {
  for (const [k, d] of Object.entries(D.doughs)) {
    const r = C.dough(d, ings);
    near(r.lines.reduce((a, l) => a + l.g, 0), d.ball, 1e-9);
    near(r.lines.reduce((a, l) => a + l.cost, 0), r.ballCost, 1e-12);
    near(r.costPerKg, r.batchCost / r.batchWeight * 1000, 1e-12);
    near(d.flours.reduce((a, f) => a + f[1], 0), 100, 1e-9);
  }
});

test('Margherita: costo = panetto + spolvero + pomodoro + mozzarella', () => {
  const m = D.items.find(i => i.slug === 'margherita-1');
  const r = C.item(m, st({ spolvero: 8, waste: 0, energy: false, vat: 10, net: true }));
  const exp = C.dough(D.doughs.classico, ings, 270).ballCost + C.lineCost(ings.f_spolvero, 8) + C.lineCost(ings.pom_sanmarzano, 80) + C.lineCost(ings.fiordilatte, 110);
  near(r.total, exp, 1e-12);
  near(r.fc, exp / (7 / 1.1) * 100, 1e-9);
  const r2 = C.item(m, st({ spolvero: 8, waste: 10, energy: true, takeaway: true, vat: 10, net: false }));
  near(r2.total, exp * 1.1 + ings.energia.p + ings.box_pizza.p, 1e-12);
});

test('tutti i piatti hanno costo > 0 e ogni prezzo ha fonte o è stima', () => {
  const S = st({ spolvero: 8, waste: 0, energy: false, vat: 10, net: true });
  for (const it of D.items) { const r = C.item(it, S); assert.ok(r.total > 0 && r.fc > 0 && r.fc < 100, it.slug); }
  for (const i of D.ings) { assert.ok(i.t === 'E' || /^https:\/\//.test(i.url), i.id); assert.ok(i.p > 0 && i.fq > 0, i.id); }
});
