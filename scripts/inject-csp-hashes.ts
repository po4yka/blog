// Post-build step: replaces 'unsafe-inline' in the script-src of dist/client/_headers with the
// sha256 hashes of every executable inline <script> found in the prerendered HTML.
// public/_headers stays the readable source. Run via: npm run build (after astro build).

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Cloudflare ignores _headers lines longer than 2,000 characters.
export const MAX_HEADER_LINE = 2000;

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const JS_TYPES = new Set(["", "module", "text/javascript", "application/javascript"]);

export function collectInlineScriptHashes(html: string): Set<string> {
  const hashes = new Set<string>();
  for (const match of html.matchAll(SCRIPT_RE)) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    if (/(^|\s)src\s*=/i.test(attrs)) continue;
    const type = /(?:^|\s)type\s*=\s*["']?([^"'\s>]*)/i.exec(attrs)?.[1]?.toLowerCase() ?? "";
    if (!JS_TYPES.has(type) || body.trim() === "") continue;
    hashes.add(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
  return hashes;
}

export function injectScriptHashes(headers: string, hashes: Iterable<string>): string {
  const list = [...hashes].sort().join(" ");
  let replaced = false;
  const out = headers
    .split("\n")
    .map((line) => {
      if (!/^\s*Content-Security-Policy:/i.test(line)) return line;
      return line.replace(/(script-src[^;]*?)\s*'unsafe-inline'/, (_m, head: string) => {
        replaced = true;
        return list ? `${head} ${list}` : head;
      });
    })
    .join("\n");
  if (!replaced) throw new Error("CSP script-src with 'unsafe-inline' not found in _headers");
  const longest = Math.max(...out.split("\n").map((l) => l.length));
  if (longest > MAX_HEADER_LINE) {
    throw new Error(`_headers line is ${longest} chars, over the ${MAX_HEADER_LINE} limit`);
  }
  return out;
}

function* htmlFiles(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

export function applyCspHashes(clientDir: string): number {
  const hashes = new Set<string>();
  for (const file of htmlFiles(clientDir)) {
    for (const h of collectInlineScriptHashes(fs.readFileSync(file, "utf8"))) hashes.add(h);
  }
  const headersPath = path.join(clientDir, "_headers");
  fs.writeFileSync(headersPath, injectScriptHashes(fs.readFileSync(headersPath, "utf8"), hashes));
  return hashes.size;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = applyCspHashes(path.resolve("dist/client"));
  console.log(`[csp] wrote ${count} script hashes into dist/client/_headers`);
}
