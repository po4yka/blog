export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, removeCategory } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  await removeCategory(db, decodeURIComponent(params.name!));
  return Response.json({ ok: true });
};
