import { describe, expect, it, vi } from "vitest";
import { collectTelemetry, statusBuckets, umamiPair, type TelemetryEnv } from "@/lib/telemetry";
import { countFailedSignIn, recordLoginAttempt } from "@/lib/auth";

/** D1 fake: answers COUNT queries with `counts[table]`, and the failures query with `failures` (or throws). */
function fakeDb(opts: { counts?: Record<string, number>; failures?: { day: string; count: number }[] | Error }) {
  const prepare = vi.fn((sql: string) => {
    const table = /FROM (\w+)/.exec(sql)?.[1] ?? "";
    const stmt = {
      bind: () => stmt,
      first: async () => ({ n: opts.counts?.[table] ?? 0 }),
      all: async () => {
        if (opts.failures instanceof Error) throw opts.failures;
        return { results: opts.failures ?? [] };
      },
      run: async () => ({ success: true }),
    };
    return stmt;
  });
  return { prepare } as unknown as D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const fullEnv: TelemetryEnv = {
  UMAMI_API_TOKEN: "umami-test-token",
  UMAMI_WEBSITE_ID: "site-1",
  CLOUDFLARE_ANALYTICS_TOKEN: "cf-test-token",
  CLOUDFLARE_ZONE_ID: "zone-1",
  CLOUDFLARE_ACCOUNT_ID: "acct-1",
};

describe("umamiPair", () => {
  it("reads current Umami (number + comparison)", () => {
    expect(umamiPair({ pageviews: 5, comparison: { pageviews: 4 } }, "pageviews")).toEqual({ now: 5, prev: 4 });
  });
  it("reads Umami 2.x ({ value, prev })", () => {
    expect(umamiPair({ pageviews: { value: 7, prev: 2 } }, "pageviews")).toEqual({ now: 7, prev: 2 });
  });
  it("treats a missing field as zero with no comparison", () => {
    expect(umamiPair({}, "visits")).toEqual({ now: 0, prev: null });
  });
});

describe("statusBuckets", () => {
  it("groups status codes by class and ignores codes outside 2xx-5xx", () => {
    const g = (s: number, count: number) => ({ count, dimensions: { edgeResponseStatus: s } });
    expect(statusBuckets([g(200, 10), g(304, 3), g(404, 2), g(403, 1), g(502, 4), g(101, 9)])).toEqual({
      "2xx": 10,
      "3xx": 3,
      "4xx": 3,
      "5xx": 4,
    });
  });
});

describe("collectTelemetry", () => {
  it("reports which secrets are missing instead of calling the APIs", async () => {
    const f = vi.fn();
    const t = await collectTelemetry({}, fakeDb({ counts: { admin_credentials: 1 } }), "7d", f);
    expect(f).not.toHaveBeenCalled();
    expect(t.visits).toEqual({ status: "unconfigured", missing: ["UMAMI_API_TOKEN", "UMAMI_WEBSITE_ID"] });
    expect(t.edge).toEqual({ status: "unconfigured", missing: ["CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ZONE_ID"] });
    expect(t.worker).toEqual({ status: "unconfigured", missing: ["CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ACCOUNT_ID"] });
    expect(t.d1.status).toBe("ok");
  });

  it("maps Umami and Cloudflare responses and keeps a failing section separate", async () => {
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      if (u.includes("/stats")) return json({ pageviews: 120, visitors: 40, visits: 50, bounces: 20, totaltime: 3000, comparison: { pageviews: 100, visitors: 35, visits: 44, bounces: 18, totaltime: 2500 } });
      if (u.includes("/active")) return json({ visitors: 3 });
      if (u.includes("type=path")) return json([{ x: "/blog", y: 60 }]);
      if (u.includes("/metrics")) return json([]);
      const query = JSON.parse(String(init?.body)).query as string;
      if (query.includes("firewallEventsAdaptiveGroups")) return json({ data: null, errors: [{ message: "zone does not have access to the path" }] });
      if (query.includes("workersInvocationsAdaptive")) {
        return json({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [{ sum: { requests: 900, errors: 2, subrequests: 30 }, quantiles: { cpuTimeP50: 1500, cpuTimeP99: 9000 } }] }] } } });
      }
      return json({
        data: {
          viewer: {
            zones: [
              {
                totals: [{ count: 1000, sum: { edgeResponseBytes: 5_000_000, visits: 300 } }],
                status: [{ count: 950, dimensions: { edgeResponseStatus: 200 } }, { count: 50, dimensions: { edgeResponseStatus: 404 } }],
                cache: [{ count: 700, dimensions: { cacheStatus: "hit" } }],
                countries: [{ count: 400, dimensions: { clientCountryName: "DE" } }],
                notFound: [{ count: 12, dimensions: { clientRequestPath: "/wp-login.php" } }],
                probes: [{ count: 12, dimensions: { clientRequestPath: "/wp-login.php" } }],
              },
            ],
          },
        },
      });
    });

    const t = await collectTelemetry(fullEnv, fakeDb({ failures: [{ day: "2026-11-01", count: 4 }] }), "7d", f as typeof fetch);

    const umamiCall = f.mock.calls.find(([u]) => String(u).includes("/stats"))!;
    expect(String(umamiCall[0])).toContain("/api/websites/site-1/stats");
    expect((umamiCall[1]?.headers as Record<string, string>).Authorization).toBe("Bearer umami-test-token");

    expect(t.visits.status === "ok" && t.visits.data).toMatchObject({
      pageviews: { now: 120, prev: 100 },
      active: 3,
      pages: [{ label: "/blog", count: 60 }],
    });
    expect(t.edge.status === "ok" && t.edge.data).toMatchObject({
      requests: 1000,
      visits: 300,
      status: { "2xx": 950, "4xx": 50 },
      probes: [{ label: "/wp-login.php", count: 12 }],
    });
    expect(t.worker.status === "ok" && t.worker.data).toEqual({ requests: 900, errors: 2, subrequests: 30, cpuP50Ms: 1.5, cpuP99Ms: 9 });
    expect(t.firewall).toEqual({ status: "error", message: "zone does not have access to the path" });
    expect(t.d1.status === "ok" && t.d1.data.failures).toEqual([{ day: "2026-11-01", count: 4 }]);
  });

  it("asks Umami 2.x for the page metric as url when it rejects path", async () => {
    const f = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("type=path")) return json({ error: "Bad request" }, 400);
      if (u.includes("type=url")) return json([{ x: "/blog", y: 9 }]);
      if (u.includes("/metrics")) return json([]);
      if (u.includes("/stats")) return json({ pageviews: { value: 9, prev: 3 } });
      return json({ x: 1 });
    });
    const t = await collectTelemetry({ UMAMI_API_TOKEN: "x", UMAMI_WEBSITE_ID: "y" }, fakeDb({}), "7d", f as typeof fetch);
    expect(t.visits.status === "ok" && t.visits.data).toMatchObject({
      pageviews: { now: 9, prev: 3 },
      active: 1,
      pages: [{ label: "/blog", count: 9 }],
    });
  });

  it("turns an upstream HTTP error into a section error", async () => {
    const f = vi.fn(async () => json({}, 401));
    const t = await collectTelemetry({ UMAMI_API_TOKEN: "x", UMAMI_WEBSITE_ID: "y" }, fakeDb({}), "24h", f as typeof fetch);
    expect(t.visits).toEqual({ status: "error", message: "Umami /stats returned 401" });
  });

  it("reports a Worker with no recorded invocations as an error, not as healthy zeros", async () => {
    const f = vi.fn(async () => json({ data: { viewer: { accounts: [{ workersInvocationsAdaptive: [] }] } } }));
    const env = { CLOUDFLARE_ANALYTICS_TOKEN: "t", CLOUDFLARE_ACCOUNT_ID: "a" };
    const t = await collectTelemetry(env, fakeDb({}), "24h", f as typeof fetch);
    expect(t.worker).toEqual({ status: "error", message: 'No invocations recorded for Worker "po4yka-blog" in the last 24 hours' });
  });

  it("reports failures as null when migration 007 is missing", async () => {
    const t = await collectTelemetry({}, fakeDb({ failures: new Error("no such table: auth_failures_daily") }), "30d");
    expect(t.d1.status === "ok" && t.d1.data.failures).toBeNull();
  });
});

describe("recordLoginAttempt", () => {
  it("still records the rate-limit attempt when the daily counter table is missing", async () => {
    const runs: string[] = [];
    const db = {
      prepare: (sql: string) => {
        const stmt = {
          bind: () => stmt,
          run: async () => {
            if (sql.includes("auth_failures_daily")) throw new Error("no such table: auth_failures_daily");
            runs.push(sql);
            return { success: true };
          },
        };
        return stmt;
      },
    } as unknown as D1Database;
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(recordLoginAttempt(db, "1.2.3.4")).resolves.toBeUndefined();
    expect(runs).toEqual(["INSERT INTO login_attempts (ip_address) VALUES (?)"]);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("countFailedSignIn", () => {
  const dbThrowing = (message: string) =>
    ({ prepare: () => ({ run: async () => Promise.reject(new Error(message)) }) }) as unknown as D1Database;

  it("rethrows database errors other than a missing table", async () => {
    await expect(countFailedSignIn(dbThrowing("D1_ERROR: database is locked"))).rejects.toThrow("database is locked");
  });

  it("logs and continues while the table is missing", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(countFailedSignIn(dbThrowing("no such table: auth_failures_daily"))).resolves.toBeUndefined();
    err.mockRestore();
  });
});
