// Zod validation schemas for admin API request bodies.
// Mirrors the types in src/types/index.ts and the fields the DB layer expects.

import { z } from "astro/zod";

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const projectLinkSchema = z.object({
  type: z.string(),
  href: z.string(),
});

export const blogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.string().min(1),
  summary: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  content: z.string(),
  featured: z.boolean().optional(),
  readingTime: z.number().optional(),
});

export const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string(),
  longDescription: z.string().optional(),
  platforms: z.array(z.string()),
  tags: z.array(z.string()),
  links: z.array(projectLinkSchema),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  previewLabel: z.string().optional(),
  year: z.string().optional(),
  status: z.string().optional(),
});

export const roleSchema = z.object({
  id: z.string().optional(),
  period: z.string().min(1),
  company: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  highlights: z.array(z.string()).optional(),
  location: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1),
});

export const siteSettingsSchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  role: z.string(),
  bio: z.string(),
  github: z.string(),
  email: z.string(),
  telegram: z.string(),
  linkedin: z.string(),
});

/** Return a 400 Response from a ZodError. */
export function validationError(error: z.ZodError): Response {
  return new Response(
    JSON.stringify({ error: "Invalid request", details: error.issues }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}
