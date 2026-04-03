export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCategories, addCategory } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { categorySchema, validationError, jsonError } from "@/lib/validation";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  await requireAuth(request, db);
  try {
    const categories = await getCategories(db);
    return Response.json(categories);
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
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await addCategory(db, parsed.data.name);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};
