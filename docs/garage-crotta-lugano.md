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

L'override consentito è `conversation.text_only`. La chat usa `@elevenlabs/client` 1.35.0 con `textOnly: true` e `connectionType: "websocket"`. In quella versione il flag viene copiato in `conversation_config_override.conversation.text_only`. La voce usa `connectionType: "webrtc"` e non imposta `textOnly`.

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
| Risposta di testo completata | `/bolla-garage-crotta-lugano/chat/response` | `chat-response` | sì |
| Errore chat | `/bolla-garage-crotta-lugano/chat/error` | `chat-error` | sì |
| Visita voce | `/bolla-garage-crotta-lugano/voce/` | `crotta-voce` | no |
| Voce connessa, dopo che l'assistente parla o scrive | `/bolla-garage-crotta-lugano/voce/connected` | `voice-connected` | sì |
| Voce chiusa | `/bolla-garage-crotta-lugano/voce/ended` | `voice-ended` | sì |
| Errore voce | `/bolla-garage-crotta-lugano/voce/error` | `voice-error` | sì |

Non vanno nel contatore: il testo, il nome, il telefono, l'email, l'id di conversazione. Il clic su Invia o su Inizia non è un evento. La risposta chat parte da `onMessage` con ruolo `agent` (`agent_response`) oppure dallo `stop` di `agent_chat_response_part`, una volta per `response_id`. I delta non contano. La voce connessa parte quando l'assistente è in linea: `onModeChange` con `speaking`, un messaggio `agent`, o `onAudio`. `onConnect`, lo stato `connected` e `conversation_initiation_metadata` da soli non bastano: il fornitore può rifiutare il dominio dopo aver assegnato un id. La chiusura parte da `onDisconnect` solo dopo che l'assistente è stato in linea. Se la sessione si chiude prima, l'evento è `voice-error`. L'errore parte anche da `onError`, da `client_error` o dal rifiuto di `startSession`. Lo stato `disconnected` prima della risposta non è una chiusura.

L'id di conversazione può comparire sulla pagina come riferimento tecnico della sessione in corso. Non è un identificatore della persona.

## Prove

`node --test test/garage-crotta-lugano.test.mjs` non chiama il contatore né ElevenLabs. Con Chrome locale apre le pagine solo con `?internal=1`, blocca GoatCounter, jsDelivr ed ElevenLabs prima del caricamento e fallisce se una di queste richieste parte. Quella prova non dimostra una conversazione: il fornitore è bloccato di proposito.

`node garage-crotta-lugano/test/runtime-probe.mjs` è separato. Parte solo con `CROTTa_RUNTIME=1`. Blocca il contatore prima del caricamento e lascia passare il fornitore. Non imposta l'Origin di `demo.bollastudio.com`. Una chat e, se serve, una voce, poi si ferma. Senza `localhost` nell'allowlist la sessione viene rifiutata: il rifiuto non è una risposta dell'assistente.

Limiti dell'agente: 2 sessioni contemporanee, 50 al giorno, 300 secondi. Non acquistare crediti per questa prova.

## Prova dal vivo, 8 novembre 2026

Chrome headless, Origin reale `http://127.0.0.1` (non quello di produzione), contatore bloccato prima del caricamento. Nessun dispositivo audio in `/dev/snd`. Il fornitore ha rifiutato la sessione: codice 3000, «Access denied. Your domain is not authorized to connect to this agent», `authorization_method` invalid. Nessun messaggio e nessun audio.

Id, tutti falliti, zero messaggi: `conv_0401m6wwsayaeervdmrkghh28h8q`, `conv_5101m6wwsc60fjqbqmntccvmq14b` (chat), `conv_5101m6wwwcsdepsrkm1y1a6kqy6r` (voce, `has_audio` false). Non sono risposte dell'assistente. Per una prova vera serve aggiungere temporaneamente l'host locale all'allowlist e poi toglierlo. Questa sessione non lo ha fatto e non ha ripetuto la chat dopo il rifiuto.
