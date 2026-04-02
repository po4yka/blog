import { describe, it, expect, vi } from "vitest";
import { createMockDb, createApiContext, createAuthenticatedContext } from "../../helpers";

// Build a db mock that handles both requireAuth (.first() via bind) and
// getAllRoles (.all()). requireAuth calls prepare -> bind -> first.
// getAllRoles calls prepare -> all.
function createRolesGetDb(roles: unknown[]) {
  const token = "valid-test-token";
  const first = vi.fn().mockResolvedValueOnce({ token });
  const run = vi.fn().mockResolvedValue({ success: true, results: [] });
  const all = vi.fn().mockResolvedValue({ results: roles });
  const bind = vi.fn().mockReturnValue({ run, first });
  const prepare = vi.fn().mockImplementation((sql: string) => {
    if (sql.includes("SELECT * FROM roles")) return { all };
    return { run, bind };
  });
  return { prepare, bind, run, first, all } as unknown as D1Database & {
    first: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
  };
}

describe("GET /api/admin/roles", () => {
  it("returns roles list", async () => {
    const { GET } = await import("@/pages/api/admin/roles/index");

    const mockRoles = [
      {
        id: "role-1",
        period: "2023-2024",
        company: "Acme",
        title: "Engineer",
        description: "Did stuff",
        tags: "[]",
        sort_order: 0,
      },
    ];

    const db = createRolesGetDb(mockRoles);
    const context = createApiContext({
      method: "GET",
      db: db as unknown as D1Database,
      headers: { Authorization: "Bearer valid-test-token" },
    });

    const response = await GET(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });
});

describe("POST /api/admin/roles", () => {
  it("creates role with valid body", async () => {
    const { POST } = await import("@/pages/api/admin/roles/index");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "POST",
      db,
      body: {
        period: "2023-2024",
        company: "Acme Corp",
        title: "Mobile Engineer",
        description: "Built mobile apps",
        tags: ["Android", "iOS"],
        sortOrder: 1,
      },
    });

    const response = await POST(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { POST } = await import("@/pages/api/admin/roles/index");

    const context = createApiContext({
      method: "POST",
      body: { period: "2023", company: "X", title: "Dev", description: "" },
    });

    await expect(POST(context)).rejects.toBeInstanceOf(Response);

    try {
      await POST(context);
    } catch (e) {
      expect((e as Response).status).toBe(401);
    }
  });

  it("returns 400 with invalid body", async () => {
    const { POST } = await import("@/pages/api/admin/roles/index");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "POST",
      db,
      body: { company: "Missing required fields" },
    });

    const response = await POST(context);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid request");
  });
});

describe("DELETE /api/admin/roles/[id]", () => {
  it("deletes role", async () => {
    const { DELETE } = await import("@/pages/api/admin/roles/[id]");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "DELETE",
      db,
      params: { id: "role-1" },
    });

    const response = await DELETE(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { DELETE } = await import("@/pages/api/admin/roles/[id]");

    const context = createApiContext({
      method: "DELETE",
      params: { id: "role-1" },
    });

    await expect(DELETE(context)).rejects.toBeInstanceOf(Response);

    try {
      await DELETE(context);
    } catch (e) {
      expect((e as Response).status).toBe(401);
    }
  });
});
