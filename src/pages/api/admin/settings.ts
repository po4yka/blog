export const prerender = false;

import { getSettings, updateSettings } from "@/lib/db";
import { siteSettingsSchema, jsonError } from "@/lib/validation";
import { withAdmin } from "@/lib/admin-handler";

export const GET = withAdmin(
  { capability: "read:settings" },
  async ({ db }) => {
    const settings = await getSettings(db);
    if (!settings) {
      return jsonError("Settings not found", 404);
    }
    return Response.json(settings);
  },
);

export const PUT = withAdmin(
  { capability: "write:settings", schema: siteSettingsSchema },
  async ({ db, data }) => {
    await updateSettings(db, data);
    return Response.json({ ok: true });
  },
);
