import { describe, it, expect } from "vitest";
import {
  loginSchema,
  validationError,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe("loginSchema", () => {
  it("accepts a non-empty password", () => {
    expect(() => loginSchema.parse({ password: "secret" })).not.toThrow();
  });

  it("rejects an empty password", () => {
    expect(() => loginSchema.parse({ password: "" })).toThrow();
  });

  it("rejects missing password", () => {
    expect(() => loginSchema.parse({})).toThrow();
  });
});

// ---------------------------------------------------------------------------
// validationError helper
// ---------------------------------------------------------------------------
describe("validationError", () => {
  it("returns a 400 Response with JSON body", () => {
    const result = loginSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const response = validationError(result.error);
      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    }
  });

  it("includes error and details in the response body", async () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const response = validationError(result.error);
      const body = await response.json();
      expect(body).toHaveProperty("error", "Invalid request");
      expect(body).toHaveProperty("details");
      expect(Array.isArray(body.details)).toBe(true);
    }
  });
});
