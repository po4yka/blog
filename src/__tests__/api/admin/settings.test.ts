import { describe, it, expect, vi } from "vitest";
import { createMockDb, createApiContext, createAuthenticatedContext } from "../../helpers";

const validSettings = {
  name: "Nikita Pochaev",
  handle: "@po4yka",
  role: "Mobile Developer",
  bio: "Android, iOS, KMP",
  github: "https://github.com/po4yka",
  email: "nikita@example.com",
  telegram: "@po4yka",
  linkedin: "https://linkedin.com/in/po4yka",
};

// Build a db mock that handles both requireAuth (.first() for session) and
// getSettings (.first() for settings row).
//
// requireAuth:  prepare(sql).bind(token).first()  -- first() on bind result
// getSettings:  prepare(sql).first()              -- first() directly on prepare result
//
// We use a single shared `first` fn with mockResolvedValueOnce so calls are
// consumed in order: 1st = session, 2nd = settings row.
function createSettingsGetDb(settingsRow: unknown | null) {
  const token = "valid-test-token";
  const first = vi
    .fn()
    // First call: session lookup in requireAuth (via bind().first())
    .mockResolvedValueOnce({ token })
    // Second call: settings lookup in getSettings (via prepare().first())
    .mockResolvedValueOnce(settingsRow);
  const run = vi.fn().mockResolvedValue({ success: true });
  // bind returns an object with first so requireAuth's bind().first() works
  const bind = vi.fn().mockReturnValue({ run, first });
  // prepare returns an object with both bind AND first so getSettings's
  // prepare().first() also works
  const prepare = vi.fn().mockReturnValue({ run, bind, first });
  return { prepare, bind, run, first } as unknown as D1Database & {
    first: ReturnType<typeof vi.fn>;
  };
}

describe("GET /api/admin/settings", () => {
  it("returns settings", async () => {
    const { GET } = await import("@/pages/api/admin/settings");

    const db = createSettingsGetDb({ id: 1, ...validSettings });
    const context = createApiContext({
      method: "GET",
      db: db as unknown as D1Database,
      headers: { Authorization: "Bearer valid-test-token" },
    });

    const response = await GET(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.name).toBe("Nikita Pochaev");
    expect(body.handle).toBe("@po4yka");
    // id should be stripped by the db layer
    expect(body.id).toBeUndefined();
  });

  it("returns 404 when settings is null", async () => {
    const { GET } = await import("@/pages/api/admin/settings");

    const db = createSettingsGetDb(null);
    const context = createApiContext({
      method: "GET",
      db: db as unknown as D1Database,
      headers: { Authorization: "Bearer valid-test-token" },
    });

    const response = await GET(context);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe("Settings not found");
  });
});

describe("PUT /api/admin/settings", () => {
  it("updates settings with valid body", async () => {
    const { PUT } = await import("@/pages/api/admin/settings");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "PUT",
      db,
      body: validSettings,
    });

    const response = await PUT(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 without auth", async () => {
    const { PUT } = await import("@/pages/api/admin/settings");

    const context = createApiContext({
      method: "PUT",
      body: validSettings,
    });

    await expect(PUT(context)).rejects.toBeInstanceOf(Response);

    try {
      await PUT(context);
    } catch (e) {
      expect((e as Response).status).toBe(401);
    }
  });

  it("returns 400 with invalid body", async () => {
    const { PUT } = await import("@/pages/api/admin/settings");

    const db = createMockDb();
    const context = createAuthenticatedContext({
      method: "PUT",
      db,
      body: { name: "" },
    });

    const response = await PUT(context);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Invalid request");
  });
});
