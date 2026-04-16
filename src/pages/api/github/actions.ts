export const prerender = false;

import type { APIRoute } from "astro";
import { GITHUB_USERNAME } from "@/lib/constants";

interface GitHubWorkflowRun {
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  head_sha: string;
  head_branch: string;
  run_number: number;
}

export interface ActionsSummary {
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  date: string;
  branch: string;
  commit: string;
  runNumber: number;
  durationSec: number | null;
}

let cache: { data: ActionsSummary[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;
const REPO_NAME = "blog";
const MAX_RUNS = 5;

export const GET: APIRoute = async () => {
  if (cache && Date.now() < cache.expiresAt) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=300", "X-Cache": "HIT" },
    });
  }

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/actions/runs?per_page=${MAX_RUNS}`,
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

  const body = (await res.json()) as { workflow_runs: GitHubWorkflowRun[] };

  const runs: ActionsSummary[] = body.workflow_runs.map((r) => {
    const created = new Date(r.created_at).getTime();
    const updated = new Date(r.updated_at).getTime();
    const durationSec = r.status === "completed" ? Math.round((updated - created) / 1000) : null;

    return {
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
      url: r.html_url,
      date: r.created_at,
      branch: r.head_branch,
      commit: r.head_sha.slice(0, 7),
      runNumber: r.run_number,
      durationSec,
    };
  });

  cache = { data: runs, expiresAt: Date.now() + CACHE_TTL_MS };

  return Response.json(runs, {
    headers: { "Cache-Control": "public, max-age=300", "X-Cache": "MISS" },
  });
};
