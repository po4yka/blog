export const prerender = false;

import type { APIRoute } from "astro";
import { createSession } from "@/lib/auth";
import { loginSchema, validationError } from "@/lib/validation";

export const POST: APIRoute = async ({ request, locals }) => {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const { password } = parsed.data;
  const env = locals.runtime.env;

  if (password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = env.DB;
  const token = await createSession(db);

  return Response.json({ token });
};
