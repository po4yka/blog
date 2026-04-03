export const prerender = false;

import { getPostBySlug, upsertPost, deletePost } from "@/lib/db";
import { blogPostSchema, jsonError } from "@/lib/validation";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(
  { capability: "read:posts" },
  async ({ db, params }) => {
    const post = await getPostBySlug(db, params.slug!);
    if (!post) {
      return jsonError("Not found", 404);
    }
    return Response.json(post);
  },
);

export const PUT = withAdmin(
  { capability: "write:posts", schema: blogPostSchema },
  async ({ db, data }) => {
    await upsertPost(db, data);
    return Response.json({ ok: true });
  },
);

export const DELETE = withAdmin(
  { capability: "write:posts" },
  async ({ db, params }) => {
    await deletePost(db, params.slug!);
    return Response.json({ ok: true });
  },
);
