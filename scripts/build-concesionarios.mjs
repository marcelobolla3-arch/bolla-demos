/**
 * Writes the four static car-dealership example pages.
 * The visit path stays /<p>/video-<lang>. Chat events use a fixed category name.
 * The prospect redirect committed here is only hash -> sector path.
 * A gitignored MAPPING.md (slug, then the path) can rebuild that table. Its names are never written into the repo.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROSPECT_DEST = {"1a4116d708f47e62":"/ferienwohnung-ch/fr/","d26d1440d5da6449":"/immobilien-ch/de/","887545aa99f01ce6":"/paragliding-ch/de/","fcad07227666865f":"/hotel-ch/de/","2cf3a89023bfc2b5":"/ferienwohnung-ch/de/","0610b747f7a6aae4":"/ferienwohnung-ch/fr/","16edf1d82a37bd29":"/hotel-ch/de/","10f2233647466f84":"/ferienwohnung-ch/de/","b916410e7820c480":"/skiverleih-ch/de/","21e73994f5def343":"/immobilien-ch/de/","2a535c62261e24c7":"/immobilien-ch/fr/","c5910d9f8c10d011":"/schifffahrt-ch/de/","3152e617c2429d9c":"/velomiete-ch/de/","b383241df7bd20f1":"/ferienwohnung-ch/de/","988a78e70052333d":"/physio-ch/de/","08427c8c4fe24cf4":"/optiker-ch/de/","0e05b26f964feb37":"/hotel-ch/de/","37125f5b84753354":"/ferienwohnung-ch/de/","2f8695f662b678e5":"/skiverleih-ch/de/","c08d66cc4b849d78":"/coiffeur-ch/de/","2e0ec12fdb1b0577":"/physio-ch/de/","0536e47e929df1b2":"/fitness-ch/de/","ea4a9e7e51b70c6e":"/bergbahn-ch/de/","5545d17a893e80a8":"/fahrschule-ch/de/","644b5b8ea51b2e72":"/fahrschule-ch/de/","f5a6af06f5ce865b":"/fahrschule-ch/de/","e41745cd8d31408d":"/ferienwohnung-ch/de/","9223f0e881c05e81":"/skiverleih-ch/fr/","25bd2bae288f66a9":"/skiverleih-ch/de/","b4d5ea049e3f4b7c":"/hotel-ch/de/","5f2600d37729f7e2":"/ferienwohnung-ch/de/","fa28e3e60759e29c":"/ausfluege-ch/fr/","4ca385f3a45ec5ad":"/paragliding-ch/fr/","19184d5c8765adb9":"/velomiete-ch/de/","b443379c9d167e8f":"/umzug-ch/de/","61c9256fcdca75c1":"/hotel-ch/de/","6e42b6389fc5138a":"/hotel-ch/de/","5787e027dd94cd80":"/hotel-ch/de/","29c89092dbad00f0":"/hotel-ch/de/","d0f92b49f07c2a93":"/hotel-ch/de/","ec6bb44b8e3006fa":"/hotel-ch/fr/","68576aa3546524d9":"/hotel-ch/de/","b9cb343966234036":"/hotel-ch/de/","85c01d02e481f7d5":"/hotel-ch/fr/","63196b7c77cc3452":"/hotel-ch/de/","4e815cf04dd6b6f5":"/hotel-ch/fr/","ec3017616f2ac3f4":"/hotel-ch/de/","7b5c0b0865b0d2a8":"/hotel-ch/de/","507867147000695b":"/hotel-ch/de/","3706abae274769b9":"/hotel-ch/de/","faae2bba5108bf54":"/hotel-ch/de/","c972445bb5366a12":"/hotel-ch/de/","2c3dca7750859214":"/skiverleih-ch/fr/","0ffbc3653d34e773":"/tierarzt-ch/de/","b0b9e2bf925bc4e9":"/tierarzt-ch/de/","4b9d9b9863318f36":"/aesthetik-ch/de/","53cfa4ef117b5655":"/bergbahn-ch/de/","8a9af6c52d4e706e":"/immobilien-ch/de/","1c0c4c85041a54e8":"/hotel-ch/fr/","c7f398784bab1c43":"/coiffeur-ch/fr/","3135e301d084d3e2":"/velomiete-ch/fr/","7103b4d23157e603":"/coiffeur-ch/de/","4445fbb4c938c2a5":"/immobilien-ch/de/","3fd63b226fb973bc":"/skiverleih-ch/fr/","80430ee27587caa4":"/skiverleih-ch/de/","84f05a2f67e6332c":"/fitness-ch/de/","2ecc1c27effa9c6e":"/musikschule-ch/de/","e15bd02cf0db0397":"/coiffeur-ch/de/","292c86b16a632790":"/canyoning-ch/de/","eb0dc2bff9f10df8":"/hotel-ch/de/","0b73316865caef13":"/paragliding-ch/de/","cb3da5fccad6e1e8":"/hotel-ch/de/","30dfb5f2fe2a38af":"/physio-ch/de/","cfb63bb2fc89fa87":"/skiverleih-ch/de/","0ed9defceb9d8347":"/skischule-ch/de/","3f2a2188c0ab59ec":"/velomiete-ch/fr/","956af4b6de58132b":"/bergbahn-ch/de/","1ac561b5f7e70edc":"/velomiete-ch/de/","16e48e83c8c7ff24":"/skiverleih-ch/de/","ce989eca6753bcda":"/ferienwohnung-ch/de/","58cb663235a9c406":"/bergbahn-ch/de/","89b57ed9f4d4d44d":"/ferienwohnung-ch/fr/","6f029266fdde4cfb":"/ferienwohnung-ch/de/","b5c6ba6cda9af18e":"/paragliding-ch/de/","fa8d639d2729d225":"/ferienwohnung-ch/de/","4ab23e9bb029674e":"/skiverleih-ch/de/","be5f6443abb74bee":"/ferienwohnung-ch/fr/","bd841ec3a50d3529":"/velowerkstatt-ch/de/","cfe9b4b07954b0fe":"/skiverleih-ch/fr/","d08c86156e56ec84":"/skiverleih-ch/de/","ecae45dad3a7108a":"/zahnarzt-ch/de/","7ad9970a9580ffc8":"/zahnarzt-ch/de/","cb14ddda86b75553":"/umzug-ch/de/","a88e7e4438d2c528":"/ferienwohnung-ch/de/","9c8a27a54508cfde":"/gastro-gruppe/de/","06c50cace1e8070f":"/gastro-gruppe/de/","f769598a7bd07bf6":"/gastro-gruppe/de/","1af3cd2d889f2fd2":"/gastro-gruppe/de/","97d5d821ec92fe9a":"/gastro-gruppe/de/","f2063f2f5327d5e3":"/gastro-gruppe/de/","a9a95751399f4f4b":"/gastro-gruppe/de/","cc356d1df5029c8a":"/gastro-gruppe/de/","46dd8d66513b26db":"/gastro-gruppe/de/","85d19c4753a138f4":"/gastro-gruppe/de/","f11e77a1dc87040c":"/gastro-gruppe/de/","3d5ead9a066e7f13":"/gastro-gruppe/de/","9b489a19c343055e":"/gastro-gruppe/de/","569f4666ca342237":"/gastro-gruppe/de/","b49f3718f4d71644":"/gastro-gruppe/de/","c3e3a8b8049e9656":"/gastro-gruppe/de/","b7b19cc749e50400":"/gastro-gruppe/de/","21d7ee03b848001f":"/gastro-gruppe/de/","5188f4462b401eb4":"/gastro-gruppe/de/","48431177fb4b4035":"/gastro-gruppe/de/","e187ee03247c4bd2":"/gastro-gruppe/de/","89a731a09bdae353":"/gastro-gruppe/de/","9392f47f2f0ad280":"/gastro-gruppe/de/","df000d285559c0dd":"/gastro-gruppe/de/","611f10281ebe2fe8":"/gastro-gruppe/de/","28289c494d3852f4":"/gastro-gruppe/de/","6d9e56e75f54d346":"/gastro-gruppe/de/","970943a80aab8afe":"/gastro-gruppe/de/","c069d82be3f6fcd7":"/gastro-gruppe/de/","043caa772514ce3c":"/gastro-gruppe/de/","3635075a021e36b4":"/gastro-gruppe/de/","21d084c3fb6a5ed5":"/gastro-gruppe/de/","087c7acf29b0d9b6":"/gastro-gruppe/de/","b2cfb3387586c355":"/gastro-gruppe/de/","e64de651cd37c5c8":"/gastro-gruppe/de/","946b064d666ee8bd":"/gastro-gruppe/de/","74b552199459bba8":"/gastro-gruppe/de/","bc1a63bc3687e0a3":"/gastro-gruppe/de/","c6898a4caba9fae5":"/gastro-gruppe/de/"};

const SHA16_SOURCE = "function sha16(str) {\n  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }\n  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];\n  var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];\n  var bytes = [];\n  for (var i = 0; i < str.length; i++) {\n    var c = str.charCodeAt(i);\n    if (c < 128) bytes.push(c);\n    else if (c < 2048) bytes.push(192 | (c >> 6), 128 | (c & 63));\n    else bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));\n  }\n  var bitLen = bytes.length * 8;\n  bytes.push(128);\n  while ((bytes.length % 64) !== 56) bytes.push(0);\n  for (var sh = 56; sh >= 0; sh -= 8) bytes.push(Math.floor(bitLen / Math.pow(2, sh)) & 255);\n  var w = new Array(64);\n  for (var off = 0; off < bytes.length; off += 64) {\n    for (var t = 0; t < 16; t++) w[t] = ((bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) | (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3]) | 0;\n    for (var t2 = 16; t2 < 64; t2++) {\n      var x15 = w[t2 - 15], x2 = w[t2 - 2];\n      var s0 = rotr(x15, 7) ^ rotr(x15, 18) ^ (x15 >>> 3);\n      var s1 = rotr(x2, 17) ^ rotr(x2, 19) ^ (x2 >>> 10);\n      w[t2] = (w[t2 - 16] + s0 + w[t2 - 7] + s1) | 0;\n    }\n    var a = H[0], b = H[1], c2 = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];\n    for (var t3 = 0; t3 < 64; t3++) {\n      var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);\n      var ch = (e & f) ^ ((~e) & g);\n      var temp1 = (h + S1 + ch + K[t3] + w[t3]) | 0;\n      var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);\n      var maj = (a & b) ^ (a & c2) ^ (b & c2);\n      var temp2 = (S0 + maj) | 0;\n      h = g; g = f; f = e; e = (d + temp1) | 0; d = c2; c2 = b; b = a; a = (temp1 + temp2) | 0;\n    }\n    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c2) | 0; H[3] = (H[3] + d) | 0;\n    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;\n  }\n  var hex = \"\";\n  for (var n = 0; n < 2; n++) hex += (\"00000000\" + (H[n] >>> 0).toString(16)).slice(-8);\n  return hex;\n}";

function prospectRedirectTag(map) {
  const dest = JSON.stringify(map);
  return `<script id="bolla-p-redirect">(function(){
var DEST=${dest};
${SHA16_SOURCE}
function go(hex){
  try{
    var q=new URLSearchParams(location.search);
    var p=(q.get("p")||"").toLowerCase().replace(/[^a-z0-9_-]/g,"");
    if(!p||!Object.prototype.hasOwnProperty.call(DEST,hex)) return;
    var u=DEST[hex].split("{p}").join(p);
    if(u.indexOf("?")<0) u+="?p="+p;
    else if(!/[?&]p=/.test(u)) u+="&p="+p;
    if(q.get("internal")==="1"&&u.indexOf("internal=")<0) u+="&internal=1";
    location.replace(u);
  }catch(e){}
}
try{
  var q0=new URLSearchParams(location.search);
  var p0=(q0.get("p")||"").toLowerCase().replace(/[^a-z0-9_-]/g,"");
  if(!p0) return;
  var msg="bolla-p-v1:"+p0;
  var done;
  if(typeof crypto!=="undefined"&&crypto.subtle&&crypto.subtle.digest&&typeof TextEncoder==="function"){
    try{
      done=crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg)).then(function(buf){
        var bytes=new Uint8Array(buf), s="", i;
        for(i=0;i<8;i++) s+=(bytes[i]<16?"0":"")+bytes[i].toString(16);
        go(s);
      }).catch(function(){ go(sha16(msg)); });
    }catch(e){ go(sha16(msg)); }
  } else {
    go(sha16(msg));
  }
  try{ window.__bollaRedirect=done||Promise.resolve(); }catch(e){}
}catch(e){}
})();</script>`;
}

function destFromMapping(file) {
  if (!existsSync(file)) return null;
  const map = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) continue;
    const slug = parts[0];
    const sector = parts[1].split("?")[0];
    if (!/^[a-z0-9_-]{7,40}$/.test(slug) || !/^\/[a-z0-9-]+\/[a-z]{2}\/$/.test(sector)) continue;
    const key = createHash("sha256").update("bolla-p-v1:" + slug).digest("hex").slice(0, 16);
    map[key] = sector;
  }
  return Object.keys(map).length ? map : null;
}

const mappingFile = fileURLToPath(new URL("../MAPPING.md", import.meta.url));
const redirect = prospectRedirectTag(destFromMapping(mappingFile) || PROSPECT_DEST);

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const CLIENT = `(function(){
  var PACK = JSON.parse(document.getElementById("demo-pack").textContent);
  var chat = document.getElementById("chat");
  var qr = document.getElementById("qr");
  var opened = false;
  var allowed = { stock:1, testdrive:1, workshop:1, finance:1, hours:1, location:1, human:1, emergency:1, fallback:1, request:1 };
  function reduceMotion(){
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function add(t, kind){
    var e = document.createElement("div");
    e.className = "m " + (kind === "in" ? "in" : "out") + (kind === "hand" ? " hand" : "");
    e.textContent = t;
    chat.appendChild(e);
    chat.scrollTop = chat.scrollHeight;
    return e;
  }
  function showAnswer(entry){
    add(entry.text, entry.hand ? "hand" : "out");
  }
  function trackUse(id){
    if (!window.bsTrack || !allowed[id]) return;
    if (!opened){
      opened = true;
      window.bsTrack("conc-chat-open", "conc-chat-open");
    }
    window.bsTrack("conc-intent-" + id, "conc-intent-" + id);
  }
  function tokensOf(raw){
    var n = String(raw || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    return n.match(/[\\p{L}\\p{N}]+/gu) || [];
  }
  function norm(s){
    return tokensOf(s).join(" ");
  }
  function isInflection(rest){
    if (rest === "") return true;
    var lang = PACK.lang;
    if (lang === "es") return /^(?:s|es|a|o|as|os|ito|ita|itos|itas|ar|er|ado|ada|ados|adas|acion|aciones|ando)$/.test(rest);
    if (lang === "de") return /^(?:e|en|er|em|es|ern|n|s|se|isch)$/.test(rest);
    if (lang === "it") return /^(?:i|e|a|o|hi|he|ione|ioni)$/.test(rest);
    return /^(?:ing|ies|es|ed|er|est|s|y|d|e)$/.test(rest);
  }
  function listed(list, key){
    var id = tokensOf(key).join(" ");
    var i;
    for (i = 0; i < (list || []).length; i++){
      if (tokensOf(list[i]).join(" ") === id) return true;
    }
    return false;
  }
  function modeFor(rule, key){
    if (listed(rule.prefixes, key)) return "prefix";
    if (listed(rule.compounds, key)) return "compound";
    if (listed(rule.roots, key)) return "root";
    return "exact";
  }
  function stemAtStart(token, stem){
    return token.startsWith(stem) && isInflection(token.slice(stem.length));
  }
  function tailHit(token, stem){
    var at = token.lastIndexOf(stem);
    return at >= 4 && isInflection(token.slice(at + stem.length));
  }
  function tokenOk(token, stem, mode){
    if (token === stem) return true;
    if (stem.length < 3 || mode === "exact") return false;
    if (mode === "phrase" || mode === "root") return stemAtStart(token, stem);
    if (mode === "compound") return stemAtStart(token, stem) || tailHit(token, stem);
    if (mode === "prefix") return (stem.length >= 4 && token.startsWith(stem)) || tailHit(token, stem);
    return false;
  }
  function keyHit(tokens, key, mode){
    var kt = tokensOf(key);
    var span = kt.length;
    var i, j, ok;
    if (!span) return false;
    for (i = 0; i + span <= tokens.length; i++){
      ok = true;
      for (j = 0; j < span; j++){
        if (!tokenOk(tokens[i + j], kt[j], span === 1 ? mode : "phrase")){ ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }
  function answerFor(raw){
    var tokens = tokensOf(raw);
    if (!tokens.length) return { text: PACK.empty, hand: false, id: "empty" };
    function best(priority){
      var found = null, foundLen = 0;
      PACK.rules.forEach(function(r){
        if (!!r.priority !== priority) return;
        (r.keys || []).forEach(function(k){
          if (!keyHit(tokens, k, modeFor(r, k))) return;
          var len = tokensOf(k).join(" ").length;
          if (len > foundLen){ found = r; foundLen = len; }
        });
      });
      return found;
    }
    var hit = best(true) || best(false);
    if (!hit) return { text: PACK.fallback, hand: false, id: "fallback" };
    return { text: hit.text, hand: !!hit.hand, id: hit.id || "match" };
  }
  window.__sectorDemo = { mode: "static-example", lang: PACK.lang, answerFor: answerFor, liveAI: false };
  function play(i){
    if (i >= PACK.chat.length) return;
    var m = PACK.chat[i];
    var kind = m[0] === "in" ? "in" : (m[0] === "hand" ? "hand" : "out");
    if (kind === "in"){
      add(m[1], "in");
      if (reduceMotion()) play(i + 1); else setTimeout(function(){ play(i + 1); }, 350);
      return;
    }
    if (reduceMotion()){ add(m[1], kind); play(i + 1); return; }
    var t = add("\\u2026", "out");
    t.setAttribute("aria-hidden", "true");
    setTimeout(function(){
      t.remove();
      add(m[1], kind);
      setTimeout(function(){ play(i + 1); }, 650);
    }, 500);
  }
  PACK.rules.forEach(function(r){
    if (!r.button) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "qbtn";
    b.textContent = r.button;
    b.onclick = function(){
      add(r.button, "in");
      trackUse(r.id);
      var entry = { text: r.text, hand: !!r.hand };
      if (reduceMotion()) showAnswer(entry);
      else {
        var t = add("\\u2026", "out");
        t.setAttribute("aria-hidden", "true");
        setTimeout(function(){ t.remove(); showAnswer(entry); }, 450);
      }
    };
    qr.appendChild(b);
  });
  play(0);
  document.getElementById("ask-form").addEventListener("submit", function(ev){
    ev.preventDefault();
    var input = document.getElementById("ask");
    var q = input.value || "";
    if (!norm(q)){ showAnswer({ text: PACK.empty, hand: false }); return; }
    add(q, "in");
    var entry = answerFor(q);
    showAnswer(entry);
    trackUse(entry.id);
    input.value = "";
  });
  function iso(d){
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function formatDate(v){
    var p = v.split("-");
    var d = Number(p[2]), m = Number(p[1]), y = p[0];
    if (PACK.dateStyle === "dmy-numeric"){
      return String(d).padStart(2, "0") + "." + String(m).padStart(2, "0") + "." + y;
    }
    return d + " " + PACK.months[m - 1] + " " + y;
  }
  var arr = document.getElementById("arr");
  var today = new Date();
  arr.min = iso(today);
  var d0 = new Date();
  d0.setDate(d0.getDate() + (PACK.lead || 7));
  arr.value = iso(d0);
  var slotsEl = document.getElementById("slots");
  var slot = null;
  (PACK.slots || []).forEach(function(n){
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = n;
    b.setAttribute("aria-pressed", "false");
    b.onclick = function(){
      [].forEach.call(slotsEl.children, function(x){
        x.classList.remove("on");
        x.setAttribute("aria-pressed", "false");
      });
      b.classList.add("on");
      b.setAttribute("aria-pressed", "true");
      slot = n;
    };
    slotsEl.appendChild(b);
  });
  document.getElementById("cta").addEventListener("click", function(){
    var ok = document.getElementById("ok");
    ok.hidden = false;
    var v = arr.value;
    if (!v || !slot){ ok.textContent = PACK.pick; return; }
    var item = document.getElementById("item").value;
    ok.textContent = PACK.ok.replace("{item}", item).replace("{date}", formatDate(v)).replace("{slot}", slot);
    if (window.bsTrack) window.bsTrack("conc-intent-request", "conc-intent-request");
  });
})();`;

function rule(id, button, keys, text, extra) {
  return { id, button, keys, text, hand: !!(extra && extra.hand), priority: !!(extra && extra.priority) };
}

const pages = {
  es: {
    redirect: false,
    nav: "Idioma",
    title: "Ejemplo de chat para un concesionario de coches · BOLLA STUDIO",
    bannerBefore: "Ejemplo estático para un concesionario de coches, preparado por",
    bannerAfter: "No es un concesionario real y no reserva.",
    badge: "Ejemplo estático",
    tag: "Concesionario de coches, solo como muestra",
    h1: "Asistente para un concesionario de coches",
    intro: "Así respondería un asistente en el chat: stock de un segmento genérico, prueba de conducción, taller, financiación, horario y el paso a una persona.",
    notice: "Ejemplo ilustrativo de cómo responde el asistente. Es un guion fijo, no una inteligencia artificial real. No reserva, no guarda lo que escribes y no es la web de un concesionario concreto.",
    voice: "Esta página no inicia una llamada. Si hace falta un teléfono en el formulario, 000 000 000 es un número de ejemplo y no es real.",
    howtoTitle: "Cómo probar el ejemplo",
    steps: [
      "Lee el aviso: las respuestas ya están escritas.",
      "Pulsa una pregunta o escribe la tuya.",
      "El texto que escribes no se envía al contador ni a ningún servidor.",
      "La nota de la derecha se queda en el navegador.",
    ],
    avatar: "C",
    chatTitle: "Concesionario de ejemplo",
    chatStatus: "guion fijo · no es una IA real",
    chatAria: "Conversación de ejemplo",
    quickLabel: "Prueba una pregunta de ejemplo",
    askLabel: "O escribe otra pregunta",
    askPlaceholder: "Ejemplo: ¿tienes un SUV compacto híbrido?",
    sendLabel: "Ver el ejemplo",
    formTitle: "Anotar una petición de ejemplo",
    formNote: "No se envía. Sirve para ver cómo quedaría la nota.",
    fields: {
      itemLabel: "Asunto",
      items: ["Prueba de conducción", "Cita de taller", "Revisión", "ITV", "Orientación de financiación", "Permuta"],
      dateLabel: "Día",
      slotLabel: "Momento del día",
      slots: ["Mañana", "Mediodía", "Tarde"],
      nameLabel: "Nombre",
      namePh: "Nombre de ejemplo",
      contactLabel: "Teléfono de ejemplo",
      contactPh: "000 000 000 (ejemplo)",
      localOnly: "El nombre y el teléfono se quedan en esta página. 000 000 000 no es un número real.",
      cta: "Anotar el ejemplo",
    },
    columns: {
      leftTitle: "El ejemplo responde",
      leftItems: [
        "Si el segmento de ejemplo, un SUV compacto híbrido, figura en el guion",
        "Anotar una prueba de conducción, sin reservarla",
        "Anotar una cita de taller, una revisión o la ITV",
        "Decir que la financiación y la permuta las cierra un asesor, en euros y sin una cifra",
        "El horario de muestra y el encuentro en nuestro concesionario",
        "Pasarte con una persona",
      ],
      rightTitle: "Lo cierra una persona",
      rightItems: [
        "Un precio, una cuota o una tasación",
        "La decisión de un crédito",
        "Confirmar que el coche está en el patio",
        "Un diagnóstico de taller",
        "Cualquier pregunta que este guion no trae escrita",
      ],
    },
    feats: [
      { t: "No es una IA real", d: "Cada respuesta está escrita de antemano. La página no consulta un modelo ni un stock." },
      { t: "Sin cifras", d: "La financiación y la permuta se hablan en euros y se derivan a un asesor. Aquí no hay un importe." },
      { t: "Tú sigues el hilo", d: "Puedes pasar a una persona del concesionario. Esta página no llama." },
    ],
    creditLead: "Ejemplo de",
    footerNote: "Nuestro concesionario, en este texto, no es un local real. No hay una dirección ni un teléfono de verdad.",
    empty: "Escribe una pregunta de ejemplo.",
    fallback: "Esto es un ejemplo escrito, no una inteligencia artificial real. Esa pregunta no está cubierta. En el concesionario respondería una persona.",
    ok: "Solo ejemplo: no se ha reservado ni enviado nada. {item} · {date} · {slot}.",
    pick: "Elige el asunto, el día y un turno.",
    chat: [
      ["in", "Hola. ¿Tienes un SUV compacto híbrido disponible?"],
      ["out", "Hola. En este ejemplo hay un SUV compacto híbrido, sin una marca concreta. No consulto un stock real: una persona del concesionario confirmaría la disponibilidad."],
      ["in", "Quiero una prueba de conducción el sábado por la mañana."],
      ["out", "Anoto el sábado por la mañana para una prueba de conducción de ese SUV. Una persona confirma la hora. Desde esta página no se reserva nada."],
    ],
    rules: [
      rule("stock", "¿Tienes un SUV compacto híbrido?", ["suv", "híbrido", "hibrido", "disponible", "disponibilidad", "stock"], "En este ejemplo el segmento es un SUV compacto híbrido, sin marca concreta. No miro un stock real. Una persona del concesionario te confirma si hay uno disponible."),
      rule("testdrive", "Quiero una prueba de conducción", ["prueba de conducción", "prueba de manejo", "test drive", "conducción", "manejo"], "Anoto una prueba de conducción del SUV compacto híbrido. Tú eliges un momento y una persona del concesionario confirma. Esta página no reserva."),
      rule("workshop", "Necesito una cita de taller", ["cita de taller", "taller", "revisión", "revisiones", "itv"], "Puedo anotar una cita de taller para una revisión o para la ITV. No elijo el día por ti: una persona del concesionario confirma el hueco. Esta página no reserva."),
      rule("finance", "¿Y la financiación o una permuta?", ["financiación", "financiacion", "permuta", "permutas", "tasación"], "La financiación y la permuta de este ejemplo son solo una orientación, en euros. No te doy ninguna cifra. Te paso con un asesor.", { hand: true }),
      rule("hours", "¿Cuál es el horario?", ["horario", "horarios"], "En este ejemplo el horario es de lunes a viernes, de 9 a 19, y los sábados de 10 a 14. El domingo está cerrado. Es un horario de muestra, no el de un concesionario real."),
      rule("location", "¿Dónde está el concesionario?", ["dónde está", "donde esta", "ubicación", "dirección", "cómo llegar"], "En este ejemplo el punto de encuentro es nuestro concesionario. No hay una dirección real en esta página. Una persona te indica cómo llegar."),
      rule("human", "Quiero hablar con una persona", ["persona", "personas", "asesor", "asesora", "humano"], "Te paso con una persona del concesionario. Esta página no llama y no guarda tu mensaje.", { hand: true }),
      rule("emergency", "He tenido un accidente", ["accidente", "emergencia", "choque", "herido", "herida", "urgencia"], "Llama al 112.", { hand: true, priority: true }),
    ],
  },
  de: {
    redirect: true,
    nav: "Sprache",
    title: "Beispielchat für ein Autohaus · BOLLA STUDIO",
    bannerBefore: "Statisches Beispiel für ein Autohaus, vorbereitet von",
    bannerAfter: "Es ist kein echtes Autohaus und es reserviert nicht.",
    badge: "Statisches Beispiel",
    tag: "Autohaus, nur als Muster",
    h1: "Assistent für ein Autohaus",
    intro: "So würde ein Assistent im Chat antworten: Bestand einer allgemeinen Fahrzeugart, Probefahrt, Werkstatt, Finanzierung, Öffnungszeiten und die Weitergabe an eine Person.",
    notice: "Ein anschauliches Beispiel dafür, wie der Assistent antwortet. Es ist ein festes Skript, keine echte künstliche Intelligenz. Es reserviert nicht, speichert nicht, was Sie schreiben, und ist nicht die Website eines bestimmten Autohauses.",
    voice: "Diese Seite startet keinen Anruf. Wenn im Formular eine Nummer steht, ist 000 000 000 eine Beispielnummer und keine echte.",
    howtoTitle: "So prüfen Sie das Beispiel",
    steps: [
      "Lesen Sie den Hinweis: die Antworten sind schon geschrieben.",
      "Wählen Sie eine Frage oder schreiben Sie eine eigene.",
      "Der geschriebene Text geht nicht an den Zähler und nicht an einen Server.",
      "Die Notiz rechts bleibt im Browser.",
    ],
    avatar: "A",
    chatTitle: "Autohaus, Beispiel",
    chatStatus: "festes Skript · keine echte KI",
    chatAria: "Beispielgespräch",
    quickLabel: "Eine Beispielfrage versuchen",
    askLabel: "Oder eine andere Frage schreiben",
    askPlaceholder: "Beispiel: Haben Sie einen kompakten Hybrid-SUV?",
    sendLabel: "Beispiel ansehen",
    formTitle: "Eine Beispielbitte notieren",
    formNote: "Es wird nichts gesendet. Sie sehen nur, wie die Notiz aussehen würde.",
    fields: {
      itemLabel: "Anliegen",
      items: ["Probefahrt", "Werkstatttermin", "Inspektion", "Fahrzeugprüfung", "Finanzierung", "Inzahlungnahme"],
      dateLabel: "Tag",
      slotLabel: "Tageszeit",
      slots: ["Vormittag", "Mittag", "Nachmittag"],
      nameLabel: "Name",
      namePh: "Beispielname",
      contactLabel: "Beispieltelefon",
      contactPh: "000 000 000 (Beispiel)",
      localOnly: "Name und Telefon bleiben auf dieser Seite. 000 000 000 ist keine echte Nummer.",
      cta: "Beispiel notieren",
    },
    columns: {
      leftTitle: "Das Beispiel antwortet",
      leftItems: [
        "Ob die Beispielart, ein kompakter Hybrid-SUV, im Skript steht",
        "Eine Probefahrt notieren, ohne sie zu reservieren",
        "Einen Werkstatttermin, eine Inspektion oder die Fahrzeugprüfung notieren",
        "Sagen, dass Finanzierung und Inzahlungnahme eine Beratung bleiben, ohne Betrag",
        "Die Beispielöffnungszeiten und den Treffpunkt in unserem Autohaus",
        "Sie an eine Person weitergeben",
      ],
      rightTitle: "Eine Person entscheidet",
      rightItems: [
        "Ein Preis, eine Rate oder eine Bewertung",
        "Eine Kreditentscheidung",
        "Ob das Fahrzeug wirklich da ist",
        "Eine Werkstattdiagnose",
        "Jede Frage, die dieses Skript nicht enthält",
      ],
    },
    feats: [
      { t: "Keine echte KI", d: "Jede Antwort ist vorher geschrieben. Die Seite fragt kein Modell und keinen Bestand ab." },
      { t: "Ohne Betrag", d: "Finanzierung und Inzahlungnahme gehen an eine Beratung. Hier steht kein Betrag." },
      { t: "Sie behalten die Entscheidung", d: "Sie können an eine Person im Autohaus übergeben. Diese Seite ruft nicht an." },
    ],
    creditLead: "Beispiel von",
    footerNote: "Unser Autohaus ist in diesem Text kein echter Standort. Es gibt keine echte Adresse und keine echte Telefonnummer.",
    empty: "Schreiben Sie eine Beispielfrage.",
    fallback: "Das ist ein geschriebenes Beispiel, keine echte künstliche Intelligenz. Diese Frage ist nicht abgedeckt. Im Autohaus würde eine Person antworten.",
    ok: "Nur ein Beispiel: es wurde nichts reserviert und nichts gesendet. {item} · {date} · {slot}.",
    pick: "Bitte wählen Sie Anliegen, Tag und Tageszeit.",
    chat: [
      ["in", "Guten Tag. Haben Sie einen kompakten Hybrid-SUV verfügbar?"],
      ["out", "Guten Tag. In diesem Beispiel gibt es einen kompakten Hybrid-SUV, ohne eine bestimmte Marke. Ich prüfe keinen echten Bestand: eine Person im Autohaus würde die Verfügbarkeit bestätigen."],
      ["in", "Ich möchte eine Probefahrt am Samstagvormittag reservieren."],
      ["out", "Ich notiere Samstagvormittag für eine Probefahrt mit diesem SUV. Eine Person bestätigt die Uhrzeit. Von dieser Seite aus wird nichts reserviert."],
    ],
    rules: [
      rule("stock", "Haben Sie einen kompakten Hybrid-SUV?", ["suv", "hybrid", "verfügbar", "verfugbar", "auf lager", "bestand"], "In diesem Beispiel geht es um einen kompakten Hybrid-SUV, ohne bestimmte Marke. Ich sehe keinen echten Bestand. Eine Person im Autohaus bestätigt Ihnen, ob einer verfügbar ist."),
      rule("testdrive", "Ich möchte eine Probefahrt", ["probefahrt", "probe fahrt"], "Ich notiere eine Probefahrt mit dem kompakten Hybrid-SUV. Sie nennen einen Wunschtermin und eine Person im Autohaus bestätigt ihn. Diese Seite reserviert nicht."),
      rule("workshop", "Ich brauche einen Werkstatttermin", ["werkstatttermin", "werkstatt", "inspektion", "hauptuntersuchung", "fahrzeugpruefung", "tüv hu", "tuv hu", "tüv", "tuv", "hu", "mfk"], "Ich kann einen Werkstatttermin für eine Inspektion oder für die Fahrzeugprüfung notieren. Den Tag bestätigt eine Person im Autohaus. Diese Seite reserviert nicht."),
      rule("finance", "Finanzierung oder Inzahlungnahme", ["finanzierung", "inzahlungnahme", "eintausch", "anzahlung"], "Finanzierung und Inzahlungnahme sind in diesem Beispiel nur eine Orientierung. Ich nenne Ihnen keinen Betrag. Ich gebe das an eine Beraterin oder einen Berater weiter.", { hand: true }),
      rule("hours", "Wie sind die Öffnungszeiten?", ["öffnungszeiten", "öffnungszeit"], "In diesem Beispiel ist von Montag bis Freitag von 9 bis 19 Uhr und samstags von 10 bis 14 Uhr geöffnet. Sonntag ist geschlossen. Das ist eine Beispielzeit, nicht die eines bestimmten Autohauses."),
      rule("location", "Wo befindet sich das Autohaus?", ["wo befindet", "adresse", "anfahrt", "wie komme"], "In diesem Beispiel ist der Treffpunkt unser Autohaus. Auf dieser Seite steht keine echte Adresse. Eine Person erklärt Ihnen den Weg."),
      rule("human", "Ich möchte mit einer Person sprechen", ["person", "mitarbeiter", "mitarbeiterin", "berater", "beraterin", "mensch"], "Ich gebe Sie an eine Person im Autohaus weiter. Diese Seite ruft nicht an und speichert Ihre Nachricht nicht.", { hand: true }),
      rule("emergency", "Ich hatte einen Unfall", ["unfall", "notfall", "verletzt", "verletzte", "notruf"], "Rufen Sie 112 an.", { hand: true, priority: true }),
    ],
  },
  en: {
    redirect: true,
    nav: "Language",
    title: "Example chat for a car dealership · BOLLA STUDIO",
    bannerBefore: "Static example for a car dealership, prepared by",
    bannerAfter: "It is not a real dealership and it does not book.",
    badge: "Static example",
    tag: "Car dealership, sample only",
    h1: "Assistant for a car dealership",
    intro: "This is how an assistant would reply in chat: stock of a generic segment, a test drive, the workshop, financing, hours, and a handoff to a person.",
    notice: "An illustrative example of how the assistant replies. It is a fixed script, not a real artificial intelligence. It does not book, it does not store what you type, and it is not the website of a specific dealership.",
    voice: "This page does not start a call. If the form shows a number, 000 000 000 is an example number and not a real one.",
    howtoTitle: "How to try the example",
    steps: [
      "Read the notice: the replies are already written.",
      "Choose a question or type your own.",
      "The text you type is not sent to the counter or to any server.",
      "The note on the right stays in the browser.",
    ],
    avatar: "D",
    chatTitle: "Example dealership",
    chatStatus: "fixed script · not a real AI",
    chatAria: "Example conversation",
    quickLabel: "Try an example question",
    askLabel: "Or type another question",
    askPlaceholder: "Example: do you have a compact hybrid SUV?",
    sendLabel: "See the example",
    formTitle: "Note an example request",
    formNote: "Nothing is sent. This only shows how the note would look.",
    fields: {
      itemLabel: "Topic",
      items: ["Test drive", "Workshop appointment", "Service", "Periodic inspection", "Financing", "Trade-in"],
      dateLabel: "Day",
      slotLabel: "Time of day",
      slots: ["Morning", "Midday", "Afternoon"],
      nameLabel: "Name",
      namePh: "Example name",
      contactLabel: "Example phone",
      contactPh: "000 000 000 (example)",
      localOnly: "The name and the phone stay on this page. 000 000 000 is not a real number.",
      cta: "Note the example",
    },
    columns: {
      leftTitle: "The example answers",
      leftItems: [
        "Whether the example segment, a compact hybrid SUV, is in the script",
        "Noting a test drive without booking it",
        "Noting a workshop visit, a service, or the periodic inspection",
        "Saying that financing and a trade-in go to an advisor, with no figure",
        "The sample hours and the meeting point at our dealership",
        "Passing you to a person",
      ],
      rightTitle: "A person decides",
      rightItems: [
        "A price, a payment, or a valuation",
        "A credit decision",
        "Whether the car is actually on the lot",
        "A workshop diagnosis",
        "Any question this script does not contain",
      ],
    },
    feats: [
      { t: "Not a real AI", d: "Every reply is written in advance. The page does not call a model or a stock system." },
      { t: "No figure", d: "Financing and a trade-in are only an orientation and go to an advisor. No amount is stated." },
      { t: "A person can take over", d: "You can be passed to someone at the dealership. This page does not place a call." },
    ],
    creditLead: "Example by",
    footerNote: "Our dealership, in this text, is not a real place. There is no real address and no real phone number.",
    empty: "Type an example question.",
    fallback: "This is a written example, not a real artificial intelligence. That question is not covered. A person at the dealership would answer it.",
    ok: "Example only: nothing was booked and nothing was sent. {item} · {date} · {slot}.",
    pick: "Choose the topic, the day and a time of day.",
    chat: [
      ["in", "Hello. Do you have a compact hybrid SUV available?"],
      ["out", "Hello. This example includes a compact hybrid SUV, not a specific brand. It does not check a live stock list. A person at the dealership would confirm availability."],
      ["in", "I would like a test drive on Saturday morning."],
      ["out", "I can note Saturday morning for a test drive of that SUV. A person confirms the time. This page does not book anything."],
    ],
    rules: [
      rule("stock", "Do you have a compact hybrid SUV?", ["suv", "hybrid", "in stock", "availability", "available"], "This example uses a compact hybrid SUV, not a specific brand. It does not look at a live stock list. A person at the dealership confirms whether one is available."),
      rule("testdrive", "I want a test drive", ["test drive", "test-drive"], "I can note a test drive of the compact hybrid SUV. You pick a time and a person at the dealership confirms it. This page does not book it."),
      rule("workshop", "I need a workshop appointment", ["workshop appointment", "workshop", "periodic inspection", "inspection"], "I can note a workshop appointment for a service or for the periodic inspection. A person at the dealership confirms the slot. This page does not book it."),
      rule("finance", "Financing or a trade-in", ["financing", "finance", "trade-in", "trade in", "part exchange"], "Financing and a trade-in in this example are only a rough orientation. I do not give you a figure. I pass this to an advisor.", { hand: true }),
      rule("hours", "What are the opening hours?", ["opening hours", "opening hour"], "In this example the hours are Monday to Friday, 9 to 19, and Saturday, 10 to 14. Sunday is closed. These hours are a sample, not those of a real dealership."),
      rule("location", "Where is the dealership?", ["where is", "address", "directions"], "In this example the meeting point is our dealership. This page has no real address. A person explains how to get there."),
      rule("human", "I want to speak to a person", ["person", "human", "advisor", "someone"], "I pass you to a person at the dealership. This page does not place a call and does not store your message.", { hand: true }),
      rule("emergency", "I have had an accident", ["accident", "emergency", "crash", "injured", "collision"], "Call 112.", { hand: true, priority: true }),
    ],
  },
  it: {
    redirect: false,
    nav: "Lingua",
    title: "Esempio di chat per una concessionaria di automobili · BOLLA STUDIO",
    bannerBefore: "Esempio statico per una concessionaria di automobili, preparato da",
    bannerAfter: "Non è una concessionaria vera e non prenota.",
    badge: "Esempio statico",
    tag: "Concessionaria di automobili, solo come mostra",
    h1: "Assistente per una concessionaria di automobili",
    intro: "Ecco come risponderebbe un assistente in chat: stock di un segmento generico, prova su strada, officina, finanziamento, orario e il passaggio a una persona.",
    notice: "Esempio illustrativo di come risponde l'assistente. È un copione fisso, non un'intelligenza artificiale vera. Non prenota, non conserva ciò che scrive e non è il sito di una concessionaria specifica.",
    voice: "Questa pagina non avvia una chiamata. Se nel modulo compare un numero, 000 000 000 è un numero di esempio e non è vero.",
    howtoTitle: "Come provare l'esempio",
    steps: [
      "Legga l'avviso: le risposte sono già scritte.",
      "Scelga una domanda o ne scriva un'altra.",
      "Il testo che scrive non va al contatore né a un server.",
      "La nota a destra resta nel browser.",
    ],
    avatar: "C",
    chatTitle: "Concessionaria di esempio",
    chatStatus: "copione fisso · non è una IA vera",
    chatAria: "Conversazione di esempio",
    quickLabel: "Provi una domanda di esempio",
    askLabel: "Oppure scriva un'altra domanda",
    askPlaceholder: "Esempio: c'è un SUV compatto ibrido?",
    sendLabel: "Vedere l'esempio",
    formTitle: "Segnare una richiesta di esempio",
    formNote: "Non viene inviata. Serve solo a vedere come sarebbe la nota.",
    fields: {
      itemLabel: "Argomento",
      items: ["Prova su strada", "Appuntamento in officina", "Tagliando", "Revisione", "Finanziamento", "Permuta"],
      dateLabel: "Giorno",
      slotLabel: "Momento del giorno",
      slots: ["Mattina", "Mezzogiorno", "Pomeriggio"],
      nameLabel: "Nome",
      namePh: "Nome di esempio",
      contactLabel: "Telefono di esempio",
      contactPh: "000 000 000 (esempio)",
      localOnly: "Il nome e il telefono restano in questa pagina. 000 000 000 non è un numero vero.",
      cta: "Segnare l'esempio",
    },
    columns: {
      leftTitle: "L'esempio risponde",
      leftItems: [
        "Se il segmento di esempio, un SUV compatto ibrido, è nel copione",
        "Segnare una prova su strada, senza prenotarla",
        "Segnare un appuntamento in officina, un tagliando o la revisione",
        "Dire che finanziamento e permuta li chiude un consulente, senza una cifra",
        "L'orario di mostra e l'incontro nella nostra concessionaria",
        "Passarla a una persona",
      ],
      rightTitle: "Decide una persona",
      rightItems: [
        "Un prezzo, una rata o una valutazione",
        "La decisione di un credito",
        "Se l'auto è davvero presente",
        "Una diagnosi d'officina",
        "Ogni domanda che questo copione non contiene",
      ],
    },
    feats: [
      { t: "Non è una IA vera", d: "Ogni risposta è scritta prima. La pagina non consulta un modello né uno stock." },
      { t: "Senza cifre", d: "Finanziamento e permuta restano un orientamento e passano a un consulente. Qui non c'è un importo." },
      { t: "Può parlare con una persona", d: "La passiamo a una persona della concessionaria. Questa pagina non chiama." },
    ],
    creditLead: "Esempio di",
    footerNote: "La nostra concessionaria, in questo testo, non è un luogo vero. Non c'è un indirizzo vero né un telefono vero.",
    empty: "Scriva una domanda di esempio.",
    fallback: "Questo è un esempio scritto, non un'intelligenza artificiale vera. Questa domanda non è coperta. In concessionaria risponderebbe una persona.",
    ok: "Solo un esempio: non è stato prenotato né inviato nulla. {item} · {date} · {slot}.",
    pick: "Scelga l'argomento, il giorno e una fascia oraria.",
    chat: [
      ["in", "Buongiorno. C'è un SUV compatto ibrido disponibile?"],
      ["out", "Buongiorno. In questo esempio c'è un SUV compatto ibrido, senza una marca precisa. Non controllo uno stock vero: una persona della concessionaria confermerebbe la disponibilità."],
      ["in", "Vorrei una prova su strada sabato mattina."],
      ["out", "Segno sabato mattina per una prova su strada di quel SUV. Una persona conferma l'orario. Da questa pagina non si prenota nulla."],
    ],
    rules: [
      rule("stock", "C'è un SUV compatto ibrido?", ["suv", "ibrido", "disponibile", "disponibilità", "giacenza"], "In questo esempio il segmento è un SUV compatto ibrido, senza una marca precisa. Non guardo uno stock vero. Una persona della concessionaria Le conferma se ce n'è uno disponibile."),
      rule("testdrive", "Vorrei una prova su strada", ["prova su strada", "prova di guida", "test drive"], "Segno una prova su strada del SUV compatto ibrido. Lei indica un momento e una persona della concessionaria lo conferma. Questa pagina non prenota."),
      rule("workshop", "Ho bisogno di un appuntamento in officina", ["appuntamento in officina", "officina", "tagliando", "revisione"], "Posso segnare un appuntamento in officina per un tagliando o per la revisione. Il giorno lo conferma una persona della concessionaria. Questa pagina non prenota."),
      rule("finance", "Finanziamento o permuta", ["finanziamento", "permuta", "valutazione"], "Il finanziamento e la permuta, in questo esempio, sono solo un orientamento. Non Le indico alcuna cifra. La passo a un consulente.", { hand: true }),
      rule("hours", "Qual è l'orario?", ["orario", "orari"], "In questo esempio l'orario è dal lunedì al venerdì, dalle 9 alle 19, e il sabato dalle 10 alle 14. La domenica è chiuso. È un orario di esempio, non quello di una concessionaria vera."),
      rule("location", "Dove si trova la concessionaria?", ["dove si trova", "indirizzo", "come arrivare"], "In questo esempio il punto d'incontro è la nostra concessionaria. In questa pagina non c'è un indirizzo vero. Una persona Le spiega come arrivare."),
      rule("human", "Vorrei parlare con una persona", ["persona", "persone", "consulente", "umano"], "La passo a una persona della concessionaria. Questa pagina non chiama e non conserva il Suo messaggio.", { hand: true }),
      rule("emergency", "Ho avuto un incidente", ["incidente", "emergenza", "ferito", "ferita", "scontro", "urgenza"], "Chiami il 112.", { hand: true, priority: true }),
    ],
  },
};

const order = ["es", "de", "en", "it"];
const banned = /Medina|Tigre|San Fernando|Canestrari|\+54|Argentin|video\.mp4|Schweiz|\+41|Italia|Olbia|Tallinn/;

function render(lang, spec) {
  const links = order.map((code) => {
    const href = code === lang ? "./" : `../${code}/`;
    const current = code === lang ? " aria-current=\"page\"" : "";
    return `<a href="${href}" hreflang="${code}" lang="${code}" data-keep-query${current}>${code}</a>`;
  }).join("");
  const pack = {
    lang,
    chat: spec.chat,
    rules: spec.rules,
    fallback: spec.fallback,
    empty: spec.empty,
    ok: spec.ok,
    pick: spec.pick,
    lead: 3,
    slots: spec.fields.slots,
    months: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    dateStyle: "dmy-numeric",
  };
  const options = spec.fields.items.map((item) => `<option>${esc(item)}</option>`).join("");
  const left = spec.columns.leftItems.map((item) => `<li>${esc(item)}</li>`).join("");
  const right = spec.columns.rightItems.map((item) => `<li>${esc(item)}</li>`).join("");
  const feats = spec.feats.map((f) => `<div><b>${esc(f.t)}</b><br>${esc(f.d)}</div>`).join("");
  const steps = spec.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  const headRedirect = spec.redirect ? redirect : "";
  return `<!doctype html>
<!-- Static example for a car dealership. Not a live assistant. Visit path stays /<p>/video-${lang}. -->
<html lang="${lang}" translate="no">
<head>
<meta charset="utf-8">
${headRedirect}<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="google" content="notranslate">
<title>${esc(spec.title)}</title>
<style>
:root{--c:#1a3a5c;--ink:#1c1c1c;--bg:#f4f2ee}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans","DejaVu Sans","Helvetica Neue",Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.5;font-size:17px}
.top{background:#1d2a33;color:#f2f5f7;padding:12px 16px;text-align:center}
.top a{color:#fff}
.langs{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:12px 16px;background:#243640}
.langs a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;min-width:48px;padding:10px 16px;border-radius:12px;background:#fff;color:#1d2a33;font-weight:700;text-decoration:none;border:2px solid #fff}
.langs a[aria-current="page"]{background:var(--c);color:#fff;border-color:var(--c)}
header,main{max-width:1080px;margin:0 auto;padding:8px 16px 0}
.brand{font-weight:800;letter-spacing:.08em;font-size:.85rem;color:#5c6770}
.by{margin:4px 0 8px;font-size:16px}
.by a{color:var(--c)}
.tag{font-size:14px;letter-spacing:.04em;color:#555;margin:0}
h1{font-size:1.7rem;line-height:1.25;margin:8px 0 10px;color:var(--c)}
.intro{margin:0 0 12px;color:#333}
.badge{display:inline-block;background:#fff4d6;border:1px dashed #8a6a10;color:#5c4300;border-radius:8px;padding:4px 8px;font-size:14px;font-weight:700}
.notice,.voice{background:#fff;border-radius:12px;padding:12px 14px;margin:12px 0;font-size:16px}
.notice{border:2px solid #8a6a10}
.voice{border:2px solid #1d2a33}
.howto{background:#fff;border-radius:12px;padding:14px 16px;margin:12px 0 16px}
.howto h2{margin:0 0 8px;font-size:1.25rem;color:var(--c)}
.steps{margin:0;padding-left:1.3rem}
.steps li{margin:8px 0}
.grid{display:grid;gap:16px;margin:0 0 16px}
.card{background:#fff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.08);overflow:hidden}
.wa-h{background:#1d2a33;color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px}
.av{width:44px;height:44px;border-radius:50%;background:var(--c);display:flex;align-items:center;justify-content:center;font-weight:800}
.wa-h small{display:block;opacity:.9;font-size:14px}
.chat{background:#ece5dd;min-height:280px;max-height:52vh;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.m{max-width:92%;padding:10px 12px;border-radius:10px;font-size:16px;white-space:pre-line;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.in{background:#fff;align-self:flex-start}.out{background:#e7f6e7;align-self:flex-end}
.m.hand{background:#fff4d6;border:1px dashed #8a6a10}
.qrl{padding:10px 12px 0;font-size:15px;color:#444}
.qr{padding:8px 12px 12px;display:flex;flex-direction:column;gap:8px}
.qr button,.slots button,.cta,.ask-row button{min-height:48px;font-size:17px;border-radius:12px;cursor:pointer}
.qr button{width:100%;text-align:left;border:2px solid var(--c);background:#fff;color:var(--c);padding:12px 14px}
.bk{padding:16px}
.bk h3{margin:0 0 6px;color:var(--c);font-size:1.25rem}
.bk p{margin:0 0 10px;color:#444}
label{font-size:16px;color:#333;display:block;margin:12px 0 6px;font-weight:650}
select,input{width:100%;padding:12px;border:1px solid #bbb;border-radius:10px;font-size:16px;font-family:inherit;min-height:48px}
.slots{display:flex;flex-wrap:wrap;gap:8px}
.slots button{border:2px solid #bbb;background:#fff;padding:10px 14px}
.slots button.on{background:var(--c);color:#fff;border-color:var(--c)}
.cta{margin-top:16px;width:100%;background:var(--c);color:#fff;border:0;padding:14px;font-weight:700}
.ok{margin-top:14px;background:#eaf7ea;border:1px solid #8fbf8f;padding:12px;border-radius:10px;font-size:16px}
.ask{padding:0 12px 14px}
.ask-row{display:flex;flex-direction:column;gap:8px}
.ask-row button{background:#1d2a33;color:#fff;border:0;padding:12px 16px;font-weight:700}
.split,.feat{display:grid;gap:12px;margin:0 0 16px}
.split div,.feat div{background:#fff;border-radius:12px;padding:14px 16px}
.split h2,.feat b{color:var(--c)}
.split ul{margin:8px 0 0;padding-left:1.2rem}
.split li{margin:6px 0}
footer{text-align:center;font-size:15px;color:#444;padding:8px 16px 40px}
footer a{color:var(--c)}
:focus-visible{outline:3px solid #0b57d0;outline-offset:2px}
@media(min-width:800px){
  h1{font-size:2rem}
  .grid,.split{grid-template-columns:1fr 1fr}
  .feat{grid-template-columns:1fr 1fr 1fr}
  .qr{flex-direction:row;flex-wrap:wrap}
  .qr button{width:auto}
  .ask-row{flex-direction:row}
  .ask-row input{flex:1}
  .chat{max-height:460px}
}
</style>
<script id="bolla-metrics">
(function(){
 var m=(location.search+location.hash).match(/[?&#]internal=([01])/);
 try{ if(m){ if(m[1]==="1") localStorage.setItem("skipgc","t"); else localStorage.removeItem("skipgc"); } }catch(e){}
 var internal=false; try{ internal=localStorage.getItem("skipgc")==="t"; }catch(e){}
 window.__concPath=function(raw,leaf){
  var s=String(raw==null?"":raw).toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,60);
  var name=leaf||"video-${lang}";
  if(!/^[a-z0-9-]{1,40}$/.test(name)) return "";
  return (s?"/"+s+"/":"/")+name;
 };
 var raw=new URLSearchParams(location.search).get("p");
 var page=window.__concPath(raw,"video-${lang}");
 window.bsTrack=function(name,title){ if(internal) return; var path=window.__concPath(raw,name); if(!path) return; try{ if(window.goatcounter&&window.goatcounter.count) window.goatcounter.count({path:path,title:title||name,event:true}); }catch(e){} };
 if(internal) return;
 window.goatcounter={no_onload:true};
 var sc=document.createElement("script"); sc.async=true; sc.src="https://gc.zgo.at/count.js";
 sc.setAttribute("data-goatcounter","https://bollastudio.goatcounter.com/count");
 sc.onload=function(){ try{ window.goatcounter.count({path:page,title:"concesionarios video-${lang}"}); }catch(e){} };
 document.head.appendChild(sc);
})();
</script>
</head>
<body data-demo="static-example" data-lang="${lang}">
<div class="top">${esc(spec.bannerBefore)} <a href="https://bollastudio.com" target="_blank" rel="noopener">BOLLA STUDIO</a> · ${esc(spec.bannerAfter)}</div>
<nav class="langs" aria-label="${esc(spec.nav)}">${links}</nav>
<header>
  <div class="brand">BOLLA STUDIO</div>
  <p class="by">Marcelo Bolla · <a href="https://bollastudio.com" target="_blank" rel="noopener">bollastudio.com</a></p>
  <p class="tag"><span class="badge">${esc(spec.badge)}</span> ${esc(spec.tag)}</p>
  <h1>${esc(spec.h1)}</h1>
  <p class="intro">${esc(spec.intro)}</p>
  <p class="notice" role="note">${esc(spec.notice)}</p>
  <p class="voice" role="note">${esc(spec.voice)}</p>
</header>
<main>
<section class="howto" aria-labelledby="howto-title">
  <h2 id="howto-title">${esc(spec.howtoTitle)}</h2>
  <ol class="steps">${steps}</ol>
</section>
<div class="grid">
  <div class="card">
    <div class="wa-h"><div class="av" aria-hidden="true">${esc(spec.avatar)}</div><div><b>${esc(spec.chatTitle)}</b><small>${esc(spec.chatStatus)}</small></div></div>
    <div class="chat" id="chat" role="log" aria-live="polite" aria-relevant="additions" aria-label="${esc(spec.chatAria)}"></div>
    <div class="qrl" id="qr-label">${esc(spec.quickLabel)}</div>
    <div class="qr" id="qr" role="group" aria-labelledby="qr-label"></div>
    <form class="ask" id="ask-form" action="#" onsubmit="return false">
      <label for="ask">${esc(spec.askLabel)}</label>
      <div class="ask-row">
        <input id="ask" name="ask" type="text" autocomplete="off" enterkeyhint="send" placeholder="${esc(spec.askPlaceholder)}">
        <button type="submit">${esc(spec.sendLabel)}</button>
      </div>
    </form>
  </div>
  <div class="card bk">
    <h3>${esc(spec.formTitle)}</h3>
    <p>${esc(spec.formNote)}</p>
    <label for="item">${esc(spec.fields.itemLabel)}</label>
    <select id="item">${options}</select>
    <label for="arr">${esc(spec.fields.dateLabel)}</label>
    <input id="arr" type="date">
    <p id="slots-label" style="margin:12px 0 6px;font-weight:650">${esc(spec.fields.slotLabel)}</p>
    <div class="slots" id="slots" role="group" aria-labelledby="slots-label"></div>
    <label for="nm">${esc(spec.fields.nameLabel)}</label>
    <input id="nm" type="text" autocomplete="off" placeholder="${esc(spec.fields.namePh)}" aria-describedby="local-only">
    <label for="ph">${esc(spec.fields.contactLabel)}</label>
    <input id="ph" type="text" autocomplete="off" placeholder="${esc(spec.fields.contactPh)}" aria-describedby="local-only">
    <p id="local-only">${esc(spec.fields.localOnly)}</p>
    <button class="cta" id="cta" type="button">${esc(spec.fields.cta)}</button>
    <div class="ok" id="ok" role="status" hidden></div>
  </div>
</div>
<div class="split">
  <div><h2>${esc(spec.columns.leftTitle)}</h2><ul>${left}</ul></div>
  <div><h2>${esc(spec.columns.rightTitle)}</h2><ul>${right}</ul></div>
</div>
<div class="feat">${feats}</div>
</main>
<footer>${esc(spec.creditLead)} <a href="https://bollastudio.com" target="_blank" rel="noopener">BOLLA STUDIO</a> · Marcelo Bolla · <a href="mailto:marcelo@bollastudio.com">marcelo@bollastudio.com</a><br>${esc(spec.footerNote)}</footer>
<script type="application/json" id="demo-pack">${safeJson(pack)}</script>
<script id="bolla-lang-links">
document.querySelectorAll("[data-keep-query]").forEach(function(a){
  try{var u=new URL(a.getAttribute("href"),location.href);a.href=u.pathname+location.search+location.hash;}catch(e){}
});
</script>
<script id="sector-demo">
${CLIENT}
</script>
</body></html>
`;
}

const bannedVisible = /España|Alemania|Suiza|Schweiz|Österreich|Deutschland|Argentina|Switzerland|Germany|Austria|Italy|Spain|France|Francia|Portugal|México|Mexico|Chile|Uruguay|Paraguay/;
function writePages() {
for (const lang of order) {
  const html = render(lang, pages[lang]);
  if (banned.test(html)) throw new Error("banned string in " + lang);
  if (/<video\b|video\.mp4|poster=|\.vtt/i.test(html)) throw new Error("video leftover in " + lang);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  if (visible.includes("$")) throw new Error("dollar in " + lang);
  if (bannedVisible.test(visible)) throw new Error("country name visible in " + lang);
  if (lang === "es" && /\b(vos|tenés|tenes|podés|podes|querés|queres|decime|sos|usted)\b/i.test(visible)) {
    throw new Error("register slip in es");
  }
  if (lang === "de" && /\b(du|dein|deine|dir|dich|schweizer)\b/i.test(visible)) {
    throw new Error("register slip in de");
  }
  writeFileSync(new URL(`../concesionarios/${lang}/index.html`, import.meta.url), html);
  console.log(lang, html.length);
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) writePages();
