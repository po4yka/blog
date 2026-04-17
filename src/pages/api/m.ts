// First-party proxy for the Umami event-collection endpoint.
// Clients POST to po4yka.dev/api/m; we forward to analytics.po4yka.dev/api/send.
// Forwarding CF-Connecting-IP as x-forwarded-for preserves Umami's geolocation.

export const prerender = false;

import type { APIRoute } from "astro";

const UPSTREAM = "https://analytics.po4yka.dev/api/send";

export const POST: APIRoute = async ({ request }) => {
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
    body: await request.text(),
  });

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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-umami-cache",
      "Access-Control-Max-Age": "86400",
    },
  });
