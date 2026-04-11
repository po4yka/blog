export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { rpID, expectedOrigin } from "@/lib/webauthn-config";
import {
  consumeChallenge,
  getCredentialById,
  updateCredentialCounter,
} from "@/lib/webauthn";
import { createSession, makeSessionCookie } from "@/lib/auth";
import { jsonError } from "@/lib/validation";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const assertion = body as AuthenticationResponseJSON;

  // Parse the challenge out of clientDataJSON up front so a malformed
  // payload is a 400, not a 401/500 buried in a broad catch.
  let challenge: string;
  try {
    const challengeJSON = Buffer.from(
      assertion.response.clientDataJSON,
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

  // Look up the credential
  const credential = await getCredentialById(db, assertion.id);
  if (!credential) {
    return jsonError("Unknown credential", 401);
  }

  // Consume the challenge (one-time use)
  const validChallenge = await consumeChallenge(db, challenge, "authentication");
  if (!validChallenge) {
    return jsonError("Invalid or expired challenge", 401);
  }

  // Cryptographic verification -- any failure here is genuinely an auth
  // failure, not a server error.
  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialID,
        publicKey: isoBase64URL.toBuffer(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransport[],
      },
    });
  } catch {
    return jsonError("Verification failed", 401);
  }

  if (!verification.verified || !verification.authenticationInfo) {
    return jsonError("Verification failed", 401);
  }

  // Update counter to prevent replay attacks, then issue a session.
  // D1 failures beyond this point are legitimate 500s -- not auth failures.
  await updateCredentialCounter(
    db,
    credential.credentialID,
    verification.authenticationInfo.newCounter,
  );

  const token = await createSession(db);
  const isSecure = new URL(request.url).protocol === "https:";

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": makeSessionCookie(token, isSecure),
    },
  });
};
