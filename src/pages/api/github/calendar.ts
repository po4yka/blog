export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

interface GitHubEvent {
  created_at: string;
}

const CACHE_TTL_S = 900; // 15 minutes
// Shared Cache API key for the GitHub events endpoint — calendar, events, and
// commits all hit the same upstream URL so they share a single cached response.
const UPSTREAM_URL = `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`;

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(UPSTREAM_URL);
  if (cached) {
    const events = (await cached.json()) as GitHubEvent[];
    const dates = events.map((e) => ({ created_at: e.created_at }));
    return Response.json(dates, {
      headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "HIT" },
    });
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${GITHUB_USERNAME}-blog`,
  };
  if (env.GITHUB_TOKEN) requestHeaders["Authorization"] = `Bearer ${env.GITHUB_TOKEN}`;

  const res = await fetch(UPSTREAM_URL, { headers: requestHeaders });

  if (!res.ok) {
    return Response.json([], {
      headers: { "Cache-Control": "public, max-age=60", "X-Cache": "MISS" },
    });
  }

  const events = (await res.json()) as GitHubEvent[];

  // Store the raw events array under the shared cache key so events.ts and
  // commits.ts can reuse the same upstream response without a second fetch.
  await cfCachePut(
    UPSTREAM_URL,
    Response.json(events, { headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}` } }),
  );

  const dates = events.map((e) => ({ created_at: e.created_at }));
  return Response.json(dates, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });
};
