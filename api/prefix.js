export default function handler(req, res) {
  const rawPath = req.url.replace(/^\/api\/prefix\/?/, "");
  const target = decodeURIComponent(rawPath);

  if (!target || (!target.startsWith("https://") && !target.startsWith("http://"))) {
    return res.status(400).send("Invalid or missing target URL. Use /api/prefix/https://chromewebstore.google.com/detail/dffldhkdhhhloidkgodomiddljpjkncm");
  }

  const edgeUrl = "microsoft-edge:" + target;

  res.writeHead(302, { Location: edgeUrl });
  res.end();
}
