export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getAllProjects, upsertProject } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { projectSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const projects = await getAllProjects(db);
  return Response.json(projects);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  await upsertProject(db, parsed.data);
  return Response.json({ ok: true });
};
