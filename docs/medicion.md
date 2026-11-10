# Medición

Cada visita a una demo queda en una de tres clases:

- **Prospecto.** La dirección trae un `?p=` real. El valor se pasa a minúsculas y se dejan solo `a-z`, `0-9` y el guion, con un máximo de 60 caracteres. Si después de eso queda texto y no empieza por `bmaudit-`, la visita y los usos llevan `?p=` con ese valor.
- **Interno.** El navegador está marcado, o `p` (o, si no hay `p`, `link_id`) empieza por `bmaudit-`. No se envía nada al contador.
- **Desconocido.** No hay marca interna y no hay `p` usable. Se cuenta la visita sin `?p=`. No se inventa una persona.

La misma URL que ya se envió a un prospecto sigue contando igual cuando `p` ya era `a-z`, `0-9` y guion. Un `p` con mayúsculas, espacios u otros signos se agrupa en la forma saneada, que es la que los usos ya usaban.

## El interno no entra en las métricas externas

Una visita interna no carga `https://gc.zgo.at/count.js` y no llama a `count`. No se anota bajo `/_internal/` ni bajo otro prefijo.

Un prefijo seguiría en el mismo GoatCounter. Un total, un export o un listado de todas las rutas lo sumaría si alguien no filtra. No cargar el script no puede mezclarse con las visitas externas. Las pruebas del repositorio ya exigen que `?internal=1` no inserte el script. Las URL ya enviadas no cambian: sin la marca, `?p=` sigue contando.

GoatCounter no recibe la visita. La clase «interno» vive solo en ese navegador.

## Cómo marcar un dispositivo

Abrir cualquier demo, una sola vez, con `?internal=1` o `?interno=1` (también vale en el hash, `#internal=1` o `#interno=1`).

Eso guarda dos cosas, las dos de primera parte, en el propio sitio:

- `localStorage` clave `skipgc`, valor `t`
- cookie `bolla_internal=1`, `Path=/`, `SameSite=Lax`, `Max-Age=34560000` (400 días), `Secure` solo si la página es `https:`. Sin `Domain`, así que el host es el de la página. En `demo.bollastudio.com` vale para todas las demos de ese host. No hay cookie de terceros.

Si solo queda una de las dos, la siguiente visita repone la otra. Para quitar la marca: `?internal=0` o `?interno=0`. Si los dos parámetros vienen juntos, gana el que aparece más tarde en la dirección.

Un `p` o un `link_id` que, ya saneado, empieza por `bmaudit-` también es interno y deja la marca. Sirve para las pruebas de auditoría. No hay que mandar ese prefijo a un prospecto: el navegador que lo abra deja de contarse hasta que alguien pase `?internal=0` o `?interno=0`. Si la misma dirección trae el apagado (`internal=0` o `interno=0`) y además `bmaudit-`, esa visita no se envía, pero la marca persistente sí se borra.

Las entradas que solo redirigen (`/hotel/`, `/charter/`, …) reenvían la búsqueda y el hash. La marca la graba la página de destino. La portada `/` no es una demo y no cuenta.

Si el navegador bloquea `localStorage` y cookies, la marca no sobrevive: solo esa visita con el parámetro queda fuera.

## Visita y uso

El contador sigue siendo el que ya estaba: `https://bollastudio.goatcounter.com/count`, cargado desde `https://gc.zgo.at/count.js`. No se añade otro servicio. No hay huella del dispositivo. Esta web no lee ni guarda direcciones IP. La geografía gruesa, si aparece, es la de GoatCounter.

- **Visita:** una sola llamada al abrir, sin `event: true`. La ruta es la de la tabla. Si hay `p` saneado, se añade `?p=`. En las páginas que antes reescribían la ruta del navegador, la visita queda en esa ruta canónica: un `index.html` o un parámetro extra (`utm`, etc.) ya no abre otra ruta.
- **Uso:** otra llamada, con `event: true`, solo después de un gesto: pulsar una pregunta preparada, confirmar la nota de ejemplo, iniciar la voz, reproducir el video, cambiar de pestaña o de escena en las demos que ya lo contaban. Abrir la página no es uso. La reproducción automática del guion no es uso.
- El texto escrito en el campo libre no sale del navegador. Ese envío no es un evento: no hay un id estable y el texto no debe viajar. El botón de tema preparado sí cuenta, con el id o con el slug del botón fijo, nunca con lo que la persona haya tecleado. No se envía audio ni transcripción.
- En Garage Crotta el chat cuenta `/response/{lang}` cuando llega la respuesta a un mensaje ya enviado, no al pulsar. La voz cuenta `/connected/{lang}` cuando el asistente está en línea, no al pulsar Iniciar. `{lang}` es `it`, `de`, `en` o `fr`.
- En algunas demos antiguas el título del evento es la frase del botón fijo (por ejemplo `Chat …` o `script-option`). No es texto tecleado. Las páginas de sector nuevas usan el título `example`.

Náutica, náutica-cat, `/es/` y concesionarios siguen metiendo `p` como tramo de la ruta (`/{p}/demo`, `/{p}/demo-es-general`, `/{p}/video-es`, …). Cambiarlo a `?p=` partiría el histórico. Sin `p`, náutica cuenta `/lagoon42/demo` y náutica-cat `/cat42/demo`: es el slug por defecto de siempre, no un prospecto distinto. En el panel, esa ruta sin `?p=` en la visita es la clase desconocido de esa familia. `/es/` sin `p` es `/demo-es-general`. Concesionarios sin `p` es `/video-<idioma>`.

`count.js` puede seguir mandando `location.search` en su campo `q`. Este repositorio no sustituye ese script. La ruta que agrupamos es la de la tabla, ya recortada. Una URL no debería llevar nombre ni correo.

## Inventario

598 demos cuentan. 374 tienen al menos un uso. 224 solo tienen la visita. 45 redirecciones no cargan el contador. La portada tampoco.

En la columna Visita, `{p}` es la etiqueta saneada y solo se añade cuando existe. `|` separa la ruta sin etiqueta y la ruta con etiqueta cuando `p` es un tramo, no una búsqueda.

| Ruta | Visita | Uso |
| --- | --- | --- |
| /abidos-hotel-apartment/ | /bolla-demo-abidos-hotel-apartment/?p={p} | /bolla-demo-abidos-hotel-apartment/tab/{id}?p={p} · Tab {…} |
| /abm-trento/ | /bolla-abm-trento/?p={p} | /bolla-abm-trento/step/{id}?p={p} · {button}; /bolla-abm-trento/completata?p={p} · Demo completata; /bolla-abm-trento/tab/{id}?p={p} · Tab {…}; /bolla-abm-trento/restart?p={p} · Restart |
| /acquarello-lugano/ | /acquarello-lugano/?p={p} | /acquarello-lugano/tab/{id}?p={p} · Tab {…} |
| /advance-service-py/ | /advance-service-py/?p={p} | solo visita |
| /aesthetik-ch/de/ | /bolla-demo-aesthetik-ch/de/?p={p} | /bolla-demo-aesthetik-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-aesthetik-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /aesthetik-ch/fr/ | /bolla-demo-aesthetik-ch/fr/?p={p} | /bolla-demo-aesthetik-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-aesthetik-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /ajisai-restaurant-py/ | /ajisai-restaurant-py/?p={p} | solo visita |
| /al-lido-lugano/ | /al-lido-lugano/?p={p} | /al-lido-lugano/tab/{id}?p={p} · Tab {…} |
| /al-maha-regency/ | /bolla-demo-al-maha-regency/?p={p} | /bolla-demo-al-maha-regency/tab/{id}?p={p} · Tab {…} |
| /alchimia-chiasso/ | /alchimia-chiasso/?p={p} | /alchimia-chiasso/tab/{id}?p={p} · Tab {…} |
| /alma-auto-castellanza/ | /bolla-alma-auto-castellanza/?p={p} | /bolla-alma-auto-castellanza/step/{id}?p={p} · {button}; /bolla-alma-auto-castellanza/completata?p={p} · Demo completata; /bolla-alma-auto-castellanza/tab/{id}?p={p} · Tab {…}; /bolla-alma-auto-castellanza/restart?p={p} · Restart |
| /alpe-adria-udine/ | /bolla-alpe-adria-udine/?p={p} | /bolla-alpe-adria-udine/step/{id}?p={p} · {button}; /bolla-alpe-adria-udine/completata?p={p} · Demo completata; /bolla-alpe-adria-udine/tab/{id}?p={p} · Tab {…}; /bolla-alpe-adria-udine/restart?p={p} · Restart |
| /ambarra/ | /ambarra/?p={p} | /ambarra/lang-auto/{id}?p={p} · Auto lang {…}; /ambarra/ask/{lang}/{id}?p={p} · Ask {…}; /ambarra/scenario/{lang}/{n}?p={p} · Scenario {…}; /ambarra/tab/{id}?p={p} · Tab {…}; /ambarra/lang/{id}?p={p} · Lang {…}; /ambarra/request/demo?p={p} · Demo table request |
| /ananda-hair-spa-bardonecchia/ | /bolla-demo-ananda-hair-spa-bardonecchia/?p={p} | solo visita |
| /anew-you-charleston/ | /bolla-demo-anew-you-charleston/?p={p} | /bolla-demo-anew-you-charleston/chat/{button}?p={p} · script-option; /bolla-demo-anew-you-charleston/booking/confirm?p={p} · Demo booking |
| /angie-peluqueria-y-spa-py/ | /angie-peluqueria-y-spa-py/?p={p} | solo visita |
| /apricus/ | /bolla-demo-apricus/?p={p} | /bolla-demo-apricus/tab/{id}?p={p} · Tab {…} |
| /aqui-madrid-py/ | /aqui-madrid-py/?p={p} | solo visita |
| /arranjaments-benet-mercade/ | /bolla-demo-arranjaments-benet-mercade/?p={p} | solo visita |
| /artemisa-centro-medico-estetico-y-py/ | /artemisa-centro-medico-estetico-y-py/?p={p} | solo visita |
| /arthur-shambala-hotel-py/ | /arthur-shambala-hotel-py/?p={p} | solo visita |
| /asadero-paraguayo-py/ | /asadero-paraguayo-py/?p={p} | solo visita |
| /atlanta-inmobiliaria-py/ | /atlanta-inmobiliaria-py/?p={p} | solo visita |
| /ausfluege-ch/de/ | /bolla-demo-ausfluege-ch/de/?p={p} | /bolla-demo-ausfluege-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-ausfluege-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /ausfluege-ch/fr/ | /bolla-demo-ausfluege-ch/fr/?p={p} | /bolla-demo-ausfluege-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-ausfluege-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /auto-due-a-nichelino/ | /bolla-auto-due-a-nichelino/?p={p} | /bolla-auto-due-a-nichelino/step/{id}?p={p} · {button}; /bolla-auto-due-a-nichelino/completata?p={p} · Demo completata; /bolla-auto-due-a-nichelino/tab/{id}?p={p} · Tab {…}; /bolla-auto-due-a-nichelino/restart?p={p} · Restart |
| /auto-more-mendrisio/ | /bolla-auto-more-mendrisio/?p={p} | /bolla-auto-more-mendrisio/step/{id}?p={p} · {button}; /bolla-auto-more-mendrisio/completata?p={p} · Demo completata; /bolla-auto-more-mendrisio/tab/{id}?p={p} · Tab {…}; /bolla-auto-more-mendrisio/restart?p={p} · Restart |
| /autocosmo-lugano/ | /bolla-autocosmo-lugano/?p={p} | /bolla-autocosmo-lugano/step/{id}?p={p} · {button}; /bolla-autocosmo-lugano/completata?p={p} · Demo completata; /bolla-autocosmo-lugano/tab/{id}?p={p} · Tab {…}; /bolla-autocosmo-lugano/restart?p={p} · Restart |
| /autoelite-brescia/ | /bolla-autoelite-brescia/?p={p} | /bolla-autoelite-brescia/step/{id}?p={p} · {button}; /bolla-autoelite-brescia/completata?p={p} · Demo completata; /bolla-autoelite-brescia/tab/{id}?p={p} · Tab {…}; /bolla-autoelite-brescia/restart?p={p} · Restart |
| /autofficina-pinardi-bormio/ | /bolla-demo-autofficina-pinardi-bormio/?p={p} | solo visita |
| /automecanica-edgar-tuerca-py/ | /automecanica-edgar-tuerca-py/?p={p} | solo visita |
| /autosalone-balasso-zane/ | /bolla-autosalone-balasso-zane/?p={p} | /bolla-autosalone-balasso-zane/step/{id}?p={p} · {button}; /bolla-autosalone-balasso-zane/completata?p={p} · Demo completata; /bolla-autosalone-balasso-zane/tab/{id}?p={p} · Tab {…}; /bolla-autosalone-balasso-zane/restart?p={p} · Restart |
| /autosalone-car-lurago/ | /bolla-autosalone-car-lurago/?p={p} | /bolla-autosalone-car-lurago/step/{id}?p={p} · {button}; /bolla-autosalone-car-lurago/completata?p={p} · Demo completata; /bolla-autosalone-car-lurago/tab/{id}?p={p} · Tab {…}; /bolla-autosalone-car-lurago/restart?p={p} · Restart |
| /autosalone-epis-bergamo/ | /bolla-autosalone-epis-bergamo/?p={p} | /bolla-autosalone-epis-bergamo/step/{id}?p={p} · {button}; /bolla-autosalone-epis-bergamo/completata?p={p} · Demo completata; /bolla-autosalone-epis-bergamo/tab/{id}?p={p} · Tab {…}; /bolla-autosalone-epis-bergamo/restart?p={p} · Restart |
| /autostar-riazzino/ | /bolla-autostar-riazzino/?p={p} | /bolla-autostar-riazzino/step/{id}?p={p} · {button}; /bolla-autostar-riazzino/completata?p={p} · Demo completata; /bolla-autostar-riazzino/tab/{id}?p={p} · Tab {…}; /bolla-autostar-riazzino/restart?p={p} · Restart |
| /b5-boutique-lugano/ | /b5-boutique-lugano/?p={p} | /b5-boutique-lugano/tab/{id}?p={p} · Tab {…} |
| /badalucci-lugano/ | /badalucci-lugano/?p={p} | /badalucci-lugano/tab/{id}?p={p} · Tab {…} |
| /banbridge-inn/ | /bolla-demo-banbridge-inn/?p={p} | /bolla-demo-banbridge-inn/chat/{button}?p={p} · script-option; /bolla-demo-banbridge-inn/booking/confirm?p={p} · Demo booking |
| /bar-barcelona-meridiana/ | /bolla-demo-bar-barcelona-meridiana/?p={p} | solo visita |
| /bar-cafeteria-13/ | /bolla-demo-bar-cafeteria-13/?p={p} | solo visita |
| /bar-cafeteria-borrell/ | /bolla-demo-bar-cafeteria-borrell/?p={p} | solo visita |
| /bar-can-tansi/ | /bolla-demo-bar-can-tansi/?p={p} | solo visita |
| /bar-las-calenas/ | /bolla-demo-bar-las-calenas/?p={p} | solo visita |
| /bar-restaurant-olympia/ | /bolla-demo-bar-restaurant-olympia/?p={p} | solo visita |
| /barbacoa-peruana-py/ | /barbacoa-peruana-py/?p={p} | solo visita |
| /barber-saad/ | /bolla-demo-barber-saad/?p={p} | solo visita |
| /barber-shop-luca-merano/ | /bolla-demo-barber-shop-luca-merano/?p={p} | solo visita |
| /barber/en/ | /bolla-demo-barber/en/?p={p} | /bolla-demo-barber/en/chat/{id}?p={p} · example; /bolla-demo-barber/en/request/confirm?p={p} · example |
| /barber/et/ | /bolla-demo-barber/et/?p={p} | /bolla-demo-barber/et/chat/{id}?p={p} · example; /bolla-demo-barber/et/request/confirm?p={p} · example |
| /barceloneta-tattoo-studio/ | /bolla-demo-barceloneta-tattoo-studio/?p={p} | solo visita |
| /bb-il-bolentino-varenna/ | /bolla-bb-il-bolentino-varenna/?p={p} | /bolla-bb-il-bolentino-varenna/opt?p={p} · Opzione; /bolla-bb-il-bolentino-varenna/slot?p={p} · Orario scelto; /bolla-bb-il-bolentino-varenna/confirm?p={p} · Conferma demo; /bolla-bb-il-bolentino-varenna/chat?p={p} · Rivedi chat |
| /beauty-spa-body-line-py/ | /beauty-spa-body-line-py/?p={p} | solo visita |
| /belvedere-locarno/ | /belvedere-locarno/?p={p} | /belvedere-locarno/tab/{id}?p={p} · Tab {…} |
| /bergbahn-ch/de/ | /bolla-demo-bergbahn-ch/de/?p={p} | /bolla-demo-bergbahn-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-bergbahn-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /bergbahn-ch/fr/ | /bolla-demo-bergbahn-ch/fr/?p={p} | /bolla-demo-bergbahn-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-bergbahn-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /bicicletas-guachin/ | /bolla-demo-bicicletas-guachin/?p={p} | solo visita |
| /boatcenter-lugano-noleggio/ | /boatcenter-lugano-noleggio/?p={p} | /boatcenter-lugano-noleggio/tab/{id}?p={p} · Tab {…} |
| /bontempi-moto-brescia/ | /bolla-bontempi-moto-brescia/?p={p} | /bolla-bontempi-moto-brescia/step/{id}?p={p} · {button}; /bolla-bontempi-moto-brescia/completata?p={p} · Demo completata; /bolla-bontempi-moto-brescia/tab/{id}?p={p} · Tab {…}; /bolla-bontempi-moto-brescia/restart?p={p} · Restart |
| /buca19-ascona/ | /buca19-ascona/?p={p} | /buca19-ascona/tab/{id}?p={p} · Tab {…} |
| /budokan-zuerich-web/ | /budokan-zuerich-web/?p={p} | /budokan-zuerich-web/trial/confirm?p={p} · trial-confirm; /budokan-zuerich-web/calendar?p={p} · calendar; /budokan-zuerich-web/chat/{id}?p={p} · script-option |
| /budokan-zuerich/ | /budokan-zuerich-demo/?p={p} | /budokan-zuerich-demo/tab/{id}?p={p} · Tab {…}; /budokan-zuerich-demo/chat?p={p} · Chat geöffnet |
| /busca-pies-moda-masculina-py/ | /busca-pies-moda-masculina-py/?p={p} | solo visita |
| /cafe-cafe-industria/ | /bolla-demo-cafe-cafe-industria/?p={p} | solo visita |
| /cafeteria-clot-arago/ | /bolla-demo-cafeteria-clot-arago/?p={p} | solo visita |
| /cala-melide/ | /cala-melide/?p={p} | /cala-melide/tab/{id}?p={p} · Tab {…} |
| /calzoleria-paparo-aosta/ | /bolla-demo-calzoleria-paparo-aosta/?p={p} | solo visita |
| /canela-fina-py/ | /canela-fina-py/?p={p} | solo visita |
| /canyoning-ch/de/ | /bolla-demo-canyoning-ch/de/?p={p} | /bolla-demo-canyoning-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-canyoning-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /canyoning-ch/fr/ | /bolla-demo-canyoning-ch/fr/?p={p} | /bolla-demo-canyoning-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-canyoning-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /car-motor-full-service-py/ | /car-motor-full-service-py/?p={p} | solo visita |
| /carnisseria-maria-rosa/ | /bolla-demo-carnisseria-maria-rosa/?p={p} | solo visita |
| /casa-berno-ascona/ | /casa-berno-ascona/?p={p} | /casa-berno-ascona/tab/{id}?p={p} · Tab {…} |
| /casa-boehny-appartamenti-ascona/ | /casa-boehny-appartamenti-ascona/?p={p} | /casa-boehny-appartamenti-ascona/tab/{id}?p={p} · Tab {…} |
| /casa-sartori-malcesine/ | /bolla-casa-sartori-malcesine/?p={p} | /bolla-casa-sartori-malcesine/opt?p={p} · Opzione; /bolla-casa-sartori-malcesine/slot?p={p} · Orario scelto; /bolla-casa-sartori-malcesine/confirm?p={p} · Conferma demo; /bolla-casa-sartori-malcesine/chat?p={p} · Rivedi chat |
| /casablanca-inn/ | /bolla-demo-casablanca-inn/?p={p} | /bolla-demo-casablanca-inn/chat/{button}?p={p} · script-option; /bolla-demo-casablanca-inn/booking/confirm?p={p} · Demo booking |
| /cascina-pizzeria-y-lomiteria-py/ | /cascina-pizzeria-y-lomiteria-py/?p={p} | solo visita |
| /castelgrande-bellinzona/ | /castelgrande-bellinzona/?p={p} | /castelgrande-bellinzona/tab/{id}?p={p} · Tab {…} |
| /castello-seeschloss-ascona/ | /castello-seeschloss-ascona/?p={p} | /castello-seeschloss-ascona/tab/{id}?p={p} · Tab {…} |
| /centre-educacio-reforc/ | /bolla-demo-centre-educacio-reforc/?p={p} | solo visita |
| /charly-bar-sant-andreu/ | /bolla-demo-charly-bar-sant-andreu/?p={p} | solo visita |
| /charter-de/de/ | /bolla-demo-charter-de/de/?p={p} | /bolla-demo-charter-de/de/chat/{id}?p={p} · example; /bolla-demo-charter-de/de/request/confirm?p={p} · example |
| /charter-de/en/ | /bolla-demo-charter-de/en/?p={p} | /bolla-demo-charter-de/en/chat/{id}?p={p} · example; /bolla-demo-charter-de/en/request/confirm?p={p} · example |
| /charter-intl/en/ | /bolla-demo-charter-intl/en/?p={p} | /bolla-demo-charter-intl/en/chat/{id}?p={p} · example; /bolla-demo-charter-intl/en/request/confirm?p={p} · example |
| /charter-intl/fr/ | /bolla-demo-charter-intl/fr/?p={p} | /bolla-demo-charter-intl/fr/chat/{id}?p={p} · example; /bolla-demo-charter-intl/fr/request/confirm?p={p} · example |
| /charter/en/ | /bolla-demo-charter/en/?p={p} | /bolla-demo-charter/en/chat/{id}?p={p} · example; /bolla-demo-charter/en/request/confirm?p={p} · example |
| /charter/et/ | /bolla-demo-charter/et/?p={p} | /bolla-demo-charter/et/chat/{id}?p={p} · example; /bolla-demo-charter/et/request/confirm?p={p} · example |
| /chic-woman-py/ | /chic-woman-py/?p={p} | solo visita |
| /chiquitines-py/ | /chiquitines-py/?p={p} | solo visita |
| /ciervo-blanco-py/ | /ciervo-blanco-py/?p={p} | solo visita |
| /clima-claret/ | /bolla-demo-clima-claret/?p={p} | solo visita |
| /clinica-lariana-como/ | /bolla-clinica-lariana-como/?p={p} | /bolla-clinica-lariana-como/opt?p={p} · Opzione; /bolla-clinica-lariana-como/slot?p={p} · Orario scelto; /bolla-clinica-lariana-como/confirm?p={p} · Conferma demo; /bolla-clinica-lariana-como/chat?p={p} · Rivedi chat |
| /clinica-veterinaria-guau-michi-py/ | /clinica-veterinaria-guau-michi-py/?p={p} | solo visita |
| /clot-de-la-mel/ | /bolla-demo-clot-de-la-mel/?p={p} | solo visita |
| /cmdm-mendrisio/ | /cmdm-mendrisio/?p={p} | /cmdm-mendrisio/tab/{id}?p={p} · Tab {…} |
| /co-automarcas/ | /co-automarcas-demo/?p={p} | /co-automarcas-demo/step/{id}?p={p} · {button}; /co-automarcas-demo/completada?p={p} · Demo completada; /co-automarcas-demo/tab/{id}?p={p} · Tab {…}; /co-automarcas-demo/restart?p={p} · Restart |
| /co-autos-exclusivos/ | /co-autos-exclusivos-demo/?p={p} | /co-autos-exclusivos-demo/step/{id}?p={p} · {button}; /co-autos-exclusivos-demo/completada?p={p} · Demo completada; /co-autos-exclusivos-demo/tab/{id}?p={p} · Tab {…}; /co-autos-exclusivos-demo/restart?p={p} · Restart |
| /co-autoselecto/ | /co-autoselecto-demo/?p={p} | /co-autoselecto-demo/step/{id}?p={p} · {button}; /co-autoselecto-demo/completada?p={p} · Demo completada; /co-autoselecto-demo/tab/{id}?p={p} · Tab {…}; /co-autoselecto-demo/restart?p={p} · Restart |
| /co-fersautos/ | /co-fersautos-demo/?p={p} | /co-fersautos-demo/step/{id}?p={p} · {button}; /co-fersautos-demo/completada?p={p} · Demo completada; /co-fersautos-demo/tab/{id}?p={p} · Tab {…}; /co-fersautos-demo/restart?p={p} · Restart |
| /co-imperio-automotriz/ | /co-imperio-automotriz-demo/?p={p} | /co-imperio-automotriz-demo/step/{id}?p={p} · {button}; /co-imperio-automotriz-demo/completada?p={p} · Demo completada; /co-imperio-automotriz-demo/tab/{id}?p={p} · Tab {…}; /co-imperio-automotriz-demo/restart?p={p} · Restart |
| /co-los-carros-usados/ | /co-los-carros-usados-demo/?p={p} | /co-los-carros-usados-demo/step/{id}?p={p} · {button}; /co-los-carros-usados-demo/completada?p={p} · Demo completada; /co-los-carros-usados-demo/tab/{id}?p={p} · Tab {…}; /co-los-carros-usados-demo/restart?p={p} · Restart |
| /cocina-clandestina-py/ | /cocina-clandestina-py/?p={p} | solo visita |
| /coiffeur-ch/de/ | /bolla-demo-coiffeur-ch/de/?p={p} | /bolla-demo-coiffeur-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-coiffeur-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /coiffeur-ch/en/ | /bolla-demo-coiffeur-ch/en/?p={p} | /bolla-demo-coiffeur-ch/en/chat/{id}?p={p} · example; /bolla-demo-coiffeur-ch/en/request/confirm?p={p} · example |
| /coiffeur-ch/fr/ | /bolla-demo-coiffeur-ch/fr/?p={p} | /bolla-demo-coiffeur-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-coiffeur-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /concesionarios/de/ | /video-de \| /{p}/video-de | conc-chat-open · conc-chat-open; "conc-intent-" + id · conc-intent-{…}; conc-intent-request · conc-intent-request |
| /concesionarios/en/ | /video-en \| /{p}/video-en | conc-chat-open · conc-chat-open; "conc-intent-" + id · conc-intent-{…}; conc-intent-request · conc-intent-request |
| /concesionarios/es/ | /video-es \| /{p}/video-es | conc-chat-open · conc-chat-open; "conc-intent-" + id · conc-intent-{…}; conc-intent-request · conc-intent-request |
| /concesionarios/it/ | /video-it \| /{p}/video-it | conc-chat-open · conc-chat-open; "conc-intent-" + id · conc-intent-{…}; conc-intent-request · conc-intent-request |
| /consultorio-medico-y-estetico-py/ | /consultorio-medico-y-estetico-py/?p={p} | solo visita |
| /consultorio-sonrisa-sana-py/ | /consultorio-sonrisa-sana-py/?p={p} | solo visita |
| /copia-claus-calcat-sicilia/ | /bolla-demo-copia-claus-calcat-sicilia/?p={p} | solo visita |
| /coral-yachting/ | /coral-yachting/?p={p} | /coral-yachting/ask/{lang}/{id}?p={p} · Ask {…}; /coral-yachting/scenario/{lang}/{n}?p={p} · Scenario {…}; /coral-yachting/booking/submit?p={p} · Booking request {…}; /coral-yachting/tab/{id}?p={p} · Tab {…}; /coral-yachting/lang/{id}?p={p} · Lang {…} |
| /costa-azzurra-solduno/ | /costa-azzurra-solduno/?p={p} | /costa-azzurra-solduno/tab/{id}?p={p} · Tab {…} |
| /crossfit-murri-bologna/ | /bolla-crossfit-murri-bologna/?p={p} | /bolla-crossfit-murri-bologna/opt?p={p} · Opzione; /bolla-crossfit-murri-bologna/slot?p={p} · Orario scelto; /bolla-crossfit-murri-bologna/confirm?p={p} · Conferma demo; /bolla-crossfit-murri-bologna/chat?p={p} · Rivedi chat |
| /cucina-del-cuore-py/ | /cucina-del-cuore-py/?p={p} | solo visita |
| /cv-auto/ | /bolla-demo-cv-auto/?p={p} | /bolla-demo-cv-auto/scene/{id}?p={p} · scene; /bolla-demo-cv-auto/tab/{id}?p={p} · Tab {…} |
| /da-larissa-locarno/ | /da-larissa-locarno/?p={p} | /da-larissa-locarno/tab/{id}?p={p} · Tab {…} |
| /dclot-vermuteria/ | /bolla-demo-dclot-vermuteria/?p={p} | solo visita |
| /de-tano-el-italiano-py/ | /de-tano-el-italiano-py/?p={p} | solo visita |
| /delicias-japonesas-py/ | /delicias-japonesas-py/?p={p} | solo visita |
| /deliz-tartas-postres/ | /bolla-demo-deliz-tartas-postres/?p={p} | solo visita |
| /delizie-py/ | /delizie-py/?p={p} | solo visita |
| /della-pizza-py/ | /della-pizza-py/?p={p} | solo visita |
| /dental-cure-viganello/ | /dental-cure-viganello/?p={p} | /dental-cure-viganello/tab/{id}?p={p} · Tab {…} |
| /dental-design-roma/ | /bolla-dental-design-roma/?p={p} | /bolla-dental-design-roma/opt?p={p} · Opzione; /bolla-dental-design-roma/slot?p={p} · Orario scelto; /bolla-dental-design-roma/confirm?p={p} · Conferma demo; /bolla-dental-design-roma/chat?p={p} · Rivedi chat |
| /dental-dubai/ | /bolla-demo-dental-dubai/?p={p} | /bolla-demo-dental-dubai/tab/{id}?p={p} · Tab {…} |
| /dentaldom-py/ | /dentaldom-py/?p={p} | solo visita |
| /dentcare/ | /bolla-demo-dentcare/?p={p} | /bolla-demo-dentcare/tab/{id}?p={p} · Tab {…} |
| /dentist/en/ | /bolla-demo-dentist/en/?p={p} | /bolla-demo-dentist/en/chat/{id}?p={p} · example; /bolla-demo-dentist/en/request/confirm?p={p} · example |
| /dentist/es/ | /bolla-demo-dentist/es/?p={p} | /bolla-demo-dentist/es/chat/{id}?p={p} · example; /bolla-demo-dentist/es/request/confirm?p={p} · example |
| /dentist/et/ | /bolla-demo-dentist/et/?p={p} | /bolla-demo-dentist/et/chat/{id}?p={p} · example; /bolla-demo-dentist/et/request/confirm?p={p} · example |
| /dentist/ru/ | /bolla-demo-dentist/ru/?p={p} | /bolla-demo-dentist/ru/chat/{id}?p={p} · example; /bolla-demo-dentist/ru/request/confirm?p={p} · example |
| /dentista-bettoni-locarno/ | /bolla-dentista-bettoni-locarno/?p={p} | /bolla-dentista-bettoni-locarno/opt?p={p} · Opzione; /bolla-dentista-bettoni-locarno/slot?p={p} · Orario scelto; /bolla-dentista-bettoni-locarno/confirm?p={p} · Conferma demo; /bolla-dentista-bettoni-locarno/chat?p={p} · Rivedi chat |
| /dentista-lambrate-milano/ | /bolla-dentista-lambrate-milano/?p={p} | /bolla-dentista-lambrate-milano/opt?p={p} · Opzione; /bolla-dentista-lambrate-milano/slot?p={p} · Orario scelto; /bolla-dentista-lambrate-milano/confirm?p={p} · Conferma demo; /bolla-dentista-lambrate-milano/chat?p={p} · Rivedi chat |
| /dentista-mirios-firenze/ | /bolla-dentista-mirios-firenze/?p={p} | /bolla-dentista-mirios-firenze/opt?p={p} · Opzione; /bolla-dentista-mirios-firenze/slot?p={p} · Orario scelto; /bolla-dentista-mirios-firenze/confirm?p={p} · Conferma demo; /bolla-dentista-mirios-firenze/chat?p={p} · Rivedi chat |
| /dentista-paradiso-lugano/ | /bolla-dentista-paradiso-lugano/?p={p} | /bolla-dentista-paradiso-lugano/opt?p={p} · Opzione; /bolla-dentista-paradiso-lugano/slot?p={p} · Orario scelto; /bolla-dentista-paradiso-lugano/confirm?p={p} · Conferma demo; /bolla-dentista-paradiso-lugano/chat?p={p} · Rivedi chat |
| /dentista-zamburlini-como/ | /bolla-dentista-zamburlini-como/?p={p} | /bolla-dentista-zamburlini-como/opt?p={p} · Opzione; /bolla-dentista-zamburlini-como/slot?p={p} · Orario scelto; /bolla-dentista-zamburlini-como/confirm?p={p} · Conferma demo; /bolla-dentista-zamburlini-como/chat?p={p} · Rivedi chat |
| /dielle-auto-borgaro/ | /bolla-dielle-auto-borgaro/?p={p} | /bolla-dielle-auto-borgaro/step/{id}?p={p} · {button}; /bolla-dielle-auto-borgaro/completata?p={p} · Demo completata; /bolla-dielle-auto-borgaro/tab/{id}?p={p} · Tab {…}; /bolla-dielle-auto-borgaro/restart?p={p} · Restart |
| /dog-show-veterinaria-py/ | /dog-show-veterinaria-py/?p={p} | solo visita |
| /doggy-s-hut-py/ | /doggy-s-hut-py/?p={p} | solo visita |
| /dolphin-hotel-apartments/ | /bolla-demo-dolphin-hotel-apartments/?p={p} | /bolla-demo-dolphin-hotel-apartments/tab/{id}?p={p} · Tab {…} |
| /donnabella-estetica-py/ | /donnabella-estetica-py/?p={p} | solo visita |
| /dot-tor-bellinzona/ | /bolla-dot-tor-bellinzona/?p={p} | /bolla-dot-tor-bellinzona/opt?p={p} · Opzione; /bolla-dot-tor-bellinzona/slot?p={p} · Orario scelto; /bolla-dot-tor-bellinzona/confirm?p={p} · Conferma demo; /bolla-dot-tor-bellinzona/chat?p={p} · Rivedi chat |
| /double-style-livigno/ | /bolla-demo-double-style-livigno/?p={p} | solo visita |
| /dr-maliha-dar/ | /bolla-demo-dr-maliha-dar/?p={p} | /bolla-demo-dr-maliha-dar/chat/{button}?p={p} · script-option; /bolla-demo-dr-maliha-dar/booking/confirm?p={p} · Demo booking |
| /drkraus-lugano/ | /drkraus-lugano/?p={p} | /drkraus-lugano/tab/{id}?p={p} · Tab {…} |
| /du-lac-locarno/ | /du-lac-locarno/?p={p} | /du-lac-locarno/tab/{id}?p={p} · Tab {…} |
| /eclipse-suites/ | /bolla-demo-eclipse-suites/?p={p} | /bolla-demo-eclipse-suites/tab/{id}?p={p} · Tab {…} |
| /ecolider-sants/ | /bolla-demo-ecolider-sants/?p={p} | solo visita |
| /edentswiss-dentista-bellinzona/ | /edentswiss-dentista-bellinzona/?p={p} | /edentswiss-dentista-bellinzona/tab/{id}?p={p} · Tab {…} |
| /edson-hill/ | /bolla-demo-edson-hill/?p={p} | /bolla-demo-edson-hill/chat/{button}?p={p} · script-option; /bolla-demo-edson-hill/booking/confirm?p={p} · Demo booking |
| /electromaurel/ | /bolla-demo-electromaurel/?p={p} | solo visita |
| /elefante-blanco-py/ | /elefante-blanco-py/?p={p} | solo visita |
| /elio-marra-courmayeur/ | /bolla-demo-elio-marra-courmayeur/?p={p} | solo visita |
| /elora-aesthetics/ | /bolla-demo-elora-aesthetics/?p={p} | /bolla-demo-elora-aesthetics/tab/{id}?p={p} · Tab {…} |
| /elysium-inmuebles-py/ | /elysium-inmuebles-py/?p={p} | solo visita |
| /emirates-stars/ | /bolla-demo-emirates-stars/?p={p} | /bolla-demo-emirates-stars/chat/{button}?p={p} · script-option; /bolla-demo-emirates-stars/booking/confirm?p={p} · Demo booking |
| /encanto-de-unas/ | /bolla-demo-encanto-de-unas/?p={p} | solo visita |
| /encarna-modista-gracia/ | /bolla-demo-encarna-modista-gracia/?p={p} | solo visita |
| /encarnacion-plaza-resto-py/ | /encarnacion-plaza-resto-py/?p={p} | solo visita |
| /eremo-san-nicolao-salorino/ | /eremo-san-nicolao-salorino/?p={p} | /eremo-san-nicolao-salorino/tab/{id}?p={p} · Tab {…} |
| /es-academia/ | /es-academia/?p={p} | /es-academia/chat/{button}?p={p} · Chat {…}; /es-academia/chat/replay?p={p} · Chat replay; /es-academia/solicitud/confirmar?p={p} · Demo solicitud; /es-academia/informe/{id}?p={p} · Informe {…} |
| /es-alojamiento/ | /es-alojamiento/?p={p} | /es-alojamiento/chat/{button}?p={p} · Chat {…}; /es-alojamiento/chat/replay?p={p} · Chat replay; /es-alojamiento/solicitud/confirmar?p={p} · Demo solicitud; /es-alojamiento/informe/{id}?p={p} · Informe {…} |
| /es-casa-natura-23/ | /es-casa-natura-23-demo/?p={p} | /es-casa-natura-23-demo/chat?p={p} · Chat replay; /es-casa-natura-23-demo/book?p={p} · Demo reserva |
| /es-casa-sol-y-playa/ | /es-casa-sol-y-playa-demo/?p={p} | /es-casa-sol-y-playa-demo/chat?p={p} · Chat replay; /es-casa-sol-y-playa-demo/book?p={p} · Demo reserva |
| /es-casita-de-mosto/ | /es-casita-de-mosto-demo/?p={p} | /es-casita-de-mosto-demo/chat?p={p} · Chat replay; /es-casita-de-mosto-demo/book?p={p} · Demo reserva |
| /es-dental-ceballos/ | /es-dental-ceballos-demo/?p={p} | /es-dental-ceballos-demo/chat?p={p} · Chat replay; /es-dental-ceballos-demo/book?p={p} · Demo reserva |
| /es-dentimag/ | /es-dentimag-demo/?p={p} | /es-dentimag-demo/chat?p={p} · Chat replay; /es-dentimag-demo/book?p={p} · Demo reserva |
| /es-fernandez-de-rota/ | /es-fernandez-de-rota-demo/?p={p} | /es-fernandez-de-rota-demo/chat?p={p} · Chat replay; /es-fernandez-de-rota-demo/book?p={p} · Demo reserva |
| /es-finca-son-miranda/ | /es-finca-son-miranda-demo/?p={p} | /es-finca-son-miranda-demo/chat?p={p} · Chat replay; /es-finca-son-miranda-demo/book?p={p} · Demo reserva |
| /es-fran-jaen/ | /es-fran-jaen-demo/?p={p} | /es-fran-jaen-demo/chat?p={p} · Chat replay; /es-fran-jaen-demo/book?p={p} · Demo reserva |
| /es-gross-dentistas/ | /es-gross-dentistas-demo/?p={p} | /es-gross-dentistas-demo/chat?p={p} · Chat replay; /es-gross-dentistas-demo/book?p={p} · Demo reserva |
| /es-ime-estetica/ | /es-ime-estetica-demo/?p={p} | /es-ime-estetica-demo/chat?p={p} · Chat replay; /es-ime-estetica-demo/book?p={p} · Demo reserva |
| /es-inmobiliaria/ | /es-inmobiliaria/?p={p} | /es-inmobiliaria/chat/{button}?p={p} · Chat {…}; /es-inmobiliaria/chat/replay?p={p} · Chat replay; /es-inmobiliaria/solicitud/confirmar?p={p} · Demo solicitud; /es-inmobiliaria/informe/{id}?p={p} · Informe {…} |
| /es-karoon-pilates/ | /es-karoon-pilates-demo/?p={p} | /es-karoon-pilates-demo/chat?p={p} · Chat replay; /es-karoon-pilates-demo/book?p={p} · Demo reserva |
| /es-la-charquera/ | /es-la-charquera-demo/?p={p} | /es-la-charquera-demo/chat?p={p} · Chat replay; /es-la-charquera-demo/book?p={p} · Demo reserva |
| /es-leon-y-soler/ | /es-leon-y-soler-demo/?p={p} | /es-leon-y-soler-demo/chat?p={p} · Chat replay; /es-leon-y-soler-demo/book?p={p} · Demo reserva |
| /es-marien-morata/ | /es-marien-morata-demo/?p={p} | /es-marien-morata-demo/chat?p={p} · Chat replay; /es-marien-morata-demo/book?p={p} · Demo reserva |
| /es-maritim-fitness/ | /es-maritim-fitness-demo/?p={p} | /es-maritim-fitness-demo/chat?p={p} · Chat replay; /es-maritim-fitness-demo/book?p={p} · Demo reserva |
| /es-performance-boutique/ | /es-performance-boutique-demo/?p={p} | /es-performance-boutique-demo/chat?p={p} · Chat replay; /es-performance-boutique-demo/book?p={p} · Demo reserva |
| /es-reformas/ | /es-reformas/?p={p} | /es-reformas/chat/{button}?p={p} · Chat {…}; /es-reformas/chat/replay?p={p} · Chat replay; /es-reformas/solicitud/confirmar?p={p} · Demo solicitud; /es-reformas/informe/{id}?p={p} · Informe {…} |
| /es-salud-estetica/ | /es-salud-estetica/?p={p} | /es-salud-estetica/chat/{button}?p={p} · Chat {…}; /es-salud-estetica/chat/replay?p={p} · Chat replay; /es-salud-estetica/solicitud/confirmar?p={p} · Demo solicitud; /es-salud-estetica/informe/{id}?p={p} · Informe {…} |
| /es-son-palou/ | /es-son-palou-demo/?p={p} | /es-son-palou-demo/chat?p={p} · Chat replay; /es-son-palou-demo/book?p={p} · Demo reserva |
| /es-umbria-ribera/ | /es-umbria-ribera-demo/?p={p} | /es-umbria-ribera-demo/chat?p={p} · Chat replay; /es-umbria-ribera-demo/book?p={p} · Demo reserva |
| /es-veterinaria/ | /es-veterinaria/?p={p} | /es-veterinaria/chat/{button}?p={p} · Chat {…}; /es-veterinaria/chat/replay?p={p} · Chat replay; /es-veterinaria/solicitud/confirmar?p={p} · Demo solicitud; /es-veterinaria/informe/{id}?p={p} · Informe {…} |
| /es/ | /demo-es-general \| /{p}/demo-es-general | solo visita |
| /expert-mobiles/ | /bolla-demo-expert-mobiles/?p={p} | solo visita |
| /expresiva-cejas-pestanas/ | /bolla-demo-expresiva-cejas-pestanas/?p={p} | solo visita |
| /fahrschule-ch/de/ | /bolla-demo-fahrschule-ch/de/?p={p} | /bolla-demo-fahrschule-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-fahrschule-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /fahrschule-ch/fr/ | /bolla-demo-fahrschule-ch/fr/?p={p} | /bolla-demo-fahrschule-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-fahrschule-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /fattoria-bacio-certaldo/ | /bolla-fattoria-bacio-certaldo/?p={p} | /bolla-fattoria-bacio-certaldo/opt?p={p} · Opzione; /bolla-fattoria-bacio-certaldo/slot?p={p} · Orario scelto; /bolla-fattoria-bacio-certaldo/confirm?p={p} · Conferma demo; /bolla-fattoria-bacio-certaldo/chat?p={p} · Rivedi chat |
| /feelgood-fitness-bologna/ | /bolla-feelgood-fitness-bologna/?p={p} | /bolla-feelgood-fitness-bologna/opt?p={p} · Opzione; /bolla-feelgood-fitness-bologna/slot?p={p} · Orario scelto; /bolla-feelgood-fitness-bologna/confirm?p={p} · Conferma demo; /bolla-feelgood-fitness-bologna/chat?p={p} · Rivedi chat |
| /ferienwohnung-ch/de/ | /bolla-demo-ferienwohnung-ch/de/?p={p} | /bolla-demo-ferienwohnung-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-ferienwohnung-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /ferienwohnung-ch/fr/ | /bolla-demo-ferienwohnung-ch/fr/?p={p} | /bolla-demo-ferienwohnung-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-ferienwohnung-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /ferrazzini-dentista-lugano/ | /ferrazzini-dentista-lugano/?p={p} | /ferrazzini-dentista-lugano/tab/{id}?p={p} · Tab {…} |
| /ferreteria-estrella-de-luque-py/ | /ferreteria-estrella-de-luque-py/?p={p} | solo visita |
| /ferreteria-la-gaviota-py/ | /ferreteria-la-gaviota-py/?p={p} | solo visita |
| /finttel-mobile/ | /bolla-demo-finttel-mobile/?p={p} | solo visita |
| /fiore-medical/ | /bolla-demo-fiore-medical/?p={p} | /bolla-demo-fiore-medical/tab/{id}?p={p} · Tab {…} |
| /fitfriends-roma/ | /bolla-fitfriends-roma/?p={p} | /bolla-fitfriends-roma/opt?p={p} · Opzione; /bolla-fitfriends-roma/slot?p={p} · Orario scelto; /bolla-fitfriends-roma/confirm?p={p} · Conferma demo; /bolla-fitfriends-roma/chat?p={p} · Rivedi chat |
| /fitness-ch/de/ | /bolla-demo-fitness-ch/de/?p={p} | /bolla-demo-fitness-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-fitness-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /fitness-ch/fr/ | /bolla-demo-fitness-ch/fr/?p={p} | /bolla-demo-fitness-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-fitness-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /flawless-dentistry/ | /bolla-demo-flawless-dentistry/?p={p} | /bolla-demo-flawless-dentistry/chat/{button}?p={p} · script-option; /bolla-demo-flawless-dentistry/booking/confirm?p={p} · Demo booking |
| /florence-dream-firenze/ | /bolla-florence-dream-firenze/?p={p} | /bolla-florence-dream-firenze/opt?p={p} · Opzione; /bolla-florence-dream-firenze/slot?p={p} · Orario scelto; /bolla-florence-dream-firenze/confirm?p={p} · Conferma demo; /bolla-florence-dream-firenze/chat?p={p} · Rivedi chat |
| /floristeria-el-marchoso/ | /bolla-demo-floristeria-el-marchoso/?p={p} | solo visita |
| /floristeria-hesp/ | /bolla-demo-floristeria-hesp/?p={p} | solo visita |
| /fontanero-electricista-marc/ | /bolla-demo-fontanero-electricista-marc/?p={p} | solo visita |
| /fontanero-electricista-villarroel/ | /bolla-demo-fontanero-electricista-villarroel/?p={p} | solo visita |
| /fontanero-sants/ | /bolla-demo-fontanero-sants/?p={p} | solo visita |
| /forestauto-mendrisio/ | /bolla-forestauto-mendrisio/?p={p} | /bolla-forestauto-mendrisio/step/{id}?p={p} · {button}; /bolla-forestauto-mendrisio/completata?p={p} · Demo completata; /bolla-forestauto-mendrisio/tab/{id}?p={p} · Tab {…}; /bolla-forestauto-mendrisio/restart?p={p} · Restart |
| /fruites-verdures-vallcarca/ | /bolla-demo-fruites-verdures-vallcarca/?p={p} | solo visita |
| /fundas-antonio/ | /bolla-demo-fundas-antonio/?p={p} | solo visita |
| /gambirasio-dentista-lugano/ | /gambirasio-dentista-lugano/?p={p} | /gambirasio-dentista-lugano/tab/{id}?p={p} · Tab {…} |
| /garage-ch/de/ | /bolla-demo-garage-ch/de/?p={p} | /bolla-demo-garage-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-garage-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /garage-ch/en/ | /bolla-demo-garage-ch/en/?p={p} | /bolla-demo-garage-ch/en/chat/{id}?p={p} · example; /bolla-demo-garage-ch/en/request/confirm?p={p} · example |
| /garage-ch/fr/ | /bolla-demo-garage-ch/fr/?p={p} | /bolla-demo-garage-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-garage-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /garage-crotta-lugano/chat/ | /bolla-garage-crotta-lugano/chat/?p={p} | /bolla-garage-crotta-lugano/chat/response/{lang}?p={p} · chat-response; /bolla-garage-crotta-lugano/chat/error/{lang}?p={p} · chat-error |
| /garage-crotta-lugano/ | /bolla-garage-crotta-lugano/?p={p} | /bolla-garage-crotta-lugano/step/{id}?p={p} · {button}; /bolla-garage-crotta-lugano/completata?p={p} · Demo completata; /bolla-garage-crotta-lugano/tab/{id}?p={p} · Tab {…}; /bolla-garage-crotta-lugano/restart?p={p} · Restart |
| /garage-crotta-lugano/voce/ | /bolla-garage-crotta-lugano/voce/?p={p} | /bolla-garage-crotta-lugano/voce/connected/{lang}?p={p} · voice-connected; /bolla-garage-crotta-lugano/voce/ended/{lang}?p={p} · voice-ended; /bolla-garage-crotta-lugano/voce/error/{lang}?p={p} · voice-error |
| /garage-margarini-locarno/ | /bolla-garage-margarini-locarno/?p={p} | /bolla-garage-margarini-locarno/step/{id}?p={p} · {button}; /bolla-garage-margarini-locarno/completata?p={p} · Demo completata; /bolla-garage-margarini-locarno/tab/{id}?p={p} · Tab {…}; /bolla-garage-margarini-locarno/restart?p={p} · Restart |
| /garage-sport-lugano/ | /bolla-garage-sport-lugano/?p={p} | /bolla-garage-sport-lugano/step/{id}?p={p} · {button}; /bolla-garage-sport-lugano/completata?p={p} · Demo completata; /bolla-garage-sport-lugano/tab/{id}?p={p} · Tab {…}; /bolla-garage-sport-lugano/restart?p={p} · Restart |
| /garage/en/ | /bolla-demo-garage/en/?p={p} | /bolla-demo-garage/en/chat/{id}?p={p} · example; /bolla-demo-garage/en/request/confirm?p={p} · example |
| /garage/et/ | /bolla-demo-garage/et/?p={p} | /bolla-demo-garage/et/chat/{id}?p={p} · example; /bolla-demo-garage/et/request/confirm?p={p} · example |
| /garage/ru/ | /bolla-demo-garage/ru/?p={p} | /bolla-demo-garage/ru/chat/{id}?p={p} · example; /bolla-demo-garage/ru/request/confirm?p={p} · example |
| /garni-golf-ascona/ | /bolla-garni-golf-ascona/?p={p} | /bolla-garni-golf-ascona/opt?p={p} · Opzione; /bolla-garni-golf-ascona/slot?p={p} · Orario scelto; /bolla-garni-golf-ascona/confirm?p={p} · Conferma demo; /bolla-garni-golf-ascona/chat?p={p} · Rivedi chat |
| /garni-molinazzo-agno/ | /bolla-garni-molinazzo-agno/?p={p} | /bolla-garni-molinazzo-agno/opt?p={p} · Opzione; /bolla-garni-molinazzo-agno/slot?p={p} · Orario scelto; /bolla-garni-molinazzo-agno/confirm?p={p} · Conferma demo; /bolla-garni-molinazzo-agno/chat?p={p} · Rivedi chat |
| /gelateria-di-michele/ | /bolla-demo-gelateria-di-michele/?p={p} | solo visita |
| /german-yanez-quiromasaje/ | /bolla-demo-german-yanez-quiromasaje/?p={p} | solo visita |
| /gimnasio-apf-pfi-py/ | /gimnasio-apf-pfi-py/?p={p} | solo visita |
| /glow-bcn-unas/ | /bolla-demo-glow-bcn-unas/?p={p} | solo visita |
| /golden-hands-bcn/ | /bolla-demo-golden-hands-bcn/?p={p} | solo visita |
| /goodlift-milano/ | /bolla-goodlift-milano/?p={p} | /bolla-goodlift-milano/opt?p={p} · Opzione; /bolla-goodlift-milano/slot?p={p} · Orario scelto; /bolla-goodlift-milano/confirm?p={p} · Conferma demo; /bolla-goodlift-milano/chat?p={p} · Rivedi chat |
| /grand-bellevue-hotel/ | /bolla-demo-grand-bellevue-hotel/?p={p} | /bolla-demo-grand-bellevue-hotel/tab/{id}?p={p} · Tab {…} |
| /gray-wellness/ | /gray-wellness/?p={p} | /gray-wellness/flow/{id}?p={p} · Flow {…}; /gray-wellness/flow/completed?p={p} · Flow completed; /gray-wellness/tab/{id}?p={p} · Tab {…} |
| /grotto-pierino-cureggia/ | /grotto-pierino-cureggia/?p={p} | /grotto-pierino-cureggia/tab/{id}?p={p} · Tab {…} |
| /grotto-san-martino-mendrisio/ | /grotto-san-martino-mendrisio/?p={p} | /grotto-san-martino-mendrisio/tab/{id}?p={p} · Tab {…} |
| /grotto-valletta-massagno/ | /grotto-valletta-massagno/?p={p} | /grotto-valletta-massagno/tab/{id}?p={p} · Tab {…} |
| /guinardo-center-gym/ | /bolla-demo-guinardo-center-gym/?p={p} | solo visita |
| /gv-medical-center-milano/ | /bolla-gv-medical-center-milano/?p={p} | /bolla-gv-medical-center-milano/opt?p={p} · Opzione; /bolla-gv-medical-center-milano/slot?p={p} · Orario scelto; /bolla-gv-medical-center-milano/confirm?p={p} · Conferma demo; /bolla-gv-medical-center-milano/chat?p={p} · Rivedi chat |
| /hair-salon/en/ | /bolla-demo-hair-salon/en/?p={p} | /bolla-demo-hair-salon/en/chat/{id}?p={p} · example; /bolla-demo-hair-salon/en/request/confirm?p={p} · example |
| /hair-salon/et/ | /bolla-demo-hair-salon/et/?p={p} | /bolla-demo-hair-salon/et/chat/{id}?p={p} · example; /bolla-demo-hair-salon/et/request/confirm?p={p} · example |
| /hair-salon/ru/ | /bolla-demo-hair-salon/ru/?p={p} | /bolla-demo-hair-salon/ru/chat/{id}?p={p} · example; /bolla-demo-hair-salon/ru/request/confirm?p={p} · example |
| /happy-cars-bellinzona/ | /bolla-happy-cars-bellinzona/?p={p} | /bolla-happy-cars-bellinzona/step/{id}?p={p} · {button}; /bolla-happy-cars-bellinzona/completata?p={p} · Demo completata; /bolla-happy-cars-bellinzona/tab/{id}?p={p} · Tab {…}; /bolla-happy-cars-bellinzona/restart?p={p} · Restart |
| /hicar/ | /bolla-demo-hicar/?p={p} | /bolla-demo-hicar/scene/{id}?p={p} · scene; /bolla-demo-hicar/tab/{id}?p={p} · Tab {…} |
| /hotel-aurora-malcesine/ | /bolla-hotel-aurora-malcesine/?p={p} | /bolla-hotel-aurora-malcesine/opt?p={p} · Opzione; /bolla-hotel-aurora-malcesine/slot?p={p} · Orario scelto; /bolla-hotel-aurora-malcesine/confirm?p={p} · Conferma demo; /bolla-hotel-aurora-malcesine/chat?p={p} · Rivedi chat |
| /hotel-benacus-bardolino/ | /bolla-hotel-benacus-bardolino/?p={p} | /bolla-hotel-benacus-bardolino/opt?p={p} · Opzione; /bolla-hotel-benacus-bardolino/slot?p={p} · Orario scelto; /bolla-hotel-benacus-bardolino/confirm?p={p} · Conferma demo; /bolla-hotel-benacus-bardolino/chat?p={p} · Rivedi chat |
| /hotel-ch/de/ | /bolla-demo-hotel-ch/de/?p={p} | /bolla-demo-hotel-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-hotel-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /hotel-ch/en/ | /bolla-demo-hotel-ch/en/?p={p} | /bolla-demo-hotel-ch/en/chat/{id}?p={p} · example; /bolla-demo-hotel-ch/en/request/confirm?p={p} · example |
| /hotel-ch/fr/ | /bolla-demo-hotel-ch/fr/?p={p} | /bolla-demo-hotel-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-hotel-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /hotel-chiara-sirmione/ | /bolla-hotel-chiara-sirmione/?p={p} | /bolla-hotel-chiara-sirmione/opt?p={p} · Opzione; /bolla-hotel-chiara-sirmione/slot?p={p} · Orario scelto; /bolla-hotel-chiara-sirmione/confirm?p={p} · Conferma demo; /bolla-hotel-chiara-sirmione/chat?p={p} · Rivedi chat |
| /hotel-ciudad-nueva-py/ | /hotel-ciudad-nueva-py/?p={p} | solo visita |
| /hotel-de/de/ | /bolla-demo-hotel-de/de/?p={p} | /bolla-demo-hotel-de/de/chat/{button}?p={p} · script-option; /bolla-demo-hotel-de/de/request/confirm?p={p} · Demo-Anfrage |
| /hotel-lago-di-garda-malcesine/ | /bolla-hotel-lago-di-garda-malcesine/?p={p} | /bolla-hotel-lago-di-garda-malcesine/opt?p={p} · Opzione; /bolla-hotel-lago-di-garda-malcesine/slot?p={p} · Orario scelto; /bolla-hotel-lago-di-garda-malcesine/confirm?p={p} · Conferma demo; /bolla-hotel-lago-di-garda-malcesine/chat?p={p} · Rivedi chat |
| /hotel-mabel-py/ | /hotel-mabel-py/?p={p} | solo visita |
| /hotel-mistral-saas-fee/ | /bolla-demo-hotel-mistral-saas-fee/?p={p} | /bolla-demo-hotel-mistral-saas-fee/chat/{lang}/{button}?p={p} · script-option; /bolla-demo-hotel-mistral-saas-fee/lang/{id}?p={p} · Sprache {…}; /bolla-demo-hotel-mistral-saas-fee/booking/confirm?p={p} · Demo-Anfrage |
| /hotel-mono/ | /bolla-demo-hotel-mono/?p={p} | /bolla-demo-hotel-mono/chat/{button}?p={p} · script-option; /bolla-demo-hotel-mono/booking/confirm?p={p} · Demo booking |
| /hotel-real-py/ | /hotel-real-py/?p={p} | solo visita |
| /hotel-renacer-py/ | /hotel-renacer-py/?p={p} | solo visita |
| /hotel-restaurante-guarania-py/ | /hotel-restaurante-guarania-py/?p={p} | solo visita |
| /hotel/en/ | /bolla-demo-hotel/en/?p={p} | /bolla-demo-hotel/en/chat/{id}?p={p} · example; /bolla-demo-hotel/en/request/confirm?p={p} · example |
| /hotel/es/ | /bolla-demo-hotel/es/?p={p} | /bolla-demo-hotel/es/chat/{id}?p={p} · example; /bolla-demo-hotel/es/request/confirm?p={p} · example |
| /hotel/et/ | /bolla-demo-hotel/et/?p={p} | /bolla-demo-hotel/et/chat/{id}?p={p} · example; /bolla-demo-hotel/et/request/confirm?p={p} · example |
| /hotel/ru/ | /bolla-demo-hotel/ru/?p={p} | /bolla-demo-hotel/ru/chat/{id}?p={p} · example; /bolla-demo-hotel/ru/request/confirm?p={p} · example |
| /hues-boutique-hotel/ | /bolla-demo-hues-boutique-hotel/?p={p} | /bolla-demo-hues-boutique-hotel/chat/{button}?p={p} · script-option; /bolla-demo-hues-boutique-hotel/booking/confirm?p={p} · Demo booking |
| /idea-auto-bastiglia/ | /bolla-idea-auto-bastiglia/?p={p} | /bolla-idea-auto-bastiglia/step/{id}?p={p} · {button}; /bolla-idea-auto-bastiglia/completata?p={p} · Demo completata; /bolla-idea-auto-bastiglia/tab/{id}?p={p} · Tab {…}; /bolla-idea-auto-bastiglia/restart?p={p} · Restart |
| /il-bambu-pizzas-py/ | /il-bambu-pizzas-py/?p={p} | solo visita |
| /il-calzolaio-merano/ | /bolla-demo-il-calzolaio-merano/?p={p} | solo visita |
| /immobilien-ch/de/ | /bolla-demo-immobilien-ch/de/?p={p} | /bolla-demo-immobilien-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-immobilien-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /immobilien-ch/en/ | /bolla-demo-immobilien-ch/en/?p={p} | /bolla-demo-immobilien-ch/en/chat/{id}?p={p} · example; /bolla-demo-immobilien-ch/en/request/confirm?p={p} · example |
| /immobilien-ch/fr/ | /bolla-demo-immobilien-ch/fr/?p={p} | /bolla-demo-immobilien-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-immobilien-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /impecauto-py/ | /impecauto-py/?p={p} | solo visita |
| /industrie-de/de/ | /bolla-demo-industrie-de/de/?p={p} | /bolla-demo-industrie-de/de/chat/{id}?p={p} · example; /bolla-demo-industrie-de/de/request/confirm?p={p} · example |
| /industrie-de/en/ | /bolla-demo-industrie-de/en/?p={p} | /bolla-demo-industrie-de/en/chat/{id}?p={p} · example; /bolla-demo-industrie-de/en/request/confirm?p={p} · example |
| /inktuitive-tattoo/ | /bolla-demo-inktuitive-tattoo/?p={p} | solo visita |
| /inmobiliaria-abrapar-py/ | /inmobiliaria-abrapar-py/?p={p} | solo visita |
| /inmobiliaria-esteche-py/ | /inmobiliaria-esteche-py/?p={p} | solo visita |
| /interauto-pordenone/ | /bolla-interauto-pordenone/?p={p} | /bolla-interauto-pordenone/step/{id}?p={p} · {button}; /bolla-interauto-pordenone/completata?p={p} · Demo completata; /bolla-interauto-pordenone/tab/{id}?p={p} · Tab {…}; /bolla-interauto-pordenone/restart?p={p} · Restart |
| /intercars-trento/ | /bolla-intercars-trento/?p={p} | /bolla-intercars-trento/step/{id}?p={p} · {button}; /bolla-intercars-trento/completata?p={p} · Demo completata; /bolla-intercars-trento/tab/{id}?p={p} · Tab {…}; /bolla-intercars-trento/restart?p={p} · Restart |
| /international-au-lac-lugano/ | /international-au-lac-lugano/?p={p} | /international-au-lac-lugano/tab/{id}?p={p} · Tab {…} |
| /inyecar-py/ | /inyecar-py/?p={p} | solo visita |
| /isha-food-bar-py/ | /isha-food-bar-py/?p={p} | solo visita |
| /ivi-estetica/ | /bolla-demo-ivi-estetica/?p={p} | solo visita |
| /ivory-grand/ | /bolla-demo-ivory-grand/?p={p} | /bolla-demo-ivory-grand/chat/{button}?p={p} · script-option; /bolla-demo-ivory-grand/booking/confirm?p={p} · Demo booking |
| /janny-nail/ | /bolla-demo-janny-nail/?p={p} | solo visita |
| /jardinet-de-la-marie/ | /bolla-demo-jardinet-de-la-marie/?p={p} | solo visita |
| /jem-bar-brunch/ | /bolla-demo-jem-bar-brunch/?p={p} | solo visita |
| /joliet-aesthetics/ | /bolla-demo-joliet-aesthetics/?p={p} | /bolla-demo-joliet-aesthetics/chat/{button}?p={p} · script-option; /bolla-demo-joliet-aesthetics/booking/confirm?p={p} · Demo booking |
| /jood-hotel-apartments/ | /bolla-demo-jood-hotel-apartments/?p={p} | /bolla-demo-jood-hotel-apartments/chat/{button}?p={p} · script-option; /bolla-demo-jood-hotel-apartments/booking/confirm?p={p} · Demo booking |
| /jourdan-veterinaria-py/ | /jourdan-veterinaria-py/?p={p} | solo visita |
| /kasas-propiedades-py/ | /kasas-propiedades-py/?p={p} | solo visita |
| /keys-please/ | /bolla-demo-keys-please/?p={p} | /bolla-demo-keys-please/tab/{id}?p={p} · Tab {…} |
| /khyber-wisal-bcn/ | /bolla-demo-khyber-wisal-bcn/?p={p} | solo visita |
| /kure-dumas-slow-pizza-py/ | /kure-dumas-slow-pizza-py/?p={p} | solo visita |
| /la-brace-manno/ | /la-brace-manno/?p={p} | /la-brace-manno/tab/{id}?p={p} · Tab {…} |
| /la-cala-barceloneta/ | /bolla-demo-la-cala-barceloneta/?p={p} | solo visita |
| /la-patrona-py/ | /la-patrona-py/?p={p} | solo visita |
| /la-tassa-granja/ | /bolla-demo-la-tassa-granja/?p={p} | solo visita |
| /latam-acrecer/ | /latam-acrecer-demo/?p={p} | /latam-acrecer-demo/chat?p={p} · Chat replay; /latam-acrecer-demo/book?p={p} · Demo reserva |
| /latam-bon-amour/ | /latam-bon-amour-demo/?p={p} | /latam-bon-amour-demo/chat?p={p} · Chat replay; /latam-bon-amour-demo/book?p={p} · Demo reserva |
| /latam-byc-dental/ | /latam-byc-dental-demo/?p={p} | /latam-byc-dental-demo/chat?p={p} · Chat replay; /latam-byc-dental-demo/book?p={p} · Demo reserva |
| /latam-cabdental/ | /latam-cabdental-demo/?p={p} | /latam-cabdental-demo/chat?p={p} · Chat replay; /latam-cabdental-demo/book?p={p} · Demo reserva |
| /latam-cabinas-yucca/ | /latam-cabinas-yucca-demo/?p={p} | /latam-cabinas-yucca-demo/chat?p={p} · Chat replay; /latam-cabinas-yucca-demo/book?p={p} · Demo reserva |
| /latam-calea-tulum/ | /latam-calea-tulum-demo/?p={p} | /latam-calea-tulum-demo/chat?p={p} · Chat replay; /latam-calea-tulum-demo/book?p={p} · Demo reserva |
| /latam-cartujita/ | /latam-cartujita-demo/?p={p} | /latam-cartujita-demo/chat?p={p} · Chat replay; /latam-cartujita-demo/book?p={p} · Demo reserva |
| /latam-casa-corazon/ | /latam-casa-corazon-demo/?p={p} | /latam-casa-corazon-demo/chat?p={p} · Chat replay; /latam-casa-corazon-demo/book?p={p} · Demo reserva |
| /latam-casa-yahri/ | /latam-casa-yahri-demo/?p={p} | /latam-casa-yahri-demo/chat?p={p} · Chat replay; /latam-casa-yahri-demo/book?p={p} · Demo reserva |
| /latam-casona-de-tita/ | /latam-casona-de-tita-demo/?p={p} | /latam-casona-de-tita-demo/chat?p={p} · Chat replay; /latam-casona-de-tita-demo/book?p={p} · Demo reserva |
| /latam-casona-distante/ | /latam-casona-distante-demo/?p={p} | /latam-casona-distante-demo/chat?p={p} · Chat replay; /latam-casona-distante-demo/book?p={p} · Demo reserva |
| /latam-colombia-care-dental/ | /latam-colombia-care-dental-demo/?p={p} | /latam-colombia-care-dental-demo/chat?p={p} · Chat replay; /latam-colombia-care-dental-demo/book?p={p} · Demo reserva |
| /latam-csc-inmobiliaria/ | /latam-csc-inmobiliaria-demo/?p={p} | /latam-csc-inmobiliaria-demo/chat?p={p} · Chat replay; /latam-csc-inmobiliaria-demo/book?p={p} · Demo reserva |
| /latam-dental-obarrio/ | /latam-dental-obarrio-demo/?p={p} | /latam-dental-obarrio-demo/chat?p={p} · Chat replay; /latam-dental-obarrio-demo/book?p={p} · Demo reserva |
| /latam-dental-team-medellin/ | /latam-dental-team-medellin-demo/?p={p} | /latam-dental-team-medellin-demo/chat?p={p} · Chat replay; /latam-dental-team-medellin-demo/book?p={p} · Demo reserva |
| /latam-dentali/ | /latam-dentali-demo/?p={p} | /latam-dentali-demo/chat?p={p} · Chat replay; /latam-dentali-demo/book?p={p} · Demo reserva |
| /latam-dune-tulum/ | /latam-dune-tulum-demo/?p={p} | /latam-dune-tulum-demo/chat?p={p} · Chat replay; /latam-dune-tulum-demo/book?p={p} · Demo reserva |
| /latam-gilles-playa/ | /latam-gilles-playa-demo/?p={p} | /latam-gilles-playa-demo/chat?p={p} · Chat replay; /latam-gilles-playa-demo/book?p={p} · Demo reserva |
| /latam-haven-boquete/ | /latam-haven-boquete-demo/?p={p} | /latam-haven-boquete-demo/chat?p={p} · Chat replay; /latam-haven-boquete-demo/book?p={p} · Demo reserva |
| /latam-kuyen/ | /latam-kuyen-demo/?p={p} | /latam-kuyen-demo/chat?p={p} · Chat replay; /latam-kuyen-demo/book?p={p} · Demo reserva |
| /latam-la-escondida-pucon/ | /latam-la-escondida-pucon-demo/?p={p} | /latam-la-escondida-pucon-demo/chat?p={p} · Chat replay; /latam-la-escondida-pucon-demo/book?p={p} · Demo reserva |
| /latam-magic-place/ | /latam-magic-place-demo/?p={p} | /latam-magic-place-demo/chat?p={p} · Chat replay; /latam-magic-place-demo/book?p={p} · Demo reserva |
| /latam-mare-condo/ | /latam-mare-condo-demo/?p={p} | /latam-mare-condo-demo/chat?p={p} · Chat replay; /latam-mare-condo-demo/book?p={p} · Demo reserva |
| /latam-odontologists/ | /latam-odontologists-demo/?p={p} | /latam-odontologists-demo/chat?p={p} · Chat replay; /latam-odontologists-demo/book?p={p} · Demo reserva |
| /latam-odontoplace/ | /latam-odontoplace-demo/?p={p} | /latam-odontoplace-demo/chat?p={p} · Chat replay; /latam-odontoplace-demo/book?p={p} · Demo reserva |
| /latam-playacar-rentals/ | /latam-playacar-rentals-demo/?p={p} | /latam-playacar-rentals-demo/chat?p={p} · Chat replay; /latam-playacar-rentals-demo/book?p={p} · Demo reserva |
| /latam-poblasur/ | /latam-poblasur-demo/?p={p} | /latam-poblasur-demo/chat?p={p} · Chat replay; /latam-poblasur-demo/book?p={p} · Demo reserva |
| /latam-qb7/ | /latam-qb7-demo/?p={p} | /latam-qb7-demo/chat?p={p} · Chat replay; /latam-qb7-demo/book?p={p} · Demo reserva |
| /latam-red-quattro/ | /latam-red-quattro-demo/?p={p} | /latam-red-quattro-demo/chat?p={p} · Chat replay; /latam-red-quattro-demo/book?p={p} · Demo reserva |
| /latam-saska-cusco/ | /latam-saska-cusco-demo/?p={p} | /latam-saska-cusco-demo/chat?p={p} · Chat replay; /latam-saska-cusco-demo/book?p={p} · Demo reserva |
| /latam-seravena/ | /latam-seravena-demo/?p={p} | /latam-seravena-demo/chat?p={p} · Chat replay; /latam-seravena-demo/book?p={p} · Demo reserva |
| /latam-smile-dental-center/ | /latam-smile-dental-center-demo/?p={p} | /latam-smile-dental-center-demo/chat?p={p} · Chat replay; /latam-smile-dental-center-demo/book?p={p} · Demo reserva |
| /latam-the-dental-clinic/ | /latam-the-dental-clinic-demo/?p={p} | /latam-the-dental-clinic-demo/chat?p={p} · Chat replay; /latam-the-dental-clinic-demo/book?p={p} · Demo reserva |
| /latam-tres-fuentes-dickinson/ | /latam-tres-fuentes-dickinson-demo/?p={p} | /latam-tres-fuentes-dickinson-demo/chat?p={p} · Chat replay; /latam-tres-fuentes-dickinson-demo/book?p={p} · Demo reserva |
| /latam-villa-dental/ | /latam-villa-dental-demo/?p={p} | /latam-villa-dental-demo/chat?p={p} · Chat replay; /latam-villa-dental-demo/book?p={p} · Demo reserva |
| /latam-villas-coral-blue/ | /latam-villas-coral-blue-demo/?p={p} | /latam-villas-coral-blue-demo/chat?p={p} · Chat replay; /latam-villas-coral-blue-demo/book?p={p} · Demo reserva |
| /latam-vistas-pucon/ | /latam-vistas-pucon-demo/?p={p} | /latam-vistas-pucon-demo/chat?p={p} · Chat replay; /latam-vistas-pucon-demo/book?p={p} · Demo reserva |
| /lattecaldo-morbio/ | /lattecaldo-morbio/?p={p} | /lattecaldo-morbio/tab/{id}?p={p} · Tab {…} |
| /leone-barberini-mendrisio/ | /leone-barberini-mendrisio/?p={p} | /leone-barberini-mendrisio/tab/{id}?p={p} · Tab {…} |
| /lgmu-la-pelu/ | /bolla-demo-lgmu-la-pelu/?p={p} | solo visita |
| /lilica-vet-py/ | /lilica-vet-py/?p={p} | solo visita |
| /lions-den-smp/ | /bolla-demo-lions-den-smp/?p={p} | /bolla-demo-lions-den-smp/chat/{button}?p={p} · script-option; /bolla-demo-lions-den-smp/booking/confirm?p={p} · Demo booking |
| /locarno-bnb-locarno/ | /bolla-locarno-bnb-locarno/?p={p} | /bolla-locarno-bnb-locarno/opt?p={p} · Opzione; /bolla-locarno-bnb-locarno/slot?p={p} · Orario scelto; /bolla-locarno-bnb-locarno/confirm?p={p} · Conferma demo; /bolla-locarno-bnb-locarno/chat?p={p} · Rivedi chat |
| /loop-gym-roma/ | /bolla-loop-gym-roma/?p={p} | /bolla-loop-gym-roma/opt?p={p} · Opzione; /bolla-loop-gym-roma/slot?p={p} · Orario scelto; /bolla-loop-gym-roma/confirm?p={p} · Conferma demo; /bolla-loop-gym-roma/chat?p={p} · Rivedi chat |
| /los-cachorros-veterinaria-py/ | /los-cachorros-veterinaria-py/?p={p} | solo visita |
| /lourdes-elli-belleza-y-spa-py/ | /lourdes-elli-belleza-y-spa-py/?p={p} | solo visita |
| /mabuhay-motors/ | /bolla-demo-mabuhay-motors/?p={p} | /bolla-demo-mabuhay-motors/scene/{id}?p={p} · scene; /bolla-demo-mabuhay-motors/tab/{id}?p={p} · Tab {…} |
| /main-gate/ | /bolla-demo-main-gate/?p={p} | /bolla-demo-main-gate/tab/{id}?p={p} · Tab {…} |
| /manchester-plaza/ | /bolla-demo-manchester-plaza/?p={p} | /bolla-demo-manchester-plaza/tab/{id}?p={p} · Tab {…} |
| /marbo-florence-firenze/ | /bolla-marbo-florence-firenze/?p={p} | /bolla-marbo-florence-firenze/opt?p={p} · Opzione; /bolla-marbo-florence-firenze/slot?p={p} · Orario scelto; /bolla-marbo-florence-firenze/confirm?p={p} · Conferma demo; /bolla-marbo-florence-firenze/chat?p={p} · Rivedi chat |
| /margen-coffee/ | /bolla-demo-margen-coffee/?p={p} | solo visita |
| /marina-pirita/et/ | /bolla-demo-marina-pirita/et/?p={p} | /bolla-demo-marina-pirita/et/chat/{id}?p={p} · example; /bolla-demo-marina-pirita/et/request/confirm?p={p} · example |
| /mascoterra-py/ | /mascoterra-py/?p={p} | solo visita |
| /mascottini-veterinaria-py/ | /mascottini-veterinaria-py/?p={p} | solo visita |
| /mason-cottage/ | /bolla-demo-mason-cottage/?p={p} | /bolla-demo-mason-cottage/chat/{button}?p={p} · script-option; /bolla-demo-mason-cottage/booking/confirm?p={p} · Demo booking |
| /max-moto-ranica/ | /bolla-max-moto-ranica/?p={p} | /bolla-max-moto-ranica/step/{id}?p={p} · {button}; /bolla-max-moto-ranica/completata?p={p} · Demo completata; /bolla-max-moto-ranica/tab/{id}?p={p} · Tab {…}; /bolla-max-moto-ranica/restart?p={p} · Restart |
| /mazzivet-locarno/ | /bolla-mazzivet-locarno/?p={p} | /bolla-mazzivet-locarno/opt?p={p} · Opzione; /bolla-mazzivet-locarno/slot?p={p} · Orario scelto; /bolla-mazzivet-locarno/confirm?p={p} · Conferma demo; /bolla-mazzivet-locarno/chat?p={p} · Rivedi chat |
| /mb-dentista-trevano-lugano/ | /mb-dentista-trevano-lugano/?p={p} | /mb-dentista-trevano-lugano/tab/{id}?p={p} · Tab {…} |
| /mega-pizza-py/ | /mega-pizza-py/?p={p} | solo visita |
| /michela-pizzo-estetica/ | /bolla-demo-michela-pizzo-estetica/?p={p} | solo visita |
| /michelangelo-bnb-varenna/ | /bolla-michelangelo-bnb-varenna/?p={p} | /bolla-michelangelo-bnb-varenna/opt?p={p} · Opzione; /bolla-michelangelo-bnb-varenna/slot?p={p} · Orario scelto; /bolla-michelangelo-bnb-varenna/confirm?p={p} · Conferma demo; /bolla-michelangelo-bnb-varenna/chat?p={p} · Rivedi chat |
| /milciades-intercoiffure-py/ | /milciades-intercoiffure-py/?p={p} | solo visita |
| /mirapar-apart-hotel-py/ | /mirapar-apart-hotel-py/?p={p} | solo visita |
| /miss-greta-canina/ | /bolla-demo-miss-greta-canina/?p={p} | solo visita |
| /moncucchetto-lugano/ | /moncucchetto-lugano/?p={p} | /moncucchetto-lugano/tab/{id}?p={p} · Tab {…} |
| /montaldi-muralto/ | /montaldi-muralto/?p={p} | /montaldi-muralto/tab/{id}?p={p} · Tab {…} |
| /moto-rattix-barzago/ | /bolla-moto-rattix-barzago/?p={p} | /bolla-moto-rattix-barzago/step/{id}?p={p} · {button}; /bolla-moto-rattix-barzago/completata?p={p} · Demo completata; /bolla-moto-rattix-barzago/tab/{id}?p={p} · Tab {…}; /bolla-moto-rattix-barzago/restart?p={p} · Restart |
| /movers/en/ | /bolla-demo-movers/en/?p={p} | /bolla-demo-movers/en/chat/{id}?p={p} · example; /bolla-demo-movers/en/request/confirm?p={p} · example |
| /movers/et/ | /bolla-demo-movers/et/?p={p} | /bolla-demo-movers/et/chat/{id}?p={p} · example; /bolla-demo-movers/et/request/confirm?p={p} · example |
| /movers/ru/ | /bolla-demo-movers/ru/?p={p} | /bolla-demo-movers/ru/chat/{id}?p={p} · example; /bolla-demo-movers/ru/request/confirm?p={p} · example |
| /mudanzas-juancito/ | /bolla-demo-mudanzas-juancito/?p={p} | solo visita |
| /musikschule-ch/de/ | /bolla-demo-musikschule-ch/de/?p={p} | /bolla-demo-musikschule-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-musikschule-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /musikschule-ch/fr/ | /bolla-demo-musikschule-ch/fr/?p={p} | /bolla-demo-musikschule-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-musikschule-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /mx-autos-selectos-puebla/ | /mx-autos-selectos-puebla-demo/?p={p} | /mx-autos-selectos-puebla-demo/step/{id}?p={p} · {button}; /mx-autos-selectos-puebla-demo/completada?p={p} · Demo completada; /mx-autos-selectos-puebla-demo/tab/{id}?p={p} · Tab {…}; /mx-autos-selectos-puebla-demo/restart?p={p} · Restart |
| /mx-autossaav/ | /mx-autossaav-demo/?p={p} | /mx-autossaav-demo/step/{id}?p={p} · {button}; /mx-autossaav-demo/completada?p={p} · Demo completada; /mx-autossaav-demo/tab/{id}?p={p} · Tab {…}; /mx-autossaav-demo/restart?p={p} · Restart |
| /mx-cda-seminuevos/ | /mx-cda-seminuevos-demo/?p={p} | /mx-cda-seminuevos-demo/step/{id}?p={p} · {button}; /mx-cda-seminuevos-demo/completada?p={p} · Demo completada; /mx-cda-seminuevos-demo/tab/{id}?p={p} · Tab {…}; /mx-cda-seminuevos-demo/restart?p={p} · Restart |
| /mx-flosol/ | /mx-flosol-demo/?p={p} | /mx-flosol-demo/step/{id}?p={p} · {button}; /mx-flosol-demo/completada?p={p} · Demo completada; /mx-flosol-demo/tab/{id}?p={p} · Tab {…}; /mx-flosol-demo/restart?p={p} · Restart |
| /mx-jalisco-seminuevos/ | /mx-jalisco-seminuevos-demo/?p={p} | /mx-jalisco-seminuevos-demo/step/{id}?p={p} · {button}; /mx-jalisco-seminuevos-demo/completada?p={p} · Demo completada; /mx-jalisco-seminuevos-demo/tab/{id}?p={p} · Tab {…}; /mx-jalisco-seminuevos-demo/restart?p={p} · Restart |
| /mx-pluramotors/ | /mx-pluramotors-demo/?p={p} | /mx-pluramotors-demo/step/{id}?p={p} · {button}; /mx-pluramotors-demo/completada?p={p} · Demo completada; /mx-pluramotors-demo/tab/{id}?p={p} · Tab {…}; /mx-pluramotors-demo/restart?p={p} · Restart |
| /nassa-dentista-lugano/ | /nassa-dentista-lugano/?p={p} | /nassa-dentista-lugano/tab/{id}?p={p} · Tab {…} |
| /nautica-cat/ | /{p\|cat42}/demo | /{p}/q-{topic} · q-{…} |
| /nautica/en/ | /{p\|lagoon42}/demo | /{p}/q-{topic} · q-{…} |
| /nautica/es/ | /{p\|lagoon42}/demo | /{p}/q-{topic} · q-{…} |
| /nautica/fr/ | /{p\|lagoon42}/demo | /{p}/q-{topic} · q-{…} |
| /nautica/ | /{p\|lagoon42}/demo | /{p}/q-{topic} · q-{…} |
| /nunez-mecanica-automotriz-py/ | /nunez-mecanica-automotriz-py/?p={p} | solo visita |
| /nutribell-paraguay-py/ | /nutribell-paraguay-py/?p={p} | solo visita |
| /nutrifit-spa-y-belleza-py/ | /nutrifit-spa-y-belleza-py/?p={p} | solo visita |
| /oasis-barche-caslano/ | /oasis-barche-caslano/?p={p} | /oasis-barche-caslano/tab/{id}?p={p} · Tab {…} |
| /obx-life-rentals/ | /bolla-demo-obx-life-rentals/?p={p} | /bolla-demo-obx-life-rentals/chat/{button}?p={p} · script-option; /bolla-demo-obx-life-rentals/booking/confirm?p={p} · Demo booking |
| /odonto-clinic-lugano/ | /odonto-clinic-lugano/?p={p} | /odonto-clinic-lugano/tab/{id}?p={p} · Tab {…} |
| /officina-franchi-faedo-valtellino/ | /bolla-demo-officina-franchi-faedo-valtellino/?p={p} | solo visita |
| /ole-guapa/ | /bolla-demo-ole-guapa/?p={p} | solo visita |
| /onkosvet-py/ | /onkosvet-py/?p={p} | solo visita |
| /optician/en/ | /bolla-demo-optician/en/?p={p} | /bolla-demo-optician/en/chat/{id}?p={p} · example; /bolla-demo-optician/en/request/confirm?p={p} · example |
| /optician/et/ | /bolla-demo-optician/et/?p={p} | /bolla-demo-optician/et/chat/{id}?p={p} · example; /bolla-demo-optician/et/request/confirm?p={p} · example |
| /optician/ru/ | /bolla-demo-optician/ru/?p={p} | /bolla-demo-optician/ru/chat/{id}?p={p} · example; /bolla-demo-optician/ru/request/confirm?p={p} · example |
| /optiker-ch/de/ | /bolla-demo-optiker-ch/de/?p={p} | /bolla-demo-optiker-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-optiker-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /optiker-ch/en/ | /bolla-demo-optiker-ch/en/?p={p} | /bolla-demo-optiker-ch/en/chat/{id}?p={p} · example; /bolla-demo-optiker-ch/en/request/confirm?p={p} · example |
| /optiker-ch/fr/ | /bolla-demo-optiker-ch/fr/?p={p} | /bolla-demo-optiker-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-optiker-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /osteria-enoteca-losone/ | /osteria-enoteca-losone/?p={p} | /osteria-enoteca-losone/tab/{id}?p={p} · Tab {…} |
| /osteria-vignetta-mendrisio/ | /osteria-vignetta-mendrisio/?p={p} | /osteria-vignetta-mendrisio/tab/{id}?p={p} · Tab {…} |
| /ozli-hotel-y-restaurant-py/ | /ozli-hotel-y-restaurant-py/?p={p} | solo visita |
| /paloma-blanca-forn/ | /bolla-demo-paloma-blanca-forn/?p={p} | solo visita |
| /paragliding-ch/de/ | /bolla-demo-paragliding-ch/de/?p={p} | /bolla-demo-paragliding-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-paragliding-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /paragliding-ch/fr/ | /bolla-demo-paragliding-ch/fr/?p={p} | /bolla-demo-paragliding-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-paragliding-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /paraguay-children-s-cirugia-pediatrica-py/ | /paraguay-children-s-cirugia-pediatrica-py/?p={p} | solo visita |
| /peccadille/ | /bolla-demo-peccadille/?p={p} | /bolla-demo-peccadille/chat?p={p} · chat; /bolla-demo-peccadille/voice?p={p} · voice |
| /peinados-taia-py/ | /peinados-taia-py/?p={p} | solo visita |
| /peluqueria-clara/ | /bolla-demo-peluqueria-clara/?p={p} | solo visita |
| /perbacco-locarno/ | /perbacco-locarno/?p={p} | /perbacco-locarno/tab/{id}?p={p} · Tab {…} |
| /performance-studio-lugano/ | /bolla-performance-studio-lugano/?p={p} | /bolla-performance-studio-lugano/opt?p={p} · Opzione; /bolla-performance-studio-lugano/slot?p={p} · Orario scelto; /bolla-performance-studio-lugano/confirm?p={p} · Conferma demo; /bolla-performance-studio-lugano/chat?p={p} · Rivedi chat |
| /perla-hair-salon-py/ | /perla-hair-salon-py/?p={p} | solo visita |
| /physio-ch/de/ | /bolla-demo-physio-ch/de/?p={p} | /bolla-demo-physio-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-physio-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /physio-ch/en/ | /bolla-demo-physio-ch/en/?p={p} | /bolla-demo-physio-ch/en/chat/{id}?p={p} · example; /bolla-demo-physio-ch/en/request/confirm?p={p} · example |
| /physio-ch/fr/ | /bolla-demo-physio-ch/fr/?p={p} | /bolla-demo-physio-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-physio-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /physio/en/ | /bolla-demo-physio/en/?p={p} | /bolla-demo-physio/en/chat/{id}?p={p} · example; /bolla-demo-physio/en/request/confirm?p={p} · example |
| /physio/et/ | /bolla-demo-physio/et/?p={p} | /bolla-demo-physio/et/chat/{id}?p={p} · example; /bolla-demo-physio/et/request/confirm?p={p} · example |
| /physio/ru/ | /bolla-demo-physio/ru/?p={p} | /bolla-demo-physio/ru/chat/{id}?p={p} · example; /bolla-demo-physio/ru/request/confirm?p={p} · example |
| /picture-frame-atelier/ | /bolla-demo-picture-frame-atelier/?p={p} | solo visita |
| /pimpam-econet/ | /bolla-demo-pimpam-econet/?p={p} | solo visita |
| /pintures-decoracio-horta/ | /bolla-demo-pintures-decoracio-horta/?p={p} | solo visita |
| /pizzeria-don-mello-py/ | /pizzeria-don-mello-py/?p={p} | solo visita |
| /podere-lupinati-chianti/ | /bolla-podere-lupinati-chianti/?p={p} | /bolla-podere-lupinati-chianti/opt?p={p} · Opzione; /bolla-podere-lupinati-chianti/slot?p={p} · Orario scelto; /bolla-podere-lupinati-chianti/confirm?p={p} · Conferma demo; /bolla-podere-lupinati-chianti/chat?p={p} · Rivedi chat |
| /podologica-horta/ | /bolla-demo-podologica-horta/?p={p} | solo visita |
| /ponchio-dentista-locarno/ | /ponchio-dentista-locarno/?p={p} | /ponchio-dentista-locarno/tab/{id}?p={p} · Tab {…} |
| /pro8-real-estate/ | /bolla-demo-pro8-real-estate/?p={p} | /bolla-demo-pro8-real-estate/chat/{button}?p={p} · script-option; /bolla-demo-pro8-real-estate/booking/confirm?p={p} · Demo booking |
| /project-one-motors/ | /bolla-demo-project-one-motors/?p={p} | /bolla-demo-project-one-motors/scene/{id}?p={p} · scene; /bolla-demo-project-one-motors/tab/{id}?p={p} · Tab {…} |
| /psicologo-jose-florentin-py/ | /psicologo-jose-florentin-py/?p={p} | solo visita |
| /pure-living/ | /bolla-demo-pure-living/?p={p} | /bolla-demo-pure-living/tab/{id}?p={p} · Tab {…} |
| /py-ares-studio-asuncion/ | /bolla-demo-py-ares-studio-asuncion/?p={p} | solo visita |
| /py-barber-club-lambare/ | /bolla-demo-py-barber-club-lambare/?p={p} | solo visita |
| /py-barberia-kratos-fernando-de-la-mora/ | /bolla-demo-py-barberia-kratos-fernando-de-la-mora/?p={p} | solo visita |
| /py-barbero-renda-lambare/ | /bolla-demo-py-barbero-renda-lambare/?p={p} | solo visita |
| /py-beerseba-capiata/ | /bolla-demo-py-beerseba-capiata/?p={p} | solo visita |
| /py-bollitas-nails-san-lorenzo/ | /bolla-demo-py-bollitas-nails-san-lorenzo/?p={p} | solo visita |
| /py-bonita-nails-lambare/ | /bolla-demo-py-bonita-nails-lambare/?p={p} | solo visita |
| /py-cafe-proa-asuncion/ | /bolla-demo-py-cafe-proa-asuncion/?p={p} | solo visita |
| /py-chiperia-juana-maria-fernando-de-la-mora/ | /bolla-demo-py-chiperia-juana-maria-fernando-de-la-mora/?p={p} | solo visita |
| /py-corporal-gym-luque/ | /bolla-demo-py-corporal-gym-luque/?p={p} | solo visita |
| /py-dama-juana-san-lorenzo/ | /bolla-demo-py-dama-juana-san-lorenzo/?p={p} | solo visita |
| /py-dante-barbershop-san-lorenzo/ | /bolla-demo-py-dante-barbershop-san-lorenzo/?p={p} | solo visita |
| /py-estilo-carlos-lambare/ | /bolla-demo-py-estilo-carlos-lambare/?p={p} | solo visita |
| /py-floreria-3-rosas-fernando-de-la-mora/ | /bolla-demo-py-floreria-3-rosas-fernando-de-la-mora/?p={p} | solo visita |
| /py-floreria-de-leila-lambare/ | /bolla-demo-py-floreria-de-leila-lambare/?p={p} | solo visita |
| /py-giuliano-lambare/ | /bolla-demo-py-giuliano-lambare/?p={p} | solo visita |
| /py-gomeria-dario-lambare/ | /bolla-demo-py-gomeria-dario-lambare/?p={p} | solo visita |
| /py-gomeria-jorge-san-lorenzo/ | /bolla-demo-py-gomeria-jorge-san-lorenzo/?p={p} | solo visita |
| /py-gomeria-las-residentas-fernando-de-la-mora/ | /bolla-demo-py-gomeria-las-residentas-fernando-de-la-mora/?p={p} | solo visita |
| /py-gomeria-ze-pilintra-luque/ | /bolla-demo-py-gomeria-ze-pilintra-luque/?p={p} | solo visita |
| /py-gorillas-gym-asuncion/ | /bolla-demo-py-gorillas-gym-asuncion/?p={p} | solo visita |
| /py-jardin-cafetero-lambare/ | /bolla-demo-py-jardin-cafetero-lambare/?p={p} | solo visita |
| /py-jorgelina-gd-nail-art-asuncion/ | /bolla-demo-py-jorgelina-gd-nail-art-asuncion/?p={p} | solo visita |
| /py-lidu-salinas-fernando-de-la-mora/ | /bolla-demo-py-lidu-salinas-fernando-de-la-mora/?p={p} | solo visita |
| /py-lirdsteam-gym-lambare/ | /bolla-demo-py-lirdsteam-gym-lambare/?p={p} | solo visita |
| /py-lo-de-liki-lambare/ | /bolla-demo-py-lo-de-liki-lambare/?p={p} | solo visita |
| /py-lomiteria-josei-asuncion/ | /bolla-demo-py-lomiteria-josei-asuncion/?p={p} | solo visita |
| /py-lomiteria-la-esquina-luque/ | /bolla-demo-py-lomiteria-la-esquina-luque/?p={p} | solo visita |
| /py-lomitoros-san-lorenzo/ | /bolla-demo-py-lomitoros-san-lorenzo/?p={p} | solo visita |
| /py-lomitorre-capiata/ | /bolla-demo-py-lomitorre-capiata/?p={p} | solo visita |
| /py-my-cam-pet-shop-luque/ | /bolla-demo-py-my-cam-pet-shop-luque/?p={p} | solo visita |
| /py-nde-renda-lambare/ | /bolla-demo-py-nde-renda-lambare/?p={p} | solo visita |
| /py-panaderia-don-garay-lambare/ | /bolla-demo-py-panaderia-don-garay-lambare/?p={p} | solo visita |
| /py-panaderia-la-asuncena-asuncion/ | /bolla-demo-py-panaderia-la-asuncena-asuncion/?p={p} | solo visita |
| /py-pannis-pizza-lambare/ | /bolla-demo-py-pannis-pizza-lambare/?p={p} | solo visita |
| /py-peluqueria-bony-fernando-de-la-mora/ | /bolla-demo-py-peluqueria-bony-fernando-de-la-mora/?p={p} | solo visita |
| /py-peluqueria-magda-asuncion/ | /bolla-demo-py-peluqueria-magda-asuncion/?p={p} | solo visita |
| /py-peluqueria-mario-luque/ | /bolla-demo-py-peluqueria-mario-luque/?p={p} | solo visita |
| /py-pequeno-sorbo-san-lorenzo/ | /bolla-demo-py-pequeno-sorbo-san-lorenzo/?p={p} | solo visita |
| /py-pizzeria-el-tatakua-san-lorenzo/ | /bolla-demo-py-pizzeria-el-tatakua-san-lorenzo/?p={p} | solo visita |
| /py-puerto-mascotas-asuncion/ | /bolla-demo-py-puerto-mascotas-asuncion/?p={p} | solo visita |
| /py-sastreria-olinda-mieres-lambare/ | /bolla-demo-py-sastreria-olinda-mieres-lambare/?p={p} | solo visita |
| /py-serafina-floreria-lambare/ | /bolla-demo-py-serafina-floreria-lambare/?p={p} | solo visita |
| /py-shaemi-floreria-lambare/ | /bolla-demo-py-shaemi-floreria-lambare/?p={p} | solo visita |
| /py-stefania-nails-luque/ | /bolla-demo-py-stefania-nails-luque/?p={p} | solo visita |
| /py-taller-dg-lambare/ | /bolla-demo-py-taller-dg-lambare/?p={p} | solo visita |
| /py-taller-lechon-lambare/ | /bolla-demo-py-taller-lechon-lambare/?p={p} | solo visita |
| /py-taller-motos-sergio-damian-capiata/ | /bolla-demo-py-taller-motos-sergio-damian-capiata/?p={p} | solo visita |
| /py-taller-rancho-fernando-de-la-mora/ | /bolla-demo-py-taller-rancho-fernando-de-la-mora/?p={p} | solo visita |
| /py-zuni-morel-fernando-de-la-mora/ | /bolla-demo-py-zuni-morel-fernando-de-la-mora/?p={p} | solo visita |
| /raiot-wine-bar/ | /bolla-demo-raiot-wine-bar/?p={p} | solo visita |
| /ravasio-moto-bonate/ | /bolla-ravasio-moto-bonate/?p={p} | /bolla-ravasio-moto-bonate/step/{id}?p={p} · {button}; /bolla-ravasio-moto-bonate/completata?p={p} · Demo completata; /bolla-ravasio-moto-bonate/tab/{id}?p={p} · Tab {…}; /bolla-ravasio-moto-bonate/restart?p={p} · Restart |
| /rc-spa-center-py/ | /rc-spa-center-py/?p={p} | solo visita |
| /rd-citybike/ | /bolla-demo-rd-citybike/?p={p} | solo visita |
| /real-estate/en/ | /bolla-demo-real-estate/en/?p={p} | /bolla-demo-real-estate/en/chat/{id}?p={p} · example; /bolla-demo-real-estate/en/request/confirm?p={p} · example |
| /real-estate/et/ | /bolla-demo-real-estate/et/?p={p} | /bolla-demo-real-estate/et/chat/{id}?p={p} · example; /bolla-demo-real-estate/et/request/confirm?p={p} · example |
| /real-estate/ru/ | /bolla-demo-real-estate/ru/?p={p} | /bolla-demo-real-estate/ru/chat/{id}?p={p} · example; /bolla-demo-real-estate/ru/request/confirm?p={p} · example |
| /relais-del-sosto-olivone/ | /bolla-relais-del-sosto-olivone/?p={p} | /bolla-relais-del-sosto-olivone/opt?p={p} · Opzione; /bolla-relais-del-sosto-olivone/slot?p={p} · Orario scelto; /bolla-relais-del-sosto-olivone/confirm?p={p} · Conferma demo; /bolla-relais-del-sosto-olivone/chat?p={p} · Rivedi chat |
| /relegance-living/ | /bolla-demo-relegance-living/?p={p} | /bolla-demo-relegance-living/chat/{button}?p={p} · script-option; /bolla-demo-relegance-living/booking/confirm?p={p} · Demo booking |
| /remorino-minusio/ | /remorino-minusio/?p={p} | /remorino-minusio/tab/{id}?p={p} · Tab {…} |
| /restaurant-ch/de/ | /bolla-demo-restaurant-ch/de/?p={p} | /bolla-demo-restaurant-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-restaurant-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /restaurant-ch/en/ | /bolla-demo-restaurant-ch/en/?p={p} | /bolla-demo-restaurant-ch/en/chat/{id}?p={p} · example; /bolla-demo-restaurant-ch/en/request/confirm?p={p} · example |
| /restaurant-ch/fr/ | /bolla-demo-restaurant-ch/fr/?p={p} | /bolla-demo-restaurant-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-restaurant-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /restaurant-de/de/ | /bolla-demo-restaurant-de/de/?p={p} | /bolla-demo-restaurant-de/de/chat/{button}?p={p} · script-option; /bolla-demo-restaurant-de/de/request/confirm?p={p} · Demo-Anfrage |
| /restaurant-santander-106/ | /bolla-demo-restaurant-santander-106/?p={p} | solo visita |
| /restaurant/en/ | /bolla-demo-restaurant/en/?p={p} | /bolla-demo-restaurant/en/chat/{id}?p={p} · example; /bolla-demo-restaurant/en/request/confirm?p={p} · example |
| /restaurant/et/ | /bolla-demo-restaurant/et/?p={p} | /bolla-demo-restaurant/et/chat/{id}?p={p} · example; /bolla-demo-restaurant/et/request/confirm?p={p} · example |
| /restaurant/ru/ | /bolla-demo-restaurant/ru/?p={p} | /bolla-demo-restaurant/ru/chat/{id}?p={p} · example; /bolla-demo-restaurant/ru/request/confirm?p={p} · example |
| /riviera-melide/ | /riviera-melide/?p={p} | /riviera-melide/tab/{id}?p={p} · Tab {…} |
| /rockademy/ | /bolla-demo-rockademy/?p={p} | solo visita |
| /roda-lliure/ | /bolla-demo-roda-lliure/?p={p} | solo visita |
| /rose-hotels/ | /bolla-demo-rose-hotels/?p={p} | /bolla-demo-rose-hotels/chat/{button}?p={p} · script-option; /bolla-demo-rose-hotels/booking/confirm?p={p} · Demo booking |
| /rousse-look-actual-y-boutique-py/ | /rousse-look-actual-y-boutique-py/?p={p} | solo visita |
| /royal-dent-py/ | /royal-dent-py/?p={p} | solo visita |
| /sahara-dental/ | /bolla-demo-sahara-dental/?p={p} | /bolla-demo-sahara-dental/tab/{id}?p={p} · Tab {…} |
| /salone-valentina-canazei/ | /bolla-demo-salone-valentina-canazei/?p={p} | solo visita |
| /san-paolo-car-bellinzona/ | /bolla-san-paolo-car-bellinzona/?p={p} | /bolla-san-paolo-car-bellinzona/step/{id}?p={p} · {button}; /bolla-san-paolo-car-bellinzona/completata?p={p} · Demo completata; /bolla-san-paolo-car-bellinzona/tab/{id}?p={p} · Tab {…}; /bolla-san-paolo-car-bellinzona/restart?p={p} · Restart |
| /sasha-blaser-makeup-hair-py/ | /sasha-blaser-makeup-hair-py/?p={p} | solo visita |
| /savoy-hotel-apartments/ | /bolla-demo-savoy-hotel-apartments/?p={p} | /bolla-demo-savoy-hotel-apartments/tab/{id}?p={p} · Tab {…} |
| /schifffahrt-ch/de/ | /bolla-demo-schifffahrt-ch/de/?p={p} | /bolla-demo-schifffahrt-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-schifffahrt-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /schifffahrt-ch/fr/ | /bolla-demo-schifffahrt-ch/fr/?p={p} | /bolla-demo-schifffahrt-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-schifffahrt-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /secret-sport-gym/ | /bolla-demo-secret-sport-gym/?p={p} | /bolla-demo-secret-sport-gym/chat/{button}?p={p} · script-option; /bolla-demo-secret-sport-gym/booking/confirm?p={p} · Demo booking |
| /sg-taller-mecanico-py/ | /sg-taller-mecanico-py/?p={p} | solo visita |
| /sitara-hotel-apartment/ | /bolla-demo-sitara-hotel-apartment/?p={p} | /bolla-demo-sitara-hotel-apartment/chat/{button}?p={p} · script-option; /bolla-demo-sitara-hotel-apartment/booking/confirm?p={p} · Demo booking |
| /sivar-car-reggio-emilia/ | /bolla-sivar-car-reggio-emilia/?p={p} | /bolla-sivar-car-reggio-emilia/step/{id}?p={p} · {button}; /bolla-sivar-car-reggio-emilia/completata?p={p} · Demo completata; /bolla-sivar-car-reggio-emilia/tab/{id}?p={p} · Tab {…}; /bolla-sivar-car-reggio-emilia/restart?p={p} · Restart |
| /skischule-ch/de/ | /bolla-demo-skischule-ch/de/?p={p} | /bolla-demo-skischule-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-skischule-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /skischule-ch/fr/ | /bolla-demo-skischule-ch/fr/?p={p} | /bolla-demo-skischule-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-skischule-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /skiverleih-ch/de/ | /bolla-demo-skiverleih-ch/de/?p={p} | /bolla-demo-skiverleih-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-skiverleih-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /skiverleih-ch/fr/ | /bolla-demo-skiverleih-ch/fr/?p={p} | /bolla-demo-skiverleih-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-skiverleih-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /sky-diplomat/ | /bolla-demo-sky-diplomat/?p={p} | /bolla-demo-sky-diplomat/tab/{id}?p={p} · Tab {…} |
| /smartherapy-lugano/ | /bolla-smartherapy-lugano/?p={p} | /bolla-smartherapy-lugano/opt?p={p} · Opzione; /bolla-smartherapy-lugano/slot?p={p} · Orario scelto; /bolla-smartherapy-lugano/confirm?p={p} · Conferma demo; /bolla-smartherapy-lugano/chat?p={p} · Rivedi chat |
| /soledad-notario-centro-de-peluqueria-py/ | /soledad-notario-centro-de-peluqueria-py/?p={p} | solo visita |
| /solo-japoneses-taller-py/ | /solo-japoneses-taller-py/?p={p} | solo visita |
| /soloaga-arrua-inmobiliaria-py/ | /soloaga-arrua-inmobiliaria-py/?p={p} | solo visita |
| /sport-jump-py/ | /sport-jump-py/?p={p} | solo visita |
| /star-metro-deira/ | /bolla-demo-star-metro-deira/?p={p} | /bolla-demo-star-metro-deira/tab/{id}?p={p} · Tab {…} |
| /staub-rondi-massagno/ | /staub-rondi-massagno/?p={p} | /staub-rondi-massagno/tab/{id}?p={p} · Tab {…} |
| /studio-de-francesco-mendrisio/ | /bolla-studio-de-francesco-mendrisio/?p={p} | /bolla-studio-de-francesco-mendrisio/opt?p={p} · Opzione; /bolla-studio-de-francesco-mendrisio/slot?p={p} · Orario scelto; /bolla-studio-de-francesco-mendrisio/confirm?p={p} · Conferma demo; /bolla-studio-de-francesco-mendrisio/chat?p={p} · Rivedi chat |
| /studio-ferrazzini-lugano/ | /bolla-studio-ferrazzini-lugano/?p={p} | /bolla-studio-ferrazzini-lugano/opt?p={p} · Opzione; /bolla-studio-ferrazzini-lugano/slot?p={p} · Orario scelto; /bolla-studio-ferrazzini-lugano/confirm?p={p} · Conferma demo; /bolla-studio-ferrazzini-lugano/chat?p={p} · Rivedi chat |
| /studio-fiori-web/ | /studio-fiori-web/?p={p} | solo visita |
| /studio-fiori/ | /studio-fiori-demo/?p={p} | /studio-fiori-demo/scene/{id}?p={p} · Scena {…} |
| /studio-mb-lugano/ | /bolla-studio-mb-lugano/?p={p} | /bolla-studio-mb-lugano/opt?p={p} · Opzione; /bolla-studio-mb-lugano/slot?p={p} · Orario scelto; /bolla-studio-mb-lugano/confirm?p={p} · Conferma demo; /bolla-studio-mb-lugano/chat?p={p} · Rivedi chat |
| /studio-merlini-muralto/ | /studio-merlini-muralto/?p={p} | /studio-merlini-muralto/tab/{id}?p={p} · Tab {…} |
| /studio-nassa-lugano/ | /bolla-studio-nassa-lugano/?p={p} | /bolla-studio-nassa-lugano/opt?p={p} · Opzione; /bolla-studio-nassa-lugano/slot?p={p} · Orario scelto; /bolla-studio-nassa-lugano/confirm?p={p} · Conferma demo; /bolla-studio-nassa-lugano/chat?p={p} · Rivedi chat |
| /studio-priotti-torino/ | /bolla-studio-priotti-torino/?p={p} | /bolla-studio-priotti-torino/opt?p={p} · Opzione; /bolla-studio-priotti-torino/slot?p={p} · Orario scelto; /bolla-studio-priotti-torino/confirm?p={p} · Conferma demo; /bolla-studio-priotti-torino/chat?p={p} · Rivedi chat |
| /studio-sannicolo-torino/ | /bolla-studio-sannicolo-torino/?p={p} | /bolla-studio-sannicolo-torino/opt?p={p} · Opzione; /bolla-studio-sannicolo-torino/slot?p={p} · Orario scelto; /bolla-studio-sannicolo-torino/confirm?p={p} · Conferma demo; /bolla-studio-sannicolo-torino/chat?p={p} · Rivedi chat |
| /super-servei-bailen/ | /bolla-demo-super-servei-bailen/?p={p} | solo visita |
| /taller-bp-py/ | /taller-bp-py/?p={p} | solo visita |
| /taller-mecanico-rg-service-py/ | /taller-mecanico-rg-service-py/?p={p} | solo visita |
| /taller-mister-car-py/ | /taller-mister-car-py/?p={p} | solo visita |
| /talleres-universal-nou-barris/ | /bolla-demo-talleres-universal-nou-barris/?p={p} | solo visita |
| /tango-lugano/ | /tango-lugano/?p={p} | /tango-lugano/tab/{id}?p={p} · Tab {…} |
| /tapiceria-hilario/ | /bolla-demo-tapiceria-hilario/?p={p} | solo visita |
| /taxi-encarnacion-py/ | /taxi-encarnacion-py/?p={p} | solo visita |
| /tierarzt-ch/de/ | /bolla-demo-tierarzt-ch/de/?p={p} | /bolla-demo-tierarzt-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-tierarzt-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /tierarzt-ch/en/ | /bolla-demo-tierarzt-ch/en/?p={p} | /bolla-demo-tierarzt-ch/en/chat/{id}?p={p} · example; /bolla-demo-tierarzt-ch/en/request/confirm?p={p} · example |
| /tierarzt-ch/fr/ | /bolla-demo-tierarzt-ch/fr/?p={p} | /bolla-demo-tierarzt-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-tierarzt-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /tierarzt-ch/it/ | /bolla-demo-tierarzt-ch/it/?p={p} | /bolla-demo-tierarzt-ch/it/chat/{button}?p={p} · script-option; /bolla-demo-tierarzt-ch/it/request/confirm?p={p} · Demo-Anfrage |
| /tina-estilo-y-belleza-py/ | /tina-estilo-y-belleza-py/?p={p} | solo visita |
| /tinkermoon/ | /bolla-demo-tinkermoon/?p={p} | /bolla-demo-tinkermoon/chat/{button}?p={p} · script-option; /bolla-demo-tinkermoon/booking/confirm?p={p} · Demo booking |
| /tinoleggio-muralto/ | /tinoleggio-muralto/?p={p} | /tinoleggio-muralto/tab/{id}?p={p} · Tab {…} |
| /tobler-ascona/ | /tobler-ascona/?p={p} | /tobler-ascona/tab/{id}?p={p} · Tab {…} |
| /tonel-pizza-casera-py/ | /tonel-pizza-casera-py/?p={p} | solo visita |
| /torretta-house-locarno/ | /bolla-torretta-house-locarno/?p={p} | /bolla-torretta-house-locarno/opt?p={p} · Opzione; /bolla-torretta-house-locarno/slot?p={p} · Orario scelto; /bolla-torretta-house-locarno/confirm?p={p} · Conferma demo; /bolla-torretta-house-locarno/chat?p={p} · Rivedi chat |
| /tourismus-berlin/de/ | /bolla-demo-tourismus-berlin/de/?p={p} | /bolla-demo-tourismus-berlin/de/chat/{id}?p={p} · example; /bolla-demo-tourismus-berlin/de/request/confirm?p={p} · example |
| /tourismus-berlin/en/ | /bolla-demo-tourismus-berlin/en/?p={p} | /bolla-demo-tourismus-berlin/en/chat/{id}?p={p} · example; /bolla-demo-tourismus-berlin/en/request/confirm?p={p} · example |
| /tu-dulce-pasion/ | /bolla-demo-tu-dulce-pasion/?p={p} | solo visita |
| /tybee-island-rentals/ | /bolla-demo-tybee-island-rentals/?p={p} | /bolla-demo-tybee-island-rentals/chat/{button}?p={p} · script-option; /bolla-demo-tybee-island-rentals/booking/confirm?p={p} · Demo booking |
| /uma-massage/ | /bolla-demo-uma-massage/?p={p} | solo visita |
| /umzug-ch/de/ | /bolla-demo-umzug-ch/de/?p={p} | /bolla-demo-umzug-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-umzug-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /umzug-ch/en/ | /bolla-demo-umzug-ch/en/?p={p} | /bolla-demo-umzug-ch/en/chat/{id}?p={p} · example; /bolla-demo-umzug-ch/en/request/confirm?p={p} · example |
| /umzug-ch/fr/ | /bolla-demo-umzug-ch/fr/?p={p} | /bolla-demo-umzug-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-umzug-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /unione-bellinzona/ | /unione-bellinzona/?p={p} | /unione-bellinzona/tab/{id}?p={p} · Tab {…} |
| /vak-holiday-homes/ | /bolla-demo-vak-holiday-homes/?p={p} | /bolla-demo-vak-holiday-homes/tab/{id}?p={p} · Tab {…} |
| /vecchia-osteria-seseglio/ | /vecchia-osteria-seseglio/?p={p} | /vecchia-osteria-seseglio/tab/{id}?p={p} · Tab {…} |
| /velomiete-ch/de/ | /bolla-demo-velomiete-ch/de/?p={p} | /bolla-demo-velomiete-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-velomiete-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /velomiete-ch/fr/ | /bolla-demo-velomiete-ch/fr/?p={p} | /bolla-demo-velomiete-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-velomiete-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /velowerkstatt-ch/de/ | /bolla-demo-velowerkstatt-ch/de/?p={p} | /bolla-demo-velowerkstatt-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-velowerkstatt-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /velowerkstatt-ch/fr/ | /bolla-demo-velowerkstatt-ch/fr/?p={p} | /bolla-demo-velowerkstatt-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-velowerkstatt-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /vet/en/ | /bolla-demo-vet/en/?p={p} | /bolla-demo-vet/en/chat/{id}?p={p} · example; /bolla-demo-vet/en/request/confirm?p={p} · example |
| /vet/et/ | /bolla-demo-vet/et/?p={p} | /bolla-demo-vet/et/chat/{id}?p={p} · example; /bolla-demo-vet/et/request/confirm?p={p} · example |
| /vet/ru/ | /bolla-demo-vet/ru/?p={p} | /bolla-demo-vet/ru/chat/{id}?p={p} · example; /bolla-demo-vet/ru/request/confirm?p={p} · example |
| /veterinaria-dog-s-shop-py/ | /veterinaria-dog-s-shop-py/?p={p} | solo visita |
| /veterinaria-libertad-py/ | /veterinaria-libertad-py/?p={p} | solo visita |
| /veterinaria-peke-s-py/ | /veterinaria-peke-s-py/?p={p} | solo visita |
| /veterinaria-renato-py/ | /veterinaria-renato-py/?p={p} | solo visita |
| /victoria-au-lac-paradiso/ | /victoria-au-lac-paradiso/?p={p} | /victoria-au-lac-paradiso/tab/{id}?p={p} · Tab {…} |
| /video/comunidad-argentina/de/ | /bolla-video-comunidad-argentina/de/?p={p} | /bolla-video-comunidad-argentina/de/play?p={p} · video-play |
| /video/comunidad-argentina/en/ | /bolla-video-comunidad-argentina/en/?p={p} | /bolla-video-comunidad-argentina/en/play?p={p} · video-play |
| /video/comunidad-argentina/es/ | /bolla-video-comunidad-argentina/es/?p={p} | /bolla-video-comunidad-argentina/es/play?p={p} · video-play |
| /video/comunidad-argentina/fr/ | /bolla-video-comunidad-argentina/fr/?p={p} | /bolla-video-comunidad-argentina/fr/play?p={p} · video-play |
| /video/comunidad-argentina/it/ | /bolla-video-comunidad-argentina/it/?p={p} | /bolla-video-comunidad-argentina/it/play?p={p} · video-play |
| /vila-motos/ | /bolla-demo-vila-motos/?p={p} | solo visita |
| /viticcio-greve/ | /bolla-viticcio-greve/?p={p} | /bolla-viticcio-greve/opt?p={p} · Opzione; /bolla-viticcio-greve/slot?p={p} · Orario scelto; /bolla-viticcio-greve/confirm?p={p} · Conferma demo; /bolla-viticcio-greve/chat?p={p} · Rivedi chat |
| /voz/ambarra/ | /ambarra/voice/?p={p} | /ambarra/voice-lang-{lang}?p={p} · Voice lang {…}; /ambarra/voice-start?p={p} · Conversazione vocale avviata |
| /voz/lagoon42/ | /PROSPECTO/voice?p={p} | /PROSPECTO/voice-start?p={p} · Conversación iniciada |
| /voz/schloss-wuelflingen/ | /schloss-wuelflingen/voice?p={p} | /schloss-wuelflingen/voice-start?p={p} · Gespräch gestartet |
| /walter-au-lac-lugano/ | /walter-au-lac-lugano/?p={p} | /walter-au-lac-lugano/tab/{id}?p={p} · Tab {…} |
| /wunderli-py/ | /wunderli-py/?p={p} | solo visita |
| /xarcuteria-omas/ | /bolla-demo-xarcuteria-omas/?p={p} | solo visita |
| /xva-art-hotel/ | /bolla-demo-xva-art-hotel/?p={p} | /bolla-demo-xva-art-hotel/chat/{button}?p={p} · script-option; /bolla-demo-xva-art-hotel/booking/confirm?p={p} · Demo booking |
| /yachting-mt/ | /yachting-mt/?p={p} | /yachting-mt/flow/{id}?p={p} · Flow {…}; /yachting-mt/flow/completed?p={p} · Flow completed; /yachting-mt/tab/{id}?p={p} · Tab {…} |
| /yakin-arena/ | /bolla-demo-yakin-arena/?p={p} | /bolla-demo-yakin-arena/home?p={p} · section; /bolla-demo-yakin-arena/events?p={p} · section; /bolla-demo-yakin-arena/me?p={p} · section; /bolla-demo-yakin-arena/chat?p={p} · section; /bolla-demo-yakin-arena/chat/{id}?p={p} · script-option |
| /your-smile-adc/ | /bolla-demo-your-smile-adc/?p={p} | /bolla-demo-your-smile-adc/tab/{id}?p={p} · Tab {…} |
| /zahnarzt-ch/de/ | /bolla-demo-zahnarzt-ch/de/?p={p} | /bolla-demo-zahnarzt-ch/de/chat/{button}?p={p} · script-option; /bolla-demo-zahnarzt-ch/de/request/confirm?p={p} · Demo-Anfrage |
| /zahnarzt-ch/en/ | /bolla-demo-zahnarzt-ch/en/?p={p} | /bolla-demo-zahnarzt-ch/en/chat/{id}?p={p} · example; /bolla-demo-zahnarzt-ch/en/request/confirm?p={p} · example |
| /zahnarzt-ch/fr/ | /bolla-demo-zahnarzt-ch/fr/?p={p} | /bolla-demo-zahnarzt-ch/fr/chat/{button}?p={p} · script-option; /bolla-demo-zahnarzt-ch/fr/request/confirm?p={p} · Demo-Anfrage |
| /zancauto-verona/ | /bolla-zancauto-verona/?p={p} | /bolla-zancauto-verona/step/{id}?p={p} · {button}; /bolla-zancauto-verona/completata?p={p} · Demo completata; /bolla-zancauto-verona/tab/{id}?p={p} · Tab {…}; /bolla-zancauto-verona/restart?p={p} · Restart |
| /zapateria-galaxia/ | /bolla-demo-zapateria-galaxia/?p={p} | solo visita |
| /zenk-barberia-py/ | /zenk-barberia-py/?p={p} | solo visita |
| /zenon-dental/ | /bolla-demo-zenon-dental/?p={p} | /bolla-demo-zenon-dental/tab/{id}?p={p} · Tab {…} |

## Páginas que no cuentan

La portada `/` es el letrero del servidor.

Redirecciones (45), conservan la búsqueda y el hash, y no cargan el contador: `/aesthetik-ch/`, `/ausfluege-ch/`, `/barber/`, `/bergbahn-ch/`, `/canyoning-ch/`, `/charter-de/`, `/charter-intl/`, `/charter/`, `/coiffeur-ch/`, `/concesionarios/`, `/dentist/`, `/fahrschule-ch/`, `/ferienwohnung-ch/`, `/fitness-ch/`, `/garage-ch/`, `/garage/`, `/hair-salon/`, `/hotel-ch/`, `/hotel-de/`, `/hotel/`, `/immobilien-ch/`, `/industrie-de/`, `/marina-pirita/`, `/movers/`, `/musikschule-ch/`, `/optician/`, `/optiker-ch/`, `/paragliding-ch/`, `/physio-ch/`, `/physio/`, `/real-estate/`, `/restaurant-ch/`, `/restaurant-de/`, `/restaurant/`, `/schifffahrt-ch/`, `/skischule-ch/`, `/skiverleih-ch/`, `/tierarzt-ch/`, `/tourismus-berlin/`, `/umzug-ch/`, `/velomiete-ch/`, `/velowerkstatt-ch/`, `/vet/`, `/video/comunidad-argentina/`, `/zahnarzt-ch/`.
