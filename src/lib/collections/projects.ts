import { z } from "astro/zod";
import type { Project } from "@/types";
import { defineCollection } from "./define.js";

const projectLinkSchema = z.object({
  type: z.string(),
  href: z.string().url(),
});

export const projects = defineCollection<Project>({
  name: "projects",
  table: "projects",
  primaryKey: "id",
  orderBy: "sort_order ASC",
  idGeneration: "uuid",
  capabilities: { read: "read:projects", write: "write:projects" },
  fields: {
    id: { column: "id", type: "text", zod: z.string().optional() },
    name: { column: "name", type: "text", zod: z.string().min(1) },
    description: { column: "description", type: "text", zod: z.string() },
    platforms: { column: "platforms", type: "json", zod: z.array(z.string()), default: [] },
    tags: { column: "tags", type: "json", zod: z.array(z.string()), default: [] },
    links: { column: "links", type: "json", zod: z.array(projectLinkSchema), default: [] },
    featured: { column: "featured", type: "boolean", zod: z.boolean().optional() },
    sortOrder: { column: "sort_order", type: "integer", zod: z.number().optional() },
  },
});
