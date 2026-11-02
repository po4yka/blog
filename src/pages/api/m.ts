// First-party proxy for the Umami event-collection endpoint.
// Clients POST to po4yka.dev/api/m; we forward to analytics.po4yka.dev/api/send.
// Forwarding CF-Connecting-IP as x-forwarded-for preserves Umami's geolocation.

export const prerender = false;

import type { APIRoute } from "astro";
import { UMAMI_ORIGIN } from "@/lib/constants";

const UPSTREAM = `${UMAMI_ORIGIN}/api/send`;
const SITE_ORIGIN = "https://po4yka.dev";
const MAX_BODY_BYTES = 64 * 1024; // 64 KB

/** Read the request body, or return null as soon as it exceeds `max` bytes. */
async function readBody(request: Request, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export const POST: APIRoute = async ({ request }) => {
  // Reject non-JSON content types early to avoid unnecessary processing.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
      status: 415,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  // Cap incoming body to 64 KB to bound memory usage and prevent DoS. Check the
  // declared length first; a chunked request has none, so the read stops at the cap too.
  const tooLarge = () =>
    new Response(JSON.stringify({ error: "Request body too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return tooLarge();
  const rawBody = await readBody(request, MAX_BODY_BYTES);
  if (!rawBody) return tooLarge();

  const clientIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "";

  const forwardHeaders = new Headers();
  forwardHeaders.set("Content-Type", "application/json");
  const ua = request.headers.get("user-agent");
  if (ua) forwardHeaders.set("User-Agent", ua);
  const cache = request.headers.get("x-umami-cache");
  if (cache) forwardHeaders.set("x-umami-cache", cache);
  if (clientIp) forwardHeaders.set("x-forwarded-for", clientIp);

  const upstream = await fetch(UPSTREAM, {
    method: "POST",
    headers: forwardHeaders,
    body: rawBody,
  });

  // Do not forward upstream error bodies verbatim — they may leak internal
  // details about the analytics backend. Return a generic status instead.
  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "Upstream error" }), {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
};

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: {
      // Restrict to the site origin rather than wildcard so that the
      // preflight only passes for first-party requests.
      "Access-Control-Allow-Origin": SITE_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-umami-cache",
      "Access-Control-Max-Age": "86400",
    },
  });
