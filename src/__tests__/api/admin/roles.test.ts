import { describe, it, expect, vi } from "vitest";
import { createApiContext } from "../../helpers";

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
