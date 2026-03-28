export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getCategories, addCategory } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const categories = await getCategories(db);
  return Response.json(categories);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const { name } = (await request.json()) as { name: string };
  await addCategory(db, name);
  return Response.json({ ok: true });
};
