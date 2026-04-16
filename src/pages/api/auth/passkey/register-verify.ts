export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { rpID, expectedOrigin } from "@/lib/webauthn-config";
import {
  consumeChallenge,
  storeCredential,
} from "@/lib/webauthn";
import { validateOrigin, checkRateLimit } from "@/lib/auth";
import { jsonError } from "@/lib/validation";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export const POST: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    (import.meta.env.PROD ? null : "127.0.0.1");
  if (!ip) return jsonError("Unable to determine client IP", 400);

  const allowed = await checkRateLimit(db, ip);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many attempts" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "900" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { setupToken, credential } = body as {
    setupToken?: string;
    credential?: RegistrationResponseJSON;
  };

  if (!setupToken) {
    return jsonError("Setup token required", 400);
  }
  if (!credential) {
    return jsonError("Credential response required", 400);
  }

  // Parse the challenge out of clientDataJSON up front so a malformed
  // payload is a 400, not a 500 buried in a broad catch.
  let challenge: string;
  try {
    const challengeJSON = Buffer.from(
      credential.response.clientDataJSON,
      "base64",
    ).toString("utf-8");
    const parsed = JSON.parse(challengeJSON) as { challenge?: unknown };
    if (typeof parsed.challenge !== "string") {
      return jsonError("Invalid client data", 400);
    }
    challenge = parsed.challenge;
  } catch {
    return jsonError("Invalid client data", 400);
  }

  // Validate and burn the setup token (one-time use, enforced here).
  const tokenValid = await consumeChallenge(db, setupToken, "setup");
  if (!tokenValid) {
    return jsonError("Invalid or expired setup token", 403);
  }

  // Consume registration challenge
  const challengeValid = await consumeChallenge(db, challenge, "registration");
  if (!challengeValid) {
    return jsonError("Invalid or expired registration challenge", 403);
  }

  // Cryptographic verification -- failure here is a client/assertion
  // problem, not a server error.
  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
    });
  } catch {
    return jsonError("Registration verification failed", 400);
  }

  if (!verification.verified || !verification.registrationInfo) {
    return jsonError("Registration verification failed", 400);
  }

  const { credential: registeredCred } = verification.registrationInfo;

  // D1 write. If this throws, it's a legitimate 500.
  await storeCredential(
    db,
    registeredCred.id,
    isoBase64URL.fromBuffer(registeredCred.publicKey),
    registeredCred.counter,
    credential.response.transports ?? [],
  );

  return Response.json({ ok: true, credentialID: registeredCred.id });
};
