export const prerender = false;

import type { APIRoute } from "astro";
import { GITHUB_USERNAME } from "@/lib/constants";

interface GitHubEvent {
  created_at: string;
}

// In-memory cache with 15-minute TTL
let cache: { data: { created_at: string }[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export const GET: APIRoute = async () => {
  if (cache && Date.now() < cache.expiresAt) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=900", "X-Cache": "HIT" },
    });
  }

  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": `${GITHUB_USERNAME}-blog`,
      },
    },
  );

  if (!res.ok) {
    if (cache) {
      return Response.json(cache.data, {
        headers: { "Cache-Control": "public, max-age=60", "X-Cache": "STALE" },
      });
    }
    return new Response(JSON.stringify({ error: "GitHub API error" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const events = (await res.json()) as GitHubEvent[];
  const dates = events.map((e) => ({ created_at: e.created_at }));

  cache = { data: dates, expiresAt: Date.now() + CACHE_TTL_MS };

  return Response.json(dates, {
    headers: { "Cache-Control": "public, max-age=900", "X-Cache": "MISS" },
  });
};
