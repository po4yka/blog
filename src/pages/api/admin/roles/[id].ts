export const prerender = false;

import { deleteRole } from "@/lib/db";
import { withAdmin } from "@/lib/admin-handler";

export const DELETE = withAdmin(
  { capability: "write:roles" },
  async ({ db, params }) => {
    await deleteRole(db, params.id!);
    return Response.json({ ok: true });
  },
);
