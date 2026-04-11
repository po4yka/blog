// Capability-scoped wrapper for admin API routes.
// Centralizes auth, CORS, body parsing, and Zod validation.

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import type { z } from "astro/zod";
import { requireAuth, validateOrigin } from "@/lib/auth";
import { validationError, jsonError } from "@/lib/validation";

export type Capability =
  | "read:posts"
  | "write:posts"
  | "read:projects"
  | "write:projects"
  | "read:roles"
  | "write:roles"
  | "read:categories"
  | "write:categories"
  | "read:settings"
  | "write:settings";

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

export interface AdminContext<T = undefined> {
  request: Request;
  params: Record<string, string | undefined>;
  db: D1Database;
  data: T;
}

interface WithSchemaOptions<S extends z.ZodType> {
  capability: Capability;
  schema: S;
}

interface WithoutSchemaOptions {
  capability: Capability;
  schema?: undefined;
}

// Overload: with schema -> handler receives typed data
export function withAdmin<S extends z.ZodType>(
  options: WithSchemaOptions<S>,
  handler: (ctx: AdminContext<z.infer<S>>) => Promise<Response>,
): APIRoute;

// Overload: without schema -> handler receives undefined data
export function withAdmin(
  options: WithoutSchemaOptions,
  handler: (ctx: AdminContext<undefined>) => Promise<Response>,
): APIRoute;

// Implementation signature must be compatible with both overloads.
export function withAdmin<S extends z.ZodType>(
  options: { capability: Capability; schema?: S },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (ctx: AdminContext<any>) => Promise<Response>,
): APIRoute {
  return async ({ params, request }) => {
    try {
      validateOrigin(request);

      const db = env.DB;
      const session = await requireAuth(request, db);

      if (!sessionHasCapability(session, options.capability)) {
        return jsonError("Forbidden", 403);
      }

      let data: unknown = undefined;
      if (options.schema) {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonError("Invalid JSON", 400);
        }
        const parsed = options.schema.safeParse(body);
        if (!parsed.success) return validationError(parsed.error);
        data = parsed.data;
      }

      return await handler({ request, params, db, data });
    } catch (err) {
      if (err instanceof Response) throw err;
      return jsonError("Database error", 500);
    }
  };
}
