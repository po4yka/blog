export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import { cfCacheGet, cfCachePut } from "@/lib/cf-cache";

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ContributionsResponse {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }>;
        };
      };
    } | null;
  };
}

const CACHE_TTL_S = 3600; // 1 hour
const GRAPHQL_URL = "https://api.github.com/graphql";
// The Cache API needs a GET URL as its key; GraphQL is a POST, so key on a synthetic URL.
const CACHE_KEY = `${GRAPHQL_URL}?contributions=${GITHUB_USERNAME}`;
// The same year of contributions that the GitHub profile graph shows.
const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

const unavailable = () =>
  Response.json({ error: "contributions unavailable" }, { status: 503, headers: { "Cache-Control": "public, max-age=60" } });

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(CACHE_KEY);
  if (cached) {
    return Response.json(await cached.json(), {
      headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "HIT" },
    });
  }

  // GitHub GraphQL rejects anonymous requests.
  if (!env.GITHUB_TOKEN) return unavailable();

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": `${GITHUB_USERNAME}-blog`,
    },
    body: JSON.stringify({ query: QUERY, variables: { login: GITHUB_USERNAME } }),
  });
  if (!res.ok) return unavailable();

  const body = (await res.json()) as ContributionsResponse;
  const weeks = body.data?.user?.contributionsCollection.contributionCalendar.weeks;
  if (!weeks) return unavailable();

  const days: ContributionDay[] = weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  );

  await cfCachePut(CACHE_KEY, Response.json(days, { headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}` } }));

  return Response.json(days, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });
};
