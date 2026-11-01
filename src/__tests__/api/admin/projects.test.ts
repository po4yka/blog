import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiContext } from "../../helpers";

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

    const response = await (GET(ctx) as Promise<Response>).catch((r: Response) => r);
    expect((response as Response).status).toBe(401);
  });
});
