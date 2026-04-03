// Build-time generator: derives src/data/experienceData.ts from src/content/experience.json.
// Run via: npx tsx scripts/generate-experience-data.ts

import fs from "node:fs";
import path from "node:path";

const INPUT_FILE = path.resolve("src/content/experience.json");
const OUTPUT_FILE = path.resolve("src/data/experienceData.ts");

interface RoleJSON {
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

interface SkillGroupJSON {
  label: string;
  items: string[];
}

interface ExperienceJSON {
  roles: RoleJSON[];
  skills: SkillGroupJSON[];
}

function escapeDoubleQuoted(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function stringifyStringArray(arr: string[]): string {
  return `[${arr.map((s) => `"${escapeDoubleQuoted(s)}"`).join(", ")}]`;
}

function generateRoleEntry(r: RoleJSON): string {
  const lines: string[] = [];
  lines.push(`${indent(1)}{`);
  lines.push(`${indent(2)}id: "${escapeDoubleQuoted(r.id)}",`);
  lines.push(`${indent(2)}period: "${escapeDoubleQuoted(r.period)}",`);
  lines.push(`${indent(2)}company: "${escapeDoubleQuoted(r.company)}",`);
  lines.push(`${indent(2)}title: "${escapeDoubleQuoted(r.title)}",`);
  lines.push(`${indent(2)}description:`);
  lines.push(`${indent(3)}"${escapeDoubleQuoted(r.description)}",`);
  if (r.tags !== undefined) {
    lines.push(`${indent(2)}tags: ${stringifyStringArray(r.tags)},`);
  }
  if (r.highlights !== undefined) {
    lines.push(`${indent(2)}highlights: [`);
    for (const h of r.highlights) {
      lines.push(`${indent(3)}"${escapeDoubleQuoted(h)}",`);
    }
    lines.push(`${indent(2)}],`);
  }
  if (r.location !== undefined) {
    lines.push(`${indent(2)}location: "${escapeDoubleQuoted(r.location)}",`);
  }
  lines.push(`${indent(1)}},`);
  return lines.join("\n");
}

function generateSkillEntry(s: SkillGroupJSON): string {
  return `${indent(1)}{ label: "${escapeDoubleQuoted(s.label)}", items: ${stringifyStringArray(s.items)} },`;
}

export function generateExperienceDataSource(): string {
  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const data = JSON.parse(raw) as ExperienceJSON;

  const roleEntries = data.roles.map((r) => generateRoleEntry(r)).join("\n");
  const skillEntries = data.skills.map((s) => generateSkillEntry(s)).join("\n");

  return `// Auto-generated from src/content/experience.json. Do not edit manually.
// Run "npm run generate:all" to regenerate.
import type { Role, SkillGroup } from "@/types";

export type { Role, SkillGroup };

export const roles: Role[] = [
${roleEntries}
];

export const skills: SkillGroup[] = [
${skillEntries}
];
`;
}

// Run as script
if (import.meta.url === `file://${process.argv[1]}`) {
  const output = generateExperienceDataSource();
  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`Generated ${OUTPUT_FILE}`);
}
