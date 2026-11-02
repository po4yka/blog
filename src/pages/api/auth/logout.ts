export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  deleteAllSessions,
  deleteSession,
  extractSessionToken,
  makeClearCookie,
  requireAuth,
  validateOrigin,
} from "@/lib/auth";
import { jsonError, logoutSchema, validationError } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;

  // { "everywhere": true } revokes every session. Any other body, or none, signs out this session,
  // so a client that sends something unexpected is still signed out.
  let body: unknown = null;
  try {
    body = JSON.parse(await request.text());
  } catch {
    // Not JSON: a plain logout.
  }
  const asksEverywhere = typeof body === "object" && body !== null && "everywhere" in body;
  const parsed = logoutSchema.safeParse(body);
  if (asksEverywhere && !parsed.success) return validationError(parsed.error);

  if (parsed.success && parsed.data.everywhere) {
    // Only a valid full-admin session may revoke the others; otherwise anyone could sign the admin out.
    try {
      const session = await requireAuth(request, db);
      if (session.capabilities !== null) return jsonError("Forbidden", 403);
    } catch (err) {
      if (err instanceof Response) return err;
      throw err;
    }
    const revoked = await deleteAllSessions(db);
    return new Response(JSON.stringify({ ok: true, revoked }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": makeClearCookie() },
    });
  }

  const token = extractSessionToken(request);
  if (token) await deleteSession(db, token);

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": makeClearCookie(),
    },
  });
};
