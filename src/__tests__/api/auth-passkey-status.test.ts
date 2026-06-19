import { beforeEach, describe, expect, it, vi } from "vitest";
import { setMockEnv } from "../mocks/cloudflare-workers";

const hasAnyCredentialMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/webauthn", () => ({
  hasAnyCredential: hasAnyCredentialMock,
  consumeChallenge: vi.fn(),
  validateChallenge: vi.fn(),
  storeChallenge: vi.fn(),
  storeCredential: vi.fn(),
  getCredentials: vi.fn(),
  getCredentialById: vi.fn(),
  updateCredentialCounter: vi.fn(),
  deleteCredentialById: vi.fn(),
  pruneStaleChallenges: vi.fn(),
  checkAuthenticationOptionsRateLimit: vi.fn(),
  recordAuthenticationOptionsRequest: vi.fn(),
}));

// Build a minimal GET context without touching setMockEnv
function makeGetContext() {
  const req = new Request("http://localhost/api/auth/passkey/status", { method: "GET" });
  return { request: req, params: {} } as import("astro").APIContext;
}

describe("GET /api/auth/passkey/status", () => {
  beforeEach(() => {
    vi.resetModules();
    hasAnyCredentialMock.mockReset();
  });

  it("returns hasPasskey=true and allowPassword=true when credential exists and env flag is true", async () => {
    hasAnyCredentialMock.mockResolvedValue(true);
    setMockEnv({ DB: {} as D1Database, ALLOW_PASSWORD_LOGIN: "true" });

    const { GET } = await import("@/pages/api/auth/passkey/status");
    const response = await GET(makeGetContext());

    expect(response.status).toBe(200);
    const body = await response.json() as { hasPasskey: boolean; allowPassword: boolean };
    expect(body.hasPasskey).toBe(true);
    expect(body.allowPassword).toBe(true);
  });

  it("returns hasPasskey=false and allowPassword=false when env flag is 'false'", async () => {
    hasAnyCredentialMock.mockResolvedValue(false);
    setMockEnv({ DB: {} as D1Database, ALLOW_PASSWORD_LOGIN: "false" });

    const { GET } = await import("@/pages/api/auth/passkey/status");
    const response = await GET(makeGetContext());

    expect(response.status).toBe(200);
    const body = await response.json() as { hasPasskey: boolean; allowPassword: boolean };
    expect(body.hasPasskey).toBe(false);
    expect(body.allowPassword).toBe(false);
  });

  it("returns allowPassword=false when ALLOW_PASSWORD_LOGIN is unset", async () => {
    hasAnyCredentialMock.mockResolvedValue(true);
    setMockEnv({ DB: {} as D1Database });

    const { GET } = await import("@/pages/api/auth/passkey/status");
    const response = await GET(makeGetContext());

    const body = await response.json() as { hasPasskey: boolean; allowPassword: boolean };
    expect(body.allowPassword).toBe(false);
  });
});
