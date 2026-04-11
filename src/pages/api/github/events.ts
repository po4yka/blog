export const prerender = false;

import type { APIRoute } from "astro";
import { GITHUB_USERNAME } from "@/lib/constants";
import type { GitHubActivitySummary } from "@/types";

interface GitHubEvent {
  created_at: string;
}

// In-memory cache with 15-minute TTL
let cache: { data: GitHubActivitySummary; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;
const BUCKET_DAYS = 14;

function buildBuckets(events: GitHubEvent[]): GitHubActivitySummary {
  const now = Date.now();
  const buckets = Array<number>(BUCKET_DAYS).fill(0);

  let total = 0;
  let latest: string | null = null;

  for (const event of events) {
    const ts = new Date(event.created_at).getTime();
    const daysAgo = Math.floor((now - ts) / (1000 * 60 * 60 * 24));
    if (daysAgo >= 0 && daysAgo < BUCKET_DAYS) {
      buckets[BUCKET_DAYS - 1 - daysAgo]!++;
      total++;
      if (!latest) latest = event.created_at;
    }
  }

  return { buckets, total, latest };
}

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
  const summary = buildBuckets(events);

  cache = { data: summary, expiresAt: Date.now() + CACHE_TTL_MS };

  return Response.json(summary, {
    headers: { "Cache-Control": "public, max-age=900", "X-Cache": "MISS" },
  });
};
