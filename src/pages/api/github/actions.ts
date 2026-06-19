export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

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

const CACHE_TTL_S = 300; // 5 minutes
const REPO_NAME = "blog";
const MAX_RUNS = 5;
const UPSTREAM_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/actions/runs?per_page=${MAX_RUNS}`;

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(UPSTREAM_URL);
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

  const res = await fetch(UPSTREAM_URL, { headers: requestHeaders });

  if (!res.ok) {
    return Response.json([], {
      headers: { "Cache-Control": "public, max-age=60", "X-Cache": "MISS" },
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

  const response = Response.json(runs, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });

  await cfCachePut(UPSTREAM_URL, response.clone());

  return response;
};
