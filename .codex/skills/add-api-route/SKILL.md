---
name: add-api-route
description: "Create a new Astro API route with Cloudflare D1 database access, authentication, and Zod validation. Use when adding any server endpoint under /api/. Follows the project's established patterns for auth, error handling, and Cloudflare runtime access."
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
    login.ts           # Public (no requireAuth)
    logout.ts
```

URL mapping: `src/pages/api/admin/posts/[slug].ts` -> `GET /api/admin/posts/my-post-slug`

## Collection Endpoint Template

`src/pages/api/admin/<entity>/index.ts`:

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, getAll<Entities>, upsert<Entity> } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { <entity>Schema, validationError } from "@/lib/validation";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const items = await getAll<Entities>(db);
  return Response.json(items);
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  const parsed = <entity>Schema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  await upsert<Entity>(db, parsed.data);
  return Response.json({ ok: true });
};
```

## Item Endpoint Template

`src/pages/api/admin/<entity>/[id].ts`:

```typescript
export const prerender = false;

import type { APIRoute } from "astro";
import { getDb, delete<Entity> } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const db = getDb(locals.runtime.env);
  await requireAuth(request, db);
  await delete<Entity>(db, params.id!);
  return Response.json({ ok: true });
};
```

## Critical Rules

### `prerender = false` is mandatory

Without this export, Astro treats the file as a static route and evaluates it at build time. This causes build failures because `locals.runtime.env` (Cloudflare D1) is not available during static builds.

```typescript
// FIRST LINE of every API route file
export const prerender = false;
```

### `requireAuth` throws a Response

`requireAuth(request, db)` from `src/lib/auth.ts` validates the Bearer token. On failure, it **throws a `Response` object** (not an `Error`). Astro catches thrown Responses and sends them directly to the client.

```typescript
// Correct: always await before any data access
const db = getDb(locals.runtime.env);
await requireAuth(request, db);  // throws Response(401) on invalid token
const data = await getAll(db);   // only reached if auth passes
```

For public endpoints (login, health checks), omit `requireAuth`.

### D1 access via Cloudflare adapter

```typescript
const db = getDb(locals.runtime.env);
```

`locals.runtime.env` is injected by the `@astrojs/cloudflare` adapter. The `getDb()` helper (from `src/lib/db.ts`) extracts `env.DB` (the D1 binding).

### Validation with Zod

1. Define schema in `src/lib/validation.ts` using `z` from `astro/zod`
2. Use `safeParse` (not `parse`) to avoid throwing
3. Return `validationError(parsed.error)` on failure (400 Response with issue details)

```typescript
import { <entity>Schema, validationError } from "@/lib/validation";

const parsed = <entity>Schema.safeParse(await request.json());
if (!parsed.success) return validationError(parsed.error);
// parsed.data is now typed
```

### Response conventions

```typescript
// Success
return Response.json({ ok: true });
return Response.json(data);

// Client error
return new Response(
  JSON.stringify({ error: "Not found" }),
  { status: 404, headers: { "Content-Type": "application/json" } }
);
```

## HTTP Method Exports

Export named constants matching HTTP methods:

```typescript
export const GET: APIRoute = async ({ ... }) => { ... };
export const POST: APIRoute = async ({ ... }) => { ... };
export const PUT: APIRoute = async ({ ... }) => { ... };
export const DELETE: APIRoute = async ({ ... }) => { ... };
```

Only export the methods your route handles. Astro returns 405 for unhandled methods.

## Dynamic Route Parameters

File `[id].ts` makes `id` available via `params.id`. Use `!` assertion since the param is guaranteed by the route:

```typescript
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const id = params.id!;
  // ...
};
```

## Checklist

- [ ] `export const prerender = false` is the first line
- [ ] `requireAuth` called before any data access (unless public endpoint)
- [ ] D1 accessed via `getDb(locals.runtime.env)`
- [ ] Request body validated with Zod `safeParse` + `validationError`
- [ ] Response uses `Response.json()` for success
- [ ] Corresponding DB functions exist in `src/lib/db.ts`
- [ ] TypeScript compiles: `npx astro check`
