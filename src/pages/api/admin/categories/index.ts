export const prerender = false;

import { getCategories } from "@/lib/db";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(
  { capability: "read:categories" },
  async ({ db }) => {
    const categories = await getCategories(db);
    return Response.json(categories);
  },
);
