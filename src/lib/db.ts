// Typed data access layer for Cloudflare D1
// JSON array fields are stored as TEXT in SQLite and parsed here.

import type { BlogPost, Project, Role, SiteSettings } from "@/types";

export type { BlogPost, Project, Role, SiteSettings };

export function getDb(env: CloudflareEnv): D1Database {
  return env.DB;
}

// --- Row → Domain mappers ---

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface PostRow {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string;
  category: string;
  content: string;
  featured: number;
  reading_time: number | null;
}

function rowToPost(row: PostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    summary: row.summary,
    tags: parseJson<string[]>(row.tags, []),
    category: row.category,
    content: row.content,
    featured: row.featured === 1,
    readingTime: row.reading_time ?? undefined,
  };
}

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  platforms: string;
  tags: string;
  links: string;
  featured: number;
  sort_order: number;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    platforms: parseJson<string[]>(row.platforms, []),
    tags: parseJson<string[]>(row.tags, []),
    links: parseJson<{ type: string; href: string }[]>(row.links, []),
    featured: row.featured === 1,
    sortOrder: row.sort_order,
  };
}

interface RoleRow {
  id: string;
  period: string;
  company: string;
  title: string;
  description: string;
  tags: string | null;
  sort_order: number;
}

function rowToRole(row: RoleRow): Role {
  return {
    id: row.id,
    period: row.period,
    company: row.company,
    title: row.title,
    description: row.description,
    tags: parseJson<string[]>(row.tags, []),
    sortOrder: row.sort_order,
  };
}

// --- Blog Posts ---

export async function getAllPosts(db: D1Database): Promise<BlogPost[]> {
  const { results } = await db.prepare("SELECT * FROM blog_posts ORDER BY date DESC").all<PostRow>();
  return results.map(rowToPost);
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<BlogPost | null> {
  const row = await db.prepare("SELECT * FROM blog_posts WHERE slug = ?").bind(slug).first<PostRow>();
  return row ? rowToPost(row) : null;
}

export async function upsertPost(db: D1Database, post: BlogPost): Promise<void> {
  await db
    .prepare(
      `INSERT INTO blog_posts (slug, title, date, summary, tags, category, content, featured, reading_time, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title, date = excluded.date, summary = excluded.summary,
         tags = excluded.tags, category = excluded.category, content = excluded.content,
         featured = excluded.featured, reading_time = excluded.reading_time,
         updated_at = datetime('now')`,
    )
    .bind(
      post.slug,
      post.title,
      post.date,
      post.summary,
      JSON.stringify(post.tags),
      post.category,
      post.content,
      post.featured ? 1 : 0,
      post.readingTime ?? null,
    )
    .run();
}

export async function deletePost(db: D1Database, slug: string): Promise<void> {
  await db.prepare("DELETE FROM blog_posts WHERE slug = ?").bind(slug).run();
}

// --- Projects ---

export async function getAllProjects(db: D1Database): Promise<Project[]> {
  const { results } = await db.prepare("SELECT * FROM projects ORDER BY sort_order ASC").all<ProjectRow>();
  return results.map(rowToProject);
}

export async function upsertProject(db: D1Database, project: Project): Promise<void> {
  await db
    .prepare(
      `INSERT INTO projects (id, name, description, platforms, tags, links, featured, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, description = excluded.description,
         platforms = excluded.platforms, tags = excluded.tags, links = excluded.links,
         featured = excluded.featured, sort_order = excluded.sort_order,
         updated_at = datetime('now')`,
    )
    .bind(
      project.id,
      project.name,
      project.description,
      JSON.stringify(project.platforms),
      JSON.stringify(project.tags),
      JSON.stringify(project.links),
      project.featured ? 1 : 0,
      project.sortOrder,
    )
    .run();
}

export async function deleteProject(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
}

// --- Roles ---

export async function getAllRoles(db: D1Database): Promise<Role[]> {
  const { results } = await db.prepare("SELECT * FROM roles ORDER BY sort_order ASC").all<RoleRow>();
  return results.map(rowToRole);
}

export async function upsertRole(db: D1Database, role: Role): Promise<void> {
  await db
    .prepare(
      `INSERT INTO roles (id, period, company, title, description, tags, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         period = excluded.period, company = excluded.company, title = excluded.title,
         description = excluded.description, tags = excluded.tags,
         sort_order = excluded.sort_order, updated_at = datetime('now')`,
    )
    .bind(role.id, role.period, role.company, role.title, role.description, JSON.stringify(role.tags), role.sortOrder)
    .run();
}

export async function deleteRole(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM roles WHERE id = ?").bind(id).run();
}

// --- Categories ---

export async function getCategories(db: D1Database): Promise<string[]> {
  const { results } = await db.prepare("SELECT name FROM categories ORDER BY name ASC").all<{ name: string }>();
  return results.map((r) => r.name);
}

export async function addCategory(db: D1Database, name: string): Promise<void> {
  await db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").bind(name).run();
}

export async function removeCategory(db: D1Database, name: string): Promise<void> {
  await db.prepare("DELETE FROM categories WHERE name = ? AND name != 'All'").bind(name).run();
}

// --- Site Settings ---

export async function getSettings(db: D1Database): Promise<SiteSettings | null> {
  const row = await db.prepare("SELECT * FROM site_settings WHERE id = 1").first<SiteSettings & { id: number }>();
  if (!row) return null;
  const { id: _, ...settings } = row;
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
