import { beforeEach, describe, it, expect, vi } from "vitest";
import { createMockDb, createApiContext } from "../helpers";
import { setMockEnv } from "../mocks/cloudflare-workers";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.resetModules();
  });

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

    const body = await response.json() as { ok: boolean };
    expect(body.ok).toBe(true);
    // Token is now in HttpOnly Set-Cookie header, not response body
    const cookie = response.headers.get("Set-Cookie");
    expect(cookie).toMatch(/__session=.+; HttpOnly/);
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

    const body = await response.json() as { error: string };
    expect(body.error).toBe("Invalid password");
  });

  it("returns 403 when ALLOW_PASSWORD_LOGIN is unset", async () => {
    // Set env directly — do NOT use createApiContext which always sets ALLOW_PASSWORD_LOGIN="true"
    setMockEnv({ DB: createMockDb(), ADMIN_PASSWORD: "secret" });

    const { POST } = await import("@/pages/api/auth/login");

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:4321" },
      body: JSON.stringify({ password: "secret" }),
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Password login disabled/i);
  });

  it("returns 403 when ALLOW_PASSWORD_LOGIN is 'false'", async () => {
    setMockEnv({ DB: createMockDb(), ADMIN_PASSWORD: "secret", ALLOW_PASSWORD_LOGIN: "false" });

    const { POST } = await import("@/pages/api/auth/login");

    // Use createApiContext but the env has already been set above
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:4321" },
      body: JSON.stringify({ password: "secret" }),
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Password login disabled/i);
  });

  it("returns 429 with Retry-After when IP is rate-limited", async () => {
    const db = createMockDb();
    // Make checkRateLimit return cnt >= 5 to trigger rate limit
    // The real auth.ts does: SELECT COUNT(*) as cnt ... -> first()
    // first() is on the bound result. The bind() mock returns { run, first }.
    db.first.mockResolvedValue({ cnt: 10 });

    setMockEnv({ DB: db, ADMIN_PASSWORD: "secret", ALLOW_PASSWORD_LOGIN: "true" });

    const { POST } = await import("@/pages/api/auth/login");

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:4321",
        "cf-connecting-ip": "5.6.7.8",
      },
      body: JSON.stringify({ password: "secret" }),
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Too many login attempts/i);
  });

  it("returns 400 when cf-connecting-ip is absent in PROD", async () => {
    // Simulate PROD: patch import.meta.env.PROD by mocking getClientIp to return null
    vi.resetModules();

    const getClientIpMock = vi.fn().mockReturnValue(null);
    vi.doMock("@/lib/auth", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/lib/auth")>();
      return { ...actual, getClientIp: getClientIpMock };
    });

    setMockEnv({ DB: createMockDb(), ADMIN_PASSWORD: "secret", ALLOW_PASSWORD_LOGIN: "true" });

    const { POST } = await import("@/pages/api/auth/login");

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:4321" },
      body: JSON.stringify({ password: "secret" }),
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Unable to determine client IP/i);
  });

  it("calls db.prepare with INSERT INTO login_attempts on wrong password", async () => {
    // Full reset so no prior doMock leaks (e.g. getClientIp null mock from prior test)
    vi.resetModules();
    vi.doUnmock("@/lib/auth");

    const db = createMockDb();
    // Return cnt=0 for the rate-limit SELECT so we pass the rate-limit check
    db.first.mockResolvedValue({ cnt: 0 });

    setMockEnv({ DB: db, ADMIN_PASSWORD: "correct", ALLOW_PASSWORD_LOGIN: "true" });

    const { POST } = await import("@/pages/api/auth/login");

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:4321",
        "cf-connecting-ip": "9.9.9.9",
      },
      body: JSON.stringify({ password: "wrong" }),
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(401);

    // Assert that prepare was called with an INSERT INTO login_attempts statement
    const prepareArgs: string[] = (db.prepare as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => String(c[0]),
    );
    expect(prepareArgs.some((sql) => sql.includes("INSERT INTO login_attempts"))).toBe(true);
  });
});
