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
});
