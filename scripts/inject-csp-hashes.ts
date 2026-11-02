// Post-build step: replaces 'unsafe-inline' in the script-src of dist/client/_headers with the
// sha256 hashes of every executable inline <script> found in the prerendered HTML.
// public/_headers stays the readable source. Run via: npm run build (after astro build).

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, type DefaultTreeAdapterMap } from "parse5";

// Cloudflare ignores _headers lines longer than 2,000 characters.
export const MAX_HEADER_LINE = 2000;

// Script types the browser runs, so the CSP script-src covers them: the JavaScript MIME types of
// the HTML spec, "module", "importmap" and "speculationrules". Any other type is a data block
// (JSON-LD, for example), which the browser never runs.
const EXECUTABLE_TYPES = new Set([
  "",
  "module",
  "importmap",
  "speculationrules",
  "application/ecmascript",
  "application/javascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript",
]);

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

function* scripts(node: Node): Generator<Element> {
  if (!("childNodes" in node)) return;
  for (const child of node.childNodes) {
    if (child.nodeName === "script") yield child as Element;
    // Script text is in the parsed tree; a <template>'s content is a separate fragment.
    yield* scripts(child);
    if (child.nodeName === "template") yield* scripts((child as DefaultTreeAdapterMap["template"]).content);
  }
}

/**
 * The sha256 source of every inline script the browser runs. The HTML is parsed as a browser
 * parses it (parse5), so attribute values with ">" and odd end tags cannot shift the hashed text.
 */
export function collectInlineScriptHashes(html: string): Set<string> {
  const hashes = new Set<string>();
  for (const script of scripts(parse(html))) {
    const attr = (name: string) => script.attrs.find((a) => a.name === name)?.value;
    if (attr("src") !== undefined) continue;
    const type = (attr("type") ?? "").trim().toLowerCase();
    if (!EXECUTABLE_TYPES.has(type)) continue;
    const body = script.childNodes.map((c) => ("value" in c ? c.value : "")).join("");
    if (body.trim() === "") continue;
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
