import { execSync } from "node:child_process";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { PROJECT_ROOT } from "../lib/paths.js";

export const regenerateTools: Tool[] = [
  {
    name: "cms_regenerate",
    description:
      "Regenerate all derived data files (blogData.ts, projectsData.ts, experienceData.ts, seed.sql) from source files. Run this after creating, updating, or deleting content.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

export function handleRegenerateTool(name: string): string {
  if (name !== "cms_regenerate") {
    throw new Error(`Unknown regenerate tool: ${name}`);
  }

  const output = execSync("npm run generate:all", {
    cwd: PROJECT_ROOT,
    encoding: "utf-8",
    timeout: 30_000,
  });

  return JSON.stringify({
    ok: true,
    output: output.trim(),
    message: "All derived files regenerated successfully.",
  });
}
