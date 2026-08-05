export default function handler(req, res) {
  // Log raw request info
  console.log("---- Incoming Request ----");
  console.log("URL:", req.url);
  console.log("Method:", req.method);
  console.log("Headers:", req.headers);
  console.log("--------------------------");

  // Extract path after /api/prefix/
  const rawPath = req.url.replace(/^\/api\/prefix\/?/, "");
  console.log("Raw Path Extracted:", rawPath);

  const target = decodeURIComponent(rawPath);
  console.log("Decoded Target:", target);

  // Root path → landing page
  if (!target || target === "" || target === "/") {
    console.log("Landing page triggered (no target URL)");
    return res.status(200).send(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Edge Prefix Service</title>
        </head>
        <body>
          <h1>Edge Prefix Service</h1>
          <p>Prefix any URL with this domain to open it in Microsoft Edge.</p>
          <p>Example:</p>
          <code>https://edge-prefix.vercel.app/https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm</code>
        </body>
      </html>
    `);
  }

  // Validate target URL
  if (!target.startsWith("https://") && !target.startsWith("http://")) {
    console.log("❌ Validation Failed — Target is not a valid URL");
    console.log("Target Received:", target);
    return res
      .status(400)
      .send("Invalid or missing target URL. Use /https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm");
  }

  // Build Edge protocol URL
  const edgeUrl = "microsoft-edge:" + target;
  console.log("Redirecting to:", edgeUrl);

  // Perform redirect
  res.writeHead(302, { Location: edgeUrl });
  res.end();

  console.log("✔ Redirect completed");
}
