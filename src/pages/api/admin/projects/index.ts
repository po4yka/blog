export const prerender = false;

import type { APIRoute } from "astro";
import { getAllProjects, upsertProject } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { projectSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  try {
    const projects = await getAllProjects(db);
    return Response.json(projects);
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await upsertProject(db, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
