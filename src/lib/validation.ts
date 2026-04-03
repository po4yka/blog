// Zod validation schemas for admin API request bodies.
//
// These schemas validate API *input*. The canonical domain types live in
// src/types/index.ts and include DB-generated fields (e.g. computed readingTime,
// generated id) that are absent or optional in the input schemas. Use the
// inferred Input types below for request parsing; use the domain types from
// src/types/ for internal logic and responses.

import { z } from "astro/zod";

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const projectLinkSchema = z.object({
  type: z.string(),
  href: z.string().url(),
});

export const blogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.string().min(1).regex(/^\w{3,9}\s+\d{4}$/, "Expected format: 'Mon YYYY' (e.g. 'Jan 2025')"),
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
  description: z.string(),
  platforms: z.array(z.string()),
  tags: z.array(z.string()),
  links: z.array(projectLinkSchema),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const roleSchema = z.object({
  id: z.string().optional(),
  period: z.string().min(1),
  company: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1),
});

export const siteSettingsSchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  role: z.string(),
  bio: z.string(),
  github: z.string().url().or(z.literal("")),
  email: z.string().email().or(z.literal("")),
  telegram: z.string().url().or(z.literal("")),
  linkedin: z.string().url().or(z.literal("")),
});

// Inferred input types derived from Zod schemas.
// These match the shape of validated API request bodies. For the full domain
// types (which may include additional DB-generated fields), see src/types/.
export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectLinkInput = z.infer<typeof projectLinkSchema>;
export type RoleInput = z.infer<typeof roleSchema>;
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;

/** Return a 400 Response from a ZodError. */
export function validationError(error: z.ZodError): Response {
  return new Response(
    JSON.stringify({ error: "Invalid request", details: error.issues }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}
