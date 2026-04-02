export const prerender = false;

import type { APIRoute } from "astro";
import { getSettings, updateSettings } from "@/lib/db";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { siteSettingsSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  try {
    const settings = await getSettings(db);
    if (!settings) {
      return new Response(JSON.stringify({ error: "Settings not found" }), { status: 404 });
    }
    return Response.json(settings);
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  validateOrigin(request);
  const db = locals.runtime.env.DB;
  await requireAuth(request, db);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await updateSettings(db, parsed.data);
    return Response.json({ ok: true });
  } catch {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
};
