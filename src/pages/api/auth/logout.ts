export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "@/lib/db";
import { deleteSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  const header = request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    const db = getDb(locals.runtime.env);
    await deleteSession(db, token);
  }

  return Response.json({ ok: true });
};
