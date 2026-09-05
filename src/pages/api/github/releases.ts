export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import { projects } from "@/data/projectsData";
import type { GitHubProjectRelease } from "@/types";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

interface GitHubRelease {
  tag_name: string;
  published_at: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
}

const CACHE_TTL_S = 1800; // 30 minutes
const CACHE_KEY = `https://api.github.com/users/${GITHUB_USERNAME}/repos:project-releases`;
const REPO_LINK = new RegExp(`^https://github\\.com/${GITHUB_USERNAME}/([^/#?]+)/?$`, "i");

/** Repos referenced from the projects list; one upstream call per repo on a cache miss. */
function projectRepos(): string[] {
  const repos = new Set<string>();
  for (const project of projects) {
    for (const link of project.links) {
      const m = REPO_LINK.exec(link.href);
      if (m?.[1]) repos.add(m[1]);
    }
  }
  return Array.from(repos);
}

async function fetchReleases(repo: string, headers: Record<string, string>): Promise<GitHubProjectRelease | null> {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${repo}/releases?per_page=100`, { headers });
  if (!res.ok) return null;
  const releases = ((await res.json()) as GitHubRelease[]).filter((r) => !r.draft);
  const latest = releases[0];
  if (!latest) return null;
  return {
    repo,
    count: releases.length,
    tagName: latest.tag_name,
    publishedAt: latest.published_at,
    url: latest.html_url,
    prerelease: latest.prerelease,
  };
}

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(CACHE_KEY);
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-Cache", "HIT");
    return new Response(cached.body, { headers });
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${GITHUB_USERNAME}-blog`,
  };
  if (env.GITHUB_TOKEN) requestHeaders["Authorization"] = `Bearer ${env.GITHUB_TOKEN}`;

  const repos = projectRepos();
  const results = await Promise.allSettled(repos.map((repo) => fetchReleases(repo, requestHeaders)));

  const byRepo: Record<string, GitHubProjectRelease | null> = {};
  repos.forEach((repo, i) => {
    const r = results[i];
    byRepo[repo] = r?.status === "fulfilled" ? r.value : null;
  });

  const response = Response.json(byRepo, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });
  await cfCachePut(CACHE_KEY, response.clone());
  return response;
};
