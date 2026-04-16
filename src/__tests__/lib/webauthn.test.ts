import { describe, it, expect, vi } from "vitest";
import {
  storeChallenge,
  consumeChallenge,
  validateChallenge,
  storeCredential,
  getCredentials,
  getCredentialById,
  updateCredentialCounter,
  hasAnyCredential,
  deleteCredentialById,
} from "@/lib/webauthn";
import { createMockDb, createWriteMockDb } from "../helpers";

describe("storeChallenge", () => {
  it("inserts challenge with type", async () => {
    const db = createWriteMockDb();
    await storeChallenge(db, "challenge-abc", "authentication");
    expect(db._bind).toHaveBeenCalledWith("challenge-abc", "authentication");
    expect(db._run).toHaveBeenCalled();
  });
});

describe("consumeChallenge", () => {
  it("returns true and deletes for valid challenge", async () => {
    const db = createMockDb();
    // First call: SELECT finds the challenge
    db.first.mockResolvedValueOnce({ challenge: "valid-challenge" });

    const result = await consumeChallenge(db, "valid-challenge", "registration");
    expect(result).toBe(true);

    // Should have called DELETE after finding the challenge
    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM auth_challenges"),
    );
  });

  it("returns false for missing/expired challenge", async () => {
    const db = createMockDb();
    db.first.mockResolvedValueOnce(null);

    const result = await consumeChallenge(db, "invalid", "registration");
    expect(result).toBe(false);
  });
});

describe("validateChallenge", () => {
  it("returns true without deleting for valid challenge", async () => {
    const db = createMockDb();
    db.first.mockResolvedValueOnce({ challenge: "valid" });

    const result = await validateChallenge(db, "valid", "setup");
    expect(result).toBe(true);
  });

  it("returns false for expired/missing challenge", async () => {
    const db = createMockDb();
    db.first.mockResolvedValueOnce(null);

    const result = await validateChallenge(db, "expired", "setup");
    expect(result).toBe(false);
  });
});

describe("storeCredential", () => {
  it("inserts credential with JSON-serialized transports", async () => {
    const db = createWriteMockDb();
    await storeCredential(db, "cred-id", "pubkey-base64", 0, ["usb", "ble"]);
    expect(db._bind).toHaveBeenCalledWith("cred-id", "pubkey-base64", 0, '["usb","ble"]');
    expect(db._run).toHaveBeenCalled();
  });
});

describe("getCredentials", () => {
  it("returns mapped credentials", async () => {
    const db = createMockDb();
    const all = {
      results: [
        { credential_id: "c1", public_key: "pk1", counter: 5, transports: '["usb"]' },
        { credential_id: "c2", public_key: "pk2", counter: 0, transports: null },
      ],
    };
    db.run.mockResolvedValueOnce(all);
    // getCredentials uses .all() not .first()
    const allFn = vi.fn().mockResolvedValueOnce(all);
    const prepareFn = vi.fn().mockReturnValue({ all: allFn });
    const mockDb = { prepare: prepareFn } as unknown as D1Database;

    const creds = await getCredentials(mockDb);
    expect(creds).toHaveLength(2);
    expect(creds[0]).toEqual({
      credentialID: "c1",
      publicKey: "pk1",
      counter: 5,
      transports: ["usb"],
    });
    expect(creds[1]?.transports).toEqual([]);
  });
});

describe("getCredentialById", () => {
  it("returns mapped credential", async () => {
    const db = createMockDb();
    db.first.mockResolvedValueOnce({
      credential_id: "c1",
      public_key: "pk1",
      counter: 10,
      transports: '["internal"]',
    });

    const cred = await getCredentialById(db, "c1");
    expect(cred).toEqual({
      credentialID: "c1",
      publicKey: "pk1",
      counter: 10,
      transports: ["internal"],
    });
  });

  it("returns null when not found", async () => {
    const db = createMockDb();
    db.first.mockResolvedValueOnce(null);

    const cred = await getCredentialById(db, "missing");
    expect(cred).toBeNull();
  });
});

describe("updateCredentialCounter", () => {
  it("updates counter by credential ID", async () => {
    const db = createWriteMockDb();
    await updateCredentialCounter(db, "cred-1", 42);
    expect(db._bind).toHaveBeenCalledWith(42, "cred-1");
    expect(db._run).toHaveBeenCalled();
  });
});

describe("hasAnyCredential", () => {
  it("returns true when credentials exist", async () => {
    // hasAnyCredential calls prepare().first() without bind()
    const first = vi.fn().mockResolvedValueOnce({ cnt: 2 });
    const prepare = vi.fn().mockReturnValue({ first });
    const db = { prepare } as unknown as D1Database;
    expect(await hasAnyCredential(db)).toBe(true);
  });

  it("returns false when no credentials", async () => {
    const first = vi.fn().mockResolvedValueOnce({ cnt: 0 });
    const prepare = vi.fn().mockReturnValue({ first });
    const db = { prepare } as unknown as D1Database;
    expect(await hasAnyCredential(db)).toBe(false);
  });
});

describe("deleteCredentialById", () => {
  it("returns true when credential was deleted", async () => {
    const db = createWriteMockDb();
    db._run.mockResolvedValueOnce({ success: true, meta: { changes: 1 } });
    const result = await deleteCredentialById(db, "cred-1");
    expect(result).toBe(true);
  });

  it("returns false when credential was not found", async () => {
    const db = createWriteMockDb();
    db._run.mockResolvedValueOnce({ success: true, meta: { changes: 0 } });
    const result = await deleteCredentialById(db, "missing");
    expect(result).toBe(false);
  });
});
