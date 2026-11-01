import type { BlogPost } from "@/types";
import { defineCollection, parseJson } from "./define.js";

// The admin mirrors English posts only; Russian posts are in the table too (composite PK slug + lang)
// but are not shown. The seed is the only writer.

export const posts = defineCollection<BlogPost>({
  name: "posts",
  table: "blog_posts",
  primaryKey: "slug",
  orderBy: "date DESC",
  capabilities: { read: "read:posts" },
  fields: {
    slug: { column: "slug", type: "text" },
    title: { column: "title", type: "text" },
    date: { column: "date", type: "text" },
    summary: { column: "summary", type: "text" },
    tags: { column: "tags", type: "json", default: [] },
    category: { column: "category", type: "text" },
    content: { column: "content", type: "text" },
    featured: { column: "featured", type: "boolean" },
    readingTime: { column: "reading_time", type: "integer", optional: true },
    lang: { column: "lang", type: "text", default: "en" },
  },
});

// Scope reads to lang='en' so the admin panel only sees English posts.

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
