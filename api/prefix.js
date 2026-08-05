export default function handler(req, res) {
  // ---------- 1. Get the target URL (prefer query parameter) ----------
  let target = "";

  // Preferred & reliable method: ?url=https://example.com
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
    <strong>Correct usage</strong> (this is the only format that works):
    <br><br>
    <code>https://edge-prefix.vercel.app/?url=https://example.com</code>
  </div>

  <p>Real example for the Chrome Web Store:</p>
  <p>
    <code>https://edge-prefix.vercel.app/?url=https://chromewebstore.google.com/detail/dffldhkdhhhloidkgodomiddljpjkncm</code>
  </p>

  <hr>
  <p style="font-size:0.9em;opacity:0.75">
    Why <code>?url=</code>? Vercel automatically rewrites any path containing
    <code>https://</code> into <code>https:/</code> (one slash). That completely breaks path-based designs.
    Using a query parameter avoids the problem.
  </p>
</body>
</html>`);
  }

  // ---------- 3. Normalize common broken forms ----------
  // https:/example.com  →  https://example.com
  target = target.replace(/^(https?):\/(?!\/)/i, "$1://");

  // //example.com → https://example.com
  if (target.startsWith("//")) {
    target = "https:" + target;
  }

  // example.com → https://example.com
  if (!/^https?:\/\//i.test(target)) {
    target = "https://" + target;
  }

  // Final validation
  if (!/^https?:\/\/.+/i.test(target)) {
    return res.status(400).send(`Invalid target URL.

Received: ${target}

Correct usage:
https://edge-prefix.vercel.app/?url=https://example.com`);
  }

  const edgeUrl = "microsoft-edge:" + target;

  // ---------- 4. Launcher page ----------
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
  </style>
</head>
<body>
  <h1>Opening in Microsoft Edge…</h1>
  <p>If nothing happens automatically, click the button below.</p>
  <a class="btn" href="${edgeUrl}">Open in Edge</a>
  <p style="margin-top:2rem;font-size:0.85em;opacity:0.65;max-width:90%;word-break:break-all">
    Target: ${target}
  </p>
  <script>
    window.location.href = ${JSON.stringify(edgeUrl)};
    setTimeout(function () {
      window.location.href = ${JSON.stringify(edgeUrl)};
    }, 400);
  </script>
</body>
</html>`);
}