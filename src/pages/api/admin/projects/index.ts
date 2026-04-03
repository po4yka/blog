export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getAllProjects, upsertProject } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { projectSchema, validationError, jsonError } from "@/lib/validation";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  await requireAuth(request, db);
  try {
    const projects = await getAllProjects(db);
    return Response.json(projects);
  } catch {
    return jsonError("Database error", 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await upsertProject(db, { ...parsed.data, id: parsed.data.id ?? crypto.randomUUID() });
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};
