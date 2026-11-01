// Capability-scoped wrapper for admin API routes.
// Centralizes origin check, session auth, and capability scoping.

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { jsonError } from "@/lib/validation";

export type Capability =
  | "read:posts"
  | "read:projects"
  | "read:roles"
  | "read:categories"
  | "read:settings"
  | "read:telemetry";

/**
 * Resolve the capability allowlist for a session.
 * - session.capabilities === null  -> full admin (every capability allowed)
 * - session.capabilities === []    -> no capabilities (fail closed)
 * - otherwise                      -> exact allowlist
 */
function sessionHasCapability(
  session: { capabilities: readonly string[] | null },
  required: Capability,
): boolean {
  if (session.capabilities === null) return true;
  return session.capabilities.includes(required);
}

export interface AdminContext {
  request: Request;
  params: Record<string, string | undefined>;
  db: D1Database;
}

export function withAdmin(
  options: { capability: Capability },
  handler: (ctx: AdminContext) => Promise<Response>,
): APIRoute {
  return async ({ params, request }) => {
    try {
      validateOrigin(request);

      const db = env.DB;
      const session = await requireAuth(request, db);

      if (!sessionHasCapability(session, options.capability)) {
        return jsonError("Forbidden", 403);
      }

      const response = await handler({ request, params, db });

      // Harden every admin API response: prevent MIME sniffing and ensure
      // browsers never cache authenticated responses.
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("Cache-Control", "no-store");

      return response;
    } catch (err) {
      // requireAuth and validateOrigin throw a 401/403 Response. Return it: Astro turns a thrown
      // Response into a 500, which hides "signed out" from the admin client.
      if (err instanceof Response) return err;
      // Anything else is a real bug -- log it so Wrangler tail surfaces
      // the stack. The client still gets an opaque 500 so we don't leak
      // internals.
      console.error("[withAdmin] unhandled error:", err);
      return jsonError("Internal server error", 500);
    }
  };
}
