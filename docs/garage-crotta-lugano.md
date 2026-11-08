# Garage Nedy Crotta — chat e voce

Demo non ufficiale di BOLLA STUDIO. Non è il sito del garage e non invia prenotazioni, email o messaggi.

Pagine nuove, solo per questo garage:

- `/garage-crotta-lugano/chat/` — chat libera, solo testo
- `/garage-crotta-lugano/voce/` — voce interattiva nei due sensi

`/garage-crotta-lugano/` resta l'esempio storico con risposte già scritte. Non usa l'agente e non è stato modificato.

Queste pagine non sono in linea finché il ramo non viene unito a `main`. GitHub Pages di questo repository pubblica `main` su `https://demo.bollastudio.com` (cartella `/`). Dopo un merge autorizzato gli indirizzi sono:

- `https://demo.bollastudio.com/garage-crotta-lugano/chat/`
- `https://demo.bollastudio.com/garage-crotta-lugano/voce/`

Questo lavoro non fa il merge e non pubblica.

## Agente

Id pubblico, creato da zero per Crotta: `agent_5901m6wvp21efkrrgna504217pjg`.

Letto il 2026-11-08, senza modificarlo: ramo `agtbrch_2801m6wvp34pe27sc6a6jnddstsf`, versione `agtvrsn_2001m6wvvn6zf6pt1xvjg4b8zm1z`. Lingua `it`. Nessuna knowledge base, nessun tool, nessun numero di telefono. `enable_auth` è false. L'allowlist è solo `demo.bollastudio.com` e `require_origin_header` è true. Il client non manda un Origin diverso da quello del browser e non contiene una chiave API.

L'override consentito è `conversation.text_only`. La chat usa `@elevenlabs/client` 1.35.0 con `textOnly: true` e `connectionType: "websocket"`. In quella versione il flag viene copiato in `conversation_config_override.conversation.text_only`. La voce usa lo stesso `connectionType: "websocket"` documentato per l'audio nei due sensi e non imposta `textOnly`. Il microfono resta acceso. `options.origin` non viene impostato: è l'host dell'API, non l'Origin della pagina. WebRTC, che chiede un token LiveKit, è stato rifiutato per questo Origin; il WebSocket pubblico è lo stesso tipo di handshake che la chat ha già superato.

Gli id di Ambàra e Schloss sono rifiutati da `assertAgent`. Non sono montati.

## Fonti

Lette il 2026-11-08:

- https://www.garagecrotta.ch/
- https://garagecrotta.ch/chi-siamo.php
- https://garagecrotta.ch/officina.php
- https://www.garagecrotta.ch/concessionario.php
- https://garagecrotta.ch/contatti.php

Usato dal sito: nome, officina auto e moto, banner «rivenditore ufficiale» per Vespa, Moto Guzzi e Aprilia, specializzazione sul gruppo Piaggio, collaborazioni storiche (Aprilia, Kawasaki, Triumph, Piaggio, Vespa, Gilera, Norton, Fantic), servizi (riparazioni, servizi, gomme, collaudi, pista, customizzazione, importazione, compravendita), partner Pirelli, Michelin, Continental, ELF e Brembo, orari lun–ven 07:30–12:00 e 13:30–18:00, sabato 09:00–12:00, domenica chiuso, telefono servizi 091 972 18 28, email garage.crotta@bluewin.ch, modulo sul sito per il giro di prova gratuito. Il modulo del sito non è collegato a queste pagine.

Il footer elenca altre marche. Non sono trattate come concessionari ufficiali. Il numero mobile della vendita, pubblicato in contatti.php, non è in queste pagine. Non ci sono prezzi, stock, finanziamenti, noleggi o appuntamenti inventati.

Indirizzo: il sito scrive Via al Campanile 1, 6900 Lugano. Una verifica su mappa del 2026-11-08 conferma la via e indica il CAP 6962. Il testo dell'agente omette il CAP («Via al Campanile 1, Lugano»). La pagina non sceglie un CAP e non mostra una mappa. Un elenco terzo riporta un'altra via: non è usato.

## Privacy

Testo visibile, uguale nelle due pagine:

«Demo non ufficiale realizzata da BOLLA STUDIO; nessuna prenotazione o richiesta viene inviata al garage.»

«Demo non ufficiale BOLLA STUDIO. Non inserire dati personali. La conversazione è elaborata da ElevenLabs; la registrazione audio è disattivata. I dati tecnici possono essere trasmessi ai servizi collegati di BOLLA STUDIO.»

Impostazioni lette sull'agente: `record_voice` false, `delete_audio` true, `retention_days` 1, `delete_transcript_and_pii` false, `zero_retention_mode` false. La conservazione di 1 giorno è un'impostazione del fornitore su questo agente. Non è una cancellazione globale. L'esportazione di archivio del workspace può ancora includere la trascrizione. Un webhook di workspace può inviare riepilogo e metadati; il post-call può escludere il transcript turno per turno. Nessun URL di webhook è stato aggiunto qui e `platform_settings.webhook` non è presente sull'agente. Non si promette che nessuna trascrizione venga esportata.

La chat non ha campi nome, telefono o email. Non c'è un modulo che invia dati.

## Contratto eventi

Il contatore resta GoatCounter, `https://bollastudio.goatcounter.com/count`. Una visita non ha `event: true`. L'uso sì. `p` oppure, se manca, `link_id`: etichetta di link, al massimo 60 caratteri `a-z`, `0-9` e trattino. Non è una persona. Se manca, il percorso resta senza query: il visitatore sconosciuto resta sconosciuto. `?internal=1` scrive `skipgc` e non inserisce lo script del contatore. `?internal=0` lo riammette.

| Fatto | Percorso | Titolo | `event` |
| --- | --- | --- | --- |
| Visita chat | `/bolla-garage-crotta-lugano/chat/` | `crotta-chat` | no |
| Risposta di testo completata, dopo un messaggio dell'utente | `/bolla-garage-crotta-lugano/chat/response/{it\|de\|en\|fr}` | `chat-response` | sì |
| Errore chat | `/bolla-garage-crotta-lugano/chat/error/{it\|de\|en\|fr}` | `chat-error` | sì |
| Visita voce | `/bolla-garage-crotta-lugano/voce/` | `crotta-voce` | no |
| Voce connessa, dopo che l'assistente parla o scrive | `/bolla-garage-crotta-lugano/voce/connected/{it\|de\|en\|fr}` | `voice-connected` | sì |
| Voce chiusa | `/bolla-garage-crotta-lugano/voce/ended/{it\|de\|en\|fr}` | `voice-ended` | sì |
| Errore voce | `/bolla-garage-crotta-lugano/voce/error/{it\|de\|en\|fr}` | `voice-error` | sì |

Non vanno nel contatore: il testo, il nome, il telefono, l'email, l'id di conversazione. Il clic su Invia o su Inizia non è un evento. Il saluto iniziale, prima di un messaggio dell'utente, non è un uso. Dopo ogni messaggio inviato conta una sola risposta completata: `onMessage` con ruolo `agent` oppure lo `stop` di `agent_chat_response_part`, una volta per `response_id`. I delta non contano. Una domanda e una risposta fanno un evento, non due. La lingua della sessione, solo `it`, `de`, `en` o `fr`, è l'ultimo tratto del percorso di uso. Il selettore imposta `overrides.agent.language` e non `first_message`. Se una sessione è aperta, il cambio di lingua non la riavvia: va chiusa prima. Il sito del garage resta italiano; le lingue aggiunte sono quelle pubblicate da Lugano Region, non una dichiarazione sul personale o sulla clientela. La voce connessa parte quando l'assistente è in linea: `onModeChange` con `speaking`, un messaggio `agent`, o `onAudio`. `onConnect`, lo stato `connected` e `conversation_initiation_metadata` da soli non bastano: il fornitore può rifiutare il dominio dopo aver assegnato un id. La chiusura parte da `onDisconnect` solo dopo che l'assistente è stato in linea. Se la sessione si chiude prima, l'evento è `voice-error`. L'errore parte anche da `onError`, da `client_error` o dal rifiuto di `startSession`. Lo stato `disconnected` prima della risposta non è una chiusura.

L'id di conversazione può comparire sulla pagina come riferimento tecnico della sessione in corso. Non è un identificatore della persona.

## Prove

`node --test test/garage-crotta-lugano.test.mjs` non chiama il contatore né ElevenLabs. Con Chrome locale apre le pagine solo con `?internal=1`, blocca GoatCounter, jsDelivr ed ElevenLabs prima del caricamento e fallisce se una di queste richieste parte. Quella prova non dimostra una conversazione: il fornitore è bloccato di proposito.

`node garage-crotta-lugano/test/runtime-probe.mjs` è separato. Parte solo con `CROTTa_RUNTIME=1`. Blocca il contatore prima del caricamento e lascia passare il fornitore. Non imposta l'Origin di `demo.bollastudio.com`. Una chat e, se serve, una voce, poi si ferma. Senza `localhost` nell'allowlist la sessione viene rifiutata: il rifiuto non è una risposta dell'assistente.

Limiti dell'agente: 2 sessioni contemporanee, 50 al giorno, 300 secondi. Non acquistare crediti per questa prova.

## Prova dal vivo, 8 novembre 2026

Prima prova, allowlist solo `demo.bollastudio.com`: il fornitore ha rifiutato l'avvio (codice 3000). Id senza messaggi: `conv_0401m6wwsayaeervdmrkghh28h8q`, `conv_5101m6wwsc60fjqbqmntccvmq14b`, `conv_5101m6wwwcsdepsrkm1y1a6kqy6r`.

Seconda prova, dopo l'allowlist con `localhost` e `127.0.0.1`, versione `agtvrsn_8901m6wx51bten59rk9q48wbzvsj`. Origin reale `http://127.0.0.1`, contatore bloccato prima del caricamento, una chat e una voce, senza ripetizioni.

Chat `conv_9001m6wxbtfhearbg7ac24va93pf`: `text_only` true, stato `done`, circa 1 secondo. L'utente ha scritto «Quali sono gli orari di apertura?». L'assistente ha completato: «Certamente. Gli orari indicati sul sito sono questi: dal lunedì al venerdì dalle 07:30 alle 12:00 e dalle 13:30 alle 18:00. Il sabato dalle 09:00 alle 12:00. La domenica è chiuso.» Il contatore interno ha registrato due `chat-response` (saluto e risposta). Nessuna richiesta al contatore di produzione.

Voce WebRTC `conv_6701m6wxbzexfa4vt9yw5kw8drfq`: il microfono finto ha letto il WAV, ma l'avvio LiveKit è stato rifiutato (codice 3000, `authorization_method` invalid) prima di ogni trascrizione. Non è un dialogo.

La voce successiva usa il WebSocket documentato, non WebRTC. Una sola sessione, `conv_5401m6wxpnp8e33bf82scpedarc9`, stato `done`, 12 secondi, `text_only` false, `is_livekit` false, `authorization_method` public. Origin reale `http://127.0.0.1:43473`. Il parlato sintetico è stato riconosciuto (`source_medium` audio): «Quali marchi trattate?». L'assistente ha risposto indicando i banner ufficiali Vespa, Moto Guzzi e Aprilia e la specializzazione Piaggio. Il browser ha ricevuto 26 chunk audio, 357000 byte, picco 27526. Il fornitore conta 11,16 secondi di audio in uscita e 3,37 secondi di audio in entrata. `record_voice` è false, quindi la conversazione salvata ha `has_audio` false. Il contatore interno: `voice-connected` poi `voice-ended`. Nessuna richiesta al contatore di produzione. Nessuna seconda prova.

Il saluto non conta come uso della chat: una domanda inviata produce un solo `chat-response`. La sessione di chat già chiusa era stata misurata col codice precedente e non è stata ripetuta.

## Lingue, 8 novembre 2026

Selettore su chat e voce: italiano predefinito, più tedesco, inglese e francese. Sono le lingue del sito di Lugano Region. Il sito del garage resta italiano. Il selettore manda solo `overrides.agent.language`. Non manda `first_message`. Una sessione aperta non viene cambiata in silenzio.

QA locale, una chat e una voce per lingua, in serie, Origin `http://127.0.0.1`, contatore bloccato. Versione agente `agtvrsn_9401m6wzhvrkf6e9pz1r20vaqta6`.

- Tedesco chat `conv_4601m6wzwks2fp2vb2qdmv5vb9qx`: «Welche sind die Öffnungszeiten?» → orari in tedesco. Un solo `chat-response`.
- Tedesco voce `conv_0201m6wzx5x4e63rhnt5vy9t3rdf`: «Welche Marken sind offiziell?» riconosciuto, risposta con Vespa, Moto Guzzi e Aprilia, audio ricevuto.
- Inglese chat `conv_0701m6wzxmqyfr0sjpv2xc3btm01`: «What are the opening hours?» → orari in inglese. Un solo `chat-response`.
- Inglese voce `conv_8601m6wzy6stfk2v06a7kb9vcws3`: il file durava 6,2 secondi e Chromium lo ripete. In 40 secondi la stessa frase è uscita cinque volte come «Which drawings are official?». Non è stata ripetuta.
- Inglese voce, un solo tentativo successivo, `conv_8501m6x09kbjey5vgvjtn7hpa3vr`: il file durava 43,7 secondi, con la frase solo tra 1,3 e 3,2 secondi. Il riconoscimento non ha ricevuto audio dell'utente (0 secondi, evento `user_turn_timeout`). Trascrizione «...» e risposta «Are you still there?». Non è una risposta sugli orari. Non è stata ripetuta. La frase va dopo i primi secondi di connessione, altrimenti finisce prima che il riconoscimento ascolti.
- Francese chat `conv_8101m6wzzh8fe5dv44g5n2phtnk1`: «Quels sont les horaires d'ouverture ?» → orari in francese. Un solo `chat-response`.
- Francese voce `conv_5701m6x00433e9pvn3csftd49q1e`. Trascrizione utente: «Quel marque sous officiel ?». Risposta: «Le garage est revendeur officiel Vespa, Moto Guzzi et Aprilia, et il est spécialisé dans le groupe Piaggio.» Poi: «Il connaît aussi bien les motos anglaises que japonaises.» I tre marchi ufficiali e la specializzazione Piaggio sono sul sito. Non dice che Piaggio sia un concessionario ufficiale. Nessuna nuova chiamata francese.
