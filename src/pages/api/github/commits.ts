export const prerender = false;

import type { APIRoute } from "astro";
import { GITHUB_USERNAME } from "@/lib/constants";

export interface CommitSummary {
  hash: string;
  msg: string;
  date: string;
  url: string;
}

let cache: { data: CommitSummary[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_COMMITS = 7;

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

export const GET: APIRoute = async () => {
  if (cache && Date.now() < cache.expiresAt) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=600", "X-Cache": "HIT" },
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

  const events = (await res.json()) as Array<{
    type: string;
    payload?: { commits?: Array<{ sha: string; message: string }> };
    created_at: string;
    repo?: { name: string };
  }>;

  // Extract push event commits
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

  cache = { data: commits, expiresAt: Date.now() + CACHE_TTL_MS };

  return Response.json(commits, {
    headers: { "Cache-Control": "public, max-age=600", "X-Cache": "MISS" },
  });
};
