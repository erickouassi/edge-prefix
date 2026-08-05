export default function handler(req, res) {
  const rawPath = req.url.replace(/^\/api\/prefix\/?/, "");
  const target = decodeURIComponent(rawPath);

  // Root path → landing page
  if (!target || target === "" || target === "/") {
    return res.status(200).send(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Edge Prefix Service</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            code { background: #f2f2f2; padding: 4px 6px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Edge Prefix Service</h1>
          <p>Prefix any URL with this domain to force it to open in Microsoft Edge.</p>

          <h3>Example</h3>
          <code>https://edge-prefix.vercel.app/https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm</code>

          <h3>Chrome Web Store Example</h3>
          <code>https://edge-prefix.vercel.app/https://chromewebstore.google.com/detail/dffldhkdhhhloidkgodomiddljpjkncm</code>

          <p>This will redirect to:</p>
          <code>microsoft-edge:https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm</code>
        </body>
      </html>
    `);
  }

  // Validate target URL
  if (!target.startsWith("https://") && !target.startsWith("http://")) {
    return res
      .status(400)
      .send("Invalid or missing target URL. Use /https://chromewebstore.google.com/detail/phishguard-phishing-warni/dffldhkdhhhloidkgodomiddljpjkncm");
  }

  const edgeUrl = "microsoft-edge:" + target;

  res.writeHead(302, { Location: edgeUrl });
  res.end();
}
