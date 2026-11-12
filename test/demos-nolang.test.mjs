import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const routes = [
  "/aesthetik-ch/de/", "/aesthetik-ch/fr/", "/ausfluege-ch/de/", "/ausfluege-ch/fr/",
  "/barber/en/", "/barber/et/", "/bergbahn-ch/de/", "/bergbahn-ch/fr/",
  "/boat-tours-intl/en/", "/boat-tours-intl/it/", "/canyoning-ch/de/", "/canyoning-ch/fr/",
  "/charter-de/en/", "/charter-intl/de/", "/charter-intl/en/", "/charter-intl/es/", "/charter-intl/fr/", "/charter-intl/it/",
  "/charter/en/", "/charter/et/", "/coiffeur-ch/de/", "/coiffeur-ch/en/", "/coiffeur-ch/fr/",
  "/concesionarios/de/", "/concesionarios/en/", "/concesionarios/es/", "/concesionarios/fr/", "/concesionarios/it/",
  "/dentist-intl/de/", "/dentist/de/", "/dentist/en/", "/dentist/es/", "/dentist/et/", "/dentist/ru/",
  "/fahrschule-ch/de/", "/fahrschule-ch/fr/", "/ferienwohnung-ch/de/", "/ferienwohnung-ch/fr/",
  "/fitness-ch/de/", "/fitness-ch/fr/", "/garage-ch/de/", "/garage-ch/en/", "/garage-ch/fr/",
  "/garage/en/", "/garage/et/", "/garage/ru/", "/gastro-gruppe/de/",
  "/hair-salon/en/", "/hair-salon/et/", "/hair-salon/ru/",
  "/hotel-ch/de/", "/hotel-ch/en/", "/hotel-ch/fr/", "/hotel-de/de/", "/hotel-intl/en/",
  "/hotel/en/", "/hotel/es/", "/hotel/et/", "/hotel/ru/",
  "/immobilien-ch/de/", "/immobilien-ch/en/", "/immobilien-ch/fr/",
  "/industrie-de/de/", "/industrie-de/en/",
  "/movers/en/", "/movers/et/", "/movers/ru/",
  "/musikschule-ch/de/", "/musikschule-ch/fr/",
  "/nautica/", "/nautica/en/", "/nautica/es/", "/nautica/fr/",
  "/optician/en/", "/optician/et/", "/optician/ru/",
  "/optiker-ch/de/", "/optiker-ch/en/", "/optiker-ch/fr/",
  "/paragliding-ch/de/", "/paragliding-ch/fr/",
  "/physio-ch/de/", "/physio-ch/en/", "/physio-ch/fr/",
  "/physio/en/", "/physio/et/", "/physio/ru/",
  "/real-estate/en/", "/real-estate/et/", "/real-estate/ru/",
  "/restaurant-ch/de/", "/restaurant-ch/en/", "/restaurant-ch/fr/", "/restaurant-de/de/",
  "/restaurant/en/", "/restaurant/es/", "/restaurant/et/", "/restaurant/ru/",
  "/schifffahrt-ch/de/", "/schifffahrt-ch/fr/",
  "/skischule-ch/de/", "/skischule-ch/fr/",
  "/skiverleih-ch/de/", "/skiverleih-ch/fr/",
  "/tierarzt-ch/de/", "/tierarzt-ch/en/", "/tierarzt-ch/fr/",
  "/tourismus-berlin/de/", "/tourismus-berlin/en/",
  "/umzug-ch/de/", "/umzug-ch/en/", "/umzug-ch/fr/",
  "/velomiete-ch/de/", "/velomiete-ch/fr/",
  "/velowerkstatt-ch/de/", "/velowerkstatt-ch/fr/",
  "/vet/en/", "/vet/es/", "/vet/et/", "/vet/ru/",
  "/zahnarzt-ch/de/", "/zahnarzt-ch/en/", "/zahnarzt-ch/fr/",
];

function fileFor(route) {
  return route === "/nautica/" ? "nautica/index.html" : `${route.replace(/^\/|\/$/g, "")}/index.html`;
}

for (const route of routes) {
  test(`${route} has no language selector`, () => {
    const html = readFileSync(new URL(`../${fileFor(route)}`, import.meta.url), "utf8");
    assert.doesNotMatch(html, /data-keep-query/, route);
    assert.doesNotMatch(html, /id="bolla-lang-links"/, route);
    assert.doesNotMatch(html, /<nav class="langs?"/, route);
    assert.doesNotMatch(html, /href="(?:\.\.\/|\/)(?:en|es|et|ru|de|fr|it)\//, route);
  });
}
