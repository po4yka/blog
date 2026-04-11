export const prerender = false;

import type { APIRoute } from "astro";
import { GITHUB_USERNAME } from "@/lib/constants";
import type { GitHubLatestRelease } from "@/types";

interface GitHubRepo {
  name: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
}

// In-memory cache with 30-minute TTL
let cache: { data: GitHubLatestRelease | null; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_REPOS_TO_CHECK = 5;

async function findLatestRelease(
  repos: GitHubRepo[],
): Promise<GitHubLatestRelease | null> {
  for (const repo of repos.slice(0, MAX_REPOS_TO_CHECK)) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `${GITHUB_USERNAME}-blog`,
        },
      },
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
  }

  return null;
}

export const GET: APIRoute = async () => {
  if (cache && Date.now() < cache.expiresAt) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=1800", "X-Cache": "HIT" },
    });
  }

  const reposRes = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=pushed&per_page=10`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": `${GITHUB_USERNAME}-blog`,
      },
    },
  );

  if (!reposRes.ok) {
    if (cache) {
      return Response.json(cache.data, {
        headers: { "Cache-Control": "public, max-age=60", "X-Cache": "STALE" },
      });
    }
    return new Response(JSON.stringify({ error: "GitHub API error" }), {
      status: reposRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const repos = (await reposRes.json()) as GitHubRepo[];
  const release = await findLatestRelease(repos);

  cache = { data: release, expiresAt: Date.now() + CACHE_TTL_MS };

  return Response.json(release, {
    headers: { "Cache-Control": "public, max-age=1800", "X-Cache": "MISS" },
  });
};
