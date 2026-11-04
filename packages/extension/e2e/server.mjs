// Minimal static file server for Playwright fixtures (no extra deps).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(
  new URL("../../test-fixtures/fixtures", import.meta.url),
);
const PORT = Number(process.env.PORT ?? 8931);
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".md": "text/markdown",
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let path = normalize(join(ROOT, url.pathname));
  if (!path.startsWith(ROOT)) {
    res.writeHead(403).end("forbidden");
    return;
  }
  try {
    const body = await readFile(path);
    const headers = {
      "content-type": MIME[extname(path)] ?? "application/octet-stream",
    };
    // Serve the CSP fixture with a strict, response-level Content-Security-Policy
    // header so the S11 scenario exercises a real CSP, not just a <meta> tag.
    if (url.pathname.includes("csp")) {
      headers["content-security-policy"] =
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'";
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => console.log(`fixture server on :${PORT}`));
