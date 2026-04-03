import { z } from "astro/zod";
import type { Role } from "@/types";
import { defineCollection } from "./define.js";

export const roles = defineCollection<Role>({
  name: "roles",
  table: "roles",
  primaryKey: "id",
  orderBy: "sort_order ASC",
  idGeneration: "uuid",
  capabilities: { read: "read:roles", write: "write:roles" },
  fields: {
    id: { column: "id", type: "text", zod: z.string().optional() },
    period: { column: "period", type: "text", zod: z.string().min(1) },
    company: { column: "company", type: "text", zod: z.string().min(1) },
    title: { column: "title", type: "text", zod: z.string().min(1) },
    description: { column: "description", type: "text", zod: z.string() },
    tags: { column: "tags", type: "json", zod: z.array(z.string()).optional(), default: [] },
    sortOrder: { column: "sort_order", type: "integer", zod: z.number().optional() },
  },
});
