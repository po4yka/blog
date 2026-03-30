---
name: add-admin-entity
description: "Scaffold a new CRUD entity across the admin panel, API, database, and data access layer. Use when adding a new data type to the admin (e.g., certifications, talks, testimonials, skills). Generates all 7+ files following established project patterns."
user-invocable: true
argument-hint: "<entity-name>"
---

# Add Admin Entity

Scaffold a complete CRUD entity across the full stack. Follow the steps below in order -- each step depends on the previous one compiling.

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
- `id` is optional (generated on create)
- `sortOrder` maps to `sort_order` in DB
- JSON array fields are typed as their parsed form (`string[]`, not `string`)
- Boolean fields are real `boolean`, not `number`

## Step 3: Data Access Layer

Add to `src/lib/db.ts`:

1. Import the new type at the top
2. Add a `Row` interface mapping to DB column types
3. Add a `rowTo<Entity>()` mapper function
4. Add CRUD functions

```typescript
// --- Row interface ---
interface <Entity>Row {
  id: string;
  // DB column types: string for TEXT, number for INTEGER
  tags: string | null;    // JSON TEXT columns are string | null
  sort_order: number;
}

// --- Mapper ---
function rowTo<Entity>(row: <Entity>Row): <Entity> {
  return {
    id: row.id,
    // map fields, converting snake_case to camelCase
    tags: parseJson<string[]>(row.tags, []),
    sortOrder: row.sort_order,
  };
}

// --- CRUD ---
export async function getAll<Entities>(db: D1Database): Promise<<Entity>[]> {
  const { results } = await db
    .prepare("SELECT * FROM <entity_plural> ORDER BY sort_order ASC")
    .all<<Entity>Row>();
  return results.map(rowTo<Entity>);
}

export async function upsert<Entity>(db: D1Database, item: <Entity>): Promise<void> {
  await db
    .prepare(
      `INSERT INTO <entity_plural> (id, ..., tags, sort_order, updated_at)
       VALUES (?, ..., ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         ... = excluded....,
         tags = excluded.tags, sort_order = excluded.sort_order,
         updated_at = datetime('now')`
    )
    .bind(item.id, ..., JSON.stringify(item.tags), item.sortOrder)
    .run();
}

export async function delete<Entity>(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM <entity_plural> WHERE id = ?").bind(id).run();
}
```

Key patterns:
- Use `parseJson<T>(raw, fallback)` for JSON TEXT columns (already exists in db.ts)
- Boolean conversion: `row.featured === 1` (DB to domain), `item.featured ? 1 : 0` (domain to DB)
- JSON serialization: `JSON.stringify(item.tags)` in bind params
- UPSERT uses `ON CONFLICT(id) DO UPDATE SET` with `excluded.*`
- Timestamps: `datetime('now')` for `updated_at`

## Step 4: Validation Schema

Add a Zod schema to `src/lib/validation.ts`:

```typescript
export const <entity>Schema = z.object({
  id: z.string().optional(),
  // domain fields with validation
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
});
```

Import `z` from `astro/zod` (already imported). Match field names to the TypeScript interface (camelCase).

## Step 5: API Routes

Create two files:

**`src/pages/api/admin/<entity_plural>/index.ts`** (collection: GET list + POST create/update):

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

**`src/pages/api/admin/<entity_plural>/[id].ts`** (single item: DELETE):

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

Critical rules:
- `export const prerender = false` is MANDATORY (without it, Astro evaluates at build time)
- `requireAuth` throws a `Response`, not an `Error` -- always `await` it before any data access
- Access D1 via `locals.runtime.env` (Cloudflare adapter specific)
- Use `validationError(parsed.error)` for Zod failures (returns 400 Response)

## Step 6: Admin API Client

Add typed fetch functions to `src/admin/api.ts`:

```typescript
// --- <Entities> ---
export const get<Entities> = () => api<<Entity>[]>("<entity_plural>");
export const save<Entity> = (item: <Entity>) =>
  api<{ ok: true }>("<entity_plural>", { method: "POST", body: JSON.stringify(item) });
export const delete<Entity> = (id: string) =>
  api<{ ok: true }>(`<entity_plural>/${id}`, { method: "DELETE" });
```

Import the type: `import type { ..., <Entity> } from "@/types";` and re-export it.

## Step 7: Query Hooks

Add to `src/admin/hooks/useAdminQueries.ts`:

1. Add query key to `adminKeys`:
```typescript
export const adminKeys = {
  // ... existing keys
  <entity_plural>: ["admin", "<entity_plural>"] as const,
};
```

2. Add hooks:
```typescript
export function use<Entities>() {
  return useQuery({
    queryKey: adminKeys.<entity_plural>,
    queryFn: api.get<Entities>,
  });
}

export function useSave<Entity>() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.save<Entity>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.<entity_plural> });
      toast.success("<Entity> saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDelete<Entity>() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.delete<Entity>,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: adminKeys.<entity_plural> });
      const prev = qc.getQueryData<<Entity>[]>(adminKeys.<entity_plural>);
      qc.setQueryData<<Entity>[]>(adminKeys.<entity_plural>, (old) =>
        old?.filter((item) => item.id !== id),
      );
      return { prev };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.<entity_plural>, ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("<Entity> deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.<entity_plural> }),
  });
}
```

The delete hook uses optimistic updates with rollback -- this is the established pattern.

## Step 8: Admin Page

Create `src/admin/pages/Admin<Entities>.tsx`. Use existing pages as reference:
- `AdminExperience.tsx` for simple list + inline editor pattern
- `AdminProjects.tsx` for modal editor pattern

## Checklist

Before marking complete, verify:

- [ ] Schema added to `db/schema.sql`
- [ ] Type added to `src/types/index.ts`
- [ ] Row interface, mapper, and CRUD in `src/lib/db.ts`
- [ ] Zod schema in `src/lib/validation.ts`
- [ ] API routes: `index.ts` (GET/POST) + `[id].ts` (DELETE)
- [ ] All API routes have `prerender = false`
- [ ] Client functions in `src/admin/api.ts`
- [ ] Query key + hooks in `src/admin/hooks/useAdminQueries.ts`
- [ ] Admin page in `src/admin/pages/`
- [ ] Route added to admin router (check `src/admin/App.tsx`)
- [ ] TypeScript compiles: `npx astro check`
