import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    summary: z.string(),
    tags: z.array(z.string()),
    category: z.string(),
    featured: z.boolean().optional().default(false),
    readingTime: z.number().optional(),
  }),
});

export const collections = { blog };
