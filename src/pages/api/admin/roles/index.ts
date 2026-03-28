export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getAllRoles, upsertRole, type Role } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const roles = await getAllRoles(db);
  return Response.json(roles);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const role = (await request.json()) as Role;
  await upsertRole(db, role);
  return Response.json({ ok: true });
};
