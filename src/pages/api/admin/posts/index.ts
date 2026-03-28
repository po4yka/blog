export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getAllPosts, upsertPost } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { blogPostSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const posts = await getAllPosts(db);
  return Response.json(posts);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const parsed = blogPostSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  await upsertPost(db, parsed.data);
  return Response.json({ ok: true });
};
