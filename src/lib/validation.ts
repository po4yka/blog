// Zod validation schemas for API request bodies (admin content is read-only; only the auth routes take a body).
//
// These schemas validate API *input*. The canonical domain types live in
// src/types/index.ts and include DB-generated fields (e.g. computed readingTime,
// generated id) that are absent or optional in the input schemas. Use the
// inferred Input types below for request parsing; use the domain types from
// src/types/ for internal logic and responses.

import { z } from "astro/zod";

export const loginSchema = z.object({
  password: z.string().min(1).max(1024),
});

export const logoutSchema = z.object({
  everywhere: z.boolean().optional(),
});

// WebAuthn payloads (@simplewebauthn/browser output). Fields are base64url strings; unknown fields
// (authenticatorAttachment) pass through for the library to read.
const b64url = z.string().min(1).max(8192);
const clientExtensionResults = z.record(z.string(), z.unknown()).default({});
const setupToken = z.string().min(1).max(256);

export const registerOptionsSchema = z.object({ setupToken });

export const registrationCredentialSchema = z.looseObject({
  id: b64url,
  rawId: b64url,
  type: z.literal("public-key"),
  response: z.looseObject({
    clientDataJSON: b64url,
    attestationObject: b64url,
    transports: z.array(z.string().max(32)).max(8).optional(),
  }),
  clientExtensionResults,
});

export const registerVerifySchema = z.object({ setupToken, credential: registrationCredentialSchema });

export const authenticationResponseSchema = z.looseObject({
  id: b64url,
  rawId: b64url,
  type: z.literal("public-key"),
  response: z.looseObject({
    clientDataJSON: b64url,
    authenticatorData: b64url,
    signature: b64url,
    userHandle: b64url.optional(),
  }),
  clientExtensionResults,
});

/** Return a 400 Response from a ZodError. */
export function validationError(error: z.ZodError): Response {
  return new Response(
    JSON.stringify({ error: "Invalid request", details: error.issues }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}

/** Return a JSON error Response with proper Content-Type. */
export function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}
