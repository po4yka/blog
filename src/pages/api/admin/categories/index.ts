export const prerender = false;

import { getCategories, addCategory } from "@/lib/db";
import { categorySchema } from "@/lib/validation";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(
  { capability: "read:categories" },
  async ({ db }) => {
    const categories = await getCategories(db);
    return Response.json(categories);
  },
);

export const POST = withAdmin(
  { capability: "write:categories", schema: categorySchema },
  async ({ db, data }) => {
    await addCategory(db, data.name);
    return Response.json({ ok: true });
  },
);
