import { describe, expect, it } from "vitest";
import { onRequest } from "@/middleware";

type Args = Parameters<typeof onRequest>;
const context = (path = "/admin") =>
  ({ locals: {}, url: new URL(`https://po4yka.dev${path}`) }) as unknown as Args[0];

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

  it("sets the baseline headers that public/_headers gives static assets", async () => {
    const next = (() => Promise.resolve(Response.json({ ok: true }))) as Args[1];
    const res = (await onRequest(context("/api/github/repos"), next)) as Response;
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    // Public API responses keep their own caching rules.
    expect(res.headers.get("Cache-Control")).toBeNull();
  });

  it("marks auth and admin API responses no-store unless the route set Cache-Control", async () => {
    const plain = (() => Promise.resolve(Response.json({ ok: true }))) as Args[1];
    const auth = (await onRequest(context("/api/auth/login"), plain)) as Response;
    expect(auth.headers.get("Cache-Control")).toBe("no-store");

    const cached = (() =>
      Promise.resolve(Response.json({}, { headers: { "Cache-Control": "private, max-age=60" } }))) as Args[1];
    const admin = (await onRequest(context("/api/admin/telemetry"), cached)) as Response;
    expect(admin.headers.get("Cache-Control")).toBe("private, max-age=60");
  });

  it("adds headers to a thrown 401 and to responses with immutable headers", async () => {
    const thrown = (() => Promise.reject(new Response(null, { status: 401 }))) as Args[1];
    const res = (await onRequest(context("/api/admin/posts"), thrown)) as Response;
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const redirect = (() => Promise.resolve(Response.redirect("https://po4yka.dev/admin/login", 302))) as Args[1];
    const moved = (await onRequest(context("/admin"), redirect)) as Response;
    expect(moved.status).toBe(302);
    expect(moved.headers.get("Location")).toBe("https://po4yka.dev/admin/login");
    expect(moved.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
