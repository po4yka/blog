export const prerender = false;

import { removeCategory } from "@/lib/db";
import { withAdmin } from "@/lib/admin-handler";

export const DELETE = withAdmin(
  { capability: "write:categories" },
  async ({ db, params }) => {
    await removeCategory(db, decodeURIComponent(params.name!));
    return Response.json({ ok: true });
  },
);
