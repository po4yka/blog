import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyAgent, collectTelemetry, fillSeries, reportedSubscribers, type TelemetryEnv } from "@/lib/telemetry";
import { blogPostsMeta } from "@/data/blogMeta";
import { lighthouseSql } from "../../../scripts/lighthouse-to-sql";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** D1 fake that answers by SQL text. */
function fakeDb(answer: (sql: string) => { first?: unknown; all?: unknown[] } | Error = () => ({})) {
  return {
    prepare: (sql: string) => {
      const stmt = {
        bind: () => stmt,
        first: async () => {
          const a = answer(sql);
          if (a instanceof Error) throw a;
          return a.first ?? { n: 0 };
        },
        all: async () => {
          const a = answer(sql);
          if (a instanceof Error) throw a;
          return { results: a.all ?? [] };
        },
        run: async () => ({ success: true }),
      };
      return stmt;
    },
  } as unknown as D1Database;
}

const umamiEnv: TelemetryEnv = { UMAMI_API_TOKEN: "t", UMAMI_WEBSITE_ID: "w" };
const cfEnv: TelemetryEnv = { CLOUDFLARE_ANALYTICS_TOKEN: "t", CLOUDFLARE_ZONE_ID: "z" };
const gql = (init?: RequestInit) => JSON.parse(String(init?.body)).query as string;

describe("fillSeries", () => {
  const now = Date.parse("2026-11-01T05:30:00Z");

  it("puts one point in every hour and zero where the source had no row", () => {
    const rows = [
      { t: "2026-11-01 02:00:00", value: 4 }, // Umami, UTC without a zone
      { t: "2026-11-01T04:00:00Z", value: 7 }, // Cloudflare ISO
    ];
    const out = fillSeries(rows, Date.parse("2026-11-01T01:10:00Z"), "hour", now);
    expect(out.map((p) => p.value)).toEqual([0, 4, 0, 7, 0]);
    expect(out[0]!.t).toBe("2026-11-01T01:00:00.000Z");
  });

  it("adds rows that land in the same day", () => {
    const out = fillSeries([{ t: "2026-10-31 08:00:00", value: 2 }, { t: "2026-10-31 20:00:00", value: 3 }], Date.parse("2026-10-30T12:00:00Z"), "day", now);
    expect(out.map((p) => [p.t.slice(0, 10), p.value])).toEqual([["2026-10-30", 0], ["2026-10-31", 5], ["2026-11-01", 0]]);
  });
});

describe("user agents", () => {
  it("names known AI, search and feed agents and groups the rest", () => {
    expect(classifyAgent("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)")).toEqual({ name: "GPTBot", kind: "ai" });
    expect(classifyAgent("Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)")).toEqual({ name: "ClaudeBot", kind: "ai" });
    expect(classifyAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toEqual({ name: "Googlebot", kind: "search" });
    expect(classifyAgent("Feedly/1.0 (+http://www.feedly.com/fetcher.html; 42 subscribers; )")).toEqual({ name: "Feedly", kind: "feed" });
    expect(classifyAgent("Tiny Tiny RSS/23.04 (12 subscribers)")).toEqual({ name: "Tiny", kind: "feed" });
    // Many readers start with the generic browser prefix; that is not a reader name.
    expect(classifyAgent("Mozilla/5.0 (compatible; SomeReader; 12 subscribers)")).toEqual({ name: "Feed reader", kind: "feed" });
    expect(classifyAgent("Mozilla/5.0 (Macintosh) Safari/605.1.15")).toEqual({ name: "Other agents", kind: "other" });
  });

  it("reads the subscriber count a feed reader reports", () => {
    expect(reportedSubscribers("Feedly/1.0 (+http://www.feedly.com/fetcher.html; 42 subscribers; )")).toBe(42);
    expect(reportedSubscribers("NewsBlur Feed Fetcher - 1 subscriber - https://www.newsblur.com")).toBe(1);
    expect(reportedSubscribers("curl/8.0")).toBeNull();
  });
});

describe("collectTelemetry insights", () => {
  it("joins post pageviews (both languages) with finished reads", async () => {
    const [first, second] = [...new Set(blogPostsMeta.map((p) => p.slug))];
    const f = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("/event-data/values")) {
        expect(u).toContain("eventName=blog-read-complete");
        expect(u).toContain("propertyName=slug");
        return json([{ value: first, total: 6 }]);
      }
      if (u.includes("type=path")) return json([{ x: `/blog/${first}/`, y: 10 }, { x: `/blog/ru/${first}`, y: 5 }, { x: `/blog/${second}`, y: 2 }]);
      return json([]);
    });
    const t = await collectTelemetry(umamiEnv, fakeDb(), "7d", f as typeof fetch);
    expect(t.reading.status).toBe("ok");
    const posts = t.reading.status === "ok" ? t.reading.data.posts : [];
    expect(posts[0]).toMatchObject({ slug: first, pageviews: 15, completions: 6 });
    expect(posts[1]).toMatchObject({ slug: second, pageviews: 2, completions: 0 });
    expect(posts).toHaveLength(new Set(blogPostsMeta.map((p) => p.slug)).size);
  });

  it("groups crawler requests by agent and keeps the largest reported subscriber count", async () => {
    const g = (count: number, clientRequestPath: string, userAgent: string) => ({ count, dimensions: { clientRequestPath, userAgent } });
    const f = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if (!gql(init).includes("query Crawlers")) return json({ data: { viewer: { zones: [] } } });
      return json({
        data: {
          viewer: {
            zones: [
              {
                httpRequestsAdaptiveGroups: [
                  g(9, "/llms.txt", "GPTBot/1.2"),
                  g(4, "/blog/a.md", "GPTBot/1.2"),
                  g(3, "/blog/b.md", "GPTBot/1.2"),
                  g(5, "/rss.xml", "Feedly/1.0 (; 40 subscribers; )"),
                  g(2, "/rss.xml", "Feedly/1.0 (; 42 subscribers; )"),
                  g(1, "/robots.txt", "Mozilla/5.0 Safari"),
                ],
              },
            ],
          },
        },
      });
    });
    const t = await collectTelemetry(cfEnv, fakeDb(), "24h", f as typeof fetch);
    expect(t.crawlers.status).toBe("ok");
    if (t.crawlers.status !== "ok") return;
    expect(t.crawlers.data.total).toBe(24);
    expect(t.crawlers.data.crawlers[0]).toEqual({
      name: "GPTBot",
      kind: "ai",
      requests: 16,
      paths: [{ label: "/llms.txt", count: 9 }, { label: "/blog/*.md", count: 7 }],
    });
    expect(t.crawlers.data.crawlers.at(-1)?.name).toBe("Other agents");
    expect(t.crawlers.data.feedReaders).toEqual([{ name: "Feedly", feed: "/rss.xml", subscribers: 42 }]);
    expect(t.crawlers.data.truncated).toBe(false);
  });

  it("reads deploy markers from the deploys table the deploy job writes", async () => {
    const db = fakeDb((sql) =>
      sql.includes("FROM deploys")
        ? { all: [{ commit_sha: "aaaaaaaaaa", deployed_at: "2026-10-31 10:00:00" }, { commit_sha: "bbbbbbbbbb", deployed_at: "2026-11-01 10:00:00" }] }
        : {},
    );
    const f = vi.fn();
    const t = await collectTelemetry({}, db, "7d", f as typeof fetch);
    expect(f).not.toHaveBeenCalled();
    expect(t.deploys).toEqual({
      status: "ok",
      data: [
        { at: "2026-10-31 10:00:00", commit: "aaaaaaa", url: "https://github.com/po4yka/blog/commit/aaaaaaaaaa" },
        { at: "2026-11-01 10:00:00", commit: "bbbbbbb", url: "https://github.com/po4yka/blog/commit/bbbbbbbbbb" },
      ],
    });
  });

  it("shows no deploy markers before the deploys table exists", async () => {
    const db = fakeDb((sql) => (sql.includes("FROM deploys") ? new Error("D1_ERROR: no such table: deploys") : {}));
    const t = await collectTelemetry({}, db, "7d", vi.fn() as typeof fetch);
    expect(t.deploys).toEqual({ status: "ok", data: [] });
  });

  it("leaves out the sessions overlay when Umami sends no session series", async () => {
    const f = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("/pageviews") ? json({ pageviews: [{ x: "2026-11-01 00:00:00", y: 3 }] }) : json([]),
    );
    const t = await collectTelemetry(umamiEnv, fakeDb(), "7d", f as typeof fetch);
    expect(t.visitTrend.status === "ok" && t.visitTrend.data.sessions).toBeNull();
  });

  it("reports no Lighthouse results while the table does not exist yet", async () => {
    const db = fakeDb((sql) => (sql.includes("lighthouse_runs") ? new Error("D1_ERROR: no such table: lighthouse_runs") : {}));
    const t = await collectTelemetry({}, db, "7d", vi.fn() as typeof fetch);
    expect(t.lighthouse).toEqual({ status: "ok", data: { latest: null, history: [] } });
  });

  it("maps the latest Lighthouse deploy and the history", async () => {
    const db = fakeDb((sql) => {
      if (sql.includes("ORDER BY measured_at DESC LIMIT 1")) return { first: { commit_sha: "abcdef1234", measured_at: "2026-11-01 10:00:00" } };
      if (sql.includes("WHERE commit_sha = ?")) {
        return {
          all: [{ commit_sha: "abcdef1234", measured_at: "2026-11-01 10:00:00", form_factor: "mobile", path: "/", performance: 0.91, accessibility: 1, best_practices: 0.96, lcp_ms: 1800, cls: 0.01, tbt_ms: 40 }],
        };
      }
      if (sql.includes("AVG(performance)")) return { all: [{ commit_sha: "abcdef1234", measured_at: "2026-11-01 10:00:00", form_factor: "mobile", performance: 0.9 }] };
      return {};
    });
    const t = await collectTelemetry({}, db, "7d", vi.fn() as typeof fetch);
    expect(t.lighthouse).toEqual({
      status: "ok",
      data: {
        latest: {
          commit: "abcdef1",
          measuredAt: "2026-11-01 10:00:00",
          rows: [{ formFactor: "mobile", path: "/", performance: 0.91, accessibility: 1, bestPractices: 0.96, lcpMs: 1800, cls: 0.01, tbtMs: 40 }],
        },
        history: [{ commit: "abcdef1", measuredAt: "2026-11-01 10:00:00", formFactor: "mobile", performance: 0.9 }],
      },
    });
  });
});

describe("lighthouseSql", () => {
  let dir: string;
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  function report(form: string, url: string, file: string, summary: Record<string, number>, audits: Record<string, number>) {
    const d = path.join(dir, form);
    fs.mkdirSync(d, { recursive: true });
    const lhr = { audits: Object.fromEntries(Object.entries(audits).map(([k, v]) => [k, { numericValue: v }])) };
    fs.writeFileSync(path.join(d, file), JSON.stringify(lhr));
    const manifestPath = path.join(d, "manifest.json");
    const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : [];
    // jsonPath is absolute on the CI runner; only the file name survives the artifact.
    manifest.push({ url, isRepresentativeRun: true, htmlPath: "", jsonPath: `/home/runner/work/blog/${file}`, summary });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  }

  it("replaces the commit's rows and inserts one row per page and device", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-"));
    report("desktop", "http://localhost:4321/", "home.json", { performance: 0.98, accessibility: 1, "best-practices": 0.96 }, {
      "largest-contentful-paint": 900,
      "cumulative-layout-shift": 0.002,
      "total-blocking-time": 10,
    });
    report("desktop", "http://localhost:4321/blog/it's/", "post.json", { performance: 0.9, accessibility: 0.95, "best-practices": 1 }, {
      "largest-contentful-paint": 1200,
    });
    const sql = lighthouseSql(dir, "0123abc", "2026-11-01 10:00:00");
    const lines = sql.trim().split("\n");
    expect(lines[0]).toBe("DELETE FROM lighthouse_runs WHERE commit_sha = '0123abc';");
    expect(lines.filter((l) => l.startsWith("INSERT"))).toEqual([
      "INSERT INTO lighthouse_runs (commit_sha, measured_at, form_factor, path, performance, accessibility, best_practices, lcp_ms, cls, tbt_ms) VALUES ('0123abc', '2026-11-01 10:00:00', 'desktop', '/', 0.98, 1, 0.96, 900, 0.002, 10);",
      "INSERT INTO lighthouse_runs (commit_sha, measured_at, form_factor, path, performance, accessibility, best_practices, lcp_ms, cls, tbt_ms) VALUES ('0123abc', '2026-11-01 10:00:00', 'desktop', '/blog/it''s/', 0.9, 0.95, 1, 1200, NULL, NULL);",
    ]);
    expect(lines.at(-1)).toContain("DELETE FROM lighthouse_runs WHERE measured_at < datetime('now', '-180 days');");
  });

  it("refuses a value that is not a commit SHA, and an empty report directory", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-"));
    expect(() => lighthouseSql(dir, "main; DROP TABLE x", "2026-11-01 10:00:00")).toThrow(/Not a commit SHA/);
    expect(() => lighthouseSql(dir, "0123abc", "2026-11-01 10:00:00")).toThrow(/No Lighthouse manifests/);
  });
});
