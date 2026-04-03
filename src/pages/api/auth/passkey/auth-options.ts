export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { rpID } from "@/lib/webauthn-config";
import { getCredentials, storeChallenge } from "@/lib/webauthn";
import { jsonError } from "@/lib/validation";

export const GET: APIRoute = async () => {
  const db = env.DB;

  try {
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
