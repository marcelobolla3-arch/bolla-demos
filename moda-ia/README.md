# Moda · Video con IA (anteprima)

Pagina portfolio con i 10 video di moda generati con IA (concept AURE, sartoria butter yellow).
Destinazione finale: una sezione di **bollastudio.com** (es. sotto *Produzione audiovisiva*). Qui vive come anteprima
su `demo.bollastudio.com/moda-ia/` con `noindex`.

- Testi: `content.js` (it, es, en, de). Le descrizioni riportano solo ciò che si vede nei fotogrammi; il tessuto è indicato «come appare».
- Video: `v/*.mp4` H.264, max 720 px di larghezza, 24 fps, senza audio (la musica originale ha licenza non verificata), `+faststart`. Poster `v/*.webp`.
  La galleria carica il video solo al tocco (nessun download in apertura, a parte il film dell'hero, che parte muto solo se visibile e non con «riduci movimento»/risparmio dati).
- Fonti: `aure/aure_v4.mp4` → film-aure, `aure_final` → film-aure-montaggio, `s1` seduta, `s2` passerella, `s3` dettaglio-pantalone, `s4` profilo-stola, `a` seduta-camminata, `b` profilo-ravvicinato, `v1` variante-ambiente, `v2` variante-stola.
- Font DM Sans e Barlow Condensed copiati da bollastudio.com/fonts.

## Contatore (GoatCounter, come le altre demo)
- Visita: `/moda-ia/` (+ `?p=`).
- Uso (`event: true`, una volta per pagina): `/moda-ia/video-play/<id>`, `/moda-ia/video-play/hero` (solo play manuale), `/moda-ia/lang-<xx>`, `/moda-ia/cta-whatsapp|cta-call|cta-email|cta-form`, `/moda-ia/link-audiovisual`.
- `?internal=1` o `p=bmaudit-*` non carica il contatore. L'autoplay muto dell'hero non conta come uso.
