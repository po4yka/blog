import { z } from "astro/zod";
import type { BlogPost } from "@/types";
import { defineCollection, parseJson } from "./define.js";

// Admin manages English posts only. Russian posts are havamal-synced and never
// admin-edited. The composite PK (slug, lang) on blog_posts requires the conflict
// target to cover both columns; lang is fixed to 'en' for all admin writes.
//
// lang is placed last in the fields map so it does not shift the positional bind
// indices that the existing test suite asserts against (indices 0-8 remain stable).

export const posts = defineCollection<BlogPost>({
  name: "posts",
  table: "blog_posts",
  primaryKey: "slug",
  conflictColumns: ["slug", "lang"],
  orderBy: "date DESC",
  capabilities: { read: "read:posts", write: "write:posts" },
  fields: {
    slug: { column: "slug", type: "text", zod: z.string().min(1) },
    title: { column: "title", type: "text", zod: z.string().min(1) },
    date: {
      column: "date",
      type: "text",
      zod: z.string().min(1).regex(/^\w{3,9}\s+\d{4}$/, "Expected format: 'Mon YYYY' (e.g. 'Jan 2025')"),
    },
    summary: { column: "summary", type: "text", zod: z.string() },
    tags: { column: "tags", type: "json", zod: z.array(z.string()), default: [] },
    category: { column: "category", type: "text", zod: z.string() },
    content: { column: "content", type: "text", zod: z.string() },
    featured: { column: "featured", type: "boolean", zod: z.boolean().optional() },
    readingTime: { column: "reading_time", type: "integer", zod: z.number().optional(), optional: true },
    // lang comes last to preserve the existing positional bind arg indices (0-8).
    // The default ensures callers that omit lang get 'en' automatically.
    lang: { column: "lang", type: "text", zod: z.literal("en").default("en"), default: "en" },
  },
});

// Scope read and delete operations to lang='en' so the admin panel only sees
// and mutates English posts. Upsert always writes lang='en' because the field
// above defaults to 'en'.

function mapRow(row: Record<string, unknown>): BlogPost {
  return {
    slug: row["slug"] as string,
    lang: (row["lang"] as string | undefined) ?? "en",
    title: row["title"] as string,
    date: row["date"] as string,
    summary: row["summary"] as string,
    tags: parseJson(row["tags"] as string | null, [] as string[]),
    category: row["category"] as string,
    content: row["content"] as string,
    featured: row["featured"] === 1,
    readingTime: row["reading_time"] != null ? (row["reading_time"] as number) : undefined,
  } as BlogPost;
}

posts.getAll = async (db: D1Database): Promise<BlogPost[]> => {
  const { results } = await db
    .prepare("SELECT * FROM blog_posts WHERE lang = 'en' ORDER BY date DESC")
    .all<Record<string, unknown>>();
  return results.map(mapRow);
};

posts.getByPk = async (db: D1Database, slug: string): Promise<BlogPost | null> => {
  const row = await db
    .prepare("SELECT * FROM blog_posts WHERE slug = ? AND lang = 'en'")
    .bind(slug)
    .first<Record<string, unknown>>();
  return row ? mapRow(row) : null;
};

posts.remove = async (db: D1Database, slug: string): Promise<void> => {
  await db
    .prepare("DELETE FROM blog_posts WHERE slug = ? AND lang = 'en'")
    .bind(slug)
    .run();
};
