// Validates that all generated data files match their canonical sources.
// Run via: npx tsx scripts/validate-all-sync.ts

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { generateBlogDataSource } from "./generate-blog-data.js";
import { generateProjectsDataSource } from "./generate-projects-data.js";
import { generateExperienceDataSource } from "./generate-experience-data.js";
import { generateSeedSource } from "./generate-seed.js";

const BLOG_DIR = path.resolve("src/content/blog");

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

// --- Extra structural assertions ---

// 1. Verify seed.sql contains at least one INSERT INTO blog_posts row.
const seedPath = path.resolve("db/seed.sql");
const seedContent = fs.readFileSync(seedPath, "utf-8");
if (!seedContent.includes("INSERT INTO blog_posts")) {
  failures++;
  console.error("seed.sql: MISSING — no 'INSERT INTO blog_posts' found. Run \"npm run generate:all\".");
} else {
  console.log("seed.sql: contains INSERT INTO blog_posts rows");
}

// 2. Verify EN/RU slug parity — every slug under en/ must exist under ru/ and vice versa.
function listMdxSlugs(dir: string): Set<string> {
  const slugs = new Set<string>();
  if (!fs.existsSync(dir)) return slugs;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith(".mdx")) slugs.add(f.replace(/\.mdx$/, ""));
  }
  return slugs;
}

// Determine which lang dirs exist.
const langDirItems = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
const existingLangs = langDirItems
  .filter((d) => d.isDirectory() && (d.name === "en" || d.name === "ru"))
  .map((d) => d.name);

if (existingLangs.length >= 2) {
  const enSlugs = listMdxSlugs(path.join(BLOG_DIR, "en"));
  const ruSlugs = listMdxSlugs(path.join(BLOG_DIR, "ru"));

  const onlyInEn = [...enSlugs].filter((s) => !ruSlugs.has(s));
  const onlyInRu = [...ruSlugs].filter((s) => !enSlugs.has(s));

  if (onlyInEn.length > 0 || onlyInRu.length > 0) {
    failures++;
    if (onlyInEn.length > 0) console.error(`EN/RU slug parity: slugs only in en/: ${onlyInEn.join(", ")}`);
    if (onlyInRu.length > 0) console.error(`EN/RU slug parity: slugs only in ru/: ${onlyInRu.join(", ")}`);
  } else {
    console.log("EN/RU slug parity: all slugs match");
  }
} else {
  console.log("EN/RU slug parity: skipped (fewer than 2 lang dirs found)");
}

// Unused import guard — matter is available for future use in this file.
void matter;

if (failures > 0) {
  console.error(`\n${failures} file(s) out of sync. Run "npm run generate:all" to regenerate.`);
  process.exit(1);
} else {
  console.log("\nAll generated files are in sync.");
}
