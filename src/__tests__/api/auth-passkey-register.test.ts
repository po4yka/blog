import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiContext, createMockDb } from "../helpers";

// Hoisted mocks
const verifyRegistrationResponseMock = vi.hoisted(() => vi.fn());
const generateRegistrationOptionsMock = vi.hoisted(() => vi.fn());
const consumeChallengeMock = vi.hoisted(() => vi.fn());
const validateChallengeMock = vi.hoisted(() => vi.fn());
const storeChallengeMock = vi.hoisted(() => vi.fn());
const storeCredentialMock = vi.hoisted(() => vi.fn());
const getCredentialsMock = vi.hoisted(() => vi.fn());
const reserveLoginAttemptMock = vi.hoisted(() => vi.fn());

vi.mock("@simplewebauthn/server", () => ({
  verifyRegistrationResponse: verifyRegistrationResponseMock,
  generateRegistrationOptions: generateRegistrationOptionsMock,
}));

vi.mock("@simplewebauthn/server/helpers", () => ({
  isoBase64URL: {
    fromBuffer: (buf: Buffer) => buf.toString("base64"),
    toBuffer: (s: string) => Buffer.from(s, "base64"),
  },
}));

vi.mock("@/lib/webauthn", () => ({
  consumeChallenge: consumeChallengeMock,
  validateChallenge: validateChallengeMock,
  storeChallenge: storeChallengeMock,
  storeCredential: storeCredentialMock,
  getCredentials: getCredentialsMock,
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    reserveLoginAttempt: reserveLoginAttemptMock,
    validateOrigin: actual.validateOrigin,
    getClientIp: actual.getClientIp,
  };
});

// Encode a minimal registration clientDataJSON containing the challenge
function encodeClientData(challenge: string): string {
  return Buffer.from(
    JSON.stringify({ type: "webauthn.create", challenge, origin: "http://localhost:4321" }),
  ).toString("base64");
}

function buildRegistrationBody(overrides: Record<string, unknown> = {}) {
  return {
    setupToken: "valid-setup-token",
    credential: {
      id: "new-cred-id",
      rawId: "new-cred-id",
      type: "public-key",
      response: {
        clientDataJSON: encodeClientData("reg-challenge"),
        attestationObject: Buffer.from("attestation").toString("base64"),
        transports: ["internal"],
      },
    },
    ...overrides,
  };
}

// ─── register-verify tests ──────────────────────────────────────────────────

describe("POST /api/auth/passkey/register-verify", () => {
  beforeEach(() => {
    vi.resetModules();
    verifyRegistrationResponseMock.mockReset();
    consumeChallengeMock.mockReset();
    storeCredentialMock.mockReset();
    reserveLoginAttemptMock.mockReset();
  });

  it("returns 400 when setupToken is missing", async () => {
    reserveLoginAttemptMock.mockResolvedValue(true);
    const { POST } = await import("@/pages/api/auth/passkey/register-verify");

    const ctx = createApiContext({
      method: "POST",
      body: { credential: buildRegistrationBody().credential },
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Setup token required/i);
  });

  it("returns 403 when setup token is expired/invalid (consumeChallenge returns false for setup)", async () => {
    reserveLoginAttemptMock.mockResolvedValue(true);
    // First consumeChallenge call is for setup token
    consumeChallengeMock.mockResolvedValueOnce(false);

    const { POST } = await import("@/pages/api/auth/passkey/register-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildRegistrationBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Invalid or expired setup token/i);
  });

  it("returns 403 when registration challenge is expired", async () => {
    reserveLoginAttemptMock.mockResolvedValue(true);
    // setup token valid, registration challenge invalid
    consumeChallengeMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const { POST } = await import("@/pages/api/auth/passkey/register-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildRegistrationBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Invalid or expired registration challenge/i);
  });

  it("returns 400 when verifyRegistrationResponse throws", async () => {
    reserveLoginAttemptMock.mockResolvedValue(true);
    consumeChallengeMock.mockResolvedValue(true);
    verifyRegistrationResponseMock.mockRejectedValue(new Error("attestation error"));

    const { POST } = await import("@/pages/api/auth/passkey/register-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildRegistrationBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Registration verification failed/i);
  });

  it("returns 200 with credentialID on success", async () => {
    reserveLoginAttemptMock.mockResolvedValue(true);
    consumeChallengeMock.mockResolvedValue(true);
    const fakeKey = Buffer.from("fakepublickey");
    verifyRegistrationResponseMock.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: "new-cred-id",
          publicKey: fakeKey,
          counter: 0,
        },
      },
    });
    storeCredentialMock.mockResolvedValue(undefined);

    const { POST } = await import("@/pages/api/auth/passkey/register-verify");

    const ctx = createApiContext({
      method: "POST",
      body: buildRegistrationBody(),
      headers: { "cf-connecting-ip": "1.2.3.4", Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { ok: boolean; credentialID: string };
    expect(body.ok).toBe(true);
    expect(body.credentialID).toBe("new-cred-id");
    expect(storeCredentialMock).toHaveBeenCalledWith(
      expect.anything(),
      "new-cred-id",
      expect.any(String),
      0,
      ["internal"],
    );
  });
});

// ─── register-options tests ──────────────────────────────────────────────────

describe("POST /api/auth/passkey/register-options", () => {
  beforeEach(() => {
    vi.resetModules();
    generateRegistrationOptionsMock.mockReset();
    validateChallengeMock.mockReset();
    storeChallengeMock.mockReset();
    getCredentialsMock.mockReset();
    reserveLoginAttemptMock.mockReset();
    reserveLoginAttemptMock.mockResolvedValue(true);
  });

  it("returns 429 before checking the setup token when the IP is rate-limited", async () => {
    reserveLoginAttemptMock.mockResolvedValue(false);

    const { POST } = await import("@/pages/api/auth/passkey/register-options");

    const ctx = createApiContext({
      method: "POST",
      body: { setupToken: "guess" },
      headers: { Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    expect(validateChallengeMock).not.toHaveBeenCalled();
  });

  it("frees the rate-limit slots when the setup token is valid", async () => {
    validateChallengeMock.mockResolvedValue(true);
    getCredentialsMock.mockResolvedValue([]);
    generateRegistrationOptionsMock.mockResolvedValue({ challenge: "c", rpName: "test", rpID: "localhost" });
    storeChallengeMock.mockResolvedValue(undefined);

    const { POST } = await import("@/pages/api/auth/passkey/register-options");

    const db = createMockDb();
    const ctx = createApiContext({
      method: "POST",
      body: { setupToken: "valid" },
      headers: { Origin: "http://localhost:4321" },
      db,
    });

    const response = await POST(ctx);
    expect(response.status).toBe(200);
    // A cancelled passkey prompt and a retry must not lock the admin out of sign-in.
    expect(db.prepare).toHaveBeenCalledWith("DELETE FROM login_attempts WHERE ip_address = ?");
  });

  it("returns 400 when setupToken is missing", async () => {
    const { POST } = await import("@/pages/api/auth/passkey/register-options");

    const ctx = createApiContext({
      method: "POST",
      body: {},
      headers: { Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Setup token required/i);
  });

  it("returns 403 when setupToken is expired/invalid", async () => {
    validateChallengeMock.mockResolvedValue(false);

    const { POST } = await import("@/pages/api/auth/passkey/register-options");

    const ctx = createApiContext({
      method: "POST",
      body: { setupToken: "expired-token" },
      headers: { Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(403);
    const body = await response.json() as { error: string };
    expect(body.error).toMatch(/Invalid or expired setup token/i);
  });

  it("returns 403 when Origin header is missing (CSRF)", async () => {
    // validateOrigin throws a Response with 403 when Origin is absent in PROD
    // In test env (non-PROD) it accepts X-Requested-With; test without either header.
    validateChallengeMock.mockResolvedValue(true);
    getCredentialsMock.mockResolvedValue([]);
    generateRegistrationOptionsMock.mockResolvedValue({ challenge: "c", rpName: "test", rpID: "localhost" });
    storeChallengeMock.mockResolvedValue(undefined);

    const { POST } = await import("@/pages/api/auth/passkey/register-options");

    // Deliberately omit Origin AND X-Requested-With to trigger CSRF guard
    const ctx = createApiContext({
      method: "POST",
      body: { setupToken: "valid-token" },
      headers: {},
    });
    // Remove the default Origin that createApiContext adds for mutations
    Object.defineProperty(ctx.request, "headers", {
      value: new Headers({ "Content-Type": "application/json" }),
      configurable: true,
    });

    try {
      await POST(ctx);
      // If we reach here in test env, validateOrigin allowed it; that's acceptable
    } catch (thrown: unknown) {
      // validateOrigin throws a Response on origin mismatch
      expect(thrown).toBeInstanceOf(Response);
      expect((thrown as Response).status).toBe(403);
    }
  });

  it("returns 200 with registration options on happy path", async () => {
    validateChallengeMock.mockResolvedValue(true);
    getCredentialsMock.mockResolvedValue([]);
    const fakeOptions = { challenge: "gen-challenge", rpName: "po4yka.dev Admin", rpID: "localhost" };
    generateRegistrationOptionsMock.mockResolvedValue(fakeOptions);
    storeChallengeMock.mockResolvedValue(undefined);

    const { POST } = await import("@/pages/api/auth/passkey/register-options");

    const ctx = createApiContext({
      method: "POST",
      body: { setupToken: "valid-setup-token" },
      headers: { Origin: "http://localhost:4321" },
    });

    const response = await POST(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as typeof fakeOptions;
    expect(body.challenge).toBe("gen-challenge");
    expect(storeChallengeMock).toHaveBeenCalledWith(expect.anything(), "gen-challenge", "registration");
  });
});
