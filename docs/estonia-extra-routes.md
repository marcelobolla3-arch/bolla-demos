# Rutas nuevas de Estonia

Rama aparte de `main` `c16a7f6`. No cambia la PR 7 (`04a928a`).

| Ejemplo | Rutas | Qué es |
| --- | --- | --- |
| Barbería masculina | `/barber/et/`, `/barber/en/`, entrada `/barber/` | «Näidisbarber» / “Example Barber”, tienda inventada. No es `/hair-salon/`. |
| Charter y vela, Tallinn | `/charter/et/`, `/charter/en/`, entrada `/charter/` | «Näidispurje» / “Example Sailing”. No es `/charter-de/`. |
| Marina | `/marina-pirita/et/`, entrada `/marina-pirita/` | «Näidissadam», ejemplo genérico en estonio. No es `/hotel/` ni la web de un puerto. |

La entrada guarda la búsqueda de la dirección, incluida `?p=`, y no carga el contador. La página de idioma cuenta una visita y el uso solo al pulsar un botón o la nota. El texto escrito no se envía. `?internal=1` no carga el contador. `?p=` no cambia el texto.

Estas páginas ya llevan la etiqueta de campaña también en el evento de uso. En `main`, el generador compartido todavía no la pone en las demos antiguas: eso está en la PR 7. Aquí no se copia el resto de esa PR.

## Seis prospectos ya preparados

Siguen en sus rutas de siempre. Estas páginas nuevas no los nombran y no están personalizadas para ellos.

| Prospecto | Ruta que ya se envió | Relación con estas páginas |
| --- | --- | --- |
| Leib | `/restaurant/et/` sin `?p=` | Sigue siendo el ejemplo de restaurante. |
| Three Sisters | `/hotel/en/` sin `?p=` | Sigue siendo el ejemplo de hotel. |
| Sakala | `/dentist/et/` sin `?p=` | Sigue siendo el ejemplo de clínica dental. |
| Füsio | `/physio/et/` sin `?p=` | Sigue siendo el ejemplo de fisioterapia. |
| Olde Hansa | `/restaurant/en/` sin `?p=` | Misma ruta que Peppersack. No se puede separar. |
| Peppersack | `/restaurant/en/` sin `?p=` | Misma ruta que Olde Hansa. No se puede separar. |

El estonio y el inglés de estas tres familias no pasaron por un revisor nativo.
