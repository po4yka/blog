export const prerender = false;

import { getSettings } from "@/lib/db";
import { jsonError } from "@/lib/validation";
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
