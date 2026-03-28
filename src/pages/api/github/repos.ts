export const prerender = false;

import type { APIRoute } from "astro";

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

export interface GitHubRepoSummary {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string | null;
  topics: string[];
}

export const GET: APIRoute = async () => {
  const res = await fetch("https://api.github.com/users/po4yka/repos?per_page=100&sort=updated", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "po4yka-blog",
    },
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "GitHub API error" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
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

  return Response.json(summary);
};
