#!/usr/bin/env node
// KuraCode demo server — serves the manual test page (test-pages/demo.html)
// so you can try every capture path by hand. No extra deps.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../test-pages", import.meta.url));
const PORT = Number(process.env.PORT ?? 7331);
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
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
    res.writeHead(200, {
      "content-type": MIME[extname(path)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(PORT, () => {
  console.log(`KuraCode demo page: http://localhost:${PORT}/demo.html`);
});
