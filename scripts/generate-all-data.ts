// Orchestrator: regenerates all derived data files from their canonical sources.
// Run via: npx tsx scripts/generate-all-data.ts
// Called automatically by: npm run build

import fs from "node:fs";
import path from "node:path";
import { generateBlogDataSource, generateBlogMetaSource } from "./generate-blog-data.js";
import { generateProjectsDataSource } from "./generate-projects-data.js";
import { generateExperienceDataSource } from "./generate-experience-data.js";
import { generateSeedSource } from "./generate-seed.js";
import { generateBuildMetaSource } from "./generate-build-meta.js";
import { generateChangelogSource } from "./generate-changelog.js";
import { generateOgImages } from "./generate-og-images.js";
import { writePlates } from "./generate-plates.js";
import { writeCovers } from "./generate-covers.js";
import { FIELD_SEED_FILE, generateFieldSeedSource, parseFieldSeed } from "./generate-field-seed.js";
import { writeFieldPosters } from "./generate-field-poster.js";

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
    name: "blogMeta",
    outputFile: path.resolve("src/data/blogMeta.ts"),
    generate: generateBlogMetaSource,
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
    name: "changelog",
    outputFile: path.resolve("src/data/changelog.ts"),
    generate: generateChangelogSource,
  },
  {
    name: "buildMeta",
    outputFile: path.resolve("src/data/buildMeta.ts"),
    generate: generateBuildMetaSource,
  },
  {
    name: "fieldSeed",
    outputFile: FIELD_SEED_FILE,
    generate: generateFieldSeedSource,
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

// The posters render from the seed file the loop above just wrote.
const writePosters = () => writeFieldPosters(parseFieldSeed(fs.readFileSync(FIELD_SEED_FILE, "utf-8")).counts);

for (const [name, write] of [["plates", writePlates], ["covers", writeCovers], ["field posters", writePosters]] as const) {
  try {
    write();
  } catch (err) {
    console.error(`Failed to generate ${name}: ${err}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

console.log("All data files generated successfully.");

// OG image rendering is async (satori + resvg). Run it after the sync
// generators so blogData.ts is up-to-date before we read it.
try {
  await generateOgImages();
  console.log("OG images generated successfully.");
} catch (err) {
  console.error(`Failed to generate OG images: ${err}`);
  process.exit(1);
}
