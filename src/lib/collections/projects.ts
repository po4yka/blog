import type { Project } from "@/types";
import { defineCollection } from "./define.js";

export const projects = defineCollection<Project>({
  name: "projects",
  table: "projects",
  primaryKey: "id",
  orderBy: "sort_order ASC",
  capabilities: { read: "read:projects" },
  fields: {
    id: { column: "id", type: "text" },
    name: { column: "name", type: "text" },
    description: { column: "description", type: "text" },
    platforms: { column: "platforms", type: "json", default: [] },
    tags: { column: "tags", type: "json", default: [] },
    links: { column: "links", type: "json", default: [] },
    featured: { column: "featured", type: "boolean" },
    sortOrder: { column: "sort_order", type: "integer" },
  },
});
