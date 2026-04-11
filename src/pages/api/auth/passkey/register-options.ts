export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { rpID, rpName } from "@/lib/webauthn-config";
import { validateChallenge, storeChallenge, getCredentials } from "@/lib/webauthn";
import { validateOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { setupToken } = body as { setupToken?: string };
  if (!setupToken) {
    return jsonError("Setup token required", 400);
  }

  // Validate setup token without consuming it. The token is only burned
  // in register-verify so that (a) the 5-minute expiry is measured from a
  // single insertion and cannot be refreshed by polling this endpoint, and
  // (b) the final registration step still enforces single-use.
  const valid = await validateChallenge(db, setupToken, "setup");
  if (!valid) {
    return jsonError("Invalid or expired setup token", 403);
  }

  try {
    const existingCredentials = await getCredentials(db);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: "admin",
      userDisplayName: "Admin",
      attestationType: "none",
      excludeCredentials: existingCredentials.map((c) => ({
        id: c.credentialID,
        transports: c.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store challenge for the verify step. The setup token remains in
    // place from whoever initially issued it -- we never re-insert it.
    await storeChallenge(db, options.challenge, "registration");

    return Response.json(options);
  } catch {
    return jsonError("Failed to generate registration options", 500);
  }
};
