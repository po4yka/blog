export const prerender = false;

import { deleteProject } from "@/lib/db";
import { withAdmin } from "@/lib/admin-handler";

export const DELETE = withAdmin(
  { capability: "write:projects" },
  async ({ db, params }) => {
    await deleteProject(db, params.id!);
    return Response.json({ ok: true });
  },
);
