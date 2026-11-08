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

  function publish(record) {
    if (!record) return;
    var ev = evidence();
    ev.events.push({ kind: record.kind, path: record.path, title: record.title });
    if (root.bsTrack) root.bsTrack(record.path, record.title);
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

  function render(doc, prefix, state) {
    var status = doc.getElementById(prefix + "-status");
    var log = doc.getElementById(prefix + "-log");
    var ref = doc.getElementById(prefix + "-session");
    var notice = doc.getElementById(prefix + "-notice");
    var labels = {
      idle: "Non connesso",
      connecting: "Connessione in corso",
      connected: "Connesso",
      ended: "Conversazione chiusa",
      error: "Errore di sessione"
    };
    if (status) {
      var line = labels[state.status] || state.status;
      if (state.mode === "speaking") line += " · l'assistente sta parlando";
      if (state.mode === "listening" && state.status === "connected") line += " · in ascolto";
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
    var ev = evidence();
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
    if (document.getElementById("crotta-chat")) mountChat(document);
    if (document.getElementById("crotta-voice")) mountVoice(document);
  }

  root.CrottaRuntime = {
    AGENT_ID: AGENT_ID,
    SDK_URL: SDK_URL,
    assertAgent: assertAgent,
    createMeter: createMeter,
    createChatController: createChatController,
    createVoiceController: createVoiceController
  };
  boot();
})(typeof window !== "undefined" ? window : globalThis);
