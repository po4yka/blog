import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSession, requireAuth } from "@/lib/auth";

// --- D1 mock helpers ---

function createMockDb() {
  const run = vi.fn().mockResolvedValue({ success: true });
  const first = vi.fn();
  const bind = vi.fn().mockReturnValue({ run, first });
  const prepare = vi.fn().mockReturnValue({ run, bind });

  return { prepare, bind, run, first } as unknown as D1Database & {
    bind: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
  };
}

describe("createSession", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
  });

  it("returns a UUID token", async () => {
    const token = await createSession(db);
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("cleans expired sessions then inserts a new one", async () => {
    await createSession(db);

    // First prepare call: DELETE expired sessions
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM admin_sessions"),
    );

    // Second prepare call: INSERT new session
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO admin_sessions"),
    );

    // Two prepare calls total
    expect(db.prepare).toHaveBeenCalledTimes(2);
  });
});

describe("requireAuth", () => {
  it("throws 401 when Authorization header is missing", async () => {
    const db = createMockDb();
    const request = new Request("http://localhost/api/test");

    try {
      await requireAuth(request, db);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const res = error as Response;
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    }
  });

  it("throws 401 when Authorization header has wrong scheme", async () => {
    const db = createMockDb();
    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Basic abc123" },
    });

    try {
      await requireAuth(request, db);
      expect.fail("should have thrown");
    } catch (error) {
      const res = error as Response;
      expect(res.status).toBe(401);
    }
  });

  it("throws 401 when session is expired or not found", async () => {
    const db = createMockDb();
    db.first.mockResolvedValue(null);

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer some-token" },
    });

    try {
      await requireAuth(request, db);
      expect.fail("should have thrown");
    } catch (error) {
      const res = error as Response;
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Session expired");
    }
  });

  it("passes when session is valid", async () => {
    const db = createMockDb();
    db.first.mockResolvedValue({ token: "valid-token" });

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer valid-token" },
    });

    // Should not throw
    await requireAuth(request, db);

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("SELECT token FROM admin_sessions"),
    );
  });
});
