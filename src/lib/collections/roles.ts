import type { Role } from "@/types";
import { defineCollection } from "./define.js";

export const roles = defineCollection<Role>({
  name: "roles",
  table: "roles",
  primaryKey: "id",
  orderBy: "sort_order ASC",
  capabilities: { read: "read:roles" },
  fields: {
    id: { column: "id", type: "text" },
    period: { column: "period", type: "text" },
    company: { column: "company", type: "text" },
    title: { column: "title", type: "text" },
    description: { column: "description", type: "text" },
    tags: { column: "tags", type: "json", default: [] },
    sortOrder: { column: "sort_order", type: "integer" },
  },
});
