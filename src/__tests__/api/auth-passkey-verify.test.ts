import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiContext } from "../helpers";

// Hoisted mocks so they are available during vi.mock() factory evaluation
const verifyAuthenticationResponseMock = vi.hoisted(() => vi.fn());
const getCredentialByIdMock = vi.hoisted(() => vi.fn());
const consumeChallengeMock = vi.hoisted(() => vi.fn());
const updateCredentialCounterMock = vi.hoisted(() => vi.fn());
const clearLoginAttemptsMock = vi.hoisted(() => vi.fn());
const recordLoginAttemptMock = vi.hoisted(() => vi.fn());
const checkRateLimitMock = vi.hoisted(() => vi.fn());
const createSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@simplewebauthn/server", () => ({
  verifyAuthenticationResponse: verifyAuthenticationResponseMock,
}));

vi.mock("@simplewebauthn/server/helpers", () => ({
  isoBase64URL: {
    toBuffer: (s: string) => Buffer.from(s, "base64"),
  },
}));

vi.mock("@/lib/webauthn", () => ({
  getCredentialById: getCredentialByIdMock,
  consumeChallenge: consumeChallengeMock,
  updateCredentialCounter: updateCredentialCounterMock,
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    checkRateLimit: checkRateLimitMock,
    recordLoginAttempt: recordLoginAttemptMock,
    clearLoginAttempts: clearLoginAttemptsMock,
    createSession: createSessionMock,
    // keep validateOrigin + getClientIp as real implementations
    validateOrigin: actual.validateOrigin,
    getClientIp: actual.getClientIp,
    makeSessionCookie: actual.makeSessionCookie,
  };
});

// Encode a minimal clientDataJSON containing the challenge field
function encodeClientData(challenge: string): string {
  return Buffer.from(JSON.stringify({ type: "webauthn.get", challenge, origin: "http://localhost:4321" })).toString("base64");
}

// Build a minimal AuthenticationResponseJSON body
function buildAssertionBody(credentialId = "cred-id-abc", challenge = "test-challenge") {
  return {
    id: credentialId,
    rawId: credentialId,
    type: "public-key",
    response: {
      authenticatorData: Buffer.from("authdata").toString("base64"),
      clientDataJSON: encodeClientData(challenge),
      signature: Buffer.from("sig").toString("base64"),
    },
  };
}

describe("POST /api/auth/passkey/auth-verify", () => {
  beforeEach(() => {
    vi.resetModules();
    verifyAuthenticationResponseMock.mockReset();
    getCredentialByIdMock.mockReset();
    consumeChallengeMock.mockReset();
    updateCredentialCounterMock.mockReset();
    clearLoginAttemptsMock.mockReset();
    recordLoginAttemptMock.mockReset();
    checkRateLimitMock.mockReset();
    createSessionMock.mockReset();
  });

  it("returns 429 when IP is rate-limited", async () => {
    checkRateLimitMock.mockResolvedValue(false);

    const { POST } = await import("@/pages/api/auth/passkey/auth-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildAssertionBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    const body = await response.json() as { error: string };
    expect(body.error).toBe("Too many attempts");
    expect(verifyAuthenticationResponseMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed clientDataJSON (invalid base64/JSON)", async () => {
    checkRateLimitMock.mockResolvedValue(true);

    const { POST } = await import("@/pages/api/auth/passkey/auth-verify");

    const badBody = {
      id: "cred-id",
      rawId: "cred-id",
      type: "public-key",
      response: {
        authenticatorData: "",
        clientDataJSON: "!!!not-valid-base64!!!",
        signature: "",
      },
    };

    const ctx = createApiContext({
      method: "POST",
      body: badBody,
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Invalid client data/i);
  });

  it("returns 401 for unknown credential", async () => {
    checkRateLimitMock.mockResolvedValue(true);
    getCredentialByIdMock.mockResolvedValue(null);

    const { POST } = await import("@/pages/api/auth/passkey/auth-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildAssertionBody("unknown-cred"),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Unknown credential/i);
    expect(verifyAuthenticationResponseMock).not.toHaveBeenCalled();
  });

  it("returns 401 when challenge is expired or missing", async () => {
    checkRateLimitMock.mockResolvedValue(true);
    getCredentialByIdMock.mockResolvedValue({
      credentialID: "cred-id-abc",
      publicKey: "cHVibGlja2V5",
      counter: 0,
      transports: ["internal"],
    });
    consumeChallengeMock.mockResolvedValue(false); // challenge not found / expired

    const { POST } = await import("@/pages/api/auth/passkey/auth-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildAssertionBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Invalid or expired challenge/i);
    expect(verifyAuthenticationResponseMock).not.toHaveBeenCalled();
  });

  it("returns 401 when verifyAuthenticationResponse throws", async () => {
    checkRateLimitMock.mockResolvedValue(true);
    getCredentialByIdMock.mockResolvedValue({
      credentialID: "cred-id-abc",
      publicKey: "cHVibGlja2V5",
      counter: 0,
      transports: [],
    });
    consumeChallengeMock.mockResolvedValue(true);
    verifyAuthenticationResponseMock.mockRejectedValue(new Error("crypto mismatch"));
    recordLoginAttemptMock.mockResolvedValue(undefined);

    const { POST } = await import("@/pages/api/auth/passkey/auth-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildAssertionBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(401);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Verification failed/i);
    expect(recordLoginAttemptMock).toHaveBeenCalledWith(expect.anything(), "1.2.3.4");
  });

  it("returns 200 with Set-Cookie on successful verification", async () => {
    checkRateLimitMock.mockResolvedValue(true);
    getCredentialByIdMock.mockResolvedValue({
      credentialID: "cred-id-abc",
      publicKey: "cHVibGlja2V5",
      counter: 5,
      transports: ["internal"],
    });
    consumeChallengeMock.mockResolvedValue(true);
    verifyAuthenticationResponseMock.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 6, credentialID: "cred-id-abc" },
    });
    updateCredentialCounterMock.mockResolvedValue(undefined);
    clearLoginAttemptsMock.mockResolvedValue(undefined);
    createSessionMock.mockResolvedValue("tok-xyz");

    const { POST } = await import("@/pages/api/auth/passkey/auth-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildAssertionBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { ok: boolean };
    expect(body.ok).toBe(true);

    const cookie = response.headers.get("Set-Cookie");
    expect(cookie).toMatch(/__session=tok-xyz/);
    expect(cookie).toMatch(/HttpOnly/);

    expect(updateCredentialCounterMock).toHaveBeenCalledWith(expect.anything(), "cred-id-abc", 6);
    expect(clearLoginAttemptsMock).toHaveBeenCalledWith(expect.anything(), "1.2.3.4");
  });

  it("returns 400 when client IP is missing in production", async () => {
    // Simulate PROD env where cf-connecting-ip is absent (getClientIp returns null)
    // We rely on the real getClientIp which returns null in PROD without cf-connecting-ip.
    // In test env (non-PROD) it falls back to 127.0.0.1, so we mock checkRateLimit to cover the IP-absent branch via missing header + PROD flag.
    // Simplest approach: override getClientIp in the module mock for this test.
    // Since we already mock @/lib/auth partially, we need a dedicated resetModules call here.
    vi.resetModules();

    const getClientIpProdMock = vi.fn().mockReturnValue(null);
    vi.doMock("@/lib/auth", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/lib/auth")>();
      return {
        ...actual,
        getClientIp: getClientIpProdMock,
        checkRateLimit: checkRateLimitMock,
        validateOrigin: actual.validateOrigin,
        makeSessionCookie: actual.makeSessionCookie,
        createSession: createSessionMock,
        recordLoginAttempt: recordLoginAttemptMock,
        clearLoginAttempts: clearLoginAttemptsMock,
      };
    });

    const { POST } = await import("@/pages/api/auth/passkey/auth-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildAssertionBody(),
      headers: { Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Unable to determine client IP/i);
  });
});
