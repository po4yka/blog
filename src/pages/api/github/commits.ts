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
// Commit search, not the events feed: GitHub's PushEvent payloads no longer list commits.
const UPSTREAM_URL = `https://api.github.com/search/commits?q=author:${GITHUB_USERNAME}&sort=author-date&order=desc&per_page=${MAX_COMMITS}`;

type GitHubCommitSearch = {
  items?: Array<{
    sha: string;
    html_url: string;
    commit: { message: string; author: { date: string } };
  }>;
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

function extractCommits(search: GitHubCommitSearch): CommitSummary[] {
  return (search.items ?? []).slice(0, MAX_COMMITS).map((c) => ({
    hash: c.sha.slice(0, 7),
    msg: c.commit.message.split("\n")[0]!,
    date: relativeTime(c.commit.author.date),
    url: c.html_url,
  }));
}

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(UPSTREAM_URL);
  if (cached) {
    const commits = extractCommits((await cached.json()) as GitHubCommitSearch);
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

  const search = (await res.json()) as GitHubCommitSearch;

  await cfCachePut(
    UPSTREAM_URL,
    Response.json(search, { headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}` } }),
  );

  const commits = extractCommits(search);
  return Response.json(commits, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });
};
