import { describe, it, expect, vi } from "vitest";

// The login route uses Astro's APIRoute type. We mock the Astro context
// and test the handler directly.

// Mock D1 for createSession
function createMockDb() {
  const run = vi.fn().mockResolvedValue({ success: true });
  const bind = vi.fn().mockReturnValue({ run });
  const prepare = vi.fn().mockReturnValue({ run, bind });
  return { prepare } as unknown as D1Database;
}

describe("POST /api/auth/login", () => {
  it("returns a token when password is correct", async () => {
    const { POST } = await import("@/pages/api/auth/login");

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "correct-password" }),
    });

    const db = createMockDb();
    const context = {
      request,
      locals: {
        runtime: {
          env: {
            ADMIN_PASSWORD: "correct-password",
            DB: db,
          },
        },
      },
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(context);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe("string");
  });

  it("returns 401 when password is wrong", async () => {
    const { POST } = await import("@/pages/api/auth/login");

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    });

    const context = {
      request,
      locals: {
        runtime: {
          env: {
            ADMIN_PASSWORD: "correct-password",
            DB: createMockDb(),
          },
        },
      },
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(context);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe("Invalid password");
  });
});
