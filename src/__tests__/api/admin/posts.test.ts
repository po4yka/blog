import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiContext, createAuthenticatedContext } from "../../helpers";

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

const VALID_POST = {
  slug: "test-post",
  title: "Test Post",
  date: "2024-01-01",
  summary: "A summary",
  tags: ["tag1"],
  category: "engineering",
  content: "Hello world",
};

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

    const response = await GET(ctx).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });
});

describe("POST /api/admin/posts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates post with valid body", async () => {
    const { POST } = await import("@/pages/api/admin/posts/index");

    const db = createListMockDb();
    const ctx = createAuthenticatedContext({ method: "POST", body: VALID_POST, db });

    const response = await POST(ctx);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { POST } = await import("@/pages/api/admin/posts/index");

    const db = createListMockDb();
    const ctx = createApiContext({ method: "POST", body: VALID_POST, db });

    const response = await POST(ctx).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });

  it("returns 400 with invalid body (missing required fields)", async () => {
    const { POST } = await import("@/pages/api/admin/posts/index");

    const db = createListMockDb();
    const ctx = createAuthenticatedContext({
      method: "POST",
      body: { title: "No slug here" },
      db,
    });

    const response = await POST(ctx);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 with malformed JSON", async () => {
    const { POST } = await import("@/pages/api/admin/posts/index");

    const db = createListMockDb();
    // Prime session for requireAuth before JSON parse
    db.first.mockResolvedValueOnce({ token: "valid-test-token" });

    const request = new Request("http://localhost/api/admin/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-test-token",
      },
      body: "{ not valid json",
    });

    const ctx = {
      request,
      params: {},
      locals: { runtime: { env: { DB: db, ADMIN_PASSWORD: "test-password" } } },
    } as unknown as import("astro").APIContext;

    const response = await POST(ctx);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 500 on DB error", async () => {
    const { POST } = await import("@/pages/api/admin/posts/index");

    const run = vi.fn()
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValue(new Error("D1 write failure"));
    const first = vi.fn().mockResolvedValueOnce({ token: "valid-test-token" });
    const all = vi.fn().mockResolvedValue({ results: [] });
    const bind = vi.fn().mockReturnValue({ run, first, all });
    const prepare = vi.fn().mockReturnValue({ run, bind, first, all });
    const db = { prepare, bind, run, first, all } as unknown as D1Database & {
      first: ReturnType<typeof vi.fn>;
    };

    const ctx = createAuthenticatedContext({ method: "POST", body: VALID_POST, db });

    const response = await POST(ctx);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe("Database error");
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

describe("PUT /api/admin/posts/[slug]", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("updates post with valid body", async () => {
    const { PUT } = await import("@/pages/api/admin/posts/[slug]");

    const db = createListMockDb();
    const ctx = createAuthenticatedContext({
      method: "PUT",
      body: VALID_POST,
      params: { slug: "test-post" },
      db,
    });

    const response = await PUT(ctx);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { PUT } = await import("@/pages/api/admin/posts/[slug]");

    const db = createListMockDb();
    const ctx = createApiContext({
      method: "PUT",
      body: VALID_POST,
      params: { slug: "test-post" },
      db,
    });

    const response = await PUT(ctx).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });
});

describe("DELETE /api/admin/posts/[slug]", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("deletes post when authenticated", async () => {
    const { DELETE } = await import("@/pages/api/admin/posts/[slug]");

    const db = createListMockDb();
    const ctx = createAuthenticatedContext({
      method: "DELETE",
      params: { slug: "test-post" },
      db,
    });

    const response = await DELETE(ctx);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { DELETE } = await import("@/pages/api/admin/posts/[slug]");

    const db = createListMockDb();
    const ctx = createApiContext({
      method: "DELETE",
      params: { slug: "test-post" },
      db,
    });

    const response = await DELETE(ctx).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });
});
