import { describe, it, expect, vi } from "vitest";
import { createApiContext } from "../../helpers";

// Build a db mock that handles both requireAuth (.first() via bind) and
// getCategories (.all()). requireAuth calls prepare -> bind -> first.
// getCategories calls prepare -> all.
function createCategoriesGetDb(categories: unknown[]) {
  const token = "valid-test-token";
  const first = vi.fn().mockResolvedValueOnce({ token });
  const run = vi.fn().mockResolvedValue({ success: true, results: [] });
  const all = vi.fn().mockResolvedValue({ results: categories });
  const bind = vi.fn().mockReturnValue({ run, first });
  const prepare = vi.fn().mockImplementation((sql: string) => {
    if (sql.includes("SELECT name FROM categories")) return { all };
    return { run, bind };
  });
  return { prepare, bind, run, first, all } as unknown as D1Database & {
    first: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
  };
}

describe("GET /api/admin/categories", () => {
  it("returns categories list", async () => {
    const { GET } = await import("@/pages/api/admin/categories/index");

    const mockCategories = [{ name: "Android" }, { name: "iOS" }];

    const db = createCategoriesGetDb(mockCategories);
    const context = createApiContext({
      method: "GET",
      db: db as unknown as D1Database,
      headers: { Authorization: "Bearer valid-test-token" },
    });

    const response = await GET(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toEqual(["Android", "iOS"]);
  });
});
