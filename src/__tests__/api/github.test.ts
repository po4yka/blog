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

  it("returns error when API fails with no cache", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });

    const GET = await getHandler();
    const response = await GET(ctx);
    expect(response.status).toBe(502);
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
