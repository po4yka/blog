export const prerender = false;

import type { APIRoute } from "astro";
import { GITHUB_USERNAME } from "@/lib/constants";
import type { GitHubRepoSummary } from "@/types";

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  fork: boolean;
  archived: boolean;
}

// In-memory cache with 10-minute TTL
let cache: { data: GitHubRepoSummary[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export const GET: APIRoute = async () => {
  if (cache && Date.now() < cache.expiresAt) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=600", "X-Cache": "HIT" },
    });
  }

  const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `${GITHUB_USERNAME}-blog`,
    },
  });

  if (!res.ok) {
    // Serve stale cache on upstream error
    if (cache) {
      return Response.json(cache.data, {
        headers: { "Cache-Control": "public, max-age=60", "X-Cache": "STALE" },
      });
    }
    return Response.json([], {
      headers: { "Cache-Control": "public, max-age=60", "X-Cache": "MISS" },
    });
  }

  const repos = (await res.json()) as GitHubRepo[];

  const summary: GitHubRepoSummary[] = repos
    .filter((r) => !r.fork && !r.archived)
    .map((r) => ({
      name: r.name,
      description: r.description ?? "",
      url: r.html_url,
      stars: r.stargazers_count,
      language: r.language,
      topics: r.topics,
    }));

  cache = { data: summary, expiresAt: Date.now() + CACHE_TTL_MS };

  return Response.json(summary, {
    headers: { "Cache-Control": "public, max-age=600", "X-Cache": "MISS" },
  });
};
