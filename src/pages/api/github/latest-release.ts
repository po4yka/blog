export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import type { GitHubLatestRelease } from "@/types";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

interface GitHubRepo {
  name: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
}

const CACHE_TTL_S = 1800; // 30 minutes
// Reduced from 5 to limit N+1 fan-out on each cache miss.
const MAX_REPOS_TO_CHECK = 3;
const REPOS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=10`;
// Distinct cache key so it doesn't collide with the repos.ts cache entry.
const CACHE_KEY = REPOS_URL + ":latest-release";

async function findLatestRelease(
  repos: GitHubRepo[],
  authHeader: string | undefined,
): Promise<GitHubLatestRelease | null> {
  const requestHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${GITHUB_USERNAME}-blog`,
  };
  if (authHeader) requestHeaders["Authorization"] = authHeader;

  const releaseResults = await Promise.allSettled(
    repos.slice(0, MAX_REPOS_TO_CHECK).map(async (repo) => {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/releases/latest`,
        { headers: requestHeaders },
      );

      if (res.status === 200) {
        const release = (await res.json()) as GitHubRelease;
        return {
          repo: repo.name,
          tagName: release.tag_name,
          name: release.name,
          publishedAt: release.published_at,
          url: release.html_url,
        };
      }

      return null;
    }),
  );

  return releaseResults.reduce<GitHubLatestRelease | null>((latest, result) => {
    if (result.status !== "fulfilled" || !result.value) {
      return latest;
    }

    if (!latest) {
      return result.value;
    }

    return Date.parse(result.value.publishedAt) > Date.parse(latest.publishedAt)
      ? result.value
      : latest;
  }, null);
}

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(CACHE_KEY);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-Cache", "HIT");
    return new Response(cached.body, { headers });
  }

  const authHeader = env.GITHUB_TOKEN ? `Bearer ${env.GITHUB_TOKEN}` : undefined;

  const requestHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${GITHUB_USERNAME}-blog`,
  };
  if (authHeader) requestHeaders["Authorization"] = authHeader;

  const reposRes = await fetch(REPOS_URL, { headers: requestHeaders });

  if (!reposRes.ok) {
    return Response.json(null, {
      headers: { "Cache-Control": "public, max-age=60", "X-Cache": "MISS" },
    });
  }

  const repos = (await reposRes.json()) as GitHubRepo[];
  const release = await findLatestRelease(repos, authHeader);

  const response = Response.json(release, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });

  await cfCachePut(CACHE_KEY, response.clone());

  return response;
};
