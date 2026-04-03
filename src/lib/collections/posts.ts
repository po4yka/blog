import { z } from "astro/zod";
import type { BlogPost } from "@/types";
import { defineCollection } from "./define.js";

export const posts = defineCollection<BlogPost>({
  name: "posts",
  table: "blog_posts",
  primaryKey: "slug",
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
  },
});
