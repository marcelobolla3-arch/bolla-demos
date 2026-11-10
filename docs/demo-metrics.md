# Contador de demos

Las visitas y el uso se envían al GoatCounter que ya está en las páginas: `https://bollastudio.goatcounter.com/count`. El panel es `https://bollastudio.goatcounter.com`. La API está documentada en `https://www.goatcounter.com/help/api` y el esquema en `https://www.goatcounter.com/api.json`. No hay otra cuenta, otro alojamiento ni una clave en este repositorio.

## Visita y uso

- Visita: una sola llamada al abrir la página. No lleva `event: true`.
- Uso: una llamada con `event: true`, solo después de un gesto.
  - Guion: el id fijo del botón, con título `example` o `script-option`. La frase del botón no va en el título. El texto escrito no se envía.
  - Confirmación de la nota de ejemplo: `/request/confirm` o `/booking/confirm`.
  - Voz: inicio de sesión del widget, como máximo una vez cada 4 segundos. No se envía audio. Pulsar no demuestra que la llamada conectara.
  - Video: la primera reproducción, título `video-play`. Abrir la página no es reproducir. No se envían cuartiles ni el archivo.

La reproducción automática del guion no es uso. En `hicar`, `cv-auto`, `mabuhay-motors` y `project-one-motors` la escena inicial se muestra y no se cuenta. El clic posterior sí.

`?p=` es una etiqueta de campaña de hasta 60 caracteres `a-z`, `0-9` y guion. No es una persona ni una empresa. En náutica, náutica-cat y `/es/` esa etiqueta ya es un tramo de la ruta (`/etiqueta/demo` o `/etiqueta/demo-es-general`). Ahí se deja así para no partir el histórico.

`https://demo.bollastudio.com/restaurant/en/` sin `?p=` es un solo grupo. Los enlaces ya enviados a Olde Hansa y a Peppersack no se pueden separar. Los enlaces nuevos llevan `?p=` opaco. El cambio de idioma y las entradas conservan la búsqueda de la dirección.

## Filtros

`?internal=1` guarda `skipgc` y no carga el contador. `?internal=0` lo vuelve a permitir. Las pruebas de este repositorio usan `internal=1`. Esto ocurre en el navegador. No promete visitantes humanos. Una visita no es una persona. Un guion estático no es una sesión de IA.

GoatCounter, en su código público, crea una ruta solo cuando `Bot` es 0 (`hit.go`, `Hit.Defaults`). Si `isbot` marca el agente o la IP, el golpe puede aceptarse y no aparecer en `GET /api/v0/paths`. Las estadísticas saltan esos golpes (`cron/tasks.go`, `persistAndStat`). La tabla `bots` se borra a los 30 días (`oldBot`). La retención del sitio solo corre si `DataRetention` es mayor que 0; este repositorio no conoce ese ajuste.

`GET /count` responde un GIF de 43 bytes. HTTP 200 significa que el manejador validó el golpe y lo dejó en memoria. No significa que exista una ruta. `b` entre 1 y 149 responde HTTP 400 con `X-Goatcounter: wrong value`. La persistencia documentada de la API es en segundo plano, cada 10 segundos (`POST /api/v0/count`).

## Lectura del 7 de noviembre de 2026

El padre leyó la API privada con la credencial que ya tenía, fuera de este entorno: `GET /api/v0/me` devolvió 200 y `GET /api/v0/paths`, paginado, 289 rutas y 200. Ninguna contenía `audit` ni `synthetic` a las 23:50 Europe/Rome. `GET /api/v0/paths` no tiene filtro de fechas. `Limit` va de 1 a 200, por defecto 20, y `After` es el cursor. `GET /api/v0/stats/total` usa `start` y `end` redondeados a la hora; el valor por defecto es desde hace una semana. Un día UTC no es el día de Roma. El total de 3 visitas y 0 eventos para el 7 de noviembre UTC no es el total de Roma ni una prueba de que el código no envíe eventos.

El único envío de este entorno que recibió HTTP 200 fue:

`GET https://bollastudio.goatcounter.com/count?p=%2Fbolla-metrics-audit%2Fsynthetic-2026-11-07&t=qa-synthetic&b=0&s=0&rnd=audit3`

Agente: `Mozilla/5.0 (compatible; bolla-metrics-audit)`. Sin `Referer`. Respuesta: HTTP 200, `image/gif`, 43 bytes, sin cabecera `X-Goatcounter`. Un intento anterior con `b=1` devolvió HTTP 400 y `X-Goatcounter: wrong value: b=1`. Esa cadena es la del manejador público `handlers/count.go`. El 200 no demuestra que el golpe quedara en la tabla de rutas. La ausencia en las 289 rutas tampoco demuestra otro servidor: el agente y la IP de esta máquina son del tipo que `isbot` puede marcar, y entonces no se crea ruta.

No se hacen más envíos desde aquí. Para comprobar persistencia más adelante, con la misma cuenta y sin abrir el panel al público: un navegador que no sea un centro de datos, ruta `/bolla-metrics-audit/…`, `b` ausente o 0, y después de los 10 segundos `GET /api/v0/paths` más `GET /api/v0/stats/total` con `path_by_name` e `include_paths` para esa ruta, `start` y `end` en hora de Roma. Al leer los KPI se excluye ese prefijo. El 403 de una lectura sin credencial solo dice que el listado es privado.

## Inventario

Hay 621 `index.html`. 581 tienen el endpoint y `skipgc`. 39 son redireccionamientos: no cargan el contador y conservan `location.search`. La portada `index.html` es el letrero del servidor, sin interacción, y no cuenta.

| Familia | Páginas | Antes de esta rama | Después |
| --- | --- | --- | --- |
| Portada | 1 | Sin contador | Igual. No es una demo. |
| Redirecciones | 39 | Sin contador, conservan la búsqueda | Igual. El destino cuenta la visita. |
| Suiza, neutras y Berlín, páginas de idioma | 95 | Visita y eventos, con `skipgc` | El evento lleva `?p=`. El título del botón deja de ser la frase. |
| Video comunidad-argentina | 5 | Sin contador | Una visita y la primera reproducción. |
| Concesionarios en, de, es, it | 4 | Visita automática, sin filtro | Visita en `/etiqueta/video-<idioma>`. El chat cuenta `conc-chat-open` y `conc-intent-<id>`, sin el texto escrito. |
| Voz Schloss, Ambàra, Lagoon | 3 | Visita; Lagoon sin filtro; la campaña no iba en todos los eventos | Filtro y `?p=` en el evento. El widget no cambia. |
| Náutica y náutica-cat | 2 | Visita y preguntas, `p` como tramo | Igual. |
| Ambàra y Coral, chat | 2 | Visita y eventos | El evento lleva `?p=`. |
| Prospectos de una página | 460 | Visita sin `skipgc`. El uso no era `event`. Cuatro contaban la escena al abrir. | `skipgc`, una visita, uso con `event: true` y `?p=`. 237 tienen un clic medible, incluido Budokan Zürich. 223 solo tienen visita: 205 sin controles y 18 con menú de folleto. Ese menú no es uso. |
| Yakin Arena | 1 | Visita de la URL y pestañas en rutas `/home` o `/chat` | Visita `/bolla-demo-yakin-arena/`. La sección y la opción van por id, como evento. |
| Dental Dubai y `/es/` | 2 | Visita con filtro parcial | El filtro no carga el script. `/es/` sigue usando `p` como tramo y no tiene botones. |

De las 69 rutas publicadas, 56 son páginas de idioma que ya contaban, y 13 son entradas que redirigen.

## Contrato propuesto, adaptado

El contrato de Operaciones Demos pedía, para todas las familias, `script_start`, pasos, completado, cuartiles de video, conexión de voz y un id de evento. GoatCounter guarda una ruta, un título, un booleano de evento y la consulta. No guarda un id de evento, una zona horaria propia ni el texto. Lo que esta rama envía:

| Pedido | Qué queda |
| --- | --- |
| Visita distinta de la interacción | Visita sin `event`. Uso con `event: true`. |
| Campaña | `?p=` saneado, o el tramo ya usado en náutica y `/es/`. |
| Guion estático | El clic del botón. No el arranque automático ni el texto. No se llama uso de IA. |
| Voz | Solo el inicio que ya dispara el widget. No hay evento de conexión, fin ni duración. |
| Video | `video-play` una vez. No hay 25/50/75 ni completado. |
| Ayuda dedicada | No hay un agente de ayuda en estas páginas. No se inventa. |

## Páginas nuevas

Toda `index.html` que no sea redireccionamiento ni la portada tiene que incluir `https://bollastudio.goatcounter.com/count` y `skipgc`. Si define `bsTrack`, el uso lleva `event: true`. Un redireccionamiento conserva `location.search` y no carga el contador. `scripts/sector-page.mjs` escribe una sola visita, con `no_onload`, y el evento lleva `?p=`. `test/metrics-coverage.test.mjs` lo exige y no llama al contador.

El script público también manda `location.search` en el campo `q`. La ruta usa `p` ya recortado. Un enlace no debe llevar nombre ni correo en la consulta: este repositorio no sustituye `count.js`.

## Concesionarios

`/concesionarios/en/`, `/de/`, `/es/` e `/it/` ya no reproducen `video.mp4`. Esos archivos salieron del repositorio. La visita sigue en `/${p}/video-<idioma>` (o `/video-<idioma>` si no hay campaña) y el título del contador sigue siendo `concesionarios video-<idioma>`, para no partir la serie. El evento viejo `/${p}/video-<idioma>-play` con título `video-play` ya no existe.

El uso del chat es otro evento, con `event: true`, y no lleva el texto escrito. El primer gesto del chat cuenta `/${p}/conc-chat-open` (título `conc-chat-open`). Cada respuesta de una categoría cuenta `/${p}/conc-intent-<id>` con el mismo título (`conc-intent-stock`, `conc-intent-testdrive`, `conc-intent-workshop`, `conc-intent-finance`, `conc-intent-hours`, `conc-intent-location`, `conc-intent-human`, `conc-intent-emergency`, `conc-intent-fallback`). La nota del formulario, si se completa, cuenta `/${p}/conc-intent-request`. El guion que se reproduce solo al abrir no cuenta. `?internal=1` sigue sin cargar el contador. En `/en/` y `/de/` la redirección de prospectos sigue, pero el HTML guarda un hash de 16 hex y la ruta del rubro: el nombre se toma del `p` de la URL. Los enlaces ya enviados no cambian de ruta.
