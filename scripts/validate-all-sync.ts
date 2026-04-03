// Validates that all generated data files match their canonical sources.
// Run via: npx tsx scripts/validate-all-sync.ts

import fs from "node:fs";
import path from "node:path";
import { generateBlogDataSource } from "./generate-blog-data.js";
import { generateProjectsDataSource } from "./generate-projects-data.js";
import { generateExperienceDataSource } from "./generate-experience-data.js";
import { generateSeedSource } from "./generate-seed.js";

function normalize(str: string): string {
  return str.replace(/\r\n/g, "\n").replace(/\s+$/gm, "").trim();
}

interface ValidationTarget {
  name: string;
  outputFile: string;
  generate: () => string;
}

const targets: ValidationTarget[] = [
  {
    name: "blogData.ts",
    outputFile: path.resolve("src/data/blogData.ts"),
    generate: generateBlogDataSource,
  },
  {
    name: "projectsData.ts",
    outputFile: path.resolve("src/data/projectsData.ts"),
    generate: generateProjectsDataSource,
  },
  {
    name: "experienceData.ts",
    outputFile: path.resolve("src/data/experienceData.ts"),
    generate: generateExperienceDataSource,
  },
  {
    name: "seed.sql",
    outputFile: path.resolve("db/seed.sql"),
    generate: generateSeedSource,
  },
];

let failures = 0;

for (const target of targets) {
  const expected = normalize(target.generate());
  const current = normalize(fs.readFileSync(target.outputFile, "utf-8"));

  if (expected === current) {
    console.log(`${target.name}: in sync`);
  } else {
    failures++;
    console.error(`${target.name}: OUT OF SYNC`);

    const genLines = expected.split("\n");
    const curLines = current.split("\n");
    const maxLines = Math.max(genLines.length, curLines.length);
    let diffCount = 0;

    for (let i = 0; i < maxLines; i++) {
      const g = genLines[i] ?? "";
      const c = curLines[i] ?? "";
      if (g !== c) {
        diffCount++;
        if (diffCount <= 10) {
          console.error(`  Line ${i + 1}:`);
          console.error(`    current:  ${c}`);
          console.error(`    expected: ${g}`);
        }
      }
    }

    if (diffCount > 10) {
      console.error(`  ... and ${diffCount - 10} more differences.`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} file(s) out of sync. Run "npm run generate:all" to regenerate.`);
  process.exit(1);
} else {
  console.log("\nAll generated files are in sync.");
}
