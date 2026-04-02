export const prerender = false;

import type { APIRoute } from "astro";
import {
  createSession,
  validateOrigin,
  checkRateLimit,
  timingSafeEqual,
  recordLoginAttempt,
  clearLoginAttempts,
} from "@/lib/auth";
import { loginSchema, validationError } from "@/lib/validation";

export const POST: APIRoute = async ({ request, locals }) => {
  validateOrigin(request);

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const { password } = parsed.data;
  const env = locals.runtime.env;
  const db = env.DB;

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "unknown";

  const allowed = await checkRateLimit(db, ip);
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Too many login attempts" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "900",
      },
    });
  }

  const valid = await timingSafeEqual(password, env.ADMIN_PASSWORD);
  if (!valid) {
    await recordLoginAttempt(db, ip);
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await clearLoginAttempts(db, ip);
  const token = await createSession(db);

  return Response.json({ token });
};
