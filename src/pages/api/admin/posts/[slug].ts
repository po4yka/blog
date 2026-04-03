export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getPostBySlug, upsertPost, deletePost } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { blogPostSchema, validationError, jsonError } from "@/lib/validation";

export const GET: APIRoute = async ({ params, request }) => {
  const db = env.DB;
  await requireAuth(request, db);
  try {
    const post = await getPostBySlug(db, params.slug!);
    if (!post) {
      return jsonError("Not found", 404);
    }
    return Response.json(post);
  } catch {
    return jsonError("Database error", 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = blogPostSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await upsertPost(db, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  validateOrigin(request);
  const db = env.DB;
  await requireAuth(request, db);
  try {
    await deletePost(db, params.slug!);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};
