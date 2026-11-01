import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateSeedSource } from "../../../scripts/generate-seed";

describe("generate-seed", () => {
  // D1 rejects one statement over 100 KB (SQLITE_TOOBIG); all post bodies in one INSERT passed that.
  it("writes one INSERT per blog post", () => {
    const mdxCount = ["en", "ru"]
      .map((lang) => fs.readdirSync(path.resolve("src/content/blog", lang)).filter((f) => f.endsWith(".mdx")).length)
      .reduce((a, b) => a + b, 0);
    const inserts = generateSeedSource().match(/^INSERT INTO blog_posts /gm) ?? [];
    expect(inserts).toHaveLength(mdxCount);
  });
});
