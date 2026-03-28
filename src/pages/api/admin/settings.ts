export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getSettings, updateSettings, type SiteSettings } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const settings = await getSettings(db);
  return Response.json(settings);
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const settings = (await request.json()) as SiteSettings;
  await updateSettings(db, settings);
  return Response.json({ ok: true });
};
