export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, deleteRole } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  await deleteRole(db, params.id!);
  return Response.json({ ok: true });
};
