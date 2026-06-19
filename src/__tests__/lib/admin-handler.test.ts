import { beforeEach, describe, expect, it, vi } from "vitest";
import { setMockEnv } from "../mocks/cloudflare-workers";
import { createMockDb } from "../helpers";

// Hoisted mock for requireAuth so we can control what capabilities it returns
const requireAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAuth: requireAuthMock,
    // validateOrigin: accept all in tests (no-op)
    validateOrigin: vi.fn(),
  };
});

import type { Capability } from "@/lib/admin-handler";

async function callWithAdmin(
  capability: Capability,
  sessionCapabilities: readonly string[] | null,
  handlerStatus = 200,
): Promise<Response> {
  // Re-import after mocks settle
  const { withAdmin } = await import("@/lib/admin-handler");

  requireAuthMock.mockResolvedValueOnce({ capabilities: sessionCapabilities });

  const db = createMockDb();
  setMockEnv({ DB: db });

  const route = withAdmin({ capability }, async () => new Response(JSON.stringify({ ok: true }), { status: handlerStatus }));

  const req = new Request("http://localhost/api/admin/test", {
    method: "GET",
    headers: { Authorization: "Bearer fake-token" },
  });

  return route({ request: req, params: {}, db } as unknown as Parameters<typeof route>[0]);
}

describe("withAdmin() capability scoping", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAuthMock.mockReset();
  });

  it("returns 200 when session has null capabilities (full admin)", async () => {
    const response = await callWithAdmin("read:posts", null);
    expect(response.status).toBe(200);
    const body = await response.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("returns 200 when session capabilities include the required capability", async () => {
    const response = await callWithAdmin("read:posts", ["read:posts", "write:posts"]);
    expect(response.status).toBe(200);
  });

  it("returns 403 when session capabilities do not include the required capability", async () => {
    const response = await callWithAdmin("write:posts", ["read:posts"]);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toBe("Forbidden");
  });

  it("fails closed (403) when session capabilities array is empty", async () => {
    const response = await callWithAdmin("read:posts", []);
    expect(response.status).toBe(403);
  });

  it("adds X-Content-Type-Options and Cache-Control on success", async () => {
    const response = await callWithAdmin("read:posts", null);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("re-throws Response errors from requireAuth (401 propagates)", async () => {
    const { withAdmin } = await import("@/lib/admin-handler");
    requireAuthMock.mockRejectedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const db = createMockDb();
    setMockEnv({ DB: db });

    const route = withAdmin({ capability: "read:posts" }, async () => new Response("ok"));
    const req = new Request("http://localhost/api/admin/test", {
      method: "GET",
      headers: { Authorization: "Bearer bad-token" },
    });

    await expect(route({ request: req, params: {}, db } as unknown as Parameters<typeof route>[0])).rejects.toBeInstanceOf(Response);
  });
});
