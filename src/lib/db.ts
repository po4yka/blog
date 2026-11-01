// Typed read-only data access layer for Cloudflare D1 (the admin mirrors repo content; see db/seed.sql).
// Posts, projects, and roles are managed via collections (src/lib/collections/).
// Categories and settings have non-standard patterns and remain here.

import type { BlogPost, Project, Role, SiteSettings } from "@/types";
import { posts, projects, roles, parseJson } from "@/lib/collections";

export type { BlogPost, Project, Role, SiteSettings };
export { parseJson };

// --- Posts (delegated to collection) ---

export const getAllPosts = (db: D1Database) => posts.getAll(db);
export const getPostBySlug = (db: D1Database, slug: string) => posts.getByPk(db, slug);

// --- Projects (delegated to collection) ---

export const getAllProjects = (db: D1Database) => projects.getAll(db);

// --- Roles (delegated to collection) ---

export const getAllRoles = (db: D1Database) => roles.getAll(db);

// --- Categories (stays hand-written) ---

export async function getCategories(db: D1Database): Promise<string[]> {
  const { results } = await db.prepare("SELECT name FROM categories ORDER BY name ASC").all<{ name: string }>();
  return results.map((r: { name: string }) => r.name);
}

// --- Site Settings (single-row table, stays hand-written) ---

export async function getSettings(db: D1Database): Promise<SiteSettings | null> {
  const row = await db.prepare("SELECT * FROM site_settings WHERE id = 1").first<SiteSettings & { id: number }>();
  if (!row) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- _id is intentionally discarded; the _ prefix alone is insufficient with this tseslint config
  const { id: _id, ...settings } = row;
  return settings;
}

