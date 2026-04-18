import { describe, it, expect, vi, beforeEach } from "vitest";

// GitHub routes use module-level cache and global fetch.
// We stub fetch and re-import each route fresh per test to reset cache.

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  vi.resetModules();
});

describe("GET /api/github/repos", () => {
  async function getHandler() {
    const mod = await import("@/pages/api/github/repos");
    return mod.GET;
  }

  const ctx = { request: new Request("http://localhost/api/github/repos") } as import("astro").APIContext;

  it("fetches from GitHub API and returns filtered repos", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: "repo1", description: "Test", html_url: "https://github.com/test/repo1", stargazers_count: 5, language: "Kotlin", topics: ["android"], fork: false, archived: false },
        { name: "forked", description: null, html_url: "https://github.com/test/forked", stargazers_count: 0, language: null, topics: [], fork: true, archived: false },
      ],
    });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("repo1");
    expect(response.headers.get("X-Cache")).toBe("MISS");
  });

  it("serves stale cache when GitHub API fails", async () => {
    // First call: populate cache
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: "cached-repo", description: "", html_url: "url", stargazers_count: 0, language: null, topics: [], fork: false, archived: false },
      ],
    });

    const GET = await getHandler();
    await GET(ctx);

    // Expire cache by manipulating time
    vi.useFakeTimers();
    vi.advanceTimersByTime(11 * 60 * 1000); // 11 minutes, past 10-min TTL

    // Second call: GitHub fails
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("STALE");

    vi.useRealTimers();
  });

  it("returns empty array when API fails with no cache", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});

describe("GET /api/github/events", () => {
  async function getHandler() {
    const mod = await import("@/pages/api/github/events");
    return mod.GET;
  }

  const ctx = { request: new Request("http://localhost/api/github/events") } as import("astro").APIContext;

  it("aggregates events into 14-day buckets", async () => {
    const now = new Date();
    const events = [
      { created_at: now.toISOString() },
      { created_at: now.toISOString() },
      { created_at: new Date(now.getTime() - 2 * 86400000).toISOString() }, // 2 days ago
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => events,
    });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.total).toBe(3);
    expect(data.buckets).toHaveLength(14);
    expect(data.latest).toBe(events[0]!.created_at);
  });

  it("handles empty event list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const GET = await getHandler();
    const response = await GET(ctx);
    const data = await response.json();
    expect(data.total).toBe(0);
    expect(data.latest).toBeNull();
  });
});

describe("GET /api/github/latest-release", () => {
  async function getHandler() {
    const mod = await import("@/pages/api/github/latest-release");
    return mod.GET;
  }

  const ctx = { request: new Request("http://localhost/api/github/latest-release") } as import("astro").APIContext;

  it("returns first repo with a release", async () => {
    // First fetch: list repos
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ name: "my-app" }, { name: "my-lib" }],
    });
    // Second fetch: first repo has no release (404)
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    // Third fetch: second repo has a release
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        tag_name: "v1.0.0",
        name: "First Release",
        published_at: "2025-01-15T00:00:00Z",
        html_url: "https://github.com/test/my-lib/releases/v1.0.0",
      }),
    });

    const GET = await getHandler();
    const response = await GET(ctx);
    const data = await response.json();

    expect(data.repo).toBe("my-lib");
    expect(data.tagName).toBe("v1.0.0");
  });

  it("returns null when no repos have releases", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ name: "no-release" }],
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const GET = await getHandler();
    const response = await GET(ctx);
    const data = await response.json();
    expect(data).toBeNull();
  });
});

describe("GET /api/github/commits", () => {
  async function getHandler() {
    const mod = await import("@/pages/api/github/commits");
    return mod.GET;
  }

  const ctx = { request: new Request("http://localhost/api/github/commits") } as import("astro").APIContext;

  it("extracts commits from PushEvents and ignores other event types", async () => {
    const now = new Date();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        // Non-push: ignored
        { type: "WatchEvent", created_at: now.toISOString(), repo: { name: "po4yka/blog" } },
        // Push with 2 commits: both counted
        {
          type: "PushEvent",
          created_at: new Date(now.getTime() - 3 * 3600000).toISOString(), // 3h ago
          repo: { name: "po4yka/blog" },
          payload: {
            commits: [
              { sha: "abcdef1234567890", message: "feat: add thing\n\nbody" },
              { sha: "1234567890abcdef", message: "fix: tweak" },
            ],
          },
        },
        // Another push, older
        {
          type: "PushEvent",
          created_at: new Date(now.getTime() - 2 * 86400000).toISOString(), // 2d ago
          repo: { name: "po4yka/other" },
          payload: {
            commits: [{ sha: "deadbeefdeadbeef", message: "chore: cleanup" }],
          },
        },
      ],
    });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("MISS");

    const data = await response.json();
    expect(data).toHaveLength(3);
    expect(data[0].hash).toBe("abcdef1"); // 7-char short sha
    expect(data[0].msg).toBe("feat: add thing"); // first line only
    expect(data[0].date).toBe("3h ago");
    expect(data[0].url).toBe("https://github.com/po4yka/blog/commit/abcdef1234567890");
    expect(data[2].date).toBe("2d ago");
  });

  it("caps output at MAX_COMMITS (7)", async () => {
    const now = new Date().toISOString();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          type: "PushEvent",
          created_at: now,
          repo: { name: "po4yka/blog" },
          payload: {
            commits: Array.from({ length: 20 }, (_, i) => ({
              sha: `${i}`.padStart(40, "0"),
              message: `commit ${i}`,
            })),
          },
        },
      ],
    });

    const GET = await getHandler();
    const response = await GET(ctx);
    const data = await response.json();
    expect(data).toHaveLength(7);
  });

  it("returns empty array when GitHub API fails with no cache", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("MISS");
    expect(await response.json()).toEqual([]);
  });
});

describe("GET /api/github/calendar", () => {
  async function getHandler() {
    const mod = await import("@/pages/api/github/calendar");
    return mod.GET;
  }

  const ctx = { request: new Request("http://localhost/api/github/calendar") } as import("astro").APIContext;

  it("returns created_at dates from events", async () => {
    const events = [
      { created_at: "2026-04-10T12:00:00Z" },
      { created_at: "2026-04-11T08:00:00Z" },
    ];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => events });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("MISS");
    expect(await response.json()).toEqual(events);
  });

  it("serves stale cache when GitHub API fails after a prior success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ created_at: "2026-04-10T12:00:00Z" }],
    });
    const GET = await getHandler();
    await GET(ctx);

    // Expire cache (15-min TTL)
    vi.useFakeTimers();
    vi.advanceTimersByTime(16 * 60 * 1000);

    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("STALE");
    vi.useRealTimers();
  });

  it("returns empty array on first-time failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});

describe("GET /api/github/actions", () => {
  async function getHandler() {
    const mod = await import("@/pages/api/github/actions");
    return mod.GET;
  }

  const ctx = { request: new Request("http://localhost/api/github/actions") } as import("astro").APIContext;

  it("maps workflow runs to ActionsSummary and computes duration for completed runs", async () => {
    const created = "2026-04-18T12:00:00Z";
    const updated = "2026-04-18T12:03:30Z"; // +210 sec
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        workflow_runs: [
          {
            name: "CI",
            status: "completed",
            conclusion: "success",
            html_url: "https://github.com/po4yka/blog/actions/runs/1",
            created_at: created,
            updated_at: updated,
            head_sha: "abcdef1234567890",
            head_branch: "main",
            run_number: 42,
          },
          {
            name: "Deploy",
            status: "in_progress",
            conclusion: null,
            html_url: "https://github.com/po4yka/blog/actions/runs/2",
            created_at: created,
            updated_at: created,
            head_sha: "1234567890abcdef",
            head_branch: "main",
            run_number: 43,
          },
        ],
      }),
    });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("MISS");

    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].durationSec).toBe(210);
    expect(data[0].commit).toBe("abcdef1");
    expect(data[0].runNumber).toBe(42);
    expect(data[1].durationSec).toBeNull(); // in_progress → null
  });

  it("serves cache on second call within TTL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        workflow_runs: [
          {
            name: "CI",
            status: "completed",
            conclusion: "success",
            html_url: "https://github.com/po4yka/blog/actions/runs/1",
            created_at: "2026-04-18T12:00:00Z",
            updated_at: "2026-04-18T12:01:00Z",
            head_sha: "abcdef1234567890",
            head_branch: "main",
            run_number: 1,
          },
        ],
      }),
    });

    const GET = await getHandler();
    await GET(ctx);

    // Second call uses cache — fetch must not be called again
    const response = await GET(ctx);
    expect(response.headers.get("X-Cache")).toBe("HIT");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when GitHub API fails with no cache", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
