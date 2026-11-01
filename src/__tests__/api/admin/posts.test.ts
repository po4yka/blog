import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiContext } from "../../helpers";

// Build a db mock that supports both .all() (for list queries) and
// .bind().first() (for single-row lookups) and .bind().run() (for writes).
function createListMockDb(rows: unknown[] = []) {
  const run = vi.fn().mockResolvedValue({ success: true });
  const first = vi.fn().mockResolvedValue(null);
  const all = vi.fn().mockResolvedValue({ results: rows });
  const bind = vi.fn().mockReturnValue({ run, first, all });
  const prepare = vi.fn().mockReturnValue({ run, bind, first, all });
  return { prepare, bind, run, first, all } as unknown as D1Database & {
    bind: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
  };
}

describe("GET /api/admin/posts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns posts list when authenticated", async () => {
    const { GET } = await import("@/pages/api/admin/posts/index");

    const postRow = {
      slug: "my-post",
      title: "My Post",
      date: "2024-01-01",
      summary: "Sum",
      tags: '["ts"]',
      category: "engineering",
      content: "body",
      featured: 0,
      reading_time: null,
    };

    const db = createListMockDb([postRow]);
    // Prime the session lookup used by requireAuth
    db.first.mockResolvedValueOnce({ token: "valid-test-token" });

    const ctx = createApiContext({
      method: "GET",
      db,
      headers: { Authorization: "Bearer valid-test-token" },
    });

    const response = await GET(ctx);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].slug).toBe("my-post");
  });

  it("returns 401 when no auth header", async () => {
    const { GET } = await import("@/pages/api/admin/posts/index");

    const db = createListMockDb();
    const ctx = createApiContext({ method: "GET", db });

    const response = await (GET(ctx) as Promise<Response>).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });
});

describe("GET /api/admin/posts/[slug]", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns single post when found", async () => {
    const { GET } = await import("@/pages/api/admin/posts/[slug]");

    const postRow = {
      slug: "my-post",
      title: "My Post",
      date: "2024-01-01",
      summary: "Sum",
      tags: '["ts"]',
      category: "engineering",
      content: "body",
      featured: 0,
      reading_time: null,
    };

    const db = createListMockDb();
    // First call: session check in requireAuth; second call: getPostBySlug
    db.first
      .mockResolvedValueOnce({ token: "valid-test-token" })
      .mockResolvedValueOnce(postRow);

    const ctx = createApiContext({
      method: "GET",
      params: { slug: "my-post" },
      db,
      headers: { Authorization: "Bearer valid-test-token" },
    });

    const response = await GET(ctx);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.slug).toBe("my-post");
    expect(body.title).toBe("My Post");
  });

  it("returns 404 when post not found", async () => {
    const { GET } = await import("@/pages/api/admin/posts/[slug]");

    const db = createListMockDb();
    db.first
      .mockResolvedValueOnce({ token: "valid-test-token" })
      .mockResolvedValueOnce(null);

    const ctx = createApiContext({
      method: "GET",
      params: { slug: "missing-post" },
      db,
      headers: { Authorization: "Bearer valid-test-token" },
    });

    const response = await GET(ctx);
    expect(response.status).toBe(404);
  });
});
