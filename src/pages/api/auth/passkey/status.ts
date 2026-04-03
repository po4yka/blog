export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hasAnyCredential } from "@/lib/webauthn";

export const GET: APIRoute = async () => {
  const db = env.DB;
  const hasPasskey = await hasAnyCredential(db);
  const allowPassword = env.ALLOW_PASSWORD_LOGIN === "true";

  return Response.json({ hasPasskey, allowPassword });
};
