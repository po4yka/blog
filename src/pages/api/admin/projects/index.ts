export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getAllProjects, upsertProject, type Project } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const projects = await getAllProjects(db);
  return Response.json(projects);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const project = (await request.json()) as Project;
  await upsertProject(db, project);
  return Response.json({ ok: true });
};
