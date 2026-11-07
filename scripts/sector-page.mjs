/**
 * Static sector chat pages for demo.bollastudio.com.
 * GitHub Pages serves the written HTML. This module is a maintainer renderer, not a runtime.
 * Every page is a scripted example: no network call, no booking, no voice audio.
 */

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
  function norm(s){
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9\\u0400-\\u04ff]+/g, " ").replace(/\\s+/g, " ").trim();
  }
  function answerFor(raw){
    var n = norm(raw);
    if (!n) return { text: PACK.empty, hand: false, id: "empty" };
    var best = null, bestLen = 0;
    PACK.rules.forEach(function(r){
      (r.keys || []).forEach(function(k){
        var nk = norm(k);
        if (nk.length < 3) return;
        if (n.indexOf(nk) >= 0 && nk.length > bestLen){ best = r; bestLen = nk.length; }
      });
    });
    if (!best) return { text: PACK.fallback, hand: false, id: "fallback" };
    return { text: best.text, hand: !!best.hand, id: best.id || "match" };
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
      if (window.bsTrack && r.id) window.bsTrack("/chat/" + r.id, "example");
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
    showAnswer(answerFor(q));
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
    if (window.bsTrack) window.bsTrack("/request/confirm", "example");
  });
})();`;

export function renderPage(spec) {
  const pack = {
    lang: spec.lang,
    chat: spec.chat,
    rules: spec.rules,
    fallback: spec.fallback,
    empty: spec.empty,
    ok: spec.ok,
    pick: spec.pick,
    lead: spec.lead,
    slots: spec.fields.slots,
    months: spec.months || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    dateStyle: spec.dateStyle || "dmy-name",
  };
  const langs = spec.langs
    .map((l) => {
      const current = l.current ? ' aria-current="page"' : "";
      return `<a href="${esc(l.href)}" hreflang="${esc(l.code)}" lang="${esc(l.code)}" data-keep-query${current}>${esc(l.label)}</a>`;
    })
    .join("");
  const options = spec.fields.items.map((item) => `<option>${esc(item)}</option>`).join("");
  const left = spec.columns.leftItems.map((item) => `<li>${esc(item)}</li>`).join("");
  const right = spec.columns.rightItems.map((item) => `<li>${esc(item)}</li>`).join("");
  const feats = spec.feats
    .map((f) => `<div><b>${esc(f.t)}</b><br>${esc(f.d)}</div>`)
    .join("");
  const steps = spec.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  const comment = spec.comment ? `<!-- ${spec.comment.replace(/--/g, "")} -->\n` : "";
  return `<!doctype html>
${comment}<html lang="${esc(spec.lang)}" translate="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="google" content="notranslate">
<title>${esc(spec.title)}</title>
<style>
:root{--c:#7a1f2b;--ink:#1c1c1c;--bg:#f4f2ee}
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
<!-- GoatCounter (BOLLA STUDIO): ?p= is a visit label for counting only. It does not personalize the page. ?internal=1 sets localStorage skipgc=t and loads nothing. -->
<script>
(function(){
 var BASE=${JSON.stringify(spec.trackBase)};
 var m=(location.search+location.hash).match(/[?&#]internal=([01])/);
 try{ if(m){ if(m[1]==="1") localStorage.setItem("skipgc","t"); else localStorage.removeItem("skipgc"); } }catch(e){}
 var internal=false; try{ internal=localStorage.getItem("skipgc")==="t"; }catch(e){}
 var sm=location.search.match(/[?&]p=([^&#]*)/);
 var tag=sm?decodeURIComponent(sm[1]).toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,60):"";
 var q=[]; window.bsTrack=function(sub,title){ if(internal) return;
   var ep=BASE+sub+(tag?'?p='+tag:'');if(window.goatcounter&&window.goatcounter.count) window.goatcounter.count({path:ep,title:title||sub,event:true}); else q.push([ep,title||sub]); };
 if(internal) return;
 window.goatcounter={no_onload:true};
 var s=document.createElement("script"); s.async=true; s.src="https://gc.zgo.at/count.js";
 s.setAttribute("data-goatcounter","https://bollastudio.goatcounter.com/count");
 s.onload=function(){ try{ window.goatcounter.count({path:BASE+'/'+(tag?'?p='+tag:''),title:${JSON.stringify(spec.trackTitle)}});
   q.forEach(function(e){window.goatcounter.count({path:e[0],title:e[1],event:true});}); q=[]; }catch(e){} };
 document.head.appendChild(s);
})();
</script>
</head>
<body data-demo="static-example" data-lang="${esc(spec.lang)}">
<div class="top">${esc(spec.bannerBefore)} <a href="https://bollastudio.com" target="_blank" rel="noopener">BOLLA STUDIO</a> · ${esc(spec.bannerAfter)}</div>
<nav class="langs" aria-label="${esc(spec.langNavLabel)}">${langs}</nav>
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
    <form class="ask" id="ask-form" action="#" method="post">
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
