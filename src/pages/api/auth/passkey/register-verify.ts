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
import { validateOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/validation";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export const POST: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;

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

  // Validate setup token
  const tokenValid = await consumeChallenge(db, setupToken, "setup");
  if (!tokenValid) {
    return jsonError("Invalid or expired setup token", 403);
  }

  try {
    // Extract challenge from clientDataJSON
    const challengeJSON = Buffer.from(credential.response.clientDataJSON, "base64").toString("utf-8");
    const { challenge } = JSON.parse(challengeJSON) as { challenge: string };

    // Consume registration challenge
    const challengeValid = await consumeChallenge(db, challenge, "registration");
    if (!challengeValid) {
      return jsonError("Invalid or expired registration challenge", 403);
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError("Registration verification failed", 400);
    }

    const { credential: registeredCred } = verification.registrationInfo;

    await storeCredential(
      db,
      registeredCred.id,
      isoBase64URL.fromBuffer(registeredCred.publicKey),
      registeredCred.counter,
      credential.response.transports ?? [],
    );

    return Response.json({ ok: true, credentialID: registeredCred.id });
  } catch {
    return jsonError("Registration failed", 500);
  }
};
