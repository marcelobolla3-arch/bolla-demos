/**
 * Source of the concesionarios prospect redirect.
 * It used to be inlined, in clear text, in concesionarios/en/index.html and concesionarios/de/index.html.
 * There was no separate file. build-concesionarios.mjs hashes each slug and writes only the hash and the sector path.
 * GitHub Pages serves this file because the site is the repository root.
 */
export const PROSPECT_SALT = "bolla-p-v1:";

export const PROSPECT_ROUTES = [
  { slug: "agence-casalp", path: "/ferienwohnung-ch/fr/" },
  { slug: "agentur-wyss", path: "/immobilien-ch/de/" },
  { slug: "air-davos", path: "/paragliding-ch/de/" },
  { slug: "aktiv-hotel-spa-hannigalp", path: "/hotel-ch/de/" },
  { slug: "allegra-zermatt", path: "/ferienwohnung-ch/de/" },
  { slug: "alpeelocation", path: "/ferienwohnung-ch/fr/" },
  { slug: "b-b-bergnest-wildhaus", path: "/hotel-ch/de/" },
  { slug: "bergidyll", path: "/ferienwohnung-ch/de/" },
  { slug: "bergluft-sport-lenk", path: "/skiverleih-ch/de/" },
  { slug: "bernestate", path: "/immobilien-ch/de/" },
  { slug: "bertrand-immobilier", path: "/immobilien-ch/fr/" },
  { slug: "bielersee-schifffahrt", path: "/schifffahrt-ch/de/" },
  { slug: "camenzind-2radsport", path: "/velomiete-ch/de/" },
  { slug: "casa-mittenwald", path: "/ferienwohnung-ch/de/" },
  { slug: "center-physio-zug", path: "/physio-ch/de/" },
  { slug: "central-optic-luzern", path: "/optiker-ch/de/" },
  { slug: "chamanna-bed-breakfast", path: "/hotel-ch/de/" },
  { slug: "charmingstay", path: "/ferienwohnung-ch/de/" },
  { slug: "chopp-snowboard-shop", path: "/skiverleih-ch/de/" },
  { slug: "coiffeur-sonderegger", path: "/coiffeur-ch/de/" },
  { slug: "craniosacral-balance", path: "/physio-ch/de/" },
  { slug: "deltafit", path: "/fitness-ch/de/" },
  { slug: "ebenalp", path: "/bergbahn-ch/de/" },
  { slug: "fahrschule-hefti", path: "/fahrschule-ch/de/" },
  { slug: "fahrschule-luan", path: "/fahrschule-ch/de/" },
  { slug: "fahrschule-massimo", path: "/fahrschule-ch/de/" },
  { slug: "ferienlizenz-lenk", path: "/ferienwohnung-ch/de/" },
  { slug: "fragniere-sports", path: "/skiverleih-ch/fr/" },
  { slug: "fun-sport-saas-grund", path: "/skiverleih-ch/de/" },
  { slug: "gasthaus-mayor", path: "/hotel-ch/de/" },
  { slug: "griwa-rent-ag", path: "/ferienwohnung-ch/de/" },
  { slug: "gruyere-escapade", path: "/ausfluege-ch/fr/" },
  { slug: "gypaete-parapente", path: "/paragliding-ch/fr/" },
  { slug: "henzensport", path: "/velomiete-ch/de/" },
  { slug: "hinwiler-umzuege", path: "/umzug-ch/de/" },
  { slug: "hotel-beausite-fassbind", path: "/hotel-ch/de/" },
  { slug: "hotel-bela-riva", path: "/hotel-ch/de/" },
  { slug: "hotel-bernerhof-kandersteg", path: "/hotel-ch/de/" },
  { slug: "hotel-caprice-grindelwald", path: "/hotel-ch/de/" },
  { slug: "hotel-central-obersaxen", path: "/hotel-ch/de/" },
  { slug: "hotel-club-sunways", path: "/hotel-ch/fr/" },
  { slug: "hotel-des-alpes-samnaun", path: "/hotel-ch/de/" },
  { slug: "hotel-dieschen", path: "/hotel-ch/de/" },
  { slug: "hotel-ermitage-verbier", path: "/hotel-ch/fr/" },
  { slug: "hotel-homann", path: "/hotel-ch/de/" },
  { slug: "hotel-les-chamois-verbier", path: "/hotel-ch/fr/" },
  { slug: "hotel-meiringen", path: "/hotel-ch/de/" },
  { slug: "hotel-restaurant-schonau", path: "/hotel-ch/de/" },
  { slug: "hotel-slalom-bettmeralp", path: "/hotel-ch/de/" },
  { slug: "hotel-sternen-unterwasser", path: "/hotel-ch/de/" },
  { slug: "hotel-vincenz", path: "/hotel-ch/de/" },
  { slug: "hotel-wengernalp", path: "/hotel-ch/de/" },
  { slug: "intersport-zermatten", path: "/skiverleih-ch/fr/" },
  { slug: "kleintierpraxis-dr-katja-rech", path: "/tierarzt-ch/de/" },
  { slug: "kleintierpraxis-dr-wendler", path: "/tierarzt-ch/de/" },
  { slug: "klinik-im-spiegel", path: "/aesthetik-ch/de/" },
  { slug: "kronberg", path: "/bergbahn-ch/de/" },
  { slug: "kw-immobilien", path: "/immobilien-ch/de/" },
  { slug: "la-chotte-du-musher", path: "/hotel-ch/fr/" },
  { slug: "la-suite-coiffure", path: "/coiffeur-ch/fr/" },
  { slug: "labicycletterie", path: "/velomiete-ch/fr/" },
  { slug: "linda-beauty", path: "/coiffeur-ch/de/" },
  { slug: "lippuner-immobilien-verwaltungen", path: "/immobilien-ch/de/" },
  { slug: "look-sport", path: "/skiverleih-ch/fr/" },
  { slug: "mattig-sport", path: "/skiverleih-ch/de/" },
  { slug: "moveon-luzern", path: "/fitness-ch/de/" },
  { slug: "musikschule-hug", path: "/musikschule-ch/de/" },
  { slug: "noctis-hairstyling", path: "/coiffeur-ch/de/" },
  { slug: "outdoor-interlaken", path: "/canyoning-ch/de/" },
  { slug: "panorama-hotel-freudenberg", path: "/hotel-ch/de/" },
  { slug: "paragliding-jungfrau", path: "/paragliding-ch/de/" },
  { slug: "pension-sonne-adelboden", path: "/hotel-ch/de/" },
  { slug: "physio-9000", path: "/physio-ch/de/" },
  { slug: "pollux-sport", path: "/skiverleih-ch/de/" },
  { slug: "pure-snowboarding-gstaad", path: "/skischule-ch/de/" },
  { slug: "raiffeisen-parc", path: "/velomiete-ch/fr/" },
  { slug: "rosswald-bahnen", path: "/bergbahn-ch/de/" },
  { slug: "sigimotion", path: "/velomiete-ch/de/" },
  { slug: "skiservice-corvatsch", path: "/skiverleih-ch/de/" },
  { slug: "soleval-ferienwohnungen", path: "/ferienwohnung-ch/de/" },
  { slug: "sportbahnen-jaunpass", path: "/bergbahn-ch/de/" },
  { slug: "stay-holiday-homes", path: "/ferienwohnung-ch/fr/" },
  { slug: "surses-alpin", path: "/ferienwohnung-ch/de/" },
  { slug: "swiss-paragliding", path: "/paragliding-ch/de/" },
  { slug: "tgesa-laroiva", path: "/ferienwohnung-ch/de/" },
  { slug: "thomet-luescher-sport", path: "/skiverleih-ch/de/" },
  { slug: "trust-immobilier", path: "/ferienwohnung-ch/fr/" },
  { slug: "velocitta", path: "/velowerkstatt-ch/de/" },
  { slug: "virage-sport", path: "/skiverleih-ch/fr/" },
  { slug: "visam-sport", path: "/skiverleih-ch/de/" },
  { slug: "zahnarzt-dr-calvano-forte", path: "/zahnarzt-ch/de/" },
  { slug: "zahnarztpraxis-dr-roland-pfeffer", path: "/zahnarzt-ch/de/" },
  { slug: "zueglenzuerich", path: "/umzug-ch/de/" },
  { slug: "zurschmitten", path: "/ferienwohnung-ch/de/" }
];

export const SHA16_SOURCE = "function sha16(str) {\n  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }\n  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];\n  var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];\n  var bytes = [];\n  for (var i = 0; i < str.length; i++) {\n    var c = str.charCodeAt(i);\n    if (c < 128) bytes.push(c);\n    else if (c < 2048) bytes.push(192 | (c >> 6), 128 | (c & 63));\n    else bytes.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));\n  }\n  var bitLen = bytes.length * 8;\n  bytes.push(128);\n  while ((bytes.length % 64) !== 56) bytes.push(0);\n  for (var sh = 56; sh >= 0; sh -= 8) bytes.push(Math.floor(bitLen / Math.pow(2, sh)) & 255);\n  var w = new Array(64);\n  for (var off = 0; off < bytes.length; off += 64) {\n    for (var t = 0; t < 16; t++) w[t] = ((bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) | (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3]) | 0;\n    for (var t2 = 16; t2 < 64; t2++) {\n      var x15 = w[t2 - 15], x2 = w[t2 - 2];\n      var s0 = rotr(x15, 7) ^ rotr(x15, 18) ^ (x15 >>> 3);\n      var s1 = rotr(x2, 17) ^ rotr(x2, 19) ^ (x2 >>> 10);\n      w[t2] = (w[t2 - 16] + s0 + w[t2 - 7] + s1) | 0;\n    }\n    var a = H[0], b = H[1], c2 = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];\n    for (var t3 = 0; t3 < 64; t3++) {\n      var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);\n      var ch = (e & f) ^ ((~e) & g);\n      var temp1 = (h + S1 + ch + K[t3] + w[t3]) | 0;\n      var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);\n      var maj = (a & b) ^ (a & c2) ^ (b & c2);\n      var temp2 = (S0 + maj) | 0;\n      h = g; g = f; f = e; e = (d + temp1) | 0; d = c2; c2 = b; b = a; a = (temp1 + temp2) | 0;\n    }\n    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c2) | 0; H[3] = (H[3] + d) | 0;\n    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;\n  }\n  var hex = \"\";\n  for (var n = 0; n < 2; n++) hex += (\"00000000\" + (H[n] >>> 0).toString(16)).slice(-8);\n  return hex;\n}";

export function sha16(str) {
  return (0, eval)("(" + SHA16_SOURCE + ")")(str);
}

export function prospectRedirectTag(map) {
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
  var msg=${JSON.stringify(PROSPECT_SALT)}+p0;
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
