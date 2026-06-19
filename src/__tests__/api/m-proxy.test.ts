import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", fetchMock);

describe("POST /api/m (analytics proxy)", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
  });

  it("returns 415 when Content-Type is not application/json", async () => {
    const { POST } = await import("@/pages/api/m");

    const req = new Request("http://localhost/api/m", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "hello",
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(415);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Content-Type must be application\/json/i);
  });

  it("returns 413 when body exceeds 64 KB", async () => {
    const { POST } = await import("@/pages/api/m");

    const bigBody = "x".repeat(65 * 1024);
    const req = new Request("http://localhost/api/m", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: bigBody,
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(413);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/too large/i);
  });

  it("forwards cf-connecting-ip as x-forwarded-for", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { POST } = await import("@/pages/api/m");

    const req = new Request("http://localhost/api/m", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.1" },
      body: JSON.stringify({ payload: "event" }),
    });

    await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Headers }];
    expect((init.headers as Headers).get("x-forwarded-for")).toBe("203.0.113.1");
  });

  it("falls back to x-forwarded-for header when cf-connecting-ip is absent", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { POST } = await import("@/pages/api/m");

    const req = new Request("http://localhost/api/m", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify({ payload: "event" }),
    });

    await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Headers }];
    expect((init.headers as Headers).get("x-forwarded-for")).toBe("10.0.0.1");
  });

  it("returns upstream error status (without leaking body) when upstream fails", async () => {
    fetchMock.mockResolvedValue(
      new Response("upstream internal error", { status: 502 }),
    );

    const { POST } = await import("@/pages/api/m");

    const req = new Request("http://localhost/api/m", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: "event" }),
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(502);
    const body = await response.json() as { error: string };
    // Must NOT leak upstream body — must be a generic error message
    expect(body.error).toBe("Upstream error");
  });

  it("passes through 200 response body from upstream", async () => {
    const upstreamBody = JSON.stringify({ ok: true });
    fetchMock.mockResolvedValue(
      new Response(upstreamBody, {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const { POST } = await import("@/pages/api/m");

    const req = new Request("http://localhost/api/m", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: "event" }),
    });

    const response = await POST({ request: req, params: {} } as Parameters<typeof POST>[0]);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe(upstreamBody);
  });

  it("OPTIONS returns 204 with CORS headers restricted to site origin", async () => {
    const { OPTIONS } = await import("@/pages/api/m");

    const req = new Request("http://localhost/api/m", { method: "OPTIONS" });
    const response = await OPTIONS({ request: req, params: {} } as Parameters<typeof OPTIONS>[0]);
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://po4yka.dev");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    // Must NOT be wildcard
    expect(response.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
  });
});
