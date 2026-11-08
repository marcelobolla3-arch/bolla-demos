/* Garage Nedy Crotta — chat and voice runtime.
   SDK checked 2026-11-08: @elevenlabs/client 1.35.0.
   A completed assistant reply is onMessage from agent_response (role "agent").
   Streaming parts are onAgentChatResponsePart. stop and agent_response share response_id.
   Tentative text is not delivered through onMessage in this version.
   Voice "connected" is onConnect, status "connected", or conversation metadata.
   The start button and sendUserMessage do not emit those metrics.
   textOnly:true is what this SDK copies into conversation.text_only.
   This file does not set an Origin header and does not contain an API key.
*/
(function (root) {
  "use strict";
  var AGENT_ID = "agent_5901m6wvp21efkrrgna504217pjg";
  var SDK_URL = "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.35.0/+esm";
  var FORBIDDEN = {
    "agent_6201m6q47bszfaz93zk0zaxrvbdb": "ambarra",
    "agent_3101m5z30nvbf06rvwp6def0k85b": "schloss"
  };

  function assertAgent(id) {
    if (FORBIDDEN[id]) throw new Error("agent-forbidden");
    if (id !== AGENT_ID) throw new Error("agent-rejected");
    return id;
  }

  function createMeter(mode) {
    var seen = Object.create(null);
    var turnCounted = false;
    var stopThisTurn = false;
    var connected = false;
    var ended = false;
    var errorOpen = false;
    var userSentCount = 0;
    var emittedAnswers = 0;

    function armTurn() {
      turnCounted = false;
      stopThisTurn = false;
    }
    function armAttempt() {
      errorOpen = false;
    }
    function noteCompleted(id) {
      if (id) {
        if (seen[id]) return false;
        seen[id] = 1;
        turnCounted = true;
        return true;
      }
      if (turnCounted) return false;
      turnCounted = true;
      return true;
    }
    function chatReply(id) {
      if (!noteCompleted(id)) return [];
      // The opening greeting arrives before any user message and is not a use.
      // One sent user message can produce one usage event.
      if (emittedAnswers >= userSentCount) return [];
      emittedAnswers += 1;
      return [{ kind: "chat-response", path: "/response", title: "chat-response" }];
    }
    function noteError(kind, path, title) {
      if (errorOpen) return [];
      errorOpen = true;
      return [{ kind: kind, path: path, title: title }];
    }

    function observe(event) {
      if (!event || typeof event !== "object") return [];
      if (event.type === "user-sent") {
        userSentCount += 1;
        return [];
      }
      if (event.type === "user-send" || event.type === "arm") armTurn();
      if (event.type === "start-click" || event.type === "user-send" || event.type === "arm") armAttempt();
      if (event.type === "start-click" || event.type === "end-click" || event.type === "user-send" || event.type === "arm") return [];

      if (mode === "chat") {
        if (event.type === "message") {
          var payload = event.payload || {};
          var role = payload.role || (payload.source === "ai" ? "agent" : payload.source === "user" ? "user" : "");
          if (role !== "agent") return [];
          var text = typeof payload.message === "string" ? payload.message.trim() : "";
          if (!text) return [];
          if (!payload.response_id && stopThisTurn) return [];
          return chatReply(payload.response_id || (payload.event_id != null ? "msg:" + payload.event_id : ""));
        }
        if (event.type === "part") {
          var part = event.part || {};
          if (part.type === "start") {
            armTurn();
            return [];
          }
          if (part.type !== "stop") return [];
          stopThisTurn = true;
          return chatReply(part.response_id || (part.event_id != null ? "part:" + part.event_id : ""));
        }
        if (event.type === "error") return noteError("chat-error", "/error", "chat-error");
        return [];
      }

      if (mode === "voice") {
        // A room id, onConnect, or status "connected" only means the transport
        // started. The provider can still reject the domain before the
        // assistant speaks. Count the connection when the assistant is live.
        if (event.type === "assistant-live") {
          if (connected) return [];
          connected = true;
          ended = false;
          errorOpen = false;
          return [{ kind: "voice-connected", path: "/connected", title: "voice-connected" }];
        }
        if (event.type === "connect" || event.type === "metadata" || (event.type === "status" && event.status === "connected")) return [];
        if (event.type === "disconnect" || (event.type === "status" && event.status === "disconnected")) {
          if (!connected || ended) return [];
          ended = true;
          connected = false;
          return [{ kind: "voice-ended", path: "/ended", title: "voice-ended" }];
        }
        if (event.type === "error" || event.type === "client-error") return noteError("voice-error", "/error", "voice-error");
        return [];
      }
      return [];
    }

    return { observe: observe };
  }

  function evidence() {
    if (!root.__crottaEvidence) {
      root.__crottaEvidence = {
        events: [],
        conversationId: "",
        replies: 0,
        lastReply: "",
        userTranscripts: [],
        assistantReplies: [],
        audioChunks: 0,
        audioBytes: 0,
        audioPeak: 0
      };
    }
    return root.__crottaEvidence;
  }

  function languageCode(value) {
    return value === "it" || value === "de" || value === "en" || value === "fr" ? value : "";
  }
  function activeLanguage() {
    return languageCode(root.__crottaLanguage) || "it";
  }
  function metricPath(path) {
    return path + "/" + activeLanguage();
  }
  function languageOverrides(textOnly) {
    var overrides = { agent: { language: activeLanguage() } };
    if (textOnly) overrides.conversation = { textOnly: true };
    return overrides;
  }
  function publish(record) {
    if (!record) return;
    var ev = evidence();
    var path = metricPath(record.path);
    ev.language = activeLanguage();
    ev.events.push({ kind: record.kind, path: path, title: record.title });
    if (root.bsTrack) root.bsTrack(path, record.title);
  }

  var sdkPromise = null;
  function loadSdk() {
    if (!sdkPromise) sdkPromise = import(SDK_URL);
    return sdkPromise;
  }

  function sessionStarter(expectText) {
    return function (options) {
      if (!options || options.origin) throw new Error("origin-override");
      assertAgent(options.agentId);
      if (expectText && options.textOnly !== true) throw new Error("chat-must-be-text");
      if (!expectText && options.textOnly === true) throw new Error("voice-must-not-be-text");
      if (!expectText && options.connectionType !== "websocket") throw new Error("voice-uses-websocket");
      var agentOverride = options.overrides && options.overrides.agent;
      if (!agentOverride || !languageCode(agentOverride.language)) throw new Error("language-required");
      if (agentOverride.firstMessage || agentOverride.first_message) throw new Error("first-message-override");
      return loadSdk().then(function (mod) {
        var Conversation = mod.Conversation || (mod.default && mod.default.Conversation);
        if (!Conversation || !Conversation.startSession) throw new Error("sdk-shape");
        return Conversation.startSession(options);
      });
    };
  }

  function bind(opts, mode) {
    var meter = opts.meter || createMeter(mode);
    var state = { status: "idle", mode: "", conversationId: "", errorText: "", notice: "", messages: [] };
    function push(records) {
      (records || []).forEach(function (record) {
        if (opts.onMetric) opts.onMetric(record);
      });
    }
    function emit() {
      if (opts.onState) opts.onState(state);
    }
    function remember(id) {
      if (id) state.conversationId = id;
      emit();
    }
    return { meter: meter, state: state, push: push, emit: emit, remember: remember };
  }

  function createChatController(opts) {
    var b = bind(opts, "chat");
    var session = null;
    var starting = null;
    var errorSent = false;
    var welcome = null;
    var settleWelcome = null;
    function armWelcome() {
      if (welcome) return welcome;
      welcome = new Promise(function (resolve) {
        var settled = false;
        settleWelcome = function () {
          if (settled) return;
          settled = true;
          resolve();
        };
        setTimeout(settleWelcome, 800);
      });
      return welcome;
    }
    function reportError(message) {
      b.state.status = "error";
      b.state.errorText = String(message || "errore");
      if (!errorSent) {
        errorSent = true;
        b.push(b.meter.observe({ type: "error" }));
      }
      b.emit();
    }

    function upsert(id, text) {
      var found = null;
      for (var i = 0; i < b.state.messages.length; i++) {
        if (b.state.messages[i].id === id) found = b.state.messages[i];
      }
      if (!found) b.state.messages.push({ role: "agent", text: text, id: id });
      else found.text = text;
      b.emit();
    }

    function handlers() {
      return {
        agentId: AGENT_ID,
        connectionType: "websocket",
        textOnly: true,
        overrides: languageOverrides(true),
        onConnect: function (props) {
          b.state.status = "connected";
          b.remember(props && props.conversationId);
        },
        onDisconnect: function () {
          session = null;
          if (b.state.status !== "error") b.state.status = "ended";
          b.emit();
        },
        onError: function (message) { reportError(message); },
        onStatusChange: function (next) {
          if (!next) return;
          if (next.status === "connecting") b.state.status = "connecting";
          if (next.status === "connected") b.state.status = "connected";
          b.emit();
        },
        onMessage: function (payload) {
          payload = payload || {};
          var role = payload.role || (payload.source === "ai" ? "agent" : "");
          if (role !== "agent") return;
          var id = payload.response_id || (payload.event_id != null ? "event:" + payload.event_id : "agent");
          upsert(id, payload.message || "");
          if (payload.message && String(payload.message).trim() && settleWelcome) settleWelcome();
          b.push(b.meter.observe({ type: "message", payload: payload }));
        },
        onAgentChatResponsePart: function (part) {
          part = part || {};
          var id = part.response_id || (part.event_id != null ? "event:" + part.event_id : "draft");
          if (part.type === "start") upsert(id, "");
          if (part.type === "delta") {
            var cur = "";
            for (var i = 0; i < b.state.messages.length; i++) if (b.state.messages[i].id === id) cur = b.state.messages[i].text;
            upsert(id, cur + (part.text || ""));
          }
          b.push(b.meter.observe({ type: "part", part: part }));
        }
      };
    }

    function ensure() {
      if (session) return Promise.resolve(session);
      if (starting) return starting;
      b.state.status = "connecting";
      b.state.errorText = "";
      errorSent = false;
      armWelcome();
      b.emit();
      var options = handlers();
      starting = Promise.resolve().then(function () {
        return opts.startSession(options);
      }).then(function (next) {
        session = next;
        starting = null;
        return next;
      }, function (err) {
        starting = null;
        session = null;
        reportError(err && err.message ? err.message : String(err));
        throw err;
      });
      return starting;
    }

    return {
      getState: function () { return b.state; },
      send: function (text) {
        var clean = String(text || "").replace(/\s+/g, " ").trim();
        b.meter.observe({ type: "user-send" });
        if (!clean) return Promise.resolve({ sent: false });
        if (clean.length > 500) {
          b.state.notice = "Messaggio troppo lungo. Lo accorci, senza dati personali.";
          b.emit();
          return Promise.resolve({ sent: false });
        }
        b.state.notice = "";
        b.state.messages.push({ role: "user", text: clean, id: "local-" + b.state.messages.length });
        b.emit();
        return ensure().then(function (current) {
          return welcome.then(function () {
            if (current && current.sendUserMessage) current.sendUserMessage(clean);
            b.meter.observe({ type: "user-sent" });
            return { sent: true };
          });
        }, function () {
          return { sent: false, error: true };
        });
      },
      activity: function () {
        if (session && session.sendUserActivity) session.sendUserActivity();
      },
      end: function () {
        b.meter.observe({ type: "end-click" });
        if (session && session.endSession) return Promise.resolve(session.endSession());
        return Promise.resolve();
      }
    };
  }

  function createVoiceController(opts) {
    var b = bind(opts, "voice");
    var session = null;
    var starting = null;
    var errorSent = false;
    function reportError(message) {
      b.state.status = "error";
      b.state.errorText = String(message || "errore");
      if (!errorSent) {
        errorSent = true;
        b.push(b.meter.observe({ type: "error" }));
      }
      b.emit();
    }

    function show(payload) {
      payload = payload || {};
      var role = payload.role || (payload.source === "ai" ? "agent" : payload.source === "user" ? "user" : "");
      if (role !== "agent" && role !== "user") return;
      var id = (role === "agent" ? "a:" : "u:") + (payload.event_id != null ? payload.event_id : b.state.messages.length);
      var found = null;
      for (var i = 0; i < b.state.messages.length; i++) if (b.state.messages[i].id === id) found = b.state.messages[i];
      if (!found) b.state.messages.push({ role: role, text: payload.message || "", id: id });
      else found.text = payload.message || found.text;
      b.emit();
    }

    function options() {
      return {
        agentId: AGENT_ID,
        // Documented public voice transport. WebRTC fetches a LiveKit token and
        // was rejected for this origin; the WebSocket carries mic audio both ways
        // and uses the same browser Origin as the working text session.
        // options.origin is the API host, not a page Origin, and is left unset.
        connectionType: "websocket",
        overrides: languageOverrides(false),
        onConnect: function (props) {
          b.state.status = "connected";
          b.remember(props && props.conversationId);
        },
        onConversationMetadata: function (meta) {
          var id = meta && (meta.conversation_id || meta.conversationId) || "";
          if (id) b.remember(id);
        },
        onDisconnect: function (details) {
          session = null;
          var assistant = b.state.mode === "speaking" || b.state.messages.some(function (message) {
            return message.role === "agent" && message.text;
          });
          var failed = !assistant || (details && details.reason === "error");
          if (failed) {
            var why = details && (details.message || (details.context && details.context.reason)) || "sessione chiusa prima della risposta";
            reportError(why);
          }
          if (assistant) {
            b.push(b.meter.observe({ type: "disconnect" }));
            if (b.state.status !== "error") b.state.status = "ended";
          }
          b.emit();
        },
        onError: function (message) { reportError(message); },
        onStatusChange: function (next) {
          if (!next) return;
          if (next.status === "connecting") b.state.status = "connecting";
          if (next.status === "connected") b.state.status = "connected";
          b.emit();
        },
        onModeChange: function (next) {
          b.state.mode = next && next.mode || "";
          if (b.state.mode === "speaking") b.push(b.meter.observe({ type: "assistant-live" }));
          b.emit();
        },
        onAudio: function (base64) {
          var ev = evidence();
          ev.audioChunks += 1;
          if (typeof base64 === "string" && base64 && typeof atob === "function") {
            try {
              var raw = atob(base64);
              ev.audioBytes += raw.length;
              var peak = ev.audioPeak || 0;
              var step = Math.max(2, (Math.floor(raw.length / 200) || 1) * 2);
              for (var i = 0; i + 1 < raw.length; i += step) {
                var sample = raw.charCodeAt(i) | (raw.charCodeAt(i + 1) << 8);
                if (sample > 32767) sample -= 65536;
                var abs = sample < 0 ? -sample : sample;
                if (abs > peak) peak = abs;
              }
              ev.audioPeak = peak;
            } catch (e) { /* ignore a chunk that is not base64 */ }
          }
          b.push(b.meter.observe({ type: "assistant-live" }));
        },
        onMessage: function (payload) {
          show(payload);
          payload = payload || {};
          var role = payload.role || (payload.source === "ai" ? "agent" : "");
          if (role === "agent" && payload.message && String(payload.message).trim()) {
            b.push(b.meter.observe({ type: "assistant-live" }));
          }
        }
      };
    }

    return {
      getState: function () { return b.state; },
      start: function () {
        if (session || starting) return Promise.resolve({ started: true });
        b.meter.observe({ type: "start-click" });
        b.state.status = "connecting";
        b.state.errorText = "";
        errorSent = false;
        b.emit();
        var voiceOptions = options();
        starting = Promise.resolve().then(function () {
          return opts.startSession(voiceOptions);
        }).then(function (next) {
          session = next;
          starting = null;
          return { started: true };
        }, function (err) {
          starting = null;
          session = null;
          reportError(err && err.message ? err.message : String(err));
          return { started: false, error: true };
        });
        return starting;
      },
      end: function () {
        b.meter.observe({ type: "end-click" });
        if (session && session.endSession) return Promise.resolve(session.endSession());
        return Promise.resolve();
      }
    };
  }

  var COPY = {
    it: {
      chatH1: "Chat dimostrativa per Garage Nedy Crotta",
      voiceH1: "Voce dimostrativa per Garage Nedy Crotta",
      disclaimer: "Demo non ufficiale realizzata da BOLLA STUDIO; nessuna prenotazione o richiesta viene inviata al garage.",
      privacy: "Demo non ufficiale BOLLA STUDIO. Non inserire dati personali. La conversazione è elaborata da ElevenLabs; la registrazione audio è disattivata. I dati tecnici possono essere trasmessi ai servizi collegati di BOLLA STUDIO.",
      detail: "Su questo agente ElevenLabs ha l'impostazione di conservazione di 1 giorno e la registrazione audio disattivata. È un'impostazione del fornitore, non una cancellazione globale dopo un giorno: l'esportazione di archivio del workspace può ancora includere la trascrizione e un webhook può inviare riepilogo e metadati.",
      address: "Indirizzo usato qui: Via al Campanile 1, Lugano. Il sito scrive anche 6900; una verifica su mappa indica 6962 per la stessa via. Questa pagina non sceglie un CAP e non mostra una posizione su mappa.",
      langNote: "Il sito del garage è solo in italiano. Questa demo può rispondere in italiano, tedesco, inglese e francese, le lingue pubblicate dall'ente turistico Lugano Region. Non significa che il personale o la clientela del garage le parlino.",
      langLock: "Per cambiare lingua, chiuda prima la sessione. La lingua nuova vale dalla sessione successiva.",
      originChat: "L'assistente risponde solo se la pagina è aperta su https://demo.bollastudio.com. Un altro indirizzo viene rifiutato dal fornitore. Inviare un messaggio non è, da solo, una risposta.",
      originVoice: "L'assistente vocale risponde solo se la pagina è aperta su https://demo.bollastudio.com. Fonti: garagecrotta.ch (home, chi siamo, officina, concessionario, contatti).",
      chatTitle: "Conversazione libera, solo testo",
      voiceTitle: "Conversazione vocale, nei due sensi",
      voiceHow: "Premere «Inizia» non significa che la linea sia connessa. Lo stato passa a «Connesso» solo quando il fornitore apre la sessione. Serve il microfono del browser. Non c'è un audio preregistrato.",
      placeholder: "Senza nome, telefono o email",
      send: "Invia",
      endChat: "Chiudi la conversazione",
      start: "Inizia",
      endVoice: "Termina",
      factsTitle: "Dal sito pubblico, 8 novembre 2026",
      hoursLabel: "Orari",
      hours: "Lun–ven 07:30–12:00 e 13:30–18:00. Sabato 09:00–12:00. Domenica chiuso.",
      brandsLabel: "Marchi",
      brands: "Banner «rivenditore ufficiale»: Vespa, Moto Guzzi, Aprilia. Specializzazione sul gruppo Piaggio. Le altre marche del footer non sono trattate qui come concessionari ufficiali.",
      shopLabel: "Officina",
      shop: "Riparazioni e servizi auto e moto, cambio gomme, collaudi, preparazioni per pista, customizzazione, importazione, compravendita. Partner citati: Pirelli, Michelin, Continental, ELF, Brembo.",
      contactLabel: "Contatti pubblicati",
      contact: "Servizi 091 972 18 28. Email garage.crotta@bluewin.ch. Questa pagina non chiama e non scrive.",
      testRide: "Il sito ha un modulo per il giro di prova gratuito e per un preventivo. Qui la richiesta resta nel testo e non viene inoltrata: la conferma è del garage.",
      sources: "Fonti: garagecrotta.ch (home, chi siamo, officina, concessionario, contatti). La pagina /garage-crotta-lugano/ resta un esempio con risposte preparate, non è questa chat.",
      asks: [
        ["Orari di apertura", "Quali sono gli orari di apertura?"],
        ["Marchi ufficiali", "Quali marchi hanno il banner di rivenditore ufficiale?"],
        ["Tagliando, senza dati", "Vorrei informazioni su un tagliando, senza lasciare dati personali."],
        ["Giro di prova, senza invio", "Come si chiede un giro di prova gratuito, sapendo che da qui non parte nessuna richiesta?"]
      ],
      hints: [
        "Gli orari di apertura.",
        "Una richiesta di tagliando, senza nome né telefono.",
        "Un giro di prova gratuito: la conferma resta al garage, da qui non parte nulla.",
        "Quali marchi hanno il banner di rivenditore ufficiale."
      ],
      status: { idle: "Non connesso", connecting: "Connessione in corso", connected: "Connesso", ended: "Conversazione chiusa", error: "Errore di sessione" },
      speaking: "l'assistente sta parlando",
      listening: "in ascolto"
    },
    de: {
      chatH1: "Demo-Chat für Garage Nedy Crotta",
      voiceH1: "Demo-Stimme für Garage Nedy Crotta",
      disclaimer: "Inoffizielle Demo von BOLLA STUDIO; es wird keine Buchung und keine Anfrage an die Werkstatt gesendet.",
      privacy: "Inoffizielle BOLLA STUDIO Demo. Keine persönlichen Daten eingeben. Das Gespräch wird von ElevenLabs verarbeitet; die Audioaufnahme ist deaktiviert. Technische Daten können an die verbundenen Dienste von BOLLA STUDIO übermittelt werden.",
      detail: "Bei diesem Agenten hat ElevenLabs eine Aufbewahrung von 1 Tag eingestellt und die Audioaufnahme deaktiviert. Das ist eine Einstellung des Anbieters, keine globale Löschung nach einem Tag: der Workspace-Export kann die Abschrift weiter enthalten, und ein Webhook kann Zusammenfassung und Metadaten senden.",
      address: "Adresse hier: Via al Campanile 1, Lugano. Die Website schreibt auch 6900; eine Kartenprüfung zeigt 6962 für dieselbe Straße. Diese Seite wählt keine Postleitzahl und zeigt keine Karte.",
      langNote: "Die Website der Werkstatt ist nur auf Italienisch. Diese Demo kann auf Italienisch, Deutsch, Englisch und Französisch antworten, den Sprachen der Website von Lugano Region. Das heißt nicht, dass das Personal oder die Kundschaft der Werkstatt diese Sprachen spricht.",
      langLock: "Beenden Sie zuerst die Sitzung, um die Sprache zu wechseln. Die neue Sprache gilt ab der nächsten Sitzung.",
      originChat: "Der Assistent antwortet nur, wenn die Seite auf https://demo.bollastudio.com geöffnet ist. Eine andere Adresse lehnt der Anbieter ab. Eine Nachricht zu senden ist allein noch keine Antwort.",
      originVoice: "Der Sprachassistent antwortet nur, wenn die Seite auf https://demo.bollastudio.com geöffnet ist. Quellen: garagecrotta.ch.",
      chatTitle: "Freies Gespräch, nur Text",
      voiceTitle: "Gespräch in beide Richtungen",
      voiceHow: "«Start» bedeutet nicht, dass die Leitung verbunden ist. «Verbunden» erscheint erst, wenn der Anbieter die Sitzung öffnet. Das Mikrofon des Browsers wird gebraucht. Es gibt keine fertige Aufnahme.",
      placeholder: "Ohne Name, Telefon oder E-Mail",
      send: "Senden",
      endChat: "Gespräch schließen",
      start: "Start",
      endVoice: "Beenden",
      factsTitle: "Von der öffentlichen Website, 8. November 2026",
      hoursLabel: "Öffnungszeiten",
      hours: "Mo–Fr 07:30–12:00 und 13:30–18:00. Samstag 09:00–12:00. Sonntag geschlossen.",
      brandsLabel: "Marken",
      brands: "Banner «offizieller Händler»: Vespa, Moto Guzzi, Aprilia. Spezialisierung auf die Piaggio-Gruppe. Die übrigen Marken in der Fußzeile gelten hier nicht als offizielle Händler.",
      shopLabel: "Werkstatt",
      shop: "Reparatur und Service für Auto und Motorrad, Reifen, Prüfungen, Streckenvorbereitung, Umbau, Import, An- und Verkauf. Genannte Partner: Pirelli, Michelin, Continental, ELF, Brembo.",
      contactLabel: "Veröffentlichte Kontakte",
      contact: "Service 091 972 18 28. E-Mail garage.crotta@bluewin.ch. Diese Seite ruft nicht an und schreibt nicht.",
      testRide: "Die Website hat ein Formular für eine kostenlose Probefahrt und ein Angebot. Hier bleibt die Anfrage im Text und wird nicht weitergeleitet: die Bestätigung liegt bei der Werkstatt.",
      sources: "Quellen: garagecrotta.ch. Die Seite /garage-crotta-lugano/ bleibt ein Beispiel mit vorbereiteten Antworten.",
      asks: [
        ["Öffnungszeiten", "Welche sind die Öffnungszeiten?"],
        ["Offizielle Marken", "Welche Marken haben das Banner des offiziellen Händlers?"],
        ["Service, ohne Daten", "Ich hätte gerne Auskunft zu einem Service, ohne persönliche Daten zu nennen."],
        ["Probefahrt, ohne Versand", "Wie fragt man eine kostenlose Probefahrt an, wenn von hier nichts gesendet wird?"]
      ],
      hints: [
        "Die Öffnungszeiten.",
        "Eine Serviceanfrage, ohne Name und Telefon.",
        "Eine kostenlose Probefahrt: die Bestätigung bleibt bei der Werkstatt.",
        "Welche Marken das Banner des offiziellen Händlers haben."
      ],
      status: { idle: "Nicht verbunden", connecting: "Verbindung wird aufgebaut", connected: "Verbunden", ended: "Gespräch geschlossen", error: "Sitzungsfehler" },
      speaking: "der Assistent spricht",
      listening: "hört zu"
    },
    en: {
      chatH1: "Demo chat for Garage Nedy Crotta",
      voiceH1: "Demo voice for Garage Nedy Crotta",
      disclaimer: "Unofficial demo by BOLLA STUDIO; no booking or request is sent to the garage.",
      privacy: "Unofficial BOLLA STUDIO demo. Do not enter personal data. The conversation is processed by ElevenLabs; audio recording is off. Technical data may be sent to BOLLA STUDIO's linked services.",
      detail: "On this agent ElevenLabs has a 1-day retention setting and audio recording turned off. That is a provider setting, not a global deletion after one day: the workspace export can still include the transcript, and a webhook can send a summary and metadata.",
      address: "Address used here: Via al Campanile 1, Lugano. The website also writes 6900; a map check shows 6962 for the same street. This page does not choose a postcode and does not show a map.",
      langNote: "The garage website is in Italian only. This demo can answer in Italian, German, English and French, the languages published by the Lugano Region tourism office. That does not mean the garage staff or its customers speak them.",
      langLock: "End the session before changing language. The new language applies to the next session.",
      originChat: "The assistant answers only when the page is opened on https://demo.bollastudio.com. Another address is rejected by the provider. Sending a message is not, by itself, a reply.",
      originVoice: "The voice assistant answers only when the page is opened on https://demo.bollastudio.com. Sources: garagecrotta.ch.",
      chatTitle: "Free conversation, text only",
      voiceTitle: "Two-way voice conversation",
      voiceHow: "Pressing Start does not mean the line is connected. Connected appears only when the provider opens the session. The browser microphone is required. There is no prerecorded clip.",
      placeholder: "No name, phone or email",
      send: "Send",
      endChat: "Close the conversation",
      start: "Start",
      endVoice: "End",
      factsTitle: "From the public website, 8 November 2026",
      hoursLabel: "Hours",
      hours: "Mon–Fri 07:30–12:00 and 13:30–18:00. Saturday 09:00–12:00. Sunday closed.",
      brandsLabel: "Brands",
      brands: "Official-dealer banners: Vespa, Moto Guzzi, Aprilia. Piaggio-group specialization. The other brands in the footer are not treated here as official dealers.",
      shopLabel: "Workshop",
      shop: "Car and motorcycle repair and service, tyres, inspections, track preparation, custom work, import, buying and selling. Named partners: Pirelli, Michelin, Continental, ELF, Brembo.",
      contactLabel: "Published contacts",
      contact: "Service 091 972 18 28. Email garage.crotta@bluewin.ch. This page does not call or write.",
      testRide: "The website has a form for a free test ride and a quote. Here the request stays in the text and is not forwarded: confirmation belongs to the garage.",
      sources: "Sources: garagecrotta.ch. The page /garage-crotta-lugano/ remains an example with prepared replies.",
      asks: [
        ["Opening hours", "What are the opening hours?"],
        ["Official brands", "Which brands have the official dealer banner?"],
        ["Service, no personal data", "I would like information about a service, without giving personal data."],
        ["Test ride, nothing sent", "How do I ask for a free test ride, knowing that nothing is sent from here?"]
      ],
      hints: [
        "The opening hours.",
        "A service request, with no name or phone.",
        "A free test ride: confirmation stays with the garage.",
        "Which brands have the official dealer banner."
      ],
      status: { idle: "Not connected", connecting: "Connecting", connected: "Connected", ended: "Conversation closed", error: "Session error" },
      speaking: "the assistant is speaking",
      listening: "listening"
    },
    fr: {
      chatH1: "Discussion de démo pour Garage Nedy Crotta",
      voiceH1: "Voix de démo pour Garage Nedy Crotta",
      disclaimer: "Démo non officielle réalisée par BOLLA STUDIO ; aucune réservation ni demande n'est envoyée au garage.",
      privacy: "Démo non officielle BOLLA STUDIO. N'indiquez pas de données personnelles. La conversation est traitée par ElevenLabs ; l'enregistrement audio est désactivé. Des données techniques peuvent être transmises aux services liés de BOLLA STUDIO.",
      detail: "Sur cet agent, ElevenLabs a un réglage de conservation d'un jour et l'enregistrement audio est désactivé. C'est un réglage du fournisseur, pas un effacement global après un jour : l'export de l'espace peut encore inclure la transcription, et un webhook peut envoyer un résumé et des métadonnées.",
      address: "Adresse utilisée ici : Via al Campanile 1, Lugano. Le site écrit aussi 6900 ; une vérification sur carte indique 6962 pour la même rue. Cette page ne choisit pas de code postal et n'affiche pas de carte.",
      langNote: "Le site du garage est uniquement en italien. Cette démo peut répondre en italien, allemand, anglais et français, les langues publiées par l'office du tourisme Lugano Region. Cela ne signifie pas que le personnel ou la clientèle du garage les parlent.",
      langLock: "Terminez d'abord la session pour changer de langue. La nouvelle langue vaut pour la session suivante.",
      originChat: "L'assistant répond seulement si la page est ouverte sur https://demo.bollastudio.com. Une autre adresse est refusée par le fournisseur. Envoyer un message n'est pas, à lui seul, une réponse.",
      originVoice: "L'assistant vocal répond seulement si la page est ouverte sur https://demo.bollastudio.com. Sources : garagecrotta.ch.",
      chatTitle: "Conversation libre, texte seulement",
      voiceTitle: "Conversation vocale dans les deux sens",
      voiceHow: "Appuyer sur « Commencer » ne signifie pas que la ligne est connectée. « Connecté » n'apparaît que lorsque le fournisseur ouvre la session. Le micro du navigateur est nécessaire. Il n'y a pas d'audio préenregistré.",
      placeholder: "Sans nom, téléphone ni e-mail",
      send: "Envoyer",
      endChat: "Fermer la conversation",
      start: "Commencer",
      endVoice: "Terminer",
      factsTitle: "D'après le site public, 8 novembre 2026",
      hoursLabel: "Horaires",
      hours: "Lun–ven 07:30–12:00 et 13:30–18:00. Samedi 09:00–12:00. Dimanche fermé.",
      brandsLabel: "Marques",
      brands: "Bandeaux « revendeur officiel » : Vespa, Moto Guzzi, Aprilia. Spécialisation groupe Piaggio. Les autres marques du pied de page ne sont pas traitées ici comme des concessions officielles.",
      shopLabel: "Atelier",
      shop: "Réparation et services auto et moto, pneus, contrôles, préparation piste, personnalisation, importation, achat et vente. Partenaires cités : Pirelli, Michelin, Continental, ELF, Brembo.",
      contactLabel: "Contacts publiés",
      contact: "Services 091 972 18 28. E-mail garage.crotta@bluewin.ch. Cette page n'appelle pas et n'écrit pas.",
      testRide: "Le site a un formulaire pour un essai gratuit et un devis. Ici la demande reste dans le texte et n'est pas envoyée : la confirmation appartient au garage.",
      sources: "Sources : garagecrotta.ch. La page /garage-crotta-lugano/ reste un exemple avec des réponses préparées.",
      asks: [
        ["Horaires", "Quels sont les horaires d'ouverture ?"],
        ["Marques officielles", "Quelles marques ont le bandeau de revendeur officiel ?"],
        ["Entretien, sans données", "Je voudrais des informations sur un entretien, sans donner de données personnelles."],
        ["Essai, sans envoi", "Comment demander un essai gratuit, sachant que rien n'est envoyé d'ici ?"]
      ],
      hints: [
        "Les horaires d'ouverture.",
        "Une demande d'entretien, sans nom ni téléphone.",
        "Un essai gratuit : la confirmation reste au garage.",
        "Quelles marques ont le bandeau de revendeur officiel."
      ],
      status: { idle: "Non connecté", connecting: "Connexion en cours", connected: "Connecté", ended: "Conversation fermée", error: "Erreur de session" },
      speaking: "l'assistant parle",
      listening: "à l'écoute"
    }
  };

  function setLanguage(code) {
    if (!languageCode(code)) return false;
    if (root.__crottaStatus === "connecting" || root.__crottaStatus === "connected") return false;
    root.__crottaLanguage = code;
    if (typeof document !== "undefined" && document.documentElement) applyCopy(document, code);
    return true;
  }

  function applyCopy(doc, code) {
    var text = COPY[languageCode(code) || "it"];
    if (!text || !doc) return;
    var voice = !!(doc.getElementById && doc.getElementById("crotta-voice"));
    if (doc.documentElement) doc.documentElement.lang = languageCode(code) || "it";
    function put(key, value) {
      if (!doc.querySelectorAll || value == null) return;
      doc.querySelectorAll('[data-i18n="' + key + '"]').forEach(function (el) { el.textContent = value; });
    }
    put("h1", voice ? text.voiceH1 : text.chatH1);
    put("disclaimer", text.disclaimer);
    put("privacy", text.privacy);
    var micLive = {
      it: "Il microfono si usa solo dal vivo, durante questa conversazione.",
      de: "Das Mikrofon wird nur live während dieses Gesprächs verwendet.",
      en: "The microphone is used only live, during this conversation.",
      fr: "Le micro est utilisé seulement en direct, pendant cette conversation."
    };
    put("detail", text.detail + (voice ? " " + micLive[languageCode(code) || "it"] : ""));
    put("address", text.address);
    put("langNote", text.langNote);
    put("origin", voice ? text.originVoice : text.originChat);
    put("panelTitle", voice ? text.voiceTitle : text.chatTitle);
    put("voiceHow", text.voiceHow);
    put("factsTitle", text.factsTitle);
    put("hoursLabel", text.hoursLabel);
    put("hours", text.hours);
    put("brandsLabel", text.brandsLabel);
    put("brands", text.brands);
    put("shopLabel", text.shopLabel);
    put("shop", text.shop);
    put("contactLabel", text.contactLabel);
    put("contact", text.contact);
    put("testRide", text.testRide);
    put("sources", text.sources);
    var input = doc.getElementById && doc.getElementById("chat-input");
    if (input) input.placeholder = text.placeholder;
    var send = doc.getElementById && doc.getElementById("chat-send");
    if (send) send.textContent = text.send;
    var endChat = doc.getElementById && doc.getElementById("chat-end");
    if (endChat) endChat.textContent = text.endChat;
    var start = doc.getElementById && doc.getElementById("voice-start");
    if (start) start.textContent = text.start;
    var endVoice = doc.getElementById && doc.getElementById("voice-end");
    if (endVoice) endVoice.textContent = text.endVoice;
    if (doc.querySelectorAll) {
      var asks = doc.querySelectorAll("[data-ask]");
      for (var i = 0; i < asks.length && i < text.asks.length; i++) {
        asks[i].textContent = text.asks[i][0];
        asks[i].setAttribute("data-ask", text.asks[i][1]);
      }
      var hints = doc.getElementById && doc.getElementById("voice-hints");
      if (hints) {
        hints.replaceChildren();
        text.hints.forEach(function (line) {
          var li = doc.createElement("li");
          li.textContent = line;
          hints.appendChild(li);
        });
      }
      doc.querySelectorAll("[data-lang]").forEach(function (button) {
        var on = button.getAttribute("data-lang") === (languageCode(code) || "it");
        button.classList.toggle("on", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }

  function render(doc, prefix, state) {
    var status = doc.getElementById(prefix + "-status");
    var log = doc.getElementById(prefix + "-log");
    var ref = doc.getElementById(prefix + "-session");
    var notice = doc.getElementById(prefix + "-notice");
    var labels = (COPY[activeLanguage()] || COPY.it).status;
    if (status) {
      var line = labels[state.status] || state.status;
      if (state.mode === "speaking") line += " · " + (COPY[activeLanguage()] || COPY.it).speaking;
      if (state.mode === "listening" && state.status === "connected") line += " · " + (COPY[activeLanguage()] || COPY.it).listening;
      if (state.errorText) line += " · " + state.errorText.slice(0, 180);
      status.textContent = line;
      status.setAttribute("data-runtime", state.status);
    }
    if (notice) notice.textContent = state.notice || "";
    if (ref) ref.textContent = state.conversationId ? "Riferimento tecnico: " + state.conversationId : "";
    if (log) {
      log.replaceChildren();
      state.messages.forEach(function (message) {
        if (message.role === "agent" && !message.text) return;
        var p = doc.createElement("p");
        p.className = "bubble " + (message.role === "user" ? "user" : "agent");
        p.textContent = message.text;
        log.appendChild(p);
      });
      log.scrollTop = log.scrollHeight;
    }
    root.__crottaStatus = state.status;
    var ev = evidence();
    ev.language = activeLanguage();
    if (state.conversationId) ev.conversationId = state.conversationId;
    var replies = state.messages.filter(function (message) { return message.role === "agent" && message.text; });
    ev.replies = replies.length;
    ev.lastReply = replies.length ? replies[replies.length - 1].text : ev.lastReply;
    ev.userTranscripts = state.messages.filter(function (message) { return message.role === "user" && message.text; }).map(function (message) { return message.text; });
    ev.assistantReplies = replies.map(function (message) { return message.text; });
  }

  function mountChat(doc) {
    var controller = createChatController({
      startSession: sessionStarter(true),
      onMetric: publish,
      onState: function (state) { render(doc, "chat", state); }
    });
    var input = doc.getElementById("chat-input");
    var send = doc.getElementById("chat-send");
    function go() {
      controller.send(input.value).then(function (result) {
        if (result && result.sent) input.value = "";
      });
    }
    send.addEventListener("click", go);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        go();
      }
    });
    input.addEventListener("input", function () { controller.activity(); });
    doc.querySelectorAll("[data-ask]").forEach(function (button) {
      button.addEventListener("click", function () { controller.send(button.getAttribute("data-ask")); });
    });
    var end = doc.getElementById("chat-end");
    if (end) end.addEventListener("click", function () { controller.end(); });
    render(doc, "chat", controller.getState());
  }

  function mountVoice(doc) {
    var controller = createVoiceController({
      startSession: sessionStarter(false),
      onMetric: publish,
      onState: function (state) { render(doc, "voice", state); }
    });
    doc.getElementById("voice-start").addEventListener("click", function () { controller.start(); });
    doc.getElementById("voice-end").addEventListener("click", function () { controller.end(); });
    render(doc, "voice", controller.getState());
  }

  function boot() {
    if (typeof document === "undefined" || !document.getElementById) return;
    if (document.querySelectorAll && typeof location !== "undefined") {
      document.querySelectorAll("[data-keep-query]").forEach(function (link) {
        link.setAttribute("href", link.getAttribute("href") + (location.search || ""));
      });
    }
    if (!languageCode(root.__crottaLanguage)) root.__crottaLanguage = "it";
    applyCopy(document, activeLanguage());
    if (document.querySelectorAll) {
      document.querySelectorAll("[data-lang]").forEach(function (button) {
        button.addEventListener("click", function () {
          var ok = setLanguage(button.getAttribute("data-lang"));
          var lock = document.getElementById("lang-lock");
          if (lock) lock.textContent = ok ? "" : COPY[activeLanguage()].langLock;
        });
      });
    }
    if (document.getElementById("crotta-chat")) mountChat(document);
    if (document.getElementById("crotta-voice")) mountVoice(document);
  }

  root.CrottaRuntime = {
    AGENT_ID: AGENT_ID,
    SDK_URL: SDK_URL,
    assertAgent: assertAgent,
    createMeter: createMeter,
    createChatController: createChatController,
    createVoiceController: createVoiceController,
    setLanguage: setLanguage,
    languageCode: languageCode,
    activeLanguage: activeLanguage,
    metricPath: metricPath,
    COPY: COPY
  };
  boot();
})(typeof window !== "undefined" ? window : globalThis);
