export const prerender = false;

import { getAllProjects, upsertProject } from "@/lib/db";
import { projectSchema } from "@/lib/validation";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(
  { capability: "read:projects" },
  async ({ db }) => {
    const projects = await getAllProjects(db);
    return Response.json(projects);
  },
);

export const POST = withAdmin(
  { capability: "write:projects", schema: projectSchema },
  async ({ db, data }) => {
    await upsertProject(db, { ...data, id: data.id ?? crypto.randomUUID() });
    return Response.json({ ok: true });
  },
);
