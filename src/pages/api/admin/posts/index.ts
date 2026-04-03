export const prerender = false;

import { getAllPosts, upsertPost } from "@/lib/db";
import { blogPostSchema } from "@/lib/validation";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(
  { capability: "read:posts" },
  async ({ db }) => {
    const posts = await getAllPosts(db);
    return Response.json(posts);
  },
);

export const POST = withAdmin(
  { capability: "write:posts", schema: blogPostSchema },
  async ({ db, data }) => {
    await upsertPost(db, data);
    return Response.json({ ok: true });
  },
);
