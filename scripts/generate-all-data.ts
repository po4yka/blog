// Orchestrator: regenerates all derived data files from their canonical sources.
// Run via: npx tsx scripts/generate-all-data.ts
// Called automatically by: npm run build

import fs from "node:fs";
import path from "node:path";
import { generateBlogDataSource } from "./generate-blog-data.js";
import { generateProjectsDataSource } from "./generate-projects-data.js";
import { generateExperienceDataSource } from "./generate-experience-data.js";
import { generateSeedSource } from "./generate-seed.js";
import { generateBuildMetaSource } from "./generate-build-meta.js";

interface GeneratorConfig {
  name: string;
  outputFile: string;
  generate: () => string;
}

const generators: GeneratorConfig[] = [
  {
    name: "blog",
    outputFile: path.resolve("src/data/blogData.ts"),
    generate: generateBlogDataSource,
  },
  {
    name: "projects",
    outputFile: path.resolve("src/data/projectsData.ts"),
    generate: generateProjectsDataSource,
  },
  {
    name: "experience",
    outputFile: path.resolve("src/data/experienceData.ts"),
    generate: generateExperienceDataSource,
  },
  {
    name: "seed",
    outputFile: path.resolve("db/seed.sql"),
    generate: generateSeedSource,
  },
  {
    name: "buildMeta",
    outputFile: path.resolve("src/data/buildMeta.ts"),
    generate: generateBuildMetaSource,
  },
];

let hasError = false;

for (const gen of generators) {
  try {
    const output = gen.generate();
    fs.mkdirSync(path.dirname(gen.outputFile), { recursive: true });
    fs.writeFileSync(gen.outputFile, output, "utf-8");
    console.log(`Generated ${gen.outputFile}`);
  } catch (err) {
    console.error(`Failed to generate ${gen.name}: ${err}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log("All data files generated successfully.");
