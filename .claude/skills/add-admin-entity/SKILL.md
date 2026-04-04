---
name: add-admin-entity
description: "Scaffold a new CRUD entity using defineCollection() and withAdmin(). Use when adding a new data type to the admin (e.g., certifications, talks, testimonials). Generates collection definition, routes, hooks, and page following established patterns."
user-invocable: true
argument-hint: "<entity-name>"
---

# Add Admin Entity

Scaffold a complete CRUD entity using the `defineCollection()` library. This derives DB operations, Zod schemas, and API route handlers from a single field-level definition.

**When to use `defineCollection()`:** 3+ entities sharing the same CRUD shape (getAll, getByPk, upsert, delete). Entities with non-standard operations (categories: INSERT OR IGNORE, settings: single-row) should stay hand-written.

## Step 1: Database Schema

Add a table to `db/schema.sql`. Follow the existing pattern:

```sql
CREATE TABLE IF NOT EXISTS <entity_plural> (
  id          TEXT PRIMARY KEY,
  -- domain fields here
  tags        TEXT DEFAULT '[]',      -- JSON arrays stored as TEXT
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
```

Conventions:
- Primary key is `id TEXT` (or `slug TEXT` for content entities like posts)
- JSON arrays (tags, links, platforms) are `TEXT` columns with `DEFAULT '[]'`
- Booleans are `INTEGER DEFAULT 0` (SQLite has no boolean type)
- Always include `created_at` and `updated_at` timestamps
- Use `snake_case` for column names

## Step 2: TypeScript Type

Add a domain interface to `src/types/index.ts`:

```typescript
export interface <Entity> {
  id?: string;
  // domain fields -- use camelCase
  tags?: string[];
  sortOrder?: number;
}
```

Conventions:
- `id` is optional (generated on create via `idGeneration: "uuid"`)
- `sortOrder` maps to `sort_order` in DB
- JSON array fields are typed as their parsed form (`string[]`, not `string`)
- Boolean fields are real `boolean`, not `number`

## Step 3: Collection Definition

Create `src/lib/collections/<entity_plural>.ts`:

```typescript
import { z } from "astro/zod";
import { defineCollection } from "./define";
import type { <Entity> } from "@/types";

export const <entity_plural> = defineCollection<Entity>({
  name: "<entity_plural>",
  table: "<entity_plural>",
  primaryKey: "id",
  orderBy: "sort_order ASC",
  idGeneration: "uuid",
  capabilities: { read: "read:<entity_plural>", write: "write:<entity_plural>" },
  fields: {
    id:        { column: "id",         type: "text",    zod: z.string().optional() },
    // domain fields
    tags:      { column: "tags",       type: "json",    zod: z.array(z.string()).optional(), default: [] },
    sortOrder: { column: "sort_order", type: "integer", zod: z.number().optional() },
  },
});
```

Field type system:
- `"text"` -- passthrough string
- `"integer"` -- passthrough number (use `optional: true` for nullable)
- `"boolean"` -- converts between `true/false` and `1/0`
- `"json"` -- `JSON.stringify`/`parseJson` with `default` value

Each field has explicit `column` mapping (no magic snake_case convention).

## Step 4: Register Collection

Add to `src/lib/collections/index.ts`:

```typescript
export { <entity_plural> } from "./<entity_plural>";
```

Add capability types to `src/lib/admin-handler.ts` if needed:

```typescript
export type Capability =
  | // ... existing
  | "read:<entity_plural>"
  | "write:<entity_plural>";
```

Add the new capabilities to the `ALL_CAPABILITIES` set as well.

## Step 5: Backward-Compat Re-exports (optional)

If other code imports from `src/lib/db.ts`, add re-exports:

```typescript
export const getAll<Entities> = (db: D1Database) => <entity_plural>.getAll(db);
export const upsert<Entity> = (db: D1Database, item: <Entity>) =>
  <entity_plural>.upsert(db, item as unknown as Record<string, unknown>);
export const delete<Entity> = (db: D1Database, id: string) => <entity_plural>.remove(db, id);
```

## Step 6: API Routes

Create two files (5-7 lines each, re-exporting from collection):

**`src/pages/api/admin/<entity_plural>/index.ts`:**

```typescript
export const prerender = false;

import { <entity_plural> } from "@/lib/collections";

export const GET = <entity_plural>.routes.list;
export const POST = <entity_plural>.routes.create;
```

**`src/pages/api/admin/<entity_plural>/[id].ts`:**

```typescript
export const prerender = false;

import { <entity_plural> } from "@/lib/collections";

export const DELETE = <entity_plural>.routes.delete;
```

The collection's route factories use `withAdmin()` internally with the collection's capabilities and schema.

## Step 7: Query Hooks

Add to `src/admin/hooks/useAdminQueries.ts`:

1. Add query key to `adminKeys`:
```typescript
<entity_plural>: ["admin", "<entity_plural>"] as const,
```

2. Use the `createCollectionHooks` factory:
```typescript
const <entity>Hooks = createCollectionHooks<<Entity>>({
  queryKey: adminKeys.<entity_plural>,
  getAll: api.get<Entities>,
  save: api.save<Entity>,
  remove: api.delete<Entity>,
  idField: "id",
  entityName: "<Entity>",
});

export const use<Entities> = <entity>Hooks.useList;
export const useSave<Entity> = <entity>Hooks.useSave;
export const useDelete<Entity> = <entity>Hooks.useDelete;
```

The factory provides list, save, and optimistic delete with rollback.

## Step 8: Admin API Client

Add typed fetch functions to `src/admin/api.ts`:

```typescript
export const get<Entities> = () => adminFetch<<Entity>[]>("<entity_plural>");
export const save<Entity> = (item: <Entity>) =>
  adminFetch<{ ok: true }>("<entity_plural>", { method: "POST", body: JSON.stringify(item) });
export const delete<Entity> = (id: string) =>
  adminFetch<{ ok: true }>(`<entity_plural>/${id}`, { method: "DELETE" });
```

Import the type and re-export it.

## Step 9: Admin Page

Create `src/admin/pages/Admin<Entities>.tsx`. Use existing pages as reference:
- `AdminExperience.tsx` for simple list + inline editor pattern
- `AdminProjects.tsx` for modal editor pattern

Add route to admin router in `src/admin/routes.ts`.

## Checklist

- [ ] Schema added to `db/schema.sql`
- [ ] Type added to `src/types/index.ts`
- [ ] Collection definition in `src/lib/collections/<entity_plural>.ts`
- [ ] Registered in `src/lib/collections/index.ts`
- [ ] Capabilities added to `src/lib/admin-handler.ts`
- [ ] API routes: `index.ts` (GET/POST) + `[id].ts` (DELETE) -- re-export from collection
- [ ] All API routes have `prerender = false`
- [ ] Client functions in `src/admin/api.ts`
- [ ] Query key + hooks in `src/admin/hooks/useAdminQueries.ts` (use `createCollectionHooks`)
- [ ] Admin page in `src/admin/pages/`
- [ ] Route added to admin router
- [ ] TypeScript compiles: `npx tsc --noEmit`
