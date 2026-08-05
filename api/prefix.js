export default function handler(req, res) {
  // On Vercel rewrites, the original path is often in x-forwarded-uri or req.url
  // Prefer the path after /api/prefix/
  let raw = req.url || "";

  // Strip query string for path extraction (we'll re-attach later if needed)
  const [pathname, search = ""] = raw.split("?");
  const query = search ? `?${search}` : "";

  // Remove /api/prefix (with or without trailing slash)
  let target = pathname.replace(/^\/api\/prefix\/?/, "");

  // Also handle cases where the rewrite leaves the full original path
  // (some Vercel versions pass the original URL in headers)
  if (!target || target === "" || target === "/") {
    const forwarded = req.headers["x-forwarded-uri"] || req.headers["x-vercel-forwarded-uri"] || "";
    if (forwarded) {
      target = forwarded.replace(/^\//, ""); // remove leading /
    }
  }

  // Decode once (Vercel may already have decoded parts)
  try {
    target = decodeURIComponent(target);
  } catch {
    // keep as-is if already decoded or malformed
  }

  // Clean up any leftover leading slashes
  target = target.replace(/^\/+/, "");

  console.log("Incoming:", { url: req.url, target, query });

  // Landing page
  if (!target || target === "" || target === "/") {
    return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Edge Prefix Service</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 4px; word-break: break-all; }
    a { color: #0078d4; }
  </style>
</head>
<body>
  <h1>Edge Prefix Service</h1>
  <p>Prefix any URL with this domain to force it to open in <strong>Microsoft Edge</strong>.</p>
  <p>Example:</p>
  <p><code>https://edge-prefix.vercel.app/https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm</code></p>
  <p>That becomes:</p>
  <p><code>microsoft-edge:https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm</code></p>
  <hr />
  <p>Works on Windows. Other platforms will usually just show a “protocol not supported” prompt.</p>
</body>
</html>`);
  }

  // Must look like a real URL
  if (!/^https?:\/\//i.test(target)) {
    return res.status(400).send(`Invalid target URL. It must start with http:// or https://

Received: ${target}

Correct usage:
https://your-domain.vercel.app/https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm`);
  }

  // Re-attach original query string if the target itself didn't already contain one
  const finalTarget = target.includes("?") ? target : target + query;

  const edgeUrl = "microsoft-edge:" + finalTarget;

  // Important: browsers ignore or block Location: microsoft-edge:... headers.
  // Serving a tiny HTML page that triggers the protocol is the reliable way.
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opening in Microsoft Edge…</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; color: #333; text-align: center; padding: 1rem; }
    a { color: #0078d4; font-weight: 600; word-break: break-all; }
    .btn { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #0078d4; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Opening in Microsoft Edge…</h1>
  <p>If nothing happens, click the button below.</p>
  <a class="btn" href="${edgeUrl}" id="open">Open in Edge</a>
  <p style="margin-top:2rem;font-size:0.9em;opacity:0.7">Target: ${finalTarget}</p>
  <script>
    // Try to launch immediately
    window.location.href = ${JSON.stringify(edgeUrl)};
    // Fallback: also try after a short delay
    setTimeout(function () {
      window.location.href = ${JSON.stringify(edgeUrl)};
    }, 300);
  </script>
</body>
</html>`);
}