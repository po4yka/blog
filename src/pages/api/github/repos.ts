export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import type { GitHubRepoSummary } from "@/types";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

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

const CACHE_TTL_S = 600; // 10 minutes
const UPSTREAM_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`;

export const GET: APIRoute = async () => {
  // Try Cloudflare Cache API first (Workers only; no-op in dev)
  const cached = await cfCacheGet(UPSTREAM_URL);
  if (cached) {
    return new Response(cached.body, {
      headers: { ...Object.fromEntries(cached.headers), "X-Cache": "HIT" },
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

  const response = Response.json(summary, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });

  await cfCachePut(UPSTREAM_URL, response.clone());

  return response;
};
