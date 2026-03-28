export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request, locals }) => {
  const { password } = await request.json() as { password: string };
  const env = locals.runtime.env;

  if (password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = getDb(env);
  const token = await createSession(db);

  return Response.json({ token });
};
