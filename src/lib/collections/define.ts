// Collection definition library.
// Derives read-only DB operations and admin GET routes from a single field-level definition.
// The admin is a read-only mirror of the repo content; writes happen only via db/seed.sql.

import { withAdmin, type Capability } from "@/lib/admin-handler";
import { jsonError } from "@/lib/validation";

// --- Field types ---

type FieldType = "text" | "integer" | "boolean" | "json";

export interface FieldDef {
  column: string;
  type: FieldType;
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
  capabilities: { read: Capability };
  fields: FieldDefs;
}

// --- Shared utility ---

export function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("[db] parseJson: corrupt JSON in DB field, returning fallback.", err);
    return fallback;
  }
}

/** Regex for a bare SQL identifier: letters, digits, underscores (no spaces). */
const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Regex for an ORDER BY expression: one or more comma-separated terms of the
 * form `identifier` or `identifier ASC|DESC` (case-insensitive).
 * Intentionally does not allow arbitrary SQL — only the safe subset used by
 * collection definitions (e.g. "sort_order ASC", "date DESC", "slug").
 */
const ORDER_BY_RE = /^[a-zA-Z_][a-zA-Z0-9_]*(?:\s+(?:ASC|DESC))?(?:,\s*[a-zA-Z_][a-zA-Z0-9_]*(?:\s+(?:ASC|DESC))?)*$/i;

function assertIdentifier(value: string, role: string): void {
  if (!IDENTIFIER_RE.test(value)) {
    throw new Error(`[defineCollection] Unsafe SQL identifier for ${role}: "${value}"`);
  }
}

function assertOrderBy(value: string): void {
  if (!ORDER_BY_RE.test(value)) {
    throw new Error(`[defineCollection] Unsafe ORDER BY expression: "${value}"`);
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

// --- Collection object ---

export interface Collection<T> {
  name: string;
  table: string;
  primaryKey: string;
  getAll(db: D1Database): Promise<T[]>;
  getByPk(db: D1Database, pk: string): Promise<T | null>;
  routes: {
    list: ReturnType<typeof withAdmin>;
    get: ReturnType<typeof withAdmin>;
  };
}

export function defineCollection<T>(config: CollectionConfig<T>): Collection<T> {
  const { name, table, primaryKey, paramName, orderBy, capabilities, fields } = config;

  // Validate SQL identifiers at definition time so a misconfiguration fails
  // loudly at startup rather than producing a runtime SQL injection vector.
  assertIdentifier(table, "table");
  assertOrderBy(orderBy);
  for (const [domainKey, field] of Object.entries(fields)) {
    assertIdentifier(field.column, `fields.${domainKey}.column`);
  }

  const pkColumn = fields[primaryKey]!.column;
  const mapRow = buildRowMapper<T>(fields);

  const collection: Collection<T> = {
    name,
    table,
    primaryKey,

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

    routes: {
      list: withAdmin(
        { capability: capabilities.read },
        async ({ db }) => {
          const items = await collection.getAll(db);
          return Response.json(items);
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
    },
  };

  return collection;
}

