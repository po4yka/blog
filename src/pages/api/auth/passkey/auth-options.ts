export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { rpID } from "@/lib/webauthn-config";
import {
  checkAuthenticationOptionsRateLimit,
  getCredentials,
  recordAuthenticationOptionsRequest,
  storeChallenge,
} from "@/lib/webauthn";
import { jsonError } from "@/lib/validation";
import { getClientIp } from "@/lib/auth";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const ip = getClientIp(request);

  if (!ip) {
    return jsonError("Unable to determine client IP", 400);
  }

  try {
    const allowed = await checkAuthenticationOptionsRateLimit(db, ip);
    if (!allowed) {
      const response = jsonError("Too many attempts", 429);
      response.headers.set("Retry-After", "300");
      return response;
    }

    await recordAuthenticationOptionsRequest(db, ip);

    const credentials = await getCredentials(db);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((c) => ({
        id: c.credentialID,
        transports: c.transports as AuthenticatorTransport[],
      })),
      userVerification: "preferred",
    });

    await storeChallenge(db, options.challenge, "authentication");

    return Response.json(options);
  } catch {
    return jsonError("Failed to generate authentication options", 500);
  }
};
