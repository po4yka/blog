export const prerender = false;

import type { APIRoute } from "astro";
import { getCategories, addCategory } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { categorySchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  const categories = await getCategories(db);
  return Response.json(categories);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await addCategory(db, parsed.data.name);
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
