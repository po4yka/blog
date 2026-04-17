// First-party proxy for the Umami tracker script.
// Serving under po4yka.dev/m.js bypasses ad-blocker lists that match the
// analytics.po4yka.dev hostname or the /script.js path.
// The body is rewritten so the runtime collect endpoint becomes /api/m
// instead of /api/send (another common ad-blocker path signature).

export const prerender = false;

import type { APIRoute } from "astro";

const UPSTREAM = "https://analytics.po4yka.dev/script.js";

export const GET: APIRoute = async () => {
  const upstream = await fetch(UPSTREAM, { cf: { cacheTtl: 3600 } } as RequestInit);

  if (!upstream.ok) {
    return new Response("", {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const body = (await upstream.text()).replace("/api/send", "/api/m");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=UTF-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
