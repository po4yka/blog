---
name: add-api-route
description: "Create a new Astro API route with withAdmin() wrapper, capability scoping, and Zod validation. Use when adding any server endpoint under /api/. For standard CRUD entities, prefer /add-admin-entity instead."
user-invocable: true
argument-hint: "<route-path>"
---

# Add API Route

Create a new server-side API endpoint in this Astro + Cloudflare D1 project.

## Route File Location

Place API route files under `src/pages/api/`:

```
src/pages/api/
  admin/
    <entity>/
      index.ts        # Collection: GET (list), POST (create/update)
      [id].ts          # Item: GET (single), PUT (update), DELETE
    settings.ts        # Singleton resource (no [id])
  auth/
    login.ts           # Public (no auth required)
    logout.ts
    passkey/            # WebAuthn endpoints
```

URL mapping: `src/pages/api/admin/posts/[slug].ts` -> `GET /api/admin/posts/my-post-slug`

## Preferred: withAdmin() Wrapper

For admin routes, use the `withAdmin()` capability-scoped wrapper. It handles auth, CSRF origin validation, JSON parsing, Zod validation, and error wrapping in one call.

### With Zod Schema (POST/PUT)

```typescript
export const prerender = false;

import { withAdmin } from "@/lib/admin-handler";
import { mySchema } from "@/lib/validation";
import { doSomething } from "@/lib/db";

export const POST = withAdmin(
  { capability: "write:entity", schema: mySchema },
  async ({ db, data }) => {
    // data is typed from mySchema
    await doSomething(db, data);
    return Response.json({ ok: true });
  },
);
```

### Without Schema (GET/DELETE)

```typescript
export const prerender = false;

import { withAdmin } from "@/lib/admin-handler";
import { getAllItems } from "@/lib/db";

export const GET = withAdmin(
  { capability: "read:entity" },
  async ({ db }) => {
    const items = await getAllItems(db);
    return Response.json(items);
  },
);

export const DELETE = withAdmin(
  { capability: "write:entity" },
  async ({ db, params }) => {
    await deleteItem(db, params.id!);
    return Response.json({ ok: true });
  },
);
```

### withAdmin Context

The handler receives `AdminContext`:

```typescript
interface AdminContext<T = undefined> {
  request: Request;
  params: Record<string, string | undefined>;
  db: D1Database;
  data: T;  // typed from schema, or undefined if no schema
}
```

### Available Capabilities

```typescript
type Capability =
  | "read:posts" | "write:posts"
  | "read:projects" | "write:projects"
  | "read:roles" | "write:roles"
  | "read:categories" | "write:categories"
  | "read:settings" | "write:settings";
```

Add new capabilities to `src/lib/admin-handler.ts` when creating new entity types.

## Collection Routes (Standard CRUD)

For entities using `defineCollection()`, routes are just re-exports:

```typescript
export const prerender = false;

import { posts } from "@/lib/collections";

export const GET = posts.routes.list;
export const POST = posts.routes.create;
```

See `/add-admin-entity` for the full collection pattern.

## Public Routes (No Auth)

For public endpoints (login, health), write handlers directly without `withAdmin()`:

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { loginSchema, validationError } from "@/lib/validation";

export const POST: APIRoute = async ({ request }) => {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  // ... handle request
  return Response.json({ token });
};
```

## Critical Rules

### `prerender = false` is mandatory

Without this export, Astro treats the file as a static route and evaluates it at build time. This causes build failures because D1 is not available during static builds.

```typescript
// FIRST LINE of every API route file
export const prerender = false;
```

### withAdmin() handles auth automatically

Do NOT manually call `requireAuth()` in routes that use `withAdmin()`. The wrapper handles:
1. CSRF origin validation (`validateOrigin`)
2. Bearer token auth (`requireAuth`)
3. Capability check
4. JSON body parsing + Zod validation (if schema provided)
5. Error wrapping (returns JSON errors with correct status codes)

### D1 access

With `withAdmin()`: `db` is provided in the handler context.
Without wrapper: use `import { env } from "cloudflare:workers"` then `env.DB`.

### Validation with Zod

Define schemas in `src/lib/validation.ts` using `z` from `astro/zod`. For collection entities, schemas are auto-generated from field definitions in `defineCollection()`.

### Response conventions

```typescript
// Success
return Response.json({ ok: true });
return Response.json(data);

// Error (use jsonError helper)
import { jsonError } from "@/lib/validation";
return jsonError("Not found", 404);
```

## Checklist

- [ ] `export const prerender = false` is the first line
- [ ] Admin routes use `withAdmin()` with appropriate capability
- [ ] Public routes omit auth (login, health)
- [ ] Request body validated with Zod schema (passed to `withAdmin` or manual `safeParse`)
- [ ] Response uses `Response.json()` for success, `jsonError()` for errors
- [ ] TypeScript compiles: `npx tsc --noEmit`
