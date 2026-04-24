import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiContext } from "../helpers";

const generateAuthenticationOptionsMock = vi.hoisted(() => vi.fn());

vi.mock("@simplewebauthn/server", () => ({
  generateAuthenticationOptions: generateAuthenticationOptionsMock,
}));

function createOptionsDb(optionsCount: number) {
  const run = vi.fn().mockResolvedValue({ success: true });
  const first = vi.fn().mockResolvedValue({ cnt: optionsCount });
  const all = vi.fn().mockResolvedValue({ results: [] });
  const bind = vi.fn().mockReturnValue({ first, run });
  const prepare = vi.fn().mockReturnValue({ bind, run, all });

  return { prepare, bind, run, first, all } as unknown as D1Database & {
    bind: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
  };
}

describe("GET /api/auth/passkey/auth-options", () => {
  beforeEach(() => {
    vi.resetModules();
    generateAuthenticationOptionsMock.mockReset();
    generateAuthenticationOptionsMock.mockResolvedValue({
      challenge: "generated-challenge",
      allowCredentials: [],
      userVerification: "preferred",
    });
  });

  it("records a rate-limit marker and stores the generated challenge", async () => {
    const { GET } = await import("@/pages/api/auth/passkey/auth-options");
    const db = createOptionsDb(0);

    const response = await GET(
      createApiContext({
        method: "GET",
        db,
        headers: { "cf-connecting-ip": "203.0.113.10" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      challenge: "generated-challenge",
    });
    expect(generateAuthenticationOptionsMock).toHaveBeenCalled();
    expect(db.bind).toHaveBeenCalledWith(
      expect.stringMatching(/^auth-options:[0-9a-f]{64}:[0-9a-f-]+$/),
      "authentication-options-rate-limit",
    );
    expect(db.bind).toHaveBeenCalledWith("generated-challenge", "authentication");
  });

  it("returns 429 before generating options when the IP is over limit", async () => {
    const { GET } = await import("@/pages/api/auth/passkey/auth-options");
    const db = createOptionsDb(10);

    const response = await GET(
      createApiContext({
        method: "GET",
        db,
        headers: { "cf-connecting-ip": "203.0.113.10" },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("300");
    await expect(response.json()).resolves.toEqual({ error: "Too many attempts" });
    expect(generateAuthenticationOptionsMock).not.toHaveBeenCalled();
    expect(db.bind).not.toHaveBeenCalledWith(
      expect.stringMatching(/^auth-options:[0-9a-f]{64}:[0-9a-f-]+$/),
      "authentication-options-rate-limit",
    );
  });
});
