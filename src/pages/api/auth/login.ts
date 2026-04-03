export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  createSession,
  validateOrigin,
  checkRateLimit,
  timingSafeEqual,
  recordLoginAttempt,
  clearLoginAttempts,
} from "@/lib/auth";
import { loginSchema, validationError, jsonError } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  // Password login is disabled by default when passkeys are available.
  // Set ALLOW_PASSWORD_LOGIN=true in Cloudflare secrets to re-enable.
  if (env.ALLOW_PASSWORD_LOGIN !== "true") {
    return jsonError("Password login disabled. Use passkey.", 403);
  }

  validateOrigin(request);

  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const { password } = parsed.data;
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
