// Typed data access layer for Cloudflare D1.
// Posts, projects, and roles are managed via collections (src/lib/collections/).
// Categories and settings have non-standard patterns and remain here.

import type { BlogPost, Project, Role, SiteSettings } from "@/types";
import { posts, projects, roles, parseJson } from "@/lib/collections";

export type { BlogPost, Project, Role, SiteSettings };
export { parseJson };

// --- Posts (delegated to collection) ---

export const getAllPosts = (db: D1Database) => posts.getAll(db);
export const getPostBySlug = (db: D1Database, slug: string) => posts.getByPk(db, slug);
export const upsertPost = (db: D1Database, post: BlogPost) =>
  posts.upsert(db, post as unknown as Record<string, unknown>);
export const deletePost = (db: D1Database, slug: string) => posts.remove(db, slug);

// --- Projects (delegated to collection) ---

export const getAllProjects = (db: D1Database) => projects.getAll(db);
export const upsertProject = (db: D1Database, project: Project) =>
  projects.upsert(db, project as unknown as Record<string, unknown>);
export const deleteProject = (db: D1Database, id: string) => projects.remove(db, id);

// --- Roles (delegated to collection) ---

export const getAllRoles = (db: D1Database) => roles.getAll(db);
export const upsertRole = (db: D1Database, role: Role) =>
  roles.upsert(db, role as unknown as Record<string, unknown>);
export const deleteRole = (db: D1Database, id: string) => roles.remove(db, id);

// --- Categories (non-standard CRUD, stays hand-written) ---

export async function getCategories(db: D1Database): Promise<string[]> {
  const { results } = await db.prepare("SELECT name FROM categories ORDER BY name ASC").all<{ name: string }>();
  return results.map((r: { name: string }) => r.name);
}

export async function addCategory(db: D1Database, name: string): Promise<void> {
  await db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").bind(name).run();
}

export async function removeCategory(db: D1Database, name: string): Promise<void> {
  await db.prepare("DELETE FROM categories WHERE name = ? AND name != 'All'").bind(name).run();
}

// --- Site Settings (single-row table, stays hand-written) ---

export async function getSettings(db: D1Database): Promise<SiteSettings | null> {
  const row = await db.prepare("SELECT * FROM site_settings WHERE id = 1").first<SiteSettings & { id: number }>();
  if (!row) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...settings } = row;
  return settings;
}

export async function updateSettings(db: D1Database, s: SiteSettings): Promise<void> {
  await db
    .prepare(
      `INSERT INTO site_settings (id, name, handle, role, bio, github, email, telegram, linkedin, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, handle = excluded.handle, role = excluded.role,
         bio = excluded.bio, github = excluded.github, email = excluded.email,
         telegram = excluded.telegram, linkedin = excluded.linkedin,
         updated_at = datetime('now')`,
    )
    .bind(s.name, s.handle, s.role, s.bio, s.github, s.email, s.telegram, s.linkedin)
    .run();
}
