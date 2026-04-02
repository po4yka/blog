export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { removeCategory } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";

export const DELETE: APIRoute = async ({ params, request }) => {
  validateOrigin(request);
  const db = env.DB;
  await requireAuth(request, db);
  try {
    await removeCategory(db, decodeURIComponent(params.name!));
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
