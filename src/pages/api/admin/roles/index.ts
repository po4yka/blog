export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getAllRoles, upsertRole } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { roleSchema, validationError, jsonError } from "@/lib/validation";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  await requireAuth(request, db);
  try {
    const roles = await getAllRoles(db);
    return Response.json(roles);
  } catch {
    return jsonError("Database error", 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await upsertRole(db, { ...parsed.data, id: parsed.data.id ?? crypto.randomUUID() });
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};
