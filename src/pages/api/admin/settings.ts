export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getSettings, updateSettings } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { siteSettingsSchema, validationError, jsonError } from "@/lib/validation";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  await requireAuth(request, db);
  try {
    const settings = await getSettings(db);
    if (!settings) {
      return jsonError("Settings not found", 404);
    }
    return Response.json(settings);
  } catch {
    return jsonError("Database error", 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  validateOrigin(request);
  const db = env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await updateSettings(db, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return jsonError("Database error", 500);
  }
};
