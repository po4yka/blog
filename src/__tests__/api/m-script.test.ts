import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", fetchMock);

describe("GET /m.js (tracker script proxy)", () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
  });

  it("serves the rewritten script as JavaScript", async () => {
    fetchMock.mockResolvedValue(new Response('fetch("/api/send")', { status: 200 }));
    const { GET } = await import("@/pages/m.js");

    const response = await GET({} as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/javascript");
    expect(await response.text()).toBe('fetch("/api/m")');
  });

  it("answers an upstream failure with an empty script that is still typed as JavaScript", async () => {
    fetchMock.mockResolvedValue(new Response("down", { status: 502 }));
    const { GET } = await import("@/pages/m.js");

    const response = await GET({} as Parameters<typeof GET>[0]);
    expect(response.status).toBe(204);
    // With nosniff, a script response without a JavaScript type is refused and logs a console error.
    expect(response.headers.get("Content-Type")).toContain("text/javascript");
  });
});
