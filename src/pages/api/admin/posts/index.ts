export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getAllPosts, upsertPost, type BlogPost } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const posts = await getAllPosts(db);
  return Response.json(posts);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const post = (await request.json()) as BlogPost;
  await upsertPost(db, post);
  return Response.json({ ok: true });
};
