// Zod validation schemas for API request bodies (admin content is read-only; only login takes a body).
//
// These schemas validate API *input*. The canonical domain types live in
// src/types/index.ts and include DB-generated fields (e.g. computed readingTime,
// generated id) that are absent or optional in the input schemas. Use the
// inferred Input types below for request parsing; use the domain types from
// src/types/ for internal logic and responses.

import { z } from "astro/zod";

export const loginSchema = z.object({
  password: z.string().min(1).max(1024),
});

/** Return a 400 Response from a ZodError. */
export function validationError(error: z.ZodError): Response {
  return new Response(
    JSON.stringify({ error: "Invalid request", details: error.issues }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}

/** Return a JSON error Response with proper Content-Type. */
export function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}
