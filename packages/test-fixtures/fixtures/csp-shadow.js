// Served under the strict CSP (script-src 'self') so it is allowed to run.
// Creates a host element that owns its own closed shadow root. The extension's
// content script must coexist with it: our injection targets light-DOM <pre>
// blocks and must not disturb this host.
const host = document.getElementById("shadow-host");
const root = host.attachShadow({ mode: "closed" });
root.innerHTML = "<pre><code>const hidden = 3;</code></pre>";
host._ok = true;
