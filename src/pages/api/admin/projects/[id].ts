export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { deleteProject } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/validation";

export const DELETE: APIRoute = async ({ params, request }) => {
  validateOrigin(request);
  const db = env.DB;
  await requireAuth(request, db);
  try {
    await deleteProject(db, params.id!);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};
