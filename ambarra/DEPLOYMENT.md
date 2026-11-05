# Deploying the Ambara demo

Do not merge this branch, and do not publish it, until the new ElevenLabs agent ID for Ambara is supplied. Merging is what puts the page on the live demo host.

## How this repo is published

GitHub Pages serves the `main` branch from the repository root. The custom domain in `CNAME` is `demo.bollastudio.com`. There is no separate staging site: a merge to `main` publishes every folder, including this one.

After a deliberate merge, the demo is:

https://demo.bollastudio.com/ambarra/

Italian is the default. English is `?lang=en`. Spanish, German and French are `?lang=es`, `?lang=de` and `?lang=fr`. They are capability demonstrations, not a claim about languages spoken in the dining room.

A pull request does not publish the page.

## Keep internal QA out of the prospect count

GoatCounter is the existing BOLLA STUDIO counter (`bollastudio.goatcounter.com`). This page follows that convention and adds a host check.

- Page view: `/ambarra/` or `/ambarra/?p=<tag>`
- Events: `/ambarra/channel/...`, `/ambarra/chat/...`, `/ambarra/booking/simulate`, `/ambarra/lang/...`, `/ambarra/sample/...`, `/ambarra/review/draft`
- A future voice start: `/ambarra/voice-start` (one count per 4 seconds)
- `?internal=1` stores `skipgc=t` and loads no counter. `?internal=0` clears it.
- The counter script loads only on `demo.bollastudio.com`. Local previews and any other host do not count.

Before anyone opens the live URL, use:

https://demo.bollastudio.com/ambarra/?internal=1

The flag sticks in the browser until it is cleared.

## Voice, when the ID arrives

1. Put the new Ambara agent ID in `RUNTIME_AGENT_ID` in `ambarra/engine.js`.
2. Leave every other demo alone. In particular do not change `voz/schloss-wuelflingen/`.
3. Do not reuse `agent_3101m5z30nvbf06rvwp6def0k85b`. `voiceMountPlan` refuses that ID and will not insert the widget.
4. The ElevenLabs script is added only for a new, well-formed ID. Widget labels follow the language selected on the page. Until then the phone tab states that voice is not configured and plays no stand-in audio.

## Reservations

The public booking link on the restaurant website is Plateform:

https://ambarasardinianlounge.plateform.app/r/ambarainstagram

That is not proof of an API, credentials, or a property-management connection. The form on this page only simulates a request. It does not check availability and it does not confirm a table. Connect a live create/change/cancel call only after the vendor grants access. OpenTable is not the path: the live OpenTable page says the restaurant is not on that network.

WhatsApp, Instagram and Google are explained and simulated. Nothing is sent, and no account is connected. Google Business Messages ended on 31 July 2024; the Google tab does not pretend that chat is live.

## Check before a later merge

```bash
node --test ambarra/test/demo.test.mjs
```

Preview from the repository root:

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765/ambarra/?internal=1`.
