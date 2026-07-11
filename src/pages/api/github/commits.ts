export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

export interface CommitSummary {
  hash: string;
  msg: string;
  date: string;
  url: string;
}

const CACHE_TTL_S = 600; // 10 minutes
// Kept below the row count of the numbered sections it sits between
// (Projects: 4, Experience: 3) so the panel reads as connective tissue,
// not a fifth full section.
const MAX_COMMITS = 5;
// Shared with calendar.ts and events.ts — one upstream call fills all three.
const UPSTREAM_URL = `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`;

type GitHubPushEvent = {
  type: string;
  payload?: { commits?: Array<{ sha: string; message: string }> };
  created_at: string;
  repo?: { name: string };
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function extractCommits(events: GitHubPushEvent[]): CommitSummary[] {
  const commits: CommitSummary[] = [];
  for (const event of events) {
    if (event.type !== "PushEvent" || !event.payload?.commits) continue;
    for (const c of event.payload.commits) {
      commits.push({
        hash: c.sha.slice(0, 7),
        msg: c.message.split("\n")[0]!,
        date: relativeTime(event.created_at),
        url: `https://github.com/${event.repo?.name ?? ""}/commit/${c.sha}`,
      });
      if (commits.length >= MAX_COMMITS) break;
    }
    if (commits.length >= MAX_COMMITS) break;
  }
  return commits;
}

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(UPSTREAM_URL);
  if (cached) {
    const events = (await cached.json()) as GitHubPushEvent[];
    const commits = extractCommits(events);
    return Response.json(commits, {
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

  const events = (await res.json()) as GitHubPushEvent[];

  await cfCachePut(
    UPSTREAM_URL,
    Response.json(events, { headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}` } }),
  );

  const commits = extractCommits(events);
  return Response.json(commits, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });
};
