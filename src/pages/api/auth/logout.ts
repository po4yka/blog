export const prerender = false;

import type { APIRoute } from "astro";
import { deleteSession, validateOrigin } from "@/lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  validateOrigin(request);
  const header = request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    const db = locals.runtime.env.DB;
    await deleteSession(db, token);
  }

  return Response.json({ ok: true });
};
