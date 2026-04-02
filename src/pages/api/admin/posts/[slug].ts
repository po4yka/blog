export const prerender = false;

import type { APIRoute } from "astro";
import { getPostBySlug, upsertPost, deletePost } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { blogPostSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  const post = await getPostBySlug(db, params.slug!);
  if (!post) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  return Response.json(post);
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const parsed = blogPostSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await upsertPost(db, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  try {
    await deletePost(db, params.slug!);
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
