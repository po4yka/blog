export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getPostBySlug, upsertPost, deletePost } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { blogPostSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ params, request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const post = await getPostBySlug(db, params.slug!);
  if (!post) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  return Response.json(post);
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const parsed = blogPostSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  await upsertPost(db, parsed.data);
  return Response.json({ ok: true });
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  await deletePost(db, params.slug!);
  return Response.json({ ok: true });
};
