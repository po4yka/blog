import { describe, it, expect } from "vitest";
import {
  validateOrigin,
  checkRateLimit,
  recordLoginAttempt,
  clearLoginAttempts,
  deleteSession,
  makeSessionCookie,
  makeClearCookie,
} from "@/lib/auth";
import { createMockDb, createWriteMockDb } from "../helpers";

describe("validateOrigin", () => {
  it("passes for GET requests without Origin header", () => {
    const request = new Request("http://localhost/api/test", { method: "GET" });
    expect(() => validateOrigin(request)).not.toThrow();
  });

  it("passes for HEAD requests without Origin header", () => {
    const request = new Request("http://localhost/api/test", { method: "HEAD" });
    expect(() => validateOrigin(request)).not.toThrow();
  });

  it("passes for POST with valid dev origin", () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { Origin: "http://localhost:4321" },
    });
    expect(() => validateOrigin(request)).not.toThrow();
  });

  it("throws 403 for POST with invalid origin", () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { Origin: "https://evil.com" },
    });
    try {
      validateOrigin(request);
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const res = error as Response;
      expect(res.status).toBe(403);
    }
  });

  it("throws 403 for POST without Origin and without X-Requested-With", () => {
    const request = new Request("http://localhost/api/test", { method: "POST" });
    try {
      validateOrigin(request);
      expect.fail("should have thrown");
    } catch (error) {
      const res = error as Response;
      expect(res.status).toBe(403);
    }
  });

  it("passes for POST without Origin but with X-Requested-With", () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    expect(() => validateOrigin(request)).not.toThrow();
  });
});

describe("checkRateLimit", () => {
  it("returns true when under 5 attempts", async () => {
    const db = createMockDb();
    db.first.mockResolvedValue({ cnt: 3 });
    const allowed = await checkRateLimit(db, "1.2.3.4");
    expect(allowed).toBe(true);
  });

  it("returns false when at 5 attempts", async () => {
    const db = createMockDb();
    db.first.mockResolvedValue({ cnt: 5 });
    const allowed = await checkRateLimit(db, "1.2.3.4");
    expect(allowed).toBe(false);
  });

  it("returns true when count is null (no rows)", async () => {
    const db = createMockDb();
    db.first.mockResolvedValue(null);
    const allowed = await checkRateLimit(db, "1.2.3.4");
    expect(allowed).toBe(true);
  });
});

describe("recordLoginAttempt", () => {
  it("inserts IP into login_attempts", async () => {
    const db = createWriteMockDb();
    await recordLoginAttempt(db, "10.0.0.1");
    expect(db._bind).toHaveBeenCalledWith("10.0.0.1");
    expect(db._run).toHaveBeenCalled();
  });
});

describe("clearLoginAttempts", () => {
  it("deletes all attempts for the given IP", async () => {
    const db = createWriteMockDb();
    await clearLoginAttempts(db, "10.0.0.1");
    expect(db._bind).toHaveBeenCalledWith("10.0.0.1");
    expect(db._run).toHaveBeenCalled();
  });
});

describe("deleteSession", () => {
  it("deletes session by token", async () => {
    const db = createWriteMockDb();
    await deleteSession(db, "test-token-123");
    expect(db._bind).toHaveBeenCalledWith("test-token-123");
    expect(db._run).toHaveBeenCalled();
  });
});

describe("makeSessionCookie", () => {
  it("includes HttpOnly, SameSite, and Path", () => {
    const cookie = makeSessionCookie("tok-123", false);
    expect(cookie).toContain("__session=tok-123");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/api");
    expect(cookie).toContain("Max-Age=86400");
    expect(cookie).not.toContain("Secure");
  });

  it("includes Secure flag when isSecure is true", () => {
    const cookie = makeSessionCookie("tok-456", true);
    expect(cookie).toContain("Secure");
  });
});

describe("makeClearCookie", () => {
  it("sets Max-Age=0 to clear the cookie", () => {
    const cookie = makeClearCookie();
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("__session=");
  });
});
