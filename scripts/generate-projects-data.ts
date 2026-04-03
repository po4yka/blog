// Build-time generator: derives src/data/projectsData.ts from src/content/projects.json.
// Run via: npx tsx scripts/generate-projects-data.ts

import fs from "node:fs";
import path from "node:path";

const INPUT_FILE = path.resolve("src/content/projects.json");
const OUTPUT_FILE = path.resolve("src/data/projectsData.ts");

interface ProjectLink {
  type: string;
  href: string;
}

interface ProjectJSON {
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

function escapeDoubleQuoted(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function stringifyStringArray(arr: string[]): string {
  return `[${arr.map((s) => `"${escapeDoubleQuoted(s)}"`).join(", ")}]`;
}

function generateProjectEntry(p: ProjectJSON): string {
  const lines: string[] = [];
  lines.push(`${indent(1)}{`);
  lines.push(`${indent(2)}id: "${escapeDoubleQuoted(p.id)}",`);
  lines.push(`${indent(2)}name: "${escapeDoubleQuoted(p.name)}",`);
  if (p.slug !== undefined) {
    lines.push(`${indent(2)}slug: "${escapeDoubleQuoted(p.slug)}",`);
  }
  lines.push(`${indent(2)}description: "${escapeDoubleQuoted(p.description)}",`);
  if (p.longDescription !== undefined) {
    lines.push(`${indent(2)}longDescription: "${escapeDoubleQuoted(p.longDescription)}",`);
  }
  lines.push(`${indent(2)}platforms: ${stringifyStringArray(p.platforms)},`);
  lines.push(`${indent(2)}tags: ${stringifyStringArray(p.tags)},`);

  // Links array
  const linksStr = p.links
    .map((l) => `{ type: "${escapeDoubleQuoted(l.type)}", href: "${escapeDoubleQuoted(l.href)}" }`)
    .join(",\n" + indent(3));
  if (p.links.length <= 1) {
    lines.push(`${indent(2)}links: [${linksStr}],`);
  } else {
    lines.push(`${indent(2)}links: [`);
    lines.push(`${indent(3)}${linksStr},`);
    lines.push(`${indent(2)}],`);
  }

  if (p.featured !== undefined) {
    lines.push(`${indent(2)}featured: ${p.featured},`);
  }
  if (p.sortOrder !== undefined) {
    lines.push(`${indent(2)}sortOrder: ${p.sortOrder},`);
  }
  if (p.previewLabel !== undefined) {
    lines.push(`${indent(2)}previewLabel: "${escapeDoubleQuoted(p.previewLabel)}",`);
  }
  if (p.year !== undefined) {
    lines.push(`${indent(2)}year: "${escapeDoubleQuoted(p.year)}",`);
  }
  if (p.status !== undefined) {
    lines.push(`${indent(2)}status: "${escapeDoubleQuoted(p.status)}",`);
  }

  lines.push(`${indent(1)}},`);
  return lines.join("\n");
}

export function generateProjectsDataSource(): string {
  const raw = fs.readFileSync(INPUT_FILE, "utf-8");
  const projects = JSON.parse(raw) as ProjectJSON[];

  const entries = projects.map((p) => generateProjectEntry(p)).join("\n");

  return `// Auto-generated from src/content/projects.json. Do not edit manually.
// Run "npm run generate:all" to regenerate.
import type { Project } from "@/types";

export type { Project };

export const projects: Project[] = [
${entries}
];
`;
}

// Run as script
if (import.meta.url === `file://${process.argv[1]}`) {
  const output = generateProjectsDataSource();
  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`Generated ${OUTPUT_FILE}`);
}
