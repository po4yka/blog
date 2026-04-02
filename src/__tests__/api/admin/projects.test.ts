import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiContext, createAuthenticatedContext } from "../../helpers";

// Build a db mock that supports .all() (list queries), .bind().first()
// (single-row lookups), and .bind().run() (writes).
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

const VALID_PROJECT = {
  name: "My App",
  description: "A great app",
  platforms: ["android", "ios"],
  tags: ["kotlin", "swift"],
  links: [{ type: "github", href: "https://github.com/test/app" }],
};

describe("GET /api/admin/projects", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns projects list when authenticated", async () => {
    const { GET } = await import("@/pages/api/admin/projects/index");

    const projectRow = {
      id: "proj-1",
      name: "My App",
      description: "A great app",
      platforms: '["android","ios"]',
      tags: '["kotlin"]',
      links: '[]',
      featured: 0,
      sort_order: 0,
    };

    const db = createListMockDb([projectRow]);
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
    expect(body[0].id).toBe("proj-1");
    expect(body[0].name).toBe("My App");
  });

  it("returns 401 when no auth header", async () => {
    const { GET } = await import("@/pages/api/admin/projects/index");

    const db = createListMockDb();
    const ctx = createApiContext({ method: "GET", db });

    const response = await GET(ctx).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });
});

describe("POST /api/admin/projects", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates project with valid body", async () => {
    const { POST } = await import("@/pages/api/admin/projects/index");

    const db = createListMockDb();
    const ctx = createAuthenticatedContext({ method: "POST", body: VALID_PROJECT, db });

    const response = await POST(ctx);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { POST } = await import("@/pages/api/admin/projects/index");

    const db = createListMockDb();
    const ctx = createApiContext({ method: "POST", body: VALID_PROJECT, db });

    const response = await POST(ctx).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });

  it("returns 400 with invalid body (missing required fields)", async () => {
    const { POST } = await import("@/pages/api/admin/projects/index");

    const db = createListMockDb();
    const ctx = createAuthenticatedContext({
      method: "POST",
      body: { description: "Missing name field" },
      db,
    });

    const response = await POST(ctx);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid request");
  });

  it("returns 400 with malformed JSON", async () => {
    const { POST } = await import("@/pages/api/admin/projects/index");

    const db = createListMockDb();
    db.first.mockResolvedValueOnce({ token: "valid-test-token" });

    const request = new Request("http://localhost/api/admin/projects", {
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
    const { POST } = await import("@/pages/api/admin/projects/index");

    const run = vi.fn().mockRejectedValue(new Error("D1 write failure"));
    const first = vi.fn().mockResolvedValueOnce({ token: "valid-test-token" });
    const all = vi.fn().mockResolvedValue({ results: [] });
    const bind = vi.fn().mockReturnValue({ run, first, all });
    const prepare = vi.fn().mockReturnValue({ run, bind, first, all });
    const db = { prepare, bind, run, first, all } as unknown as D1Database & {
      first: ReturnType<typeof vi.fn>;
    };

    const ctx = createAuthenticatedContext({ method: "POST", body: VALID_PROJECT, db });

    const response = await POST(ctx);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toBe("Database error");
  });
});

describe("DELETE /api/admin/projects/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("deletes project when authenticated", async () => {
    const { DELETE } = await import("@/pages/api/admin/projects/[id]");

    const db = createListMockDb();
    const ctx = createAuthenticatedContext({
      method: "DELETE",
      params: { id: "proj-1" },
      db,
    });

    const response = await DELETE(ctx);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { DELETE } = await import("@/pages/api/admin/projects/[id]");

    const db = createListMockDb();
    const ctx = createApiContext({
      method: "DELETE",
      params: { id: "proj-1" },
      db,
    });

    const response = await DELETE(ctx).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });
});
