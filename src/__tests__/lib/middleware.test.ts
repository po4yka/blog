import { describe, expect, it } from "vitest";
import { onRequest } from "@/middleware";

type Args = Parameters<typeof onRequest>;
const context = () => ({ locals: {} }) as unknown as Args[0];

describe("middleware", () => {
  it("returns a Response thrown by a route (401 from requireAuth) instead of failing", async () => {
    const thrown = new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const next = (() => Promise.reject(thrown)) as Args[1];
    const res = (await onRequest(context(), next)) as Response;
    expect(res).toBe(thrown);
    expect(res.status).toBe(401);
  });

  it("rethrows other errors", async () => {
    const next = (() => Promise.reject(new Error("boom"))) as Args[1];
    await expect(onRequest(context(), next)).rejects.toThrow("boom");
  });

  it("sets the CSP header on HTML responses", async () => {
    const next = (() => Promise.resolve(new Response("<p>", { headers: { "content-type": "text/html" } }))) as Args[1];
    const res = (await onRequest(context(), next)) as Response;
    expect(res.headers.get("Content-Security-Policy")).toContain("script-src 'self' 'nonce-");
  });
});
