import { describe, it, expect, vi } from "vitest";
import { createMockDb, createApiContext, createAuthenticatedContext } from "../../helpers";

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

describe("POST /api/admin/categories", () => {
  it("adds category with valid body", async () => {
    const { POST } = await import("@/pages/api/admin/categories/index");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "POST",
      db,
      body: { name: "KMP" },
    });

    const response = await POST(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { POST } = await import("@/pages/api/admin/categories/index");

    const context = createApiContext({
      method: "POST",
      body: { name: "KMP" },
    });

    await expect(POST(context)).rejects.toBeInstanceOf(Response);

    try {
      await POST(context);
    } catch (e) {
      expect((e as Response).status).toBe(401);
    }
  });

  it("returns 400 with invalid body", async () => {
    const { POST } = await import("@/pages/api/admin/categories/index");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "POST",
      db,
      body: { name: "" },
    });

    const response = await POST(context);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid request");
  });
});

describe("DELETE /api/admin/categories/[name]", () => {
  it("deletes category", async () => {
    const { DELETE } = await import("@/pages/api/admin/categories/[name]");

    const db = createMockDb();
    // The handler calls decodeURIComponent(params.name)
    const context = createAuthenticatedContext({
      method: "DELETE",
      db,
      params: { name: "Android" },
    });

    const response = await DELETE(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("deletes URL-encoded category name", async () => {
    const { DELETE } = await import("@/pages/api/admin/categories/[name]");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "DELETE",
      db,
      params: { name: "Kotlin%20Multiplatform" },
    });

    const response = await DELETE(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { DELETE } = await import("@/pages/api/admin/categories/[name]");

    const context = createApiContext({
      method: "DELETE",
      params: { name: "Android" },
    });

    await expect(DELETE(context)).rejects.toBeInstanceOf(Response);

    try {
      await DELETE(context);
    } catch (e) {
      expect((e as Response).status).toBe(401);
    }
  });
});
