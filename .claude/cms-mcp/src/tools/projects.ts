import fs from "node:fs";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { PROJECTS_FILE } from "../lib/paths.js";

interface ProjectLink {
  type: string;
  href: string;
}

interface Project {
  id: string;
  name: string;
  slug?: string;
  description: string;
  longDescription?: string;
  platforms: string[];
  tags: string[];
  links: ProjectLink[];
  featured?: boolean;
  sortOrder?: number;
  previewLabel?: string;
  year?: string;
  status?: string;
}

function readProjects(): Project[] {
  const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
  return JSON.parse(raw) as Project[];
}

function writeProjects(projects: Project[]): void {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2) + "\n", "utf-8");
}

export const projectTools: Tool[] = [
  {
    name: "cms_list_projects",
    description: "List all projects with their full details",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "cms_get_project",
    description: "Get a single project by id",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Project id" },
      },
      required: ["id"],
    },
  },
  {
    name: "cms_upsert_project",
    description:
      "Create or update a project by id. Provide all fields for create, or just changed fields for update. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        slug: { type: "string" },
        description: { type: "string" },
        longDescription: { type: "string" },
        platforms: { type: "array", items: { type: "string" } },
        tags: { type: "array", items: { type: "string" } },
        links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              href: { type: "string" },
            },
            required: ["type", "href"],
          },
        },
        featured: { type: "boolean" },
        sortOrder: { type: "number" },
        previewLabel: { type: "string" },
        year: { type: "string" },
        status: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "cms_remove_project",
    description: "Remove a project by id. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Project id to remove" },
      },
      required: ["id"],
    },
  },
];

export function handleProjectTool(
  name: string,
  args: Record<string, unknown>,
): string {
  switch (name) {
    case "cms_list_projects": {
      const projects = readProjects();
      return JSON.stringify(projects, null, 2);
    }

    case "cms_get_project": {
      const projects = readProjects();
      const project = projects.find((p) => p.id === args.id);
      if (!project) throw new Error(`Project not found: ${args.id}`);
      return JSON.stringify(project, null, 2);
    }

    case "cms_upsert_project": {
      const projects = readProjects();
      const id = args.id as string;
      const idx = projects.findIndex((p) => p.id === id);

      if (idx >= 0) {
        const existing = projects[idx]!;
        const updated = { ...existing };
        for (const [key, value] of Object.entries(args)) {
          if (value !== undefined) {
            (updated as Record<string, unknown>)[key] = value;
          }
        }
        projects[idx] = updated;
      } else {
        projects.push(args as unknown as Project);
      }

      writeProjects(projects);
      return JSON.stringify({
        ok: true,
        id,
        message: `Project ${idx >= 0 ? "updated" : "created"}. Run cms_regenerate to update derived files.`,
      });
    }

    case "cms_remove_project": {
      const projects = readProjects();
      const id = args.id as string;
      const filtered = projects.filter((p) => p.id !== id);
      if (filtered.length === projects.length) {
        throw new Error(`Project not found: ${id}`);
      }
      writeProjects(filtered);
      return JSON.stringify({
        ok: true,
        id,
        message: "Project removed. Run cms_regenerate to update derived files.",
      });
    }

    default:
      throw new Error(`Unknown project tool: ${name}`);
  }
}
