export const prerender = false;

import type { APIRoute } from "astro";
import { getAllRoles, upsertRole } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { roleSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  try {
    const roles = await getAllRoles(db);
    return Response.json(roles);
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  validateOrigin(request);
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await upsertRole(db, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
