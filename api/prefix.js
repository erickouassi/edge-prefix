export default function handler(req, res) {
  // ---------- 1. Get the target URL (prefer query parameter) ----------
  let target = "";

  // Preferred & reliable method: ?url=https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm
  if (req.query && req.query.url) {
    target = Array.isArray(req.query.url) ? req.query.url[0] : String(req.query.url);
  }

  // Fallback: try path (in case someone still uses old style)
  if (!target) {
    let raw = req.url || "";
    const [pathname] = raw.split("?");
    target = pathname.replace(/^\/api\/prefix\/?/, "").replace(/^\/+/, "");

    // strip optional "to/" if present
    if (target.toLowerCase().startsWith("to/")) {
      target = target.slice(3);
    }
  }

  // Decode
  try {
    target = decodeURIComponent(target);
  } catch {
    // already decoded or malformed
  }

  console.log("Incoming:", { url: req.url, query: req.query, target });

  // ---------- 2. Landing page ----------
  if (!target || target === "" || target === "/") {
    return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Edge Prefix Service</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; }
    code { background: #f4f4f4; padding: 0.2em 0.45em; border-radius: 4px; word-break: break-all; font-size: 0.95em; }
    .box { background: #f0f7ff; border: 1px solid #cce0ff; border-radius: 8px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
    a { color: #0078d4; }
  </style>
</head>
<body>
  <h1>Edge Prefix Service</h1>
  <p>Force any URL to open in <strong>Microsoft Edge</strong> on Windows.</p>

  <div class="box">
    <strong>Correct usage</strong>:
    <br><br>
    <code>https://edge-prefix.vercel.app/?url=https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm</code>
  </div>

  <p>Real example:</p>
  <p>
    <code>https://edge-prefix.vercel.app/?url=https://chromewebstore.google.com/detail/dffldhkdhhhloidkgodomiddljpjkncm</code>
  </p>

  <hr>
  <p style="font-size:0.9em;opacity:0.75">
    Note: When you are already inside Microsoft Edge, the link simply opens the page normally
    (Edge blocks the <code>microsoft-edge:</code> protocol for security reasons).
  </p>
</body>
</html>`);
  }

  // ---------- 3. Normalize common broken forms ----------
  target = target.replace(/^(https?):\/(?!\/)/i, "$1://");

  if (target.startsWith("//")) {
    target = "https:" + target;
  }

  if (!/^https?:\/\//i.test(target)) {
    target = "https://" + target;
  }

  if (!/^https?:\/\/.+/i.test(target)) {
    return res.status(400).send(`Invalid target URL.

Received: ${target}

Correct usage:
https://edge-prefix.vercel.app/?url=https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm`);
  }

  const edgeUrl = "microsoft-edge:" + target;

  // ---------- 4. Smart launcher page ----------
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opening in Microsoft Edge…</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; margin: 0;
      background: #f5f5f5; color: #333; text-align: center; padding: 1rem;
    }
    .btn {
      display: inline-block; margin-top: 1.5rem;
      padding: 0.85rem 1.75rem; background: #0078d4; color: white;
      text-decoration: none; border-radius: 6px; font-weight: 600;
    }
    .btn:hover { background: #106ebe; }
    .note { margin-top: 2rem; font-size: 0.9em; opacity: 0.7; max-width: 420px; }
  </style>
</head>
<body>
  <h1 id="title">Opening in Microsoft Edge…</h1>
  <p id="message">If nothing happens automatically, click the button below.</p>
  <a class="btn" id="openBtn" href="${edgeUrl}">Open in Edge</a>
  <p class="note" id="target">Target: ${target}</p>

  <script>
    (function () {
      var target = ${JSON.stringify(target)};
      var edgeUrl = ${JSON.stringify(edgeUrl)};
      var isEdge = /Edg\\//.test(navigator.userAgent);

      var title = document.getElementById("title");
      var message = document.getElementById("message");
      var btn = document.getElementById("openBtn");

      if (isEdge) {
        // Already in Edge → just go to the normal URL
        title.textContent = "Opening page…";
        message.textContent = "You are already using Microsoft Edge.";
        btn.href = target;
        btn.textContent = "Continue";
        window.location.href = target;
      } else {
        // Other browser → try to launch Edge
        window.location.href = edgeUrl;
        setTimeout(function () {
          window.location.href = edgeUrl;
        }, 400);
      }
    })();
  </script>
</body>
</html>`);
}