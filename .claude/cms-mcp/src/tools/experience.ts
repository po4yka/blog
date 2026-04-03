import fs from "node:fs";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { EXPERIENCE_FILE } from "../lib/paths.js";

interface Role {
  id: string;
  period: string;
  company: string;
  title: string;
  description: string;
  tags?: string[];
  sortOrder?: number;
  highlights?: string[];
  location?: string;
}

interface SkillGroup {
  label: string;
  items: string[];
}

interface ExperienceData {
  roles: Role[];
  skills: SkillGroup[];
}

function readExperience(): ExperienceData {
  const raw = fs.readFileSync(EXPERIENCE_FILE, "utf-8");
  return JSON.parse(raw) as ExperienceData;
}

function writeExperience(data: ExperienceData): void {
  fs.writeFileSync(EXPERIENCE_FILE, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export const experienceTools: Tool[] = [
  {
    name: "cms_list_experience",
    description: "List all roles and skills",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "cms_upsert_role",
    description:
      "Create or update a role by id. Provide all fields for create, or just changed fields for update. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        period: { type: "string", description: "e.g. '2023 - Present'" },
        company: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        sortOrder: { type: "number" },
        highlights: { type: "array", items: { type: "string" } },
        location: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "cms_remove_role",
    description: "Remove a role by id. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Role id to remove" },
      },
      required: ["id"],
    },
  },
  {
    name: "cms_update_skills",
    description: "Replace the entire skills array. Run cms_regenerate after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        skills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              items: { type: "array", items: { type: "string" } },
            },
            required: ["label", "items"],
          },
          description: "Array of skill groups, each with a label and items list",
        },
      },
      required: ["skills"],
    },
  },
];

export function handleExperienceTool(
  name: string,
  args: Record<string, unknown>,
): string {
  switch (name) {
    case "cms_list_experience": {
      const data = readExperience();
      return JSON.stringify(data, null, 2);
    }

    case "cms_upsert_role": {
      const data = readExperience();
      const id = args.id as string;
      const idx = data.roles.findIndex((r) => r.id === id);

      if (idx >= 0) {
        const existing = data.roles[idx]!;
        const updated = { ...existing };
        for (const [key, value] of Object.entries(args)) {
          if (value !== undefined) {
            (updated as Record<string, unknown>)[key] = value;
          }
        }
        data.roles[idx] = updated;
      } else {
        data.roles.push(args as unknown as Role);
      }

      writeExperience(data);
      return JSON.stringify({
        ok: true,
        id,
        message: `Role ${idx >= 0 ? "updated" : "created"}. Run cms_regenerate to update derived files.`,
      });
    }

    case "cms_remove_role": {
      const data = readExperience();
      const id = args.id as string;
      const originalLen = data.roles.length;
      data.roles = data.roles.filter((r) => r.id !== id);
      if (data.roles.length === originalLen) {
        throw new Error(`Role not found: ${id}`);
      }
      writeExperience(data);
      return JSON.stringify({
        ok: true,
        id,
        message: "Role removed. Run cms_regenerate to update derived files.",
      });
    }

    case "cms_update_skills": {
      const data = readExperience();
      data.skills = args.skills as SkillGroup[];
      writeExperience(data);
      return JSON.stringify({
        ok: true,
        message: "Skills updated. Run cms_regenerate to update derived files.",
      });
    }

    default:
      throw new Error(`Unknown experience tool: ${name}`);
  }
}
