/* GoatCounter for /ambarra/.
   Page: /ambarra/ or /ambarra/?p=<tag>
   Events: /ambarra/<sub> via bsTrack, event:true
   ?internal=1 stores skipgc=t and loads nothing (?internal=0 clears it).
   Counts only on demo.bollastudio.com, so local QA and other hosts are not prospect visits. */

export const ANALYTICS_BASE = "/ambarra";
export const ANALYTICS_HOST = "demo.bollastudio.com";
export const GOAT_SRC = "https://gc.zgo.at/count.js";
export const GOAT_ENDPOINT = "https://bollastudio.goatcounter.com/count";

export function setupAnalytics(env) {
  const search = String(env.search || "");
  const hash = String(env.hash || "");
  const storage = env.storage;
  const host = String(env.hostname || "");
  const flag = (search + hash).match(/[?&#]internal=([01])/);
  try {
    if (flag) {
      if (flag[1] === "1") storage.setItem("skipgc", "t");
      else storage.removeItem("skipgc");
    }
  } catch (e) { /* private mode */ }
  let internal = false;
  try { internal = storage.getItem("skipgc") === "t"; } catch (e) { internal = false; }
  const tagMatch = search.match(/[?&]p=([^&#]*)/);
  const tag = tagMatch
    ? decodeURIComponent(tagMatch[1]).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 60)
    : "";
  const production = host === ANALYTICS_HOST;
  const blocked = internal || !production;
  const queue = [];
  function send(path, title, event) {
    const gc = env.getGoat();
    if (gc && typeof gc.count === "function") {
      const payload = { path, title: title || path };
      if (event) payload.event = true;
      gc.count(payload);
      return;
    }
    queue.push([path, title || path, event]);
  }
  function track(sub, title) {
    if (blocked) return false;
    const extra = sub ? (String(sub).charAt(0) === "/" ? String(sub) : "/" + sub) : "";
    send(ANALYTICS_BASE + extra, title, true);
    return true;
  }
  if (!blocked) {
    env.setGoat({ no_onload: true });
    env.loadScript({
      src: GOAT_SRC,
      endpoint: GOAT_ENDPOINT,
      onload() {
        send(ANALYTICS_BASE + "/" + (tag ? "?p=" + tag : ""), "Ambara demo", false);
        const pending = queue.splice(0, queue.length);
        pending.forEach(function (entry) { send(entry[0], entry[1], entry[2]); });
      }
    });
  }
  return { track, blocked, internal, production, base: ANALYTICS_BASE, tag };
}

export function bootAnalytics() {
  const ctl = setupAnalytics({
    search: location.search,
    hash: location.hash,
    hostname: location.hostname,
    storage: localStorage,
    getGoat() { return window.goatcounter; },
    setGoat(value) { window.goatcounter = value; },
    loadScript(opts) {
      const script = document.createElement("script");
      script.async = true;
      script.src = opts.src;
      script.setAttribute("data-goatcounter", opts.endpoint);
      script.onload = opts.onload;
      document.head.appendChild(script);
    }
  });
  window.bsTrack = ctl.track;
  document.documentElement.dataset.analyticsBlocked = ctl.blocked ? "true" : "false";
  return ctl;
}
