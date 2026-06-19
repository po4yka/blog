export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import type { GitHubActivitySummary } from "@/types";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

interface GitHubEvent {
  created_at: string;
}

const CACHE_TTL_S = 900; // 15 minutes
const BUCKET_DAYS = 14;
// Shared with calendar.ts and commits.ts — one upstream call fills all three.
const UPSTREAM_URL = `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`;

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
  const cached = await cfCacheGet(UPSTREAM_URL);
  if (cached) {
    const events = (await cached.json()) as GitHubEvent[];
    const summary = buildBuckets(events);
    return Response.json(summary, {
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
    return Response.json(null, {
      headers: { "Cache-Control": "public, max-age=60", "X-Cache": "MISS" },
    });
  }

  const events = (await res.json()) as GitHubEvent[];

  await cfCachePut(
    UPSTREAM_URL,
    Response.json(events, { headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}` } }),
  );

  const summary = buildBuckets(events);
  return Response.json(summary, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });
};
