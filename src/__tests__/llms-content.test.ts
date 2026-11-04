import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GET } from "@/pages/llms-full.txt";
import { roles } from "@/data/experienceData";

// Claims that no file in src/content backs, or that src/content contradicts
// (the screens moved into a shared codebase, and Fastlane was replaced).
const UNSOURCED = [
  /60%/,
  /\b70%/,
  /18 (minutes )?to 7/,
  /500k/i,
  /200\+ stars/,
  /AndroidX/,
  /from (legacy )?XML/,
  /Fastlane[- ](based )?distribution/,
  /\bKMM\b/,
  /deep expertise/i,
];

async function llmsFull(): Promise<string> {
  const response = await GET({} as Parameters<typeof GET>[0]);
  return response.text();
}

describe("machine-facing bio", () => {
  it("every number in the llms.txt bio exists in the content sources", () => {
    const text = readFileSync("public/llms.txt", "utf8");
    const bio = text.slice(0, text.indexOf("## Pages"));
    const sources = readFileSync("src/content/experience.json", "utf8") + readFileSync("src/content/projects.json", "utf8");
    const numbers = bio.match(/\d[\d,]*\d|\d/g) ?? [];
    expect(numbers.length).toBeGreaterThan(0);
    for (const number of numbers) expect(sources).toContain(number);
  });

  it("llms-full.txt About block comes from the experience data", async () => {
    const text = await llmsFull();
    const about = text.slice(0, text.indexOf("## Blog Posts"));
    for (const claim of UNSOURCED) expect(about).not.toMatch(claim);
    expect(text).toContain("AI Engineer & Senior Mobile Developer");
    const current = roles.filter((role) => role.period.endsWith("Present"));
    expect(current.length).toBeGreaterThan(0);
    for (const role of current) expect(about).toContain(`${role.title} at ${role.company}`);
  });

  it("llms-full.txt keeps the record of every role", async () => {
    const text = await llmsFull();
    for (const role of roles) {
      for (const highlight of role.highlights ?? []) expect(text).toContain(highlight);
    }
  });

  it.each(["public/llms.txt", "src/components/JsonLd.astro"])("%s has no unsourced career claim", (path) => {
    const text = readFileSync(path, "utf8");
    for (const claim of UNSOURCED) expect(text).not.toMatch(claim);
  });
});

describe("identity strings", () => {
  const SURFACES = [
    "public/llms.txt",
    "scripts/generate-og-images.ts",
    "scripts/generate-seed.ts",
    "src/components/JsonLd.astro",
    "src/components/Terminal/commands/cat.tsx",
    "src/layouts/BaseHead.astro",
    "src/lib/i18n.ts",
    "src/pages/experience.astro",
    "src/pages/projects.astro",
  ];

  it.each(SURFACES)("%s uses the term Kotlin Multiplatform", (path) => {
    expect(readFileSync(path, "utf8")).not.toMatch(/\bKMM\b|Kotlin Multiplatform Mobile/);
  });

  it("the skills in the JSON-LD exist in the experience data", () => {
    const experience = readFileSync("src/content/experience.json", "utf8");
    for (const skill of ["SwiftUI", "PyTorch", "On-device ML"]) expect(experience).toContain(skill);
  });

  it("every profile link uses one LinkedIn URL", () => {
    for (const path of ["scripts/generate-seed.ts", "src/components/JsonLd.astro", "src/components/Links.tsx", "src/pages/site-index.json.ts"]) {
      expect(readFileSync(path, "utf8")).toContain("linkedin.com/in/pochaev-nikita");
    }
  });
});
