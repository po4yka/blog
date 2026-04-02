export const prerender = false;

import type { APIRoute } from "astro";
import { deleteRole } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  validateOrigin(request);
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  try {
    await deleteRole(db, params.id!);
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
