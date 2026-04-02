import { describe, it, expect } from "vitest";
import { createMockDb, createApiContext } from "../helpers";

// The login route uses Astro's APIRoute type. We mock the Astro context
// and test the handler directly.

describe("POST /api/auth/login", () => {
  it("returns a token when password is correct", async () => {
    const { POST } = await import("@/pages/api/auth/login");

    const context = createApiContext({
      method: "POST",
      body: { password: "correct-password" },
      db: createMockDb(),
      adminPassword: "correct-password",
    });

    const response = await POST(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe("string");
  });

  it("returns 401 when password is wrong", async () => {
    const { POST } = await import("@/pages/api/auth/login");

    const context = createApiContext({
      method: "POST",
      body: { password: "wrong-password" },
      db: createMockDb(),
      adminPassword: "correct-password",
    });

    const response = await POST(context);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Invalid password");
  });
});
