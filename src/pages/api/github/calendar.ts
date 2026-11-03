export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { GITHUB_USERNAME } from "@/lib/constants";
import { cfCacheGet, cfCachePut, fetchUpstream } from "@/lib/cf-cache";

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

// The public profile graph needs no token, so it backs the GraphQL query when the token is
// missing or the query fails.
const PUBLIC_URL = `https://github.com/users/${GITHUB_USERNAME}/contributions`;

/** Read the day cells (date by id) and their tooltips (count by id) from the profile graph HTML. */
export function parseContributionsHtml(html: string): ContributionDay[] {
  const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  const counts = new Map<string, number>();
  for (const [, tag, text] of html.matchAll(/(<tool-tip\b[^>]*>)([^<]*)<\/tool-tip>/g)) {
    const id = attr(tag!, "for");
    // "No contributions on ...", "1 contribution on ...", "1,234 contributions on ...".
    const n = text!.trim().match(/^([\d,]+) contributions?\b/);
    if (id) counts.set(id, n ? Number(n[1]!.replaceAll(",", "")) : 0);
  }
  const days: ContributionDay[] = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*\sdata-date="[^"]*"[^>]*>/g)) {
    const date = attr(tag, "data-date");
    const id = attr(tag, "id");
    if (date && id && counts.has(id)) days.push({ date, count: counts.get(id)! });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

async function fromGraphql(token: string): Promise<ContributionDay[] | null> {
  const res = await fetchUpstream(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": `${GITHUB_USERNAME}-blog`,
    },
    body: JSON.stringify({ query: QUERY, variables: { login: GITHUB_USERNAME } }),
  }, CACHE_KEY);
  if (!res) return null;

  const body = (await res.json()) as ContributionsResponse;
  const weeks = body.data?.user?.contributionsCollection.contributionCalendar.weeks;
  if (!weeks) return null;
  return weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
}

async function fromPublicPage(): Promise<ContributionDay[] | null> {
  const res = await fetchUpstream(PUBLIC_URL, { headers: { "User-Agent": `${GITHUB_USERNAME}-blog` } });
  if (!res) return null;
  const days = parseContributionsHtml(await res.text());
  // A changed page layout parses to nothing; say unavailable instead of drawing an empty year.
  return days.length > 0 ? days : null;
}

const unavailable = () =>
  Response.json({ error: "contributions unavailable" }, { status: 503, headers: { "Cache-Control": "public, max-age=60" } });

export const GET: APIRoute = async () => {
  const cached = await cfCacheGet(CACHE_KEY);
  if (cached) {
    return Response.json(await cached.json(), {
      headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "HIT" },
    });
  }

  const days = (env.GITHUB_TOKEN ? await fromGraphql(env.GITHUB_TOKEN) : null) ?? (await fromPublicPage());
  if (!days) return unavailable();

  await cfCachePut(CACHE_KEY, Response.json(days, { headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}` } }));

  return Response.json(days, {
    headers: { "Cache-Control": `public, max-age=${CACHE_TTL_S}`, "X-Cache": "MISS" },
  });
};
