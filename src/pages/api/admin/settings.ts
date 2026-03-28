export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getSettings, updateSettings } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { siteSettingsSchema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const settings = await getSettings(db);
  return Response.json(settings);
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const parsed = siteSettingsSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  await updateSettings(db, parsed.data);
  return Response.json({ ok: true });
};
