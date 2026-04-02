// Validates that src/data/blogData.ts matches the generated output from MDX files.
// Run via: npx tsx scripts/validate-blog-sync.ts

import fs from "node:fs";
import path from "node:path";
import { generateBlogDataSource } from "./generate-blog-data.js";

const OUTPUT_FILE = path.resolve("src/data/blogData.ts");

function normalize(str: string): string {
  return str.replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();
}

const generated = normalize(generateBlogDataSource());
const current = normalize(fs.readFileSync(OUTPUT_FILE, "utf-8"));

if (generated === current) {
  console.log("Blog data is in sync with MDX content files.");
  process.exit(0);
} else {
  console.error("Blog data is OUT OF SYNC with MDX content files.");
  console.error('Run "npm run generate:blog" to regenerate.\n');

  // Show a simple line-by-line diff
  const genLines = generated.split("\n");
  const curLines = current.split("\n");
  const maxLines = Math.max(genLines.length, curLines.length);
  let diffCount = 0;

  for (let i = 0; i < maxLines; i++) {
    const g = genLines[i] ?? "";
    const c = curLines[i] ?? "";
    if (g !== c) {
      diffCount++;
      if (diffCount <= 20) {
        console.error(`Line ${i + 1}:`);
        console.error(`  current:   ${c}`);
        console.error(`  expected:  ${g}`);
      }
    }
  }

  if (diffCount > 20) {
    console.error(`\n... and ${diffCount - 20} more differences.`);
  }

  console.error(`\nTotal differences: ${diffCount} lines.`);
  process.exit(1);
}
