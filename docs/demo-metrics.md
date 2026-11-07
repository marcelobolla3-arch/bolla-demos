# Contador de demos

Las visitas y el uso se envían al GoatCounter que ya existe: `https://bollastudio.goatcounter.com/count`. No hay otra cuenta, clave ni servicio en este repositorio.

El 7 de noviembre de 2026 este entorno hizo dos lecturas públicas, `counter/bolla-demo-hotel-ch/en.json` y `counter//bolla-demo-hotel-ch/en.json`. Las dos devolvieron HTTP 403. No hay variable de acceso. Un envío etiquetado a `/count`, ruta `/bolla-metrics-audit/synthetic-2026-11-07`, título `qa-synthetic`, devolvió HTTP 200. Otro intento con `b=1` devolvió HTTP 400 y la cabecera `X-Goatcounter: wrong value: b=1`. El envío puede entrar. Esta sesión no puede listar lo que quedó guardado. Quien tenga la cuenta lo mira en el panel y tiene que excluir la ruta `/bolla-metrics-audit/`.

El script del navegador no es el almacén. Sin el acceso de lectura, la medición no se puede consultar desde aquí.

## Qué se cuenta

- Visita (`page_view`): una sola llamada al abrir la página de idioma. No es un evento.
- Uso: una llamada con `event: true`.
  - Chat o guion: `/chat/<id>` al pulsar una pregunta preparada, y `/request/confirm` al pulsar el botón de la nota. El id es fijo. No se envía el texto escrito, el nombre ni el contacto.
  - Voz: `…/voice-start` al iniciar la sesión del widget, como máximo una vez cada 4 segundos. No se envía audio.
  - Video: `/play` o `…-play` la primera vez que el visitante pulsa reproducir. No se envía el archivo ni el minuto.

La visita y el uso llevan `?p=` solo si el enlace lo trae. `p` se recorta a 60 caracteres `a-z`, `0-9` y guion. Es una etiqueta de campaña, no una persona ni una empresa.

## Cómo mirar una demo y una campaña

En el panel de GoatCounter, la ruta sin `?p=` es la demo. La misma ruta con `?p=etiqueta` es esa campaña. El uso de esa campaña está en las rutas de evento que terminan en `?p=etiqueta`.

Ejemplos:

- `/bolla-demo-restaurant/en/` visita de la demo en inglés, sin campaña.
- `/bolla-demo-restaurant/en/?p=etiqueta` visita de un enlace nuevo.
- `/bolla-demo-restaurant/en/chat/lunch?p=etiqueta` uso de un botón.
- `/bolla-video-comunidad-argentina/es/` visita del video.
- `/bolla-video-comunidad-argentina/es/play?p=etiqueta` reproducción.

`https://demo.bollastudio.com/restaurant/en/` sin `?p=` es un solo grupo. Los enlaces ya enviados a Olde Hansa y a Peppersack no se pueden separar después. Los enlaces nuevos deben llevar `?p=` opaco. El cambio de idioma conserva la búsqueda de la dirección.

## Qué no entra

`?internal=1` guarda `skipgc` y no carga el contador. `?internal=0` lo vuelve a permitir. Las pruebas de este repositorio usan `internal=1`.

Hay que excluir a mano la ruta `/bolla-metrics-audit/`, si aparece: es una prueba sintética etiquetada, no una visita comercial.

Esto no separa personas de robots. No promete visitantes humanos únicos. GoatCounter puede guardar tamaño de pantalla y referrer porque así funciona su script. Este cambio no añade IP, huella ni contenido de chat o audio.

## Inventario en este árbol

Hay 621 `index.html`. 581 incluyen el endpoint de GoatCounter. 39 son redireccionamientos y no lo cargan: conservan `location.search` para no perder `?p=` y para no contar dos veces. La portada `index.html` tampoco lo carga.

De las 581, 120 incluyen `skipgc`. Las otras 461 ya envían una visita con el script antiguo y no tienen el filtro `?internal=1`. Un ejemplo, `hicar/index.html`, además llama a `bsTrack` al abrir la escena inicial y no marca `event: true`. Esta rama no reescribe esas 461 páginas.

Las 83 páginas auditadas de Suiza, neutras, Berlín, video, concesionarios, voz, náutica, Ambàra y Coral sí tienen endpoint y `skipgc`. En náutica y náutica-cat, `p` ya es el tramo de la ruta (`/etiqueta/demo` y `/etiqueta/q-…`), no un `?p=` añadido. Ese comportamiento se deja igual para no partir el histórico. En el chat de sector, la reproducción automática del guion no llama a `bsTrack`. El uso es el botón o la confirmación. En el video, la visita y la primera reproducción van separadas. En la voz, la visita y el inicio de sesión van separados.

De las 69 rutas publicadas el 7 de noviembre de 2026, 56 son páginas de idioma y 13 son entradas que redirigen. Las 56 ya tenían visita y eventos. Esta rama añade `?p=` al evento. El video no estaba en esas 69: sus cinco idiomas no tenían contador y ahora sí. `voz/lagoon42` no filtraba `?internal=1` ni `?p=`. `voz/schloss-wuelflingen` no ponía `?p=` en la ruta.

## Páginas nuevas

Toda `index.html` que no sea redireccionamiento ni la portada tiene que incluir `https://bollastudio.goatcounter.com/count`. Un redireccionamiento tiene que conservar `location.search` y no cargar el contador. Las 83 páginas auditadas tienen que incluir además `skipgc`. El generador `scripts/sector-page.mjs` escribe una sola visita, con `no_onload`, y el evento lleva `?p=` si existe. El test `test/metrics-coverage.test.mjs` lo exige en CI. El test no envía nada al contador.

El script público también manda `location.search` en el campo `q`. La ruta usa solo `p` ya recortado. Un enlace no debe llevar nombre, correo ni otro dato en la consulta: este repositorio no puede quitar `q` sin sustituir `count.js`.
