export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getAllPosts, upsertPost } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { blogPostSchema, validationError, jsonError } from "@/lib/validation";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  await requireAuth(request, db);
  try {
    const posts = await getAllPosts(db);
    return Response.json(posts);
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
  const parsed = blogPostSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await upsertPost(db, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};
