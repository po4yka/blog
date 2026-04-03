// Collection definition library.
// Derives DB operations, Zod schema, API routes, client functions, and React Query hooks
// from a single field-level definition.

import { z } from "astro/zod";
import { withAdmin, type Capability } from "@/lib/admin-handler";
import { jsonError } from "@/lib/validation";

// --- Field types ---

type FieldType = "text" | "integer" | "boolean" | "json";

export interface FieldDef {
  column: string;
  type: FieldType;
  zod: z.ZodType;
  default?: unknown;
  optional?: boolean;
}

export type FieldDefs = Record<string, FieldDef>;

export interface CollectionConfig<T> {
  name: string;
  table: string;
  primaryKey: keyof T & string;
  paramName?: string;
  orderBy: string;
  idGeneration?: "uuid";
  capabilities: { read: Capability; write: Capability };
  fields: FieldDefs;
}

// --- Shared utility ---

export function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// --- Row mapper builder ---

function buildRowMapper<T>(fields: FieldDefs): (row: Record<string, unknown>) => T {
  return (row) => {
    const result: Record<string, unknown> = {};
    for (const [domainKey, field] of Object.entries(fields)) {
      const raw = row[field.column];
      switch (field.type) {
        case "json":
          result[domainKey] = parseJson(raw as string | null, field.default ?? null);
          break;
        case "boolean":
          result[domainKey] = raw === 1;
          break;
        case "integer":
          result[domainKey] = field.optional ? (raw ?? undefined) : raw;
          break;
        default:
          result[domainKey] = raw;
      }
    }
    return result as T;
  };
}

// --- SQL builders ---

function buildColumns(fields: FieldDefs): string[] {
  return Object.values(fields).map((f) => f.column);
}

function buildUpsertSQL(table: string, fields: FieldDefs, primaryKey: string): string {
  const pkColumn = fields[primaryKey]!.column;
  const columns = [...buildColumns(fields), "updated_at"];
  const placeholders = [...Object.keys(fields).map(() => "?"), "datetime('now')"];
  const updateSet = columns
    .filter((c) => c !== pkColumn)
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) ON CONFLICT(${pkColumn}) DO UPDATE SET ${updateSet}`;
}

function buildBindParams(fields: FieldDefs, input: Record<string, unknown>): unknown[] {
  return Object.entries(fields).map(([domainKey, field]) => {
    const val = input[domainKey];
    switch (field.type) {
      case "json":
        return JSON.stringify(val);
      case "boolean":
        return val ? 1 : 0;
      default:
        return val ?? null;
    }
  });
}

// --- Zod schema builder ---

function buildSchema(fields: FieldDefs): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {};
  for (const [key, field] of Object.entries(fields)) {
    shape[key] = field.zod;
  }
  return z.object(shape);
}

// --- Collection object ---

export interface Collection<T> {
  name: string;
  table: string;
  primaryKey: string;
  schema: z.ZodObject<Record<string, z.ZodType>>;
  getAll(db: D1Database): Promise<T[]>;
  getByPk(db: D1Database, pk: string): Promise<T | null>;
  upsert(db: D1Database, input: Record<string, unknown>): Promise<void>;
  remove(db: D1Database, pk: string): Promise<void>;
  routes: {
    list: ReturnType<typeof withAdmin>;
    create: ReturnType<typeof withAdmin>;
    get: ReturnType<typeof withAdmin>;
    update: ReturnType<typeof withAdmin>;
    delete: ReturnType<typeof withAdmin>;
  };
}

export function defineCollection<T>(config: CollectionConfig<T>): Collection<T> {
  const { name, table, primaryKey, paramName, orderBy, idGeneration, capabilities, fields } = config;
  const pkColumn = fields[primaryKey]!.column;
  const mapRow = buildRowMapper<T>(fields);
  const upsertSQL = buildUpsertSQL(table, fields, primaryKey);
  const schema = buildSchema(fields);

  const collection: Collection<T> = {
    name,
    table,
    primaryKey,
    schema,

    async getAll(db: D1Database): Promise<T[]> {
      const { results } = await db
        .prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`)
        .all<Record<string, unknown>>();
      return results.map(mapRow);
    },

    async getByPk(db: D1Database, pk: string): Promise<T | null> {
      const row = await db
        .prepare(`SELECT * FROM ${table} WHERE ${pkColumn} = ?`)
        .bind(pk)
        .first<Record<string, unknown>>();
      return row ? mapRow(row) : null;
    },

    async upsert(db: D1Database, input: Record<string, unknown>): Promise<void> {
      const data = idGeneration === "uuid" && !input[primaryKey]
        ? { ...input, [primaryKey]: crypto.randomUUID() }
        : input;
      const params = buildBindParams(fields, data);
      await db.prepare(upsertSQL).bind(...params).run();
    },

    async remove(db: D1Database, pk: string): Promise<void> {
      await db.prepare(`DELETE FROM ${table} WHERE ${pkColumn} = ?`).bind(pk).run();
    },

    routes: {
      list: withAdmin(
        { capability: capabilities.read },
        async ({ db }) => {
          const items = await collection.getAll(db);
          return Response.json(items);
        },
      ),

      create: withAdmin(
        { capability: capabilities.write, schema },
        async ({ db, data }) => {
          await collection.upsert(db, data as Record<string, unknown>);
          return Response.json({ ok: true });
        },
      ),

      get: withAdmin(
        { capability: capabilities.read },
        async ({ db, params }) => {
          const pk = params[paramName ?? primaryKey];
          if (!pk) return jsonError("Missing identifier", 400);
          const item = await collection.getByPk(db, pk);
          if (!item) return jsonError("Not found", 404);
          return Response.json(item);
        },
      ),

      update: withAdmin(
        { capability: capabilities.write, schema },
        async ({ db, data }) => {
          await collection.upsert(db, data as Record<string, unknown>);
          return Response.json({ ok: true });
        },
      ),

      delete: withAdmin(
        { capability: capabilities.write },
        async ({ db, params }) => {
          const pk = params[paramName ?? primaryKey];
          if (!pk) return jsonError("Missing identifier", 400);
          await collection.remove(db, pk);
          return Response.json({ ok: true });
        },
      ),
    },
  };

  return collection;
}

