export const prerender = false;

import { getAllRoles, upsertRole } from "@/lib/db";
import { roleSchema } from "@/lib/validation";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(
  { capability: "read:roles" },
  async ({ db }) => {
    const roles = await getAllRoles(db);
    return Response.json(roles);
  },
);

export const POST = withAdmin(
  { capability: "write:roles", schema: roleSchema },
  async ({ db, data }) => {
    await upsertRole(db, { ...data, id: data.id ?? crypto.randomUUID() });
    return Response.json({ ok: true });
  },
);
