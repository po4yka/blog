// Build-time generator: one 1-bit identity mark per project in public/plates/.
// The pattern is seeded by the slug hash only; it is an identity mark, not a metric.
// `<slug>.svg` is the resting mark; `<slug>.hover.svg` holds only the pixels a
// higher density adds, so the hover can fade them in with opacity alone.

import fs from "node:fs";
import path from "node:path";
import { ditherField, hash32, markField, mirrorX, pixelsToSvg } from "../src/lib/dither.js";

const INPUT_FILE = path.resolve("src/content/projects.json");
export const PLATES_DIR = path.resolve("public/plates");

export const PLATE_SIZE = 16;
const REST_DENSITY = 0.3;
const HOVER_DENSITY = 0.55;

/** File name to SVG source, for every project in projects.json. */
export function generatePlateFiles(): Map<string, string> {
  const projects = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8")) as Array<{ id: string; slug?: string }>;
  const files = new Map<string, string>();
  for (const project of projects) {
    const slug = project.slug ?? project.id;
    const seed = hash32(slug);
    const mark = (density: number) =>
      mirrorX(ditherField(markField(seed, PLATE_SIZE, density), PLATE_SIZE, PLATE_SIZE), PLATE_SIZE, PLATE_SIZE);
    const rest = mark(REST_DENSITY);
    const dense = mark(HOVER_DENSITY);
    const added = dense.map((px, i) => (px && !rest[i] ? 1 : 0));
    files.set(`${slug}.svg`, pixelsToSvg(rest, PLATE_SIZE, PLATE_SIZE));
    files.set(`${slug}.hover.svg`, pixelsToSvg(added, PLATE_SIZE, PLATE_SIZE));
  }
  return files;
}

/** Make `dir` hold exactly `files`: write each one and delete anything else. */
export function syncDir(dir: string, files: Map<string, string>): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    if (!files.has(name)) fs.rmSync(path.join(dir, name));
  }
  for (const [name, svg] of files) fs.writeFileSync(path.join(dir, name), svg, "utf-8");
  console.log(`Generated ${files.size} files in ${dir}`);
}

/** Names of files in `dir` that are missing, stale or extra compared with `files`. */
export function dirDrift(dir: string, files: Map<string, string>): string[] {
  const present = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const extra = present.filter((name) => !files.has(name));
  const wrong = [...files]
    .filter(([name, svg]) => {
      const file = path.join(dir, name);
      return !fs.existsSync(file) || fs.readFileSync(file, "utf-8") !== svg;
    })
    .map(([name]) => name);
  return [...extra, ...wrong];
}

export const writePlates = () => syncDir(PLATES_DIR, generatePlateFiles());
