import { describe, it, expect } from "vitest";
import { createMockDb, createApiContext } from "../helpers";

describe("POST /api/auth/logout", () => {
  it("deletes session from cookie and returns clear cookie", async () => {
    const { POST } = await import("@/pages/api/auth/logout");
    const db = createMockDb();

    const context = createApiContext({
      method: "POST",
      headers: {
        Cookie: "__session=test-token-abc",
        Origin: "http://localhost:4321",
      },
      db,
    });

    const response = await POST(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);

    const cookie = response.headers.get("Set-Cookie");
    expect(cookie).toContain("Max-Age=0");

    // Should have deleted the session
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM admin_sessions"),
    );
  });

  it("extracts token from Bearer header as fallback", async () => {
    const { POST } = await import("@/pages/api/auth/logout");
    const db = createMockDb();

    const context = createApiContext({
      method: "POST",
      headers: {
        Authorization: "Bearer bearer-token-123",
        Origin: "http://localhost:4321",
      },
      db,
    });

    const response = await POST(context);
    expect(response.status).toBe(200);

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM admin_sessions"),
    );
  });

  it("returns 200 even when no session token is present", async () => {
    const { POST } = await import("@/pages/api/auth/logout");
    const db = createMockDb();

    const context = createApiContext({
      method: "POST",
      headers: { Origin: "http://localhost:4321" },
      db,
    });

    const response = await POST(context);
    expect(response.status).toBe(200);

    const cookie = response.headers.get("Set-Cookie");
    expect(cookie).toContain("Max-Age=0");
  });

  describe("everywhere", () => {
    const everywhere = (db: ReturnType<typeof createMockDb>, cookie?: string) =>
      createApiContext({
        method: "POST",
        body: { everywhere: true },
        headers: { Origin: "http://localhost:4321", ...(cookie ? { Cookie: cookie } : {}) },
        db,
      });

    it("revokes every session for a full-admin session", async () => {
      const { POST } = await import("@/pages/api/auth/logout");
      const db = createMockDb();
      db.first.mockResolvedValue({ token: "hash", capabilities: null });
      db.run.mockResolvedValue({ success: true, meta: { changes: 3 } });

      const response = await POST(everywhere(db, "__session=t"));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true, revoked: 3 });
      expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
      expect(db.prepare).toHaveBeenCalledWith("DELETE FROM admin_sessions");
    });

    // Without this check anyone could sign the admin out of every device.
    it("refuses without a valid session and deletes nothing", async () => {
      const { POST } = await import("@/pages/api/auth/logout");
      const db = createMockDb();
      db.first.mockResolvedValue(null);

      const response = await POST(everywhere(db, "__session=stolen-or-expired"));
      expect(response.status).toBe(401);
      expect(db.prepare).not.toHaveBeenCalledWith("DELETE FROM admin_sessions");
    });

    it("refuses a capability-scoped session", async () => {
      const { POST } = await import("@/pages/api/auth/logout");
      const db = createMockDb();
      db.first.mockResolvedValue({ token: "hash", capabilities: '["read:posts"]' });

      const response = await POST(everywhere(db, "__session=t"));
      expect(response.status).toBe(403);
      expect(db.prepare).not.toHaveBeenCalledWith("DELETE FROM admin_sessions");
    });

    // A client that sends an unexpected body must still be signed out.
    it("treats a body that is not JSON or has no everywhere field as a plain logout", async () => {
      const { POST } = await import("@/pages/api/auth/logout");
      for (const body of ["not json", null, [], { other: 1 }]) {
        const db = createMockDb();
        const ctx = createApiContext({
          method: "POST",
          headers: { Cookie: "__session=t", Origin: "http://localhost:4321" },
          db,
        });
        const request = new Request(ctx.request.url, {
          method: "POST",
          headers: ctx.request.headers,
          body: typeof body === "string" ? body : JSON.stringify(body),
        });
        const response = await POST({ ...ctx, request });
        expect(response.status, JSON.stringify(body)).toBe(200);
        expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
        expect(db.prepare).toHaveBeenCalledWith("DELETE FROM admin_sessions WHERE token = ?");
      }
    });

    it("rejects a body that is not the expected shape", async () => {
      const { POST } = await import("@/pages/api/auth/logout");
      const db = createMockDb();
      const response = await POST(
        createApiContext({ method: "POST", body: { everywhere: "yes" }, headers: { Origin: "http://localhost:4321" }, db }),
      );
      expect(response.status).toBe(400);
    });
  });
});
