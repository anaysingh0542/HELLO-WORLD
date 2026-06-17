/* AgentOS UI-component origin & auth probe.
 *
 * Purpose: determine which ORIGIN an externally-hosted UI component runs in when
 * AgentOS renders it (Source Repository / Hosted URL mode), and whether the
 * existing session-cookie + authHelper auth survives from that origin.
 *
 *   Model A  -> iframe served under *.sirioncloud.io  (same-origin; auth works free)
 *   Model B  -> iframe served from the external host   (cross-origin; cookie path breaks)
 *
 * Self-contained: works whether AgentOS iframes index.html directly (static-dir
 * serving) or loads this file as the component bundle. No secrets, no Sirion IP.
 */
(function () {
  "use strict";

  var SIRION_HOST = "https://ibmsw.sirioncloud.io"; // absolute target for the cross-origin test
  var lines = [];

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  var root = el("div", { id: "agentos-probe", style:
    "font:13px/1.5 ui-monospace,Menlo,monospace;padding:12px;color:#0b1a2b;" +
    "background:#f5f8fc;border:1px solid #c7d4e6;border-radius:8px;margin:8px" });
  root.appendChild(el("div", { style: "font-weight:700;font-size:14px;margin-bottom:6px" },
    "AgentOS origin + auth probe"));
  var pre = el("pre", { id: "probe-out", style: "white-space:pre-wrap;margin:0" });
  root.appendChild(pre);
  function flush() { pre.textContent = lines.join("\n"); }
  function log(s) { lines.push(s); flush(); }

  function boot() {
    if (!document.body) { return void setTimeout(boot, 0); }
    document.body.appendChild(root);

    var sameOrigin = false;
    try { sameOrigin = location.origin.indexOf("sirioncloud.io") !== -1; } catch (e) {}

    log("location.origin   : " + location.origin);
    log("location.href     : " + location.href);
    log("document.referrer : " + (document.referrer || "(empty)"));
    log("in iframe         : " + (window !== window.parent));
    try { log("parent origin     : " + (document.referrer ? new URL(document.referrer).origin : "(unknown)")); } catch (e) {}
    log("VERDICT (origin)  : " + (sameOrigin
      ? "MODEL A — same-origin under sirioncloud.io (cookie auth should work)"
      : "MODEL B — foreign origin (" + location.origin + "); cookie path is cross-site"));
    log("");
    log("Running fetch probes…");

    runProbes();
    notifyParent(sameOrigin);
  }

  function probe(label, url, opts) {
    var started = Date.now();
    return fetch(url, opts).then(function (r) {
      return r.text().then(function (body) {
        log("[" + label + "] " + r.status + " " + r.statusText +
            " (" + (Date.now() - started) + "ms)  type=" + r.type +
            "  body=" + JSON.stringify((body || "").slice(0, 80)));
      });
    }).catch(function (err) {
      log("[" + label + "] FAILED  " + (err && err.message ? err.message : err) +
          "  (likely CORS / network — expected from a foreign origin)");
    });
  }

  function runProbes() {
    var inc = { credentials: "include" };
    // Relative paths: hit whatever origin the iframe is actually served from.
    probe("rel  CSRF      ", "/api/v1/csrf/token", inc)
      .then(function () { return probe("rel  authHelper ", "/v1/authHelper/getAccessToken", inc); })
      // Absolute Sirion host: shows explicit cross-origin / CORS behavior.
      .then(function () { return probe("abs  CSRF      ", SIRION_HOST + "/api/v1/csrf/token", inc); })
      .then(function () { return probe("abs  authHelper ", SIRION_HOST + "/v1/authHelper/getAccessToken", inc); })
      .then(function () { log(""); log("Probes complete. Compare rel vs abs to confirm Model A/B."); });
  }

  // Capture AgentOS render event + report a summary back to the host.
  window.addEventListener("message", function (ev) {
    var t = ev && ev.data && ev.data.type;
    if (t === "ui_component_render" || t === "render") {
      log("");
      log("render event from origin: " + ev.origin);
      try { log("render payload: " + JSON.stringify(ev.data).slice(0, 200)); } catch (e) {}
    }
  });

  function notifyParent(sameOrigin) {
    try {
      window.parent.postMessage({
        type: "ui_component_user_message",
        message: "origin-probe: " + location.origin + (sameOrigin ? " (MODEL A)" : " (MODEL B)"),
        llmMessage: JSON.stringify({ origin: location.origin, referrer: document.referrer,
          inIframe: window !== window.parent, model: sameOrigin ? "A" : "B" })
      }, "*");
    } catch (e) {}
  }

  boot();
})();
