export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getAllRoles, upsertRole } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { roleSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const roles = await getAllRoles(db);
  return Response.json(roles);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const parsed = roleSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  await upsertRole(db, parsed.data);
  return Response.json({ ok: true });
};
